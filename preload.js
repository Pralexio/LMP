const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    onLoadFolder: (callback) => ipcRenderer.on('load-folder', (event, folderPath) => callback(folderPath))
});
