import { createApp } from './api/app/create-app.js';
import { env } from './api/config/env.js';

const app = createApp();

app.listen(env.API_PORT, () => {
  console.log('Server listening on port ' + env.API_PORT);
});