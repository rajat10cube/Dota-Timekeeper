const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onGSIUpdate: (callback) => ipcRenderer.on('gsi-update', (_event, value) => callback(value)),
  onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', (_event, value) => callback(value))
});
