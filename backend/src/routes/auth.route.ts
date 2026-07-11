import { Router } from "express";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "../config/auth.js";

export const authRouter = Router();

// Mount the standard Auth.js Express adapter onto the wildcard path.
// This matches actions like POST /signin/:provider, GET /session, etc.
authRouter.use("/*", ExpressAuth(authConfig));
