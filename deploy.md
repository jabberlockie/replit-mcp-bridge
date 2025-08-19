# Deploying the MCP Bridge Extension to Replit

## Prerequisites

1. A Replit account
2. A Replit project/workspace where you want to install the extension

## Installation Steps

### Option 1: Direct Upload (Recommended)

1. **Create a new Replit project** or open an existing one
2. **Upload all extension files** to your project root:
   - `extension.json` (manifest)
   - `background.html` & `background.js` (background service)
   - `control.html` & `control.js` (control panel)
   - `http-bridge.js` (HTTP server simulation)
   - `icon.svg` (extension icon)

3. **Ensure files are served** from the root directory (they should be accessible at `/extension.json`, `/background.html`, etc.)

4. **Test the extension** by opening your workspace - the extension should auto-load

### Option 2: Clone from Repository

If you've pushed the extension to a Git repository:

1. Clone or import the repository into your Replit workspace
2. Make sure all files are in the root directory
3. The extension will automatically be detected by Replit

## Verification

Once installed, you should see:

1. **Extension appears** in the Replit extensions sidebar
2. **Background script runs** (check Extension Devtools)
3. **Control panel tool** is available
4. **Bridge server** starts on port 3000

## Configuration

The extension is pre-configured with the required permissions:
- `read` - For reading workspace files  
- `write-exec` - For writing files and executing commands

## Testing with MCP Server

After installation:

1. **In your local Claude Code session**, the Replit MCP should connect successfully
2. **Test the connection** using the MCP tools:
   ```
   replit_health_check
   replit_get_workspace_info
   replit_list_files
   ```
3. **Monitor activity** using the Control Panel tool in your Replit workspace

## Troubleshooting

- **Extension not loading**: Check that `extension.json` is in the root and properly formatted
- **Permission errors**: Verify the extension manifest includes required scopes
- **Connection issues**: Check the Extension Devtools for error messages
- **MCP not connecting**: Ensure the bridge server is running (check Control Panel)

## File Structure

```
project-root/
├── extension.json          # Extension manifest
├── background.html         # Background service page
├── background.js          # Background service logic  
├── control.html           # Control panel UI
├── control.js             # Control panel logic
├── http-bridge.js         # HTTP server simulation
├── icon.svg              # Extension icon
└── README.md             # Documentation
```

The extension will automatically start when you open your Replit workspace and provide the bridge functionality needed for Claude Code's MCP server integration.