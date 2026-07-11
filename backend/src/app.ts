import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Required when running behind proxies (Vite dev proxy, Cloudflare, Nginx, etc.)
app.set("trust proxy", true);

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register modular endpoints
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// Catch-all centralized error handler
app.use(errorHandler);

export { app };
