const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "copykit" is now active!');

    let disposable = vscode.commands.registerCommand('copykit.copyFileOrFolder', function (uri) {
        if (uri && uri.fsPath) {
            const sourcePath = uri.fsPath;
            try {
                let content = '';
                if (fs.lstatSync(sourcePath).isDirectory()) {
                    content = getDirectoryContent(sourcePath);
                } else {
                    content = fs.readFileSync(sourcePath, 'utf8');
                }
                
                const tempFile = vscode.Uri.parse(`untitled:${path.basename(sourcePath)}_copy`);
                vscode.workspace.openTextDocument(tempFile).then(document => {
                    const edit = new vscode.WorkspaceEdit();
                    edit.insert(tempFile, new vscode.Position(0, 0), content);
                    return vscode.workspace.applyEdit(edit).then(success => {
                        if (success) {
                            vscode.window.showTextDocument(document);
                        } else {
                            vscode.window.showErrorMessage('Failed to create temporary file');
                        }
                    });
                });

                vscode.window.showInformationMessage(`Content copied to temporary file`);
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to copy: ${err.message}`);
            }
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