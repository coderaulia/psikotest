import('./apps/api/dist/index.js').catch((error) => {
  console.error('Failed to start API from repo root.');
  console.error(error);
  process.exit(1);
});
