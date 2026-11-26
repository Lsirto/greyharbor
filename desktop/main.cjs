/**
 * Greyharbor desktop shell (Electron main process, CommonJS).
 *
 * The game is a pure static ES-module app whose browser shim fetches the card
 * table over HTTP, so file:// cannot be used. This process starts a tiny,
 * zero-dependency static server on 127.0.0.1 and loads the same app.html the
 * web version uses. No game logic lives here.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, Menu, shell } = require('electron');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = '/app.html';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url, 'http://127.0.0.1');
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname === '/') pathname = ENTRY;

        const filePath = path.normalize(path.join(ROOT, pathname));
        const insideRoot = filePath === ROOT || filePath.startsWith(ROOT + path.sep);
        if (!insideRoot) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
            'Cache-Control': 'no-store',
          });
          fs.createReadStream(filePath).pipe(res);
        });
      } catch (error) {
        res.writeHead(500);
        res.end('Internal Error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  let mainWindow = null;
  let serverRef = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  async function bootstrap() {
    serverRef = await startStaticServer();
    Menu.setApplicationMenu(null);

    const iconPath = path.join(__dirname, 'icon.png');
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1280,
      minHeight: 800,
      backgroundColor: '#0b1214',
      show: false,
      ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    await mainWindow.loadURL(`http://127.0.0.1:${serverRef.port}${ENTRY}`);
  }

  app.whenReady()
    .then(bootstrap)
    .catch((error) => {
      console.error('[greyharbor-desktop] 启动失败：', error);
      app.quit();
    });

  app.on('window-all-closed', () => {
    if (serverRef) serverRef.server.close();
    app.quit();
  });
}
