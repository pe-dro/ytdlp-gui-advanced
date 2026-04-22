const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Binary management
  binaryCheck: () => ipcRenderer.invoke('binary:check'),
  binaryCheckUpdate: () => ipcRenderer.invoke('binary:checkUpdate'),
  binaryDownload: (version) => ipcRenderer.invoke('binary:download', version),
  ffmpegCheck: () => ipcRenderer.invoke('ffmpeg:check'),
  onBinaryDownloadProgress: (cb) => {
    ipcRenderer.on('binary:downloadProgress', (_e, pct) => cb(pct));
    return () => ipcRenderer.removeAllListeners('binary:downloadProgress');
  },

  // Downloads
  downloadStart: (payload) => ipcRenderer.invoke('download:start', payload),
  downloadCancel: (id) => ipcRenderer.invoke('download:cancel', id),
  downloadGetFormats: (url) => ipcRenderer.invoke('download:getFormats', url),
  downloadBuildCommand: (config) => ipcRenderer.invoke('download:buildCommand', config),

  // Events from main
  onDownloadStdout: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:stdout', handler);
    return () => ipcRenderer.removeListener('download:stdout', handler);
  },
  onDownloadStderr: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:stderr', handler);
    return () => ipcRenderer.removeListener('download:stderr', handler);
  },
  onDownloadDone: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:done', handler);
    return () => ipcRenderer.removeListener('download:done', handler);
  },
  onDownloadError: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:error', handler);
    return () => ipcRenderer.removeListener('download:error', handler);
  },

  // Dialogs
  pickDir: () => ipcRenderer.invoke('dialog:pickDir'),
  pickFile: () => ipcRenderer.invoke('dialog:pickFile'),

  // Shell
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),

  // App
  getDownloadsDir: () => ipcRenderer.invoke('app:getDownloadsDir'),
});
