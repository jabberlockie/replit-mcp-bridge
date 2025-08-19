# MCP Bridge Extension for Replit

This extension provides a bridge between Replit workspaces and the Claude Code MCP server, allowing Claude to interact with your Replit projects.

## Features

- File operations (read, write, create, delete, move, copy)
- Directory management
- Command execution
- Workspace information access
- Real-time debugging and monitoring

## Installation

1. Upload this extension to your Replit project
2. Make sure all files are served from the root directory
3. The extension will automatically start when you open your Replit workspace

## Files

- `extension.json` - Extension manifest with permissions and configuration
- `background.html` & `background.js` - Background script that runs the MCP bridge server
- `control.html` & `control.js` - Control panel UI for monitoring and testing
- `icon.svg` - Extension icon
- `README.md` - This documentation

## Usage

Once installed, the extension will:

1. Start a background bridge server
2. Expose HTTP endpoints that the MCP server can connect to
3. Provide a control panel tool for monitoring and testing

The MCP server will connect to `http://localhost:3000` and communicate via the bridge endpoints.

## API Endpoints

- `GET /health` - Health check
- `GET /api/workspace/info` - Get workspace information
- `POST /api/fs/read` - Read file contents
- `POST /api/fs/write` - Write file contents
- `POST /api/fs/list` - List directory contents
- `POST /api/fs/create-dir` - Create directory
- `POST /api/fs/delete` - Delete file or directory
- `POST /api/fs/move` - Move/rename file or directory
- `POST /api/fs/copy` - Copy file
- `POST /api/exec/command` - Execute shell command

## Permissions

The extension requires:
- `read` - To read files from the workspace
- `write-exec` - To write files and execute commands

## Troubleshooting

1. Check the Extension Devtools for error messages
2. Use the Control Panel tool to test the connection
3. Verify the extension has the required permissions
4. Ensure the MCP server is configured to connect to localhost:3000