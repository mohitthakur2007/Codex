"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
// This method is called when your extension is activated
function activate(context) {
    console.log('Congratulations, your extension "codex" is now active!');
    // Register the command to open the chat interface
    const disposable = vscode.commands.registerCommand('codex.helloWorld', () => {
        // Create a Webview panel
        const panel = vscode.window.createWebviewPanel('codexChat', // Identifies the type of the webview
        'Codex Chat', // Title of the panel
        vscode.ViewColumn.One, // Editor column to show the panel in
        {
            enableScripts: true, // Enable JavaScript in the webview
            retainContextWhenHidden: true // Retain state when the panel is hidden
        });
        // Set the initial HTML content for the webview
        panel.webview.html = getWebviewContent();
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            console.log("Received message from Webview:", message);
            switch (message.command) {
                case 'sendMessage':
                    const userMessage = message.text;
                    console.log("User message:", userMessage);
                    try {
                        const response = await sendMessageToOllama(userMessage);
                        console.log("Ollama response:", response);
                        panel.webview.postMessage({ command: 'receiveMessage', text: response });
                    }
                    catch (error) {
                        console.error('Error communicating with Ollama:', error);
                        panel.webview.postMessage({ command: 'error', text: 'Failed to get a response from the chatbot.' });
                    }
                    break;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
// Function to send a message to Ollama
async function sendMessageToOllama(message) {
    const ollamaUrl = 'http://localhost:11434/api/generate'; // Ollama API endpoint
    const model = 'deepseek-r1:1.5b'; // Model to use
    try {
        const response = await axios_1.default.post(ollamaUrl, {
            model: model,
            prompt: message,
            stream: false // Set to true if you want to handle streaming responses
        });
        return response.data.response;
    }
    catch (error) {
        console.error("Error in Ollama request:", error);
        return "Error fetching response from AI model.";
    }
}
// Function to generate the HTML content for the webview
function getWebviewContent() {
    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Codex Chat</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                    background-color:rgb(0, 0, 0);
                    
                }
                #chat {
                    height: 300px;
                    border: 1px solid #ccc;
                    padding: 10px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    background-color: white;
                }
                #input {
                    width: 100%;
                    padding: 10px;
                    box-sizing: border-box;
                }
            </style>
        </head>
        <body>
            <h1 class="text-2xl font-bold mb-4 text-center text-white">Codex : Welcome to CodeX</h1>
            <div id="chat"></div>
            <input id="input" type="text" placeholder="Type your message here..." />
            
            <script>
                const vscode = acquireVsCodeApi();
                const input = document.getElementById('input');
                const chatDiv = document.getElementById('chat'); // Initialize chatDiv

                // Handle incoming messages from the extension
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    switch (message.command) {
                        case 'receiveMessage':
                            chatDiv.innerHTML += \`<div><strong>Chatbot:</strong> \${message.text}</div>\`;
                            chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to latest message
                            break;
                        case 'error':
                            chatDiv.innerHTML += \`<div style="color: red; backgroung-color:black">\${message.text}</div>\`;
                            chatDiv.scrollTop = chatDiv.scrollHeight;
                            break;
                    }
                });

                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault(); // Prevent unintended behavior
                        const userMessage = input.value.trim();
                        if (userMessage) {
                            chatDiv.innerHTML += \`<div><strong>You:</strong> \${userMessage}</div>\`;
                            chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to latest message
                            
                            vscode.postMessage({
                                command: 'sendMessage',
                                text: userMessage
                            });

                            input.value = ''; // Clear input after sending
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map