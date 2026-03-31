import pino from "pino";
import { getEnv } from "./config/env.js";

const { NODE_ENV } = getEnv();

/** Structured JSON logs in production; readable level tagging in all envs. */
export const logger = pino({
  level: NODE_ENV === "production" ? "info" : "debug",
  base: { service: "ethiolocal-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
