import { createApp } from './app/create-app.js';
import { env } from './config/env.js';
const app = createApp();
app.listen(env.API_PORT, () => {
    console.log(`API listening on port ${env.API_PORT}`);
});
