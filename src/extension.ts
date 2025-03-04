import * as vscode from 'vscode';
import axios from 'axios';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codex" is now active!');

    // Register the command to open the chat interface
    const disposable = vscode.commands.registerCommand('codex.helloWorld', () => {
        // Create a Webview panel
        const panel = vscode.window.createWebviewPanel(
            'codexChat', // Identifies the type of the webview
            'Codex Chat', // Title of the panel
            vscode.ViewColumn.One, // Editor column to show the panel in
            {
                enableScripts: true, // Enable JavaScript in the webview
                retainContextWhenHidden: true // Retain state when the panel is hidden
            }
        );

        // Set the initial HTML content for the webview
        panel.webview.html = getWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                console.log("Received message from Webview:", message);
                switch (message.command) {
                    case 'sendMessage':
                        const userMessage = message.text;
                        console.log("User message:", userMessage);
                        
                        try {
                            const response = await sendMessageToOllama(userMessage);
                            console.log("Ollama response:", response);
                            panel.webview.postMessage({ command: 'receiveMessage', text: response });
                        } catch (error) {
                            console.error('Error communicating with Ollama:', error);
                            panel.webview.postMessage({ command: 'error', text: 'Failed to get a response from the chatbot.' });
                        }
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

// Function to send a message to Ollama
async function sendMessageToOllama(message: string): Promise<string> {
    const ollamaUrl = 'http://localhost:11434/api/generate'; // Ollama API endpoint
    const model = 'deepseek-r1:1.5b'; // Model to use

    try {
        const response = await axios.post(ollamaUrl, {
            model: model,
            prompt: message,
            stream: false // Set to true if you want to handle streaming responses
        });

        return response.data.response;
    } catch (error) {
        console.error("Error in Ollama request:", error);
        return "Error fetching response from AI model.";
    }
}

// Function to generate the HTML content for the webview
function getWebviewContent(): string {
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
export function deactivate() {}
