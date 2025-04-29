const { contextBridge, ipcRenderer } = require("electron");

// Exposes specific APIs from the main process to the renderer process in a secure way
contextBridge.exposeInMainWorld("electronAPI", {
  
  // Exposes a method to request data from a PHP script through IPC
  // It uses ipcRenderer.invoke to call "get-client-data" and optionally sends input data
  getClientData: (scriptName, inputData = null) => 
    ipcRenderer.invoke("get-client-data", scriptName, inputData),

  // Exposes a method to send log messages to the main process
  logMessage: (message) => 
    ipcRenderer.send("log-message", message)
});
