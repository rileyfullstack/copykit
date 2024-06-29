const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Size limit in bytes (e.g., 10MB)
const SIZE_LIMIT = 10 * 1024 * 1024;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "copykit" is now active!');

    let copyToTempFile = vscode.commands.registerCommand('copykit.copyFileOrFolder', function (uri) {
        handleCopy(uri, copyContentToTempFile);
    });

    let copyToClipboard = vscode.commands.registerCommand('copykit.copyToClipboard', function (uri) {
        handleCopy(uri, copyContentToClipboard);
    });

    context.subscriptions.push(copyToTempFile, copyToClipboard);
}

async function handleCopy(uri, copyFunction) {
    if (uri && uri.fsPath) {
        const sourcePath = uri.fsPath;
        try {
            const size = await getSize(sourcePath);
            if (size > SIZE_LIMIT) {
                const shouldProceed = await vscode.window.showWarningMessage(
                    `The selected item is larger than ${SIZE_LIMIT / 1024 / 1024}MB. Do you want to proceed?`,
                    'Yes', 'No'
                );
                if (shouldProceed !== 'Yes') {
                    return;
                }
            }
            const content = await getContent(sourcePath);
            await copyFunction(sourcePath, content);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to copy: ${err.message}`);
        }
    }
}

async function copyContentToTempFile(sourcePath, content) {
    const tempFile = vscode.Uri.parse(`untitled:${path.basename(sourcePath)}_copy`);
    const document = await vscode.workspace.openTextDocument(tempFile);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(tempFile, new vscode.Position(0, 0), content);
    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Content copied to temporary file`);
    } else {
        vscode.window.showErrorMessage('Failed to create temporary file');
    }
}

async function copyContentToClipboard(sourcePath, content) {
    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(`Content copied to clipboard`);
}

async function getSize(sourcePath) {
    const stats = await fs.promises.stat(sourcePath);
    if (stats.isDirectory()) {
        let size = 0;
        const files = await fs.promises.readdir(sourcePath);
        for (const file of files) {
            const filePath = path.join(sourcePath, file);
            size += await getSize(filePath);
        }
        return size;
    } else {
        return stats.size;
    }
}

async function getContent(sourcePath) {
    const stats = await fs.promises.stat(sourcePath);
    if (stats.isDirectory()) {
        return getDirectoryContent(sourcePath);
    } else {
        return fs.promises.readFile(sourcePath, 'utf8');
    }
}

async function getDirectoryContent(dirPath, indent = '') {
    let content = '';
    const files = await fs.promises.readdir(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) {
            content += `${indent}${file}/\n`;
            content += await getDirectoryContent(filePath, indent + '  ');
        } else {
            content += `${indent}${file}\n`;
            content += `${indent}Content:\n`;
            content += `${indent}${await fs.promises.readFile(filePath, 'utf8')}\n\n`;
        }
    }
    return content;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}