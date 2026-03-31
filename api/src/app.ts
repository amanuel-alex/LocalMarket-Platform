import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getEnv } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogMiddleware } from "./middlewares/requestLog.middleware.js";
import {
  sanitizeBodyMiddleware,
  sanitizeQueryMiddleware,
} from "./middlewares/sanitize.middleware.js";

export const app = express();

if (getEnv().TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors());
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));
app.use(sanitizeQueryMiddleware);
app.use(sanitizeBodyMiddleware);
app.use(requestLogMiddleware);
app.use(router);
app.use(errorMiddleware);
