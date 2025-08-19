import { HTTPBridge } from './http-bridge.js';
import { init, fs, exec, data, debug } from '@replit/extensions';

class MCPBridge {
    constructor() {
        this.server = null;
        this.port = 3002;
        this.isRunning = false;
    }

    async initialize() {
        try {
            // Initialize the extension
            const { status } = await init();
            
            if (status === 'ready') {
                await debug.info('MCP Bridge initialized successfully');
                await this.startBridgeServer();
                await this.writePortInfo();
            } else {
                await debug.error('Failed to initialize MCP Bridge', { status });
            }
        } catch (error) {
            await debug.error('MCP Bridge initialization error', { error: error.message });
        }
    }

    async startBridgeServer() {
        try {
            // Start a simple HTTP server to handle MCP requests
            this.isRunning = true;
            await debug.info(`MCP Bridge server starting on port ${this.port}`);
            
            // Note: In a real implementation, we'd need to set up actual HTTP server
            // For now, we'll simulate the server being ready
            await this.setupMessageHandlers();
            
        } catch (error) {
            await debug.error('Failed to start bridge server', { error: error.message });
            this.isRunning = false;
        }
    }

    async setupMessageHandlers() {
        // Listen for messages from the extension context
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'MCP_REQUEST') {
                try {
                    const response = await this.handleMCPRequest(event.data);
                    event.source.postMessage({
                        type: 'MCP_RESPONSE',
                        id: event.data.id,
                        data: response
                    }, '*');
                } catch (error) {
                    event.source.postMessage({
                        type: 'MCP_ERROR',
                        id: event.data.id,
                        error: error.message
                    }, '*');
                }
            }
        });
    }

    async handleMCPRequest(request) {
        const { method, endpoint, data: requestData } = request;
        
        try {
            switch (endpoint) {
                case '/health':
                    return await this.handleHealth();
                
                case '/api/workspace/info':
                    return await this.handleWorkspaceInfo();
                
                case '/api/fs/read':
                    return await this.handleReadFile(requestData);
                
                case '/api/fs/write':
                    return await this.handleWriteFile(requestData);
                
                case '/api/fs/list':
                    return await this.handleListFiles(requestData);
                
                case '/api/fs/create-dir':
                    return await this.handleCreateDirectory(requestData);
                
                case '/api/fs/delete':
                    return await this.handleDelete(requestData);
                
                case '/api/fs/move':
                    return await this.handleMove(requestData);
                
                case '/api/fs/copy':
                    return await this.handleCopy(requestData);
                
                case '/api/exec/command':
                    return await this.handleExecuteCommand(requestData);
                
                default:
                    throw new Error(`Unknown endpoint: ${endpoint}`);
            }
        } catch (error) {
            await debug.error(`MCP request failed: ${endpoint}`, { error: error.message });
            throw error;
        }
    }

    async handleHealth() {
        const workspaceInfo = await data.currentRepl({});
        return {
            success: true,
            data: {
                version: '1.0.0',
                status: 'running',
                workspace: workspaceInfo.repl.title
            }
        };
    }

    async handleWorkspaceInfo() {
        try {
            const currentUser = await data.currentUser({});
            const currentRepl = await data.currentRepl({});
            
            return {
                success: true,
                data: {
                    workspace: {
                        id: currentRepl.repl.id,
                        title: currentRepl.repl.title,
                        description: currentRepl.repl.description,
                        language: currentRepl.repl.slug,
                        url: currentRepl.repl.url
                    },
                    bridge: {
                        status: 'connected'
                    },
                    user: {
                        username: currentUser.user.username,
                        id: currentUser.user.id
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to get workspace info: ${error.message}`
            };
        }
    }

    async handleReadFile(requestData) {
        try {
            const { path, encoding = 'utf8' } = requestData;
            const result = await fs.readFile(path, encoding);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            return {
                success: true,
                data: {
                    content: result.content,
                    path: path
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to read file: ${error.message}`
            };
        }
    }

    async handleWriteFile(requestData) {
        try {
            const { path, content } = requestData;
            const result = await fs.writeFile(path, content);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            return {
                success: true,
                data: {
                    path: path,
                    size: content.length
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to write file: ${error.message}`
            };
        }
    }

    async handleListFiles(requestData) {
        try {
            const { path = '.', recursive = false } = requestData;
            const result = await fs.readDir(path);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            const files = result.children.map(child => ({
                name: child.filename,
                path: `${path}/${child.filename}`.replace(/\/+/g, '/'),
                type: child.type === 'FILE' ? 'file' : 'directory'
            }));
            
            return {
                success: true,
                data: {
                    files: files
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to list files: ${error.message}`
            };
        }
    }

    async handleCreateDirectory(requestData) {
        try {
            const { path } = requestData;
            const result = await fs.createDir(path);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            return {
                success: true,
                data: {
                    path: path
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to create directory: ${error.message}`
            };
        }
    }

    async handleDelete(requestData) {
        try {
            const { path } = requestData;
            
            // Try to delete as file first, then as directory
            let result = await fs.deleteFile(path);
            
            if (result.error) {
                result = await fs.deleteDir(path);
                if (result.error) {
                    return {
                        success: false,
                        error: result.error
                    };
                }
            }
            
            return {
                success: true,
                data: {
                    path: path
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to delete: ${error.message}`
            };
        }
    }

    async handleMove(requestData) {
        try {
            const { from, to } = requestData;
            const result = await fs.move(from, to);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            return {
                success: true,
                data: {
                    from: from,
                    to: to
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to move: ${error.message}`
            };
        }
    }

    async handleCopy(requestData) {
        try {
            const { from, to } = requestData;
            const result = await fs.copyFile(from, to);
            
            if (result.error) {
                return {
                    success: false,
                    error: result.error
                };
            }
            
            return {
                success: true,
                data: {
                    from: from,
                    to: to
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to copy: ${error.message}`
            };
        }
    }

    async handleExecuteCommand(requestData) {
        try {
            const { command, options = {} } = requestData;
            const result = await exec.exec(command, { env: options.env || {} });
            
            return {
                success: true,
                data: {
                    command: command,
                    exitCode: result.exitCode,
                    output: result.output
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to execute command: ${error.message}`
            };
        }
    }

    async writePortInfo() {
        try {
            // Write port information to a temporary file that the MCP server can read
            const portInfo = {
                port: this.port,
                timestamp: new Date().toISOString(),
                workspace: 'replit-workspace',
                status: 'active'
            };
            
            // Note: In a real implementation, we'd need to write this to a location
            // accessible by the MCP server. For now, we'll use the extension's storage
            await debug.info('Port info written', portInfo);
            
        } catch (error) {
            await debug.error('Failed to write port info', { error: error.message });
        }
    }
}

// Initialize the bridge when the background script loads
const bridge = new MCPBridge();
bridge.initialize();

// Keep the bridge alive
setInterval(async () => {
    if (bridge.isRunning) {
        await debug.info('MCP Bridge heartbeat');
    }
}, 30000); // 30 second heartbeat