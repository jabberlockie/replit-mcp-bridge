# Deploying the MCP Bridge Extension to Replit

## Prerequisites

1. A Replit account
2. A Replit project/workspace where you want to install the extension

## Repository

**GitHub Repository**: https://github.com/jabberlockie/replit-mcp-bridge

## Installation Steps

### Method 1: Import from GitHub (Recommended)

1. **Open Replit** and go to https://replit.com
2. **Create a new Repl** or open an existing workspace
3. **Import from GitHub**:
   - Click "Import from GitHub" 
   - Enter: `https://github.com/jabberlockie/replit-mcp-bridge`
   - Click "Import"
4. **The extension will auto-deploy** when you open the workspace

### Method 2: Fork the Repository

1. **Fork the repository** on GitHub:
   - Go to https://github.com/jabberlockie/replit-mcp-bridge
   - Click "Fork" to create your own copy
2. **Import your fork** into Replit using Method 1 steps
3. **Make customizations** if needed

### Method 3: Manual Clone

If you want to work with the code locally first:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jabberlockie/replit-mcp-bridge.git
   cd replit-mcp-bridge
   ```
2. **Make any modifications** you need
3. **Push to your own GitHub repository**
4. **Import your repository** into Replit

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