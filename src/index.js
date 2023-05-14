const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');
const fs = require('fs');
const os = require('os');

let server;

const filename = 'config.json';
let config;

// Verifica se o arquivo existe
if (fs.existsSync(filename)) {
  // Se existir, lê o conteúdo do arquivo
  const data = fs.readFileSync(filename);
  config = JSON.parse(data);
} else {
  // Se não existir, cria um arquivo vazio
  let content = {
    gamePath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive"
  }
  fs.writeFileSync(filename, JSON.stringify(content));
  config = content;
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();

  for (const iface of Object.values(interfaces)) {
    for (const address of iface) {
      if (address.family === 'IPv4' && !address.internal && address.address.startsWith('192.168.5.')) {
        return address.address;
      }
    }
  }

  return null;
}

createServer = () => {
  const eServer = express();

  eServer.get('/api/server-address', (req, res) => {
    res.json({message: getLocalIpAddress()});
  });

  server = http.createServer(eServer);
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  io.on('connection', function (socket) {
    console.log('Client connected');

    socket.on('say', function (say) {
      console.log('Received bind:', say);
      fs.writeFile(`${config.gamePath}\\csgo\\cfg\\csconfig.cfg`, `bind . "say ${say}"`, (err) => {
        if (err) throw err;
        console.log(`bind . "say ${say}"`);
        robot.keyTap(',');
        robot.keyTap('.');
      });
    });

    socket.on('disconnect', function () {
      console.log('Client disconnected');
    });
  });

  server.listen(443, getLocalIpAddress(), function () {
    console.log('Server listening on port 443');
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  createServer();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
    createServer();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Evento que é disparado quando a aplicação está pronta
// para receber mensagens do processo de renderização.