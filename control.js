import { init, data, debug } from '@replit/extensions';

class MCPBridgeControl {
    constructor() {
        this.logElement = null;
        this.statusElement = null;
        this.portElement = null;
        this.workspaceElement = null;
    }

    async initialize() {
        try {
            const { status } = await init();
            
            if (status === 'ready') {
                this.setupElements();
                await this.refreshStatus();
                this.log('MCP Bridge Control Panel initialized');
            } else {
                this.log(`Failed to initialize: ${status}`, 'error');
            }
        } catch (error) {
            this.log(`Initialization error: ${error.message}`, 'error');
        }
    }

    setupElements() {
        this.logElement = document.getElementById('log');
        this.statusElement = document.getElementById('status');
        this.portElement = document.getElementById('port');
        this.workspaceElement = document.getElementById('workspace');
        
        // Make functions available globally for button onclick handlers
        window.testConnection = () => this.testConnection();
        window.refreshStatus = () => this.refreshStatus();
        window.clearLog = () => this.clearLog();
    }

    async refreshStatus() {
        try {
            const currentRepl = await data.currentRepl({});
            
            this.statusElement.textContent = 'Running';
            this.statusElement.style.color = '#00ff88';
            this.workspaceElement.textContent = currentRepl.repl.title || 'Unknown';
            
            this.log('Status refreshed');
        } catch (error) {
            this.statusElement.textContent = 'Error';
            this.statusElement.style.color = '#ff4444';
            this.log(`Error refreshing status: ${error.message}`, 'error');
        }
    }

    async testConnection() {
        try {
            this.log('Testing MCP Bridge connection...');
            
            // Send a test message to the background script
            window.parent.postMessage({
                type: 'MCP_REQUEST',
                id: Date.now(),
                method: 'GET',
                endpoint: '/health'
            }, '*');
            
            // Listen for response
            const handleResponse = (event) => {
                if (event.data.type === 'MCP_RESPONSE') {
                    this.log('✅ Connection test successful!');
                    this.log(`Response: ${JSON.stringify(event.data.data, null, 2)}`);
                    window.removeEventListener('message', handleResponse);
                } else if (event.data.type === 'MCP_ERROR') {
                    this.log('❌ Connection test failed!', 'error');
                    this.log(`Error: ${event.data.error}`, 'error');
                    window.removeEventListener('message', handleResponse);
                }
            };
            
            window.addEventListener('message', handleResponse);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                this.log('Connection test timed out', 'warning');
            }, 5000);
            
        } catch (error) {
            this.log(`Connection test error: ${error.message}`, 'error');
        }
    }

    log(message, level = 'info') {
        if (!this.logElement) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
        const logMessage = `[${timestamp}] ${prefix} ${message}\n`;
        
        this.logElement.textContent += logMessage;
        this.logElement.scrollTop = this.logElement.scrollHeight;
        
        // Also log to extension debug console
        try {
            debug.info(`[MCP Control] ${message}`);
        } catch (e) {
            // Ignore debug logging errors
        }
    }

    clearLog() {
        if (this.logElement) {
            this.logElement.textContent = 'Log cleared.\n';
        }
    }
}

// Initialize the control panel when the script loads
const control = new MCPBridgeControl();
control.initialize();