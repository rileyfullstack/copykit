const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "copykit" is now active!');

    let disposable = vscode.commands.registerCommand('copykit.copyFileOrFolder', function (uri) {
        console.log('Command copykit.copyFileOrFolder triggered');
        
        if (!uri || !uri.fsPath) {
            console.error('No valid URI provided');
            vscode.window.showErrorMessage('No file or folder selected');
            return;
        }

        const sourcePath = uri.fsPath;
        console.log(`Source path: ${sourcePath}`);

        try {
            let content = '';
            if (fs.lstatSync(sourcePath).isDirectory()) {
                console.log('Processing directory');
                content = getDirectoryContent(sourcePath);
            } else {
                console.log('Processing file');
                content = fs.readFileSync(sourcePath, 'utf8');
            }

            const tempFile = vscode.Uri.parse(`untitled:${path.basename(sourcePath)}_copy`);
            vscode.workspace.openTextDocument(tempFile).then(document => {
                const edit = new vscode.WorkspaceEdit();
                edit.insert(tempFile, new vscode.Position(0, 0), content);
                return vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        vscode.window.showTextDocument(document);
                        vscode.window.showInformationMessage(`Content copied to temporary file`);
                    } else {
                        console.error('Failed to apply edit');
                        vscode.window.showErrorMessage('Failed to create temporary file');
                    }
                });
            }, error => {
                console.error('Failed to open text document', error);
                vscode.window.showErrorMessage(`Failed to open document: ${error.message}`);
            });
        } catch (err) {
            console.error('Error in copykit.copyFileOrFolder', err);
            vscode.window.showErrorMessage(`Failed to copy: ${err.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

function getDirectoryContent(dirPath, indent = '') {
    let content = '';
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            content += `${indent}${file}/\n`;
            content += getDirectoryContent(filePath, indent + '  ');
        } else {
            content += `${indent}${file}\n`;
            content += `${indent}Content:\n`;
            content += `${indent}${fs.readFileSync(filePath, 'utf8')}\n\n`;
        }
    }
    return content;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}