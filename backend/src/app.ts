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

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[HTTP]: ${req.method} ${req.originalUrl}`);
  next();
});

// Intercept GET requests for provider-specific sign-in and trailing slashes,
// redirecting them to prevent Auth.js from throwing UnsupportedAction/UnknownAction errors.
app.get("/api/auth/signin/:provider", (req, res) => {
  res.redirect("/");
});
app.get("/api/auth/signin/", (req, res) => {
  res.redirect("/");
});

// Register modular endpoints
app.use("/api/auth/*", authRouter);
app.use("/api/users", userRouter);

// Catch-all centralized error handler
app.use(errorHandler);

export { app };
