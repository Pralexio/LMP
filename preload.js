const { contextBridge, ipcRenderer } = require('electron');

// Exposer des fonctions dans le contexte de la page front-end
contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    onLoadFolder: (callback) => ipcRenderer.on('load-folder', (event, folderPath) => callback(folderPath))
});
