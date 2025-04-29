const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {
  // Create the main application window
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Loads the preload script
      contextIsolation: true,  // Protects the app from untrusted scripts
      nodeIntegration: false   // Disables Node.js integration for security
    },
    autoHideMenuBar: false,    // Keeps the menu bar visible
  });

  mainWindow.maximize(); // Maximizes the window on start
  mainWindow.loadFile(path.join(__dirname, "routes/index.html")); // Loads the main HTML file
});

// IPC handler to execute a PHP script and return its JSON output
ipcMain.handle("get-client-data", async (event, scriptName, inputData = null) => {
  return new Promise((resolve, reject) => {

    // Validates the PHP script file name (must end with .php and contain only valid characters)
    if (!scriptName || !/^[\w\-]+\.php$/.test(scriptName)) {
      return reject(new Error("Invalid PHP script name."));
    }

    const phpScriptPath = path.join(__dirname, "routes", "scripts", scriptName);

    // Checks if the script file exists
    if (!fs.existsSync(phpScriptPath)) {
      return reject(new Error(`PHP script not found: ${scriptName}`));
    }

    // Spawns a PHP process to run the script
    const process = spawn("php", [phpScriptPath]);

    let output = "";

    // Captures the output from the PHP script
    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Logs any errors from the PHP process
    process.stderr.on("data", (data) => {
      console.error(`PHP error (${scriptName}): ${data}`);
    });

    // When the PHP process closes, try to parse the result as JSON
    process.on("close", () => {
      try {
        // Matches and parses a JSON object or array from the PHP output
        const jsonMatch = output.match(/\{.*\}|\[.*\]/s);
        if (!jsonMatch) throw new Error("Invalid JSON returned from PHP");

        const json = JSON.parse(jsonMatch[0]);
        resolve(json); // Resolves with the parsed JSON
      } catch (err) {
        console.error(`Error processing JSON from ${scriptName}:`, err);
        reject(err); // Rejects with parsing error
      }
    });

    // If input data exists, sends it to the PHP script via stdin
    if (inputData && typeof inputData === "object") {
      process.stdin.write(JSON.stringify(inputData));
    }

    process.stdin.end(); // Closes the input stream
  });
});

// Closes the app when all windows are closed, except on macOS (Darwin)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
