import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join as joinPath } from 'node:path';
import * as fromsDB from './db/scripts/forms-db-manager.js';
import * as dataDB from './db/scripts/data-db-manager.js';

let MAIN_WINDOW: BrowserWindow;

app.whenReady().then(() => onAppReady());

function onAppReady(): void {
  MAIN_WINDOW = createWindow('index');
  MAIN_WINDOW.on('closed', quitApp);

  ipcMain.handle('window:close', closeFocusedWindow);

  ipcMain.handle('gui:insert', fromsDB.insertGui);
  ipcMain.handle('gui:get-all', fromsDB.getGuis);
  ipcMain.handle('gui:open', openGui);
  ipcMain.handle('gui:delete', deleteGui);
  ipcMain.handle('gui:production', makeProduction);

  ipcMain.handle('form-control:insert', fromsDB.insertFormControl);
  ipcMain.handle('form-control:update', fromsDB.updateFormControl);
  ipcMain.handle('form-control:delete', fromsDB.deleteFormControl);
  ipcMain.handle('form-control:get-all', fromsDB.getFormControls);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quitApp();
});

function openGui(e: IpcMainInvokeEvent, gui: GUI): void {
  const template = gui.production ? 'gui-form' : 'gui-editor';
  const window = createWindow(template);

  sendAfterLoad(window, 'gui:data', gui);
}

function deleteGui(e: IpcMainInvokeEvent, gui: GUI): void {
  try {
    const changes = fromsDB.deleteGui(gui.gui_id);
    if (!changes) throw new Error();

    if (gui.production)
      dataDB.deleteTable(gui);

  } catch (err) {
    console.log(err)
    throw err;
  }
}

function makeProduction(e: IpcMainInvokeEvent, gui: GUI, controls: FormControl[]): void {
  try {
    const result = fromsDB.updateGui(e, gui.gui_id, 'production', 1);
    if (!result) throw new Error();

    dataDB.createDataTable(gui, controls);
    MAIN_WINDOW.webContents.send('gui:data');

  } catch (err) {
    throw err;
  }
}

// Utils

function createWindow(templateName: string): BrowserWindow {
  const tempalteFile = pathTo(`assets/templates/${templateName}.html`);

  const window = new BrowserWindow({
    show: false,
    webPreferences: { preload: pathTo('preload.js') }
  });

  window.maximize();
  window.loadFile(tempalteFile);
  window.webContents.openDevTools({ mode: 'right' });
  window.on('ready-to-show', window.show);

  return window;
}

function sendAfterLoad(win: BrowserWindow, channel: string, ...args: any): void {
  win.webContents.on('did-finish-load', () => {
    win.webContents.send(channel, ...args);
  });
}

export function pathTo(path: string): string {
  return joinPath(app.getAppPath(), 'src', path);
}

function closeFocusedWindow(): void {
  BrowserWindow.getFocusedWindow()?.close();
}

function quitApp() {
  fromsDB.close();
  dataDB.close();
  app.quit();
}