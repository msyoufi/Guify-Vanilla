import { app, BrowserWindow } from 'electron';
import { join as joinPath } from 'node:path';

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  const mainWindow = createWindow('index');
  mainWindow.on('closed', app.quit);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function createWindow(templateName: string): BrowserWindow {
  const tempalteFile = pathTo(`assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: { preload: pathTo('preload.js') }
  });

  window.maximize();
  window.loadFile(tempalteFile);
  window.on('ready-to-show', window.show);

  return window;
}

function pathTo(path: string): string {
  return joinPath(app.getAppPath(), 'src', path);
}