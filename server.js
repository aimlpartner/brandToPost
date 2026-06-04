import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent crash logger to catch startup and runtime exceptions
const logFilePath = path.join(__dirname, 'crash-log.txt');
function logError(error) {
  const time = new Date().toISOString();
  const message = `[${time}] CRITICAL CRASH:\n${error.stack || error}\n\n`;
  try {
    fs.appendFileSync(logFilePath, message, 'utf8');
  } catch (e) {
    console.error('Failed to write to crash-log.txt:', e);
  }
}

process.on('uncaughtException', (err) => {
  logError(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(reason);
  process.exit(1);
});

const compiledServer = path.join(__dirname, 'dist-server', 'server.js');

if (fs.existsSync(compiledServer)) {
  import('./dist-server/server.js').catch((e) => {
    logError(e);
    process.exit(1);
  });
} else {
  import('tsx/esm')
    .then(() => {
      return import('./server.ts');
    })
    .catch((e) => {
      logError(e);
      process.exit(1);
    });
}


