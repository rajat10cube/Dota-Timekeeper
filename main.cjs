const { app, BrowserWindow, Tray, Menu, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');

let mainWindow;
let tray;

let appSettings = {
  showBounty: true,
  showPower: true,
  showWisdom: true,
  showLotus: true,
  showStacking: true,
  playAudio: true,
  location: 'top-right'
};

function sendSettings() {
  if (mainWindow) {
    mainWindow.webContents.send('settings-update', appSettings);
  }
}

function createWindow() {
  // We want the window to cover the entire primary screen
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Force the window to the highest z-index level so it stays over borderless window'd games 
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // VERY IMPORTANT: This makes the window ignore all mouse clicks, allowing them to pass through to the game.
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // In development, load from Vite dev server. In production, load the built index.html.
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.webContents.on('did-finish-load', () => {
    sendSettings();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'public', 'tray-icon.png');
  const iconImage = require('electron').nativeImage.createFromPath(iconPath);

  // Fallback if needed, though createFromPath handles missing files by returning an empty nativeImage
  // Create a system tray icon since there is no 'X' button on the frameless transparent window
  tray = new Tray(iconImage); 
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Dota Timekeeper', enabled: false },
    { type: 'separator' },
    { label: 'Show Bounty Runes', type: 'checkbox', checked: appSettings.showBounty, click: (i) => { appSettings.showBounty = i.checked; sendSettings(); } },
    { label: 'Show Power Runes', type: 'checkbox', checked: appSettings.showPower, click: (i) => { appSettings.showPower = i.checked; sendSettings(); } },
    { label: 'Show Wisdom Rune', type: 'checkbox', checked: appSettings.showWisdom, click: (i) => { appSettings.showWisdom = i.checked; sendSettings(); } },
    { label: 'Show Healing Lotus', type: 'checkbox', checked: appSettings.showLotus, click: (i) => { appSettings.showLotus = i.checked; sendSettings(); } },
    { label: 'Show Camp Stacking', type: 'checkbox', checked: appSettings.showStacking, click: (i) => { appSettings.showStacking = i.checked; sendSettings(); } },
    { type: 'separator' },
    { label: 'Play Sound Alerts', type: 'checkbox', checked: appSettings.playAudio, click: (i) => { appSettings.playAudio = i.checked; sendSettings(); } },
    { type: 'separator' },
    {
      label: 'Location',
      submenu: [
        { label: 'Top Left', type: 'radio', checked: appSettings.location === 'top-left', click: () => { appSettings.location = 'top-left'; sendSettings(); } },
        { label: 'Top Right', type: 'radio', checked: appSettings.location === 'top-right', click: () => { appSettings.location = 'top-right'; sendSettings(); } },
        { label: 'Center Left', type: 'radio', checked: appSettings.location === 'center-left', click: () => { appSettings.location = 'center-left'; sendSettings(); } },
        { label: 'Center Right', type: 'radio', checked: appSettings.location === 'center-right', click: () => { appSettings.location = 'center-right'; sendSettings(); } },
        { label: 'Bottom Left', type: 'radio', checked: appSettings.location === 'bottom-left', click: () => { appSettings.location = 'bottom-left'; sendSettings(); } },
        { label: 'Bottom Right', type: 'radio', checked: appSettings.location === 'bottom-right', click: () => { appSettings.location = 'bottom-right'; sendSettings(); } }
      ]
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('Dota Timekeeper');
  tray.setContextMenu(contextMenu);
}

function checkAndCreateConfig() {
  const userDataPath = app.getPath('userData');
  const flagPath = path.join(userDataPath, 'config_generated.flag');
  
  if (!fs.existsSync(flagPath)) {
    const desktopPath = app.getPath('desktop');
    const cfgPath = path.join(desktopPath, 'gamestate_integration_overlay.cfg');
    
    try {
      const cfgContent = `"Dota 2 Integration Configuration"\n{\n    "uri"           "http://localhost:3000/gsi"\n    "timeout"       "5.0"\n    "buffer"        "0.1"\n    "throttle"      "0.5"\n    "heartbeat"     "10.0"\n    "data"\n    {\n        "provider"      "1"\n        "map"           "1"\n        "player"        "1"\n        "hero"          "1"\n        "abilities"     "1"\n        "items"         "1"\n        "draft"         "1"\n    }\n}`;
      fs.writeFileSync(cfgPath, cfgContent);
      fs.writeFileSync(flagPath, 'done'); 
      
      dialog.showMessageBox({
        type: 'info',
        title: 'Action Required: Link Dota 2',
        message: 'Hey! Place the "gamestate_integration_overlay.cfg" file that was just created on your Desktop into your Dota 2 game/dota/cfg/gamestate_integration/ folder to link the overlay!',
        buttons: ['Got it!']
      });
    } catch (e) {
      console.error('Failed to generate cfg file:', e);
    }
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Allow audio playback without user gesture
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    dialog.showErrorBox('Already Running', 'Dota Timekeeper is already running. Please check your system tray.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    checkAndCreateConfig();
    createWindow();
    createTray();

    // Initialize Express server to catch GSI POST reqs from Dota 2
    const server = express();
    server.use(express.json());

    server.post('/gsi', (req, res) => {
      if (mainWindow && req.body) {
        // Broadcast the entire GSI payload down to the React frontend
        mainWindow.webContents.send('gsi-update', req.body);
      }
      res.sendStatus(200);
    });

    server.listen(3000, () => {
      console.log('Backend GSI Server listening on port 3000');
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
