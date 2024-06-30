const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { default: ignore } = require('ignore');
const micromatch = require('micromatch');

let tempFileUri = null;

function activate(context) {
    console.log('Congratulations, your extension "copykit" is now active!');

    // Function to update command visibility
    function updateCommandVisibility() {
        vscode.commands.executeCommand('setContext', 'copykit.tempFileExists', !!tempFileUri);
    }

    let copyToTempFile = vscode.commands.registerCommand('copykit.copyFileOrFolder', function (uri, uris) {
        if (vscode.workspace.getConfiguration('copykit').get('enableCopyToTempFile')) {
            handleCopyMultiple(uris || [uri], copyContentToTempFile);
            updateCommandVisibility();
        }
    });

    let copyToNewTempFile = vscode.commands.registerCommand('copykit.copyToNewTempFile', function (uri, uris) {
        if (vscode.workspace.getConfiguration('copykit').get('enableCopyToTempFile')) {
            vscode.window.showWarningMessage('This will replace the contents of the existing temp file. Continue?', 'Yes', 'No')
                .then(selection => {
                    if (selection === 'Yes') {
                        tempFileUri = null;
                        handleCopyMultiple(uris || [uri], copyContentToTempFile);
                        updateCommandVisibility();
                    }
                });
        }
    });

    let addToExistingTempFile = vscode.commands.registerCommand('copykit.addToExistingTempFile', function (uri, uris) {
        if (vscode.workspace.getConfiguration('copykit').get('enableCopyToTempFile')) {
            handleCopyMultiple(uris || [uri], addContentToExistingTempFile);
        }
    });

    let copyToClipboard = vscode.commands.registerCommand('copykit.copyToClipboard', function (uri, uris) {
        if (vscode.workspace.getConfiguration('copykit').get('enableCopyToClipboard')) {
            handleCopyMultiple(uris || [uri], copyContentToClipboard);
        }
    });

    context.subscriptions.push(copyToTempFile, copyToNewTempFile, addToExistingTempFile, copyToClipboard);

    // Initial update of command visibility
    updateCommandVisibility();
}

async function handleCopyMultiple(uris, copyFunction) {
    if (!uris || uris.length === 0) return;

    let totalSize = 0;
    let contents = [];
    let excludedFiles = [];

    for (const uri of uris) {
        if (uri && uri.fsPath) {
            try {
                const size = await getSize(uri.fsPath);
                totalSize += size;

                const content = await getFilteredContent(uri.fsPath);
                if (content) {
                    contents.push({ path: uri.fsPath, content });
                } else {
                    excludedFiles.push(path.basename(uri.fsPath));
                }
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to process ${uri.fsPath}: ${err.message}`);
            }
        }
    }

    const sizeLimit = getSizeLimit();
    if (totalSize > sizeLimit) {
        const shouldProceed = await vscode.window.showWarningMessage(
            `The selected items are larger than ${sizeLimit / 1024 / 1024}MB in total. Do you want to proceed?`,
            'Yes', 'No'
        );
        if (shouldProceed !== 'Yes') {
            return;
        }
    }

    if (contents.length === 0) {
        vscode.window.showWarningMessage('All selected files were excluded based on your settings.');
        return;
    }

    if (excludedFiles.length > 0) {
        vscode.window.showInformationMessage(`The following files were excluded: ${excludedFiles.join(', ')}`);
    }

    await copyFunction(contents);
}

async function copyContentToTempFile(contents) {
    if (!tempFileUri) {
        tempFileUri = vscode.Uri.parse(`untitled:CopyKit_temp_file.txt`);
    }
    const document = await vscode.workspace.openTextDocument(tempFileUri);
    const edit = new vscode.WorkspaceEdit();
    const includeFilePath = vscode.workspace.getConfiguration('copykit').get('includeFilePath');
    
    let fullContent = contents.map(item => 
        (includeFilePath ? `File: ${item.path}\n\n` : '') + `${item.content}\n\n`
    ).join('--------------------\n\n');
    
    edit.replace(tempFileUri, new vscode.Range(0, 0, document.lineCount, 0), fullContent);
    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Content copied to temporary file`);
        vscode.commands.executeCommand('setContext', 'copykit.tempFileExists', true);
    } else {
        vscode.window.showErrorMessage('Failed to create temporary file');
    }
}

async function addContentToExistingTempFile(contents) {
    if (!tempFileUri) {
        vscode.window.showErrorMessage('No existing temporary file. Creating a new one.');
        return copyContentToTempFile(contents);
    }
    const document = await vscode.workspace.openTextDocument(tempFileUri);
    const edit = new vscode.WorkspaceEdit();
    const includeFilePath = vscode.workspace.getConfiguration('copykit').get('includeFilePath');
    
    let newContent = '\n\n--------------------\n\n' + contents.map(item => 
        (includeFilePath ? `File: ${item.path}\n\n` : '') + `${item.content}\n\n`
    ).join('--------------------\n\n');
    
    edit.insert(tempFileUri, new vscode.Position(document.lineCount, 0), newContent);
    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Content added to existing temporary file`);
    } else {
        vscode.window.showErrorMessage('Failed to add content to temporary file');
    }
}

async function copyContentToClipboard(contents) {
    const includeFilePath = vscode.workspace.getConfiguration('copykit').get('includeFilePath');
    let fullContent = contents.map(item => 
        (includeFilePath ? `File: ${item.path}\n\n` : '') + `${item.content}\n\n`
    ).join('--------------------\n\n');
    
    await vscode.env.clipboard.writeText(fullContent);
    vscode.window.showInformationMessage(`Content copied to clipboard`);
}

async function getSize(sourcePath) {
    const stats = await fs.stat(sourcePath);
    if (stats.isDirectory()) {
        let size = 0;
        const files = await fs.readdir(sourcePath);
        for (const file of files) {
            const filePath = path.join(sourcePath, file);
            size += await getSize(filePath);
        }
        return size;
    } else {
        return stats.size;
    }
}

async function getFilteredContent(sourcePath) {
    const stats = await fs.stat(sourcePath);
    if (stats.isDirectory()) {
        return getFilteredDirectoryContent(sourcePath);
    } else {
        if (shouldIncludeFile(sourcePath)) {
            return fs.readFile(sourcePath, 'utf8');
        }
        return '';
    }
}

async function getFilteredDirectoryContent(dirPath, indent = '') {
    let content = '';
    const files = await fs.readdir(dirPath);
    const gitignore = await getGitignoreRules(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (shouldIncludeFile(filePath, gitignore)) {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                content += `${indent}${file}/\n`;
                content += await getFilteredDirectoryContent(filePath, indent + '  ');
            } else {
                content += `${indent}${file}\n`;
                content += `${indent}Content:\n`;
                content += `${indent}${await fs.readFile(filePath, 'utf8')}\n\n`;
            }
        }
    }
    return content;
}

function shouldIncludeFile(filePath, gitignore) {
    const config = vscode.workspace.getConfiguration('copykit');
    const filteringConfig = config.get('fileTypeFiltering');
    const respectGitignore = config.get('respectGitignore');

    const relativePath = path.relative(vscode.workspace.rootPath, filePath);

    if (respectGitignore && gitignore && gitignore.ignores(relativePath)) {
        return false;
    }

    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).slice(1);

    switch (filteringConfig.mode) {
        case 'includeSpecified':
            return micromatch.isMatch(fileName, filteringConfig.include.map(ext => `*.${ext}`));
        case 'excludeSpecified':
            return !micromatch.isMatch(fileName, filteringConfig.exclude);
        case 'includeAll':
        default:
            return !micromatch.isMatch(fileName, filteringConfig.exclude);
    }
}

async function getGitignoreRules(dirPath) {
    const gitignorePath = path.join(dirPath, '.gitignore');
    try {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        return ignore().add(gitignoreContent);
    } catch (error) {
        return null;
    }
}

function getSizeLimit() {
    const config = vscode.workspace.getConfiguration('copykit');
    return config.get('sizeLimit', 10) * 1024 * 1024;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}