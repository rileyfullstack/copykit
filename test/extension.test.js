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
            vscode.window.showInformationMessage(`Copying: ${sourcePath}`);
            // TODO: Implement copying logic here
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}