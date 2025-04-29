# Firebase Integration with Electron and PHP

This project demonstrates how to integrate Electron with PHP scripts. 

## Features
- Use Electron's `ipcMain` and `contextBridge` to invoke PHP scripts
- Pass data from frontend to PHP via `stdin`
- Return JSON data from PHP to frontend

## Requirements

- Node.js
- PHP CLI

## 🔧 Setup

### From Electron to PHP

Examples of calling an PHP script:
```js
//whitout and input array 
const data = await window.electronAPI.getClientData("examplescript.php");

//whith an input array
 const data = await window.electronAPI.getClientData("examplescript.php", {
          id: id,
          value: value,
          method: "update"
        });
});
```

### PHP Script Example
to receive an input array via Js and return a json response: 
```php
$stdin = fopen("php://stdin", "r");
$input = json_decode(stream_get_contents($stdin), true);
fclose($stdin);

echo json_encode(["status" => "ok", "received" => $input]);
```

### Electron main process (`main.js`)

```js
const { ipcMain } = require("electron");

ipcMain.handle("get-client-data", async (event, scriptName, inputData = null) => {
  const process = spawn("php", [phpScriptPath]);
  ...
  if (inputData) {
    process.stdin.write(JSON.stringify(inputData));
    process.stdin.end();
  }
});
```

### Electron preload script (`preload.js`)

```js
contextBridge.exposeInMainWorld("electronAPI", {
  getClientData: (script, data) => ipcRenderer.invoke("get-client-data", script, data)
});
```
