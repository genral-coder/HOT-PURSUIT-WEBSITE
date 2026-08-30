import { createApp } from "./server/app.js";
import { env, isProd } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[hot-pursuit-api] ${isProd ? "production" : "development"} listening on :${env.port}`,
  );
});
