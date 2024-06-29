# CopyKit

CopyKit is a Visual Studio Code extension that enhances your file copying capabilities. It allows you to easily copy files and folders with right-click actions, respecting gitignore rules and applying custom filtering.

## Features

- Copy files and folders to a temporary file or clipboard
- Support for multiple file selection
- Respect .gitignore rules
- Custom file type filtering
- Size limit warnings for large files/folders
- Option to include or exclude file paths in copied content

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "CopyKit"
4. Click Install

## Usage

### Copying Files or Folders

1. Right-click on a file or folder in the Explorer view
2. Select either "CopyKit: Copy to Temp File" or "CopyKit: Copy to Clipboard"
3. For multiple files, select them while holding Ctrl (or Cmd on macOS), then right-click and choose your desired CopyKit action

### Configuration

CopyKit can be configured through VS Code's settings. Here are the available options:

- `copykit.sizeLimit`: Size limit in MB for files/folders to copy without warning (default: 10)
- `copykit.enableCopyToTempFile`: Enable 'Copy to Temp File' in the context menu (default: true)
- `copykit.enableCopyToClipboard`: Enable 'Copy to Clipboard' in the context menu (default: true)
- `copykit.includeFilePath`: Include file path at the beginning of each copied file (default: true)
- `copykit.respectGitignore`: Respect .gitignore rules when copying (default: true)
- `copykit.fileTypeFiltering`: File type filtering settings
  - `mode`: Filtering mode (includeAll, includeSpecified, or excludeSpecified)
  - `include`: File types to include (e.g., ['js', 'ts', 'json'])
  - `exclude`: File types or patterns to exclude (e.g., ['exe', 'dll', 'node_modules'])

To modify these settings:

1. Go to File > Preferences > Settings (or Code > Preferences > Settings on macOS)
2. Search for "CopyKit"
3. Adjust the settings as needed

## Examples

### Copying specific file types

To copy only JavaScript and TypeScript files:

1. Open VS Code settings
2. Find "CopyKit: File Type Filtering"
3. Set "Mode" to "includeSpecified"
4. Add "js" and "ts" to the "Include" array

### Excluding certain directories

To exclude "node_modules" and ".git" directories:

1. Open VS Code settings
2. Find "CopyKit: File Type Filtering"
3. Set "Mode" to "excludeSpecified"
4. Add "node_modules" and ".git" to the "Exclude" array

## Troubleshooting

- If the CopyKit options don't appear in the context menu, ensure that `copykit.enableCopyToTempFile` and `copykit.enableCopyToClipboard` are set to `true` in your settings.
- If files aren't being copied as expected, check your file type filtering settings and ensure that `copykit.respectGitignore` is set correctly.

## Contributing

Contributions to CopyKit are welcome! Please feel free to submit a Pull Request.

## License

This extension is released under the [MIT License](https://opensource.org/licenses/MIT).