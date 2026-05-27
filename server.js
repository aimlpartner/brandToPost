const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

if (isProduction) {
  await import('./dist-server/server.js');
} else {
  await import('tsx/esm');
  await import('./server.ts');
}

