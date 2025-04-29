const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getClientData: (scriptName, inputData = null) => ipcRenderer.invoke("get-client-data", scriptName, inputData),
  logMessage: (message) => ipcRenderer.send("log-message", message)
});