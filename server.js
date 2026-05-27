import fs from 'fs';

const compiledServer = './dist-server/server.js';

if (fs.existsSync(compiledServer)) {
  await import(compiledServer);
} else {
  await import('tsx/esm');
  await import('./server.ts');
}


