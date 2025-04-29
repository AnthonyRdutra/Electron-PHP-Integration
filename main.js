const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {


  mainWindow = new BrowserWindow({
    
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: false,
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "routes/index.html"));
});

ipcMain.handle("get-client-data", async (event, scriptName, inputData = null) => {
  return new Promise((resolve, reject) => {
    if (!scriptName || !/^[\w\-]+\.php$/.test(scriptName)) {
      return reject(new Error("Nome de script PHP inválido."));
    }

    const phpScriptPath = path.join(__dirname, "routes", "scripts", scriptName);

    if (!fs.existsSync(phpScriptPath)) {
      return reject(new Error(`Script PHP não encontrado: ${scriptName}`));
    }

    const process = spawn("php", [phpScriptPath]);

    let output = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      console.error(`Erro do PHP (${scriptName}): ${data}`);
    });

    process.on("close", () => {
      try {
        const jsonMatch = output.match(/\{.*\}|\[.*\]/s);
        if (!jsonMatch) throw new Error("JSON inválido retornado do PHP");

        const json = JSON.parse(jsonMatch[0]);
        resolve(json);
      } catch (err) {
        console.error(`Erro ao processar JSON de ${scriptName}:`, err);
        reject(err);
      }
    });

    if (inputData && typeof inputData === "object") {
      process.stdin.write(JSON.stringify(inputData));
    }

    process.stdin.end();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
