import { init, fs, exec, data, debug } from '@replit/extensions';

class HTTPBridge {
    constructor() {
        this.port = 3002;
        this.routes = new Map();
        this.isRunning = false;
        this.setupRoutes();
    }

    async initialize() {
        try {
            const { status } = await init();
            
            if (status === 'ready') {
                await debug.info('HTTP Bridge initialized successfully');
                await this.startServer();
                await this.writePortInfo();
            } else {
                await debug.error('Failed to initialize HTTP Bridge', { status });
            }
        } catch (error) {
            await debug.error('HTTP Bridge initialization error', { error: error.message });
        }
    }

    setupRoutes() {
        // Health check endpoint
        this.routes.set('GET:/health', async () => {
            const workspaceInfo = await data.currentRepl({});
            return {
                version: '1.0.0',
                status: 'running',
                workspace: workspaceInfo.repl.title,
                timestamp: new Date().toISOString()
            };
        });

        // Workspace info endpoint
        this.routes.set('GET:/api/workspace/info', async () => {
            const currentUser = await data.currentUser({});
            const currentRepl = await data.currentRepl({});
            
            return {
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
            };
        });

        // File system endpoints
        this.routes.set('POST:/api/fs/read', async (data) => {
            const { path, encoding = 'utf8' } = data;
            const result = await fs.readFile(path, encoding);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return {
                content: result.content,
                path: path
            };
        });

        this.routes.set('POST:/api/fs/write', async (data) => {
            const { path, content } = data;
            const result = await fs.writeFile(path, content);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return {
                path: path,
                size: content.length
            };
        });

        this.routes.set('POST:/api/fs/list', async (data) => {
            const { path = '.', recursive = false } = data;
            const result = await fs.readDir(path);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            const files = result.children.map(child => ({
                name: child.filename,
                path: `${path}/${child.filename}`.replace(/\/+/g, '/'),
                type: child.type === 'FILE' ? 'file' : 'directory'
            }));
            
            return { files };
        });

        this.routes.set('POST:/api/fs/create-dir', async (data) => {
            const { path } = data;
            const result = await fs.createDir(path);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return { path };
        });

        this.routes.set('POST:/api/fs/delete', async (data) => {
            const { path } = data;
            
            // Try file first, then directory
            let result = await fs.deleteFile(path);
            
            if (result.error) {
                result = await fs.deleteDir(path);
                if (result.error) {
                    throw new Error(result.error);
                }
            }
            
            return { path };
        });

        this.routes.set('POST:/api/fs/move', async (data) => {
            const { from, to } = data;
            const result = await fs.move(from, to);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return { from, to };
        });

        this.routes.set('POST:/api/fs/copy', async (data) => {
            const { from, to } = data;
            const result = await fs.copyFile(from, to);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return { from, to };
        });

        // Command execution endpoint
        this.routes.set('POST:/api/exec/command', async (data) => {
            const { command, options = {} } = data;
            const result = await exec.exec(command, { env: options.env || {} });
            
            return {
                command: command,
                exitCode: result.exitCode,
                output: result.output
            };
        });
    }

    async startServer() {
        this.isRunning = true;
        
        // Since we can't create an actual HTTP server in a browser extension,
        // we'll simulate it by intercepting requests and routing them through postMessage
        await this.setupMessageInterceptor();
        
        await debug.info(`HTTP Bridge server simulation started on port ${this.port}`);
    }

    async setupMessageInterceptor() {
        // Listen for HTTP requests from the MCP client
        window.addEventListener('message', async (event) => {
            if (event.data.type === 'HTTP_REQUEST') {
                try {
                    const response = await this.handleRequest(event.data);
                    
                    // Send response back
                    event.source.postMessage({
                        type: 'HTTP_RESPONSE',
                        id: event.data.id,
                        status: 200,
                        data: {
                            success: true,
                            data: response
                        }
                    }, '*');
                } catch (error) {
                    event.source.postMessage({
                        type: 'HTTP_RESPONSE',
                        id: event.data.id,
                        status: 500,
                        data: {
                            success: false,
                            error: error.message
                        }
                    }, '*');
                }
            }
        });

        // Set up a proxy to intercept actual HTTP requests
        // This would require additional setup in the content script
        await this.setupHTTPProxy();
    }

    async setupHTTPProxy() {
        // Inject a script that intercepts fetch requests to localhost:3000
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                const originalFetch = window.fetch;
                
                window.fetch = async function(url, options = {}) {
                    if (typeof url === 'string' && url.startsWith('http://localhost:3002')) {
                        // Extract path from URL
                        const urlObj = new URL(url);
                        const path = urlObj.pathname;
                        const method = options.method || 'GET';
                        
                        // Parse request body if present
                        let body = null;
                        if (options.body) {
                            try {
                                body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
                            } catch (e) {
                                body = options.body;
                            }
                        }
                        
                        // Send message to extension
                        return new Promise((resolve, reject) => {
                            const id = Date.now() + Math.random();
                            
                            const handleResponse = (event) => {
                                if (event.data.type === 'HTTP_RESPONSE' && event.data.id === id) {
                                    window.removeEventListener('message', handleResponse);
                                    
                                    // Create a Response object
                                    const responseData = event.data.data;
                                    const response = new Response(JSON.stringify(responseData), {
                                        status: event.data.status,
                                        statusText: event.data.status === 200 ? 'OK' : 'Error',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    
                                    resolve(response);
                                }
                            };
                            
                            window.addEventListener('message', handleResponse);
                            
                            // Send request to extension
                            window.postMessage({
                                type: 'HTTP_REQUEST',
                                id: id,
                                method: method,
                                path: path,
                                body: body
                            }, '*');
                            
                            // Timeout after 10 seconds
                            setTimeout(() => {
                                window.removeEventListener('message', handleResponse);
                                reject(new Error('Request timeout'));
                            }, 10000);
                        });
                    }
                    
                    // For all other requests, use original fetch
                    return originalFetch.apply(this, arguments);
                };
            })();
        `;
        
        document.head.appendChild(script);
        await debug.info('HTTP proxy injected successfully');
    }

    async handleRequest(request) {
        const { method, path, body } = request;
        const routeKey = `${method}:${path}`;
        
        if (!this.routes.has(routeKey)) {
            throw new Error(`Route not found: ${method} ${path}`);
        }
        
        const handler = this.routes.get(routeKey);
        return await handler(body);
    }

    async writePortInfo() {
        try {
            // Write port info to localStorage for now
            const portInfo = {
                port: this.port,
                timestamp: new Date().toISOString(),
                workspace: 'replit-workspace',
                status: 'active'
            };
            
            localStorage.setItem('replit-mcp-bridge-port', JSON.stringify(portInfo));
            await debug.info('Port info written to localStorage', portInfo);
            
        } catch (error) {
            await debug.error('Failed to write port info', { error: error.message });
        }
    }
}

// Initialize and start the HTTP bridge
const bridge = new HTTPBridge();
bridge.initialize();

export { HTTPBridge };