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
            vscode.window.showInputBox({
                prompt: "Enter destination path",
                value: sourcePath
            }).then(destinationPath => {
                if (destinationPath) {
                    try {
                        if (fs.lstatSync(sourcePath).isDirectory()) {
                            fs.cpSync(sourcePath, destinationPath, { recursive: true });
                        } else {
                            fs.copyFileSync(sourcePath, destinationPath);
                        }
                        vscode.window.showInformationMessage(`Successfully copied to ${destinationPath}`);
                    } catch (err) {
                        vscode.window.showErrorMessage(`Failed to copy: ${err.message}`);
                    }
                }
            });
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}