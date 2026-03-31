import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import { getEnv } from "./config/env.js";
import { v1Router } from "./api/v1/router.js";
import { v2Router } from "./api/v2/router.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogMiddleware } from "./middlewares/requestLog.middleware.js";
import {
  sanitizeBodyMiddleware,
  sanitizeQueryMiddleware,
} from "./middlewares/sanitize.middleware.js";
import { localeMiddleware } from "./middlewares/locale.middleware.js";

export const app = express();

if (getEnv().TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: getEnv().NODE_ENV === "production" ? { maxAge: 15552000, includeSubDomains: true } : false,
    }),
);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));
app.use(sanitizeQueryMiddleware);
app.use(sanitizeBodyMiddleware);
app.use(localeMiddleware);
app.use(requestLogMiddleware);
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);
/** Legacy base path — same as `/api/v1` (deprecate clients gradually). */
app.use("/", v1Router);
app.use(errorMiddleware);
