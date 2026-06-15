import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`Incoming Request: [${req.method}] ${req.url}`);
  next();
}
