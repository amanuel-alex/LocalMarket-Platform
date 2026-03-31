import express from "express";
import cors from "cors";
import { getEnv } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogMiddleware } from "./middlewares/requestLog.middleware.js";

export const app = express();

if (getEnv().TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(cors());
app.use(express.json());
app.use(requestLogMiddleware);
app.use(router);
app.use(errorMiddleware);
