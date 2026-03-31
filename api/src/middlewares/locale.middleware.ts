import type { RequestHandler } from "express";
import { resolveRequestLocale } from "../i18n/resolveLocale.js";

export const localeMiddleware: RequestHandler = (req, _res, next) => {
  req.locale = resolveRequestLocale(req);
  next();
};
