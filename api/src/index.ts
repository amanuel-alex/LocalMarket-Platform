import "dotenv/config";
import { getEnv } from "./config/env.js";
import { app } from "./app.js";

const { PORT } = getEnv();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
