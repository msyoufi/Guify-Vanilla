const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  handle: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  recieve: (channel, listener) => ipcRenderer.on(channel, listener)
} satisfies Window['electron']);