import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compiledServer = path.join(__dirname, 'dist-server', 'server.js');

if (fs.existsSync(compiledServer)) {
  await import('./dist-server/server.js');
} else {
  await import('tsx/esm');
  await import('./server.ts');
}


