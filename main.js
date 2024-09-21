const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const supportedFormats = ['.mp4', '.mkv', '.avi', '.mov'];

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'ico.ico'), // Chemin vers votre fichier ico
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true  // Pour la sécurité
        }
    });

    // Supprimer la barre de menu
    mainWindow.setMenuBarVisibility(false);

    mainWindow.loadFile('index.html');

    // Récupérer le dernier dossier utilisé
    let lastFolder = null;
    const lastFolderPath = path.join(app.getPath('userData'), 'lastFolder.json');
    if (fs.existsSync(lastFolderPath)) {
        const data = fs.readFileSync(lastFolderPath);
        lastFolder = JSON.parse(data).path;
    }

    // Si un dossier a été enregistré, l'envoyer à la fenêtre
    if (lastFolder) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('load-folder', lastFolder);
        });
    }

    // Sélection de dossier via le bouton
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];

            // Sauvegarder le dernier dossier sélectionné
            fs.writeFileSync(lastFolderPath, JSON.stringify({ path: folderPath }));

            // Lire les fichiers supportés dans le dossier sélectionné
            const files = fs.readdirSync(folderPath).filter(file => {
                const fileExtension = path.extname(file).toLowerCase();
                return supportedFormats.includes(fileExtension);
            });

            return { folderPath, files };
        }
        return null;
    });
    
     // Charger un dossier à partir d'un chemin (utilisé pour restaurer le dernier dossier)
     ipcMain.handle('load-folder', async (event, folderPath) => {
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath).filter(file => {
                const fileExtension = path.extname(file).toLowerCase();
                return supportedFormats.includes(fileExtension);
            });
            return { folderPath, files };
        }
        return { folderPath: null, files: [] };
    });
});
