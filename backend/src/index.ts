import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`[Server]: Node.js Express server is listening in ${env.NODE_ENV} mode at http://localhost:${env.PORT}`);
});
