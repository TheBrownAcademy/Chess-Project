import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const paymentRouter = Router();

// Protected Checkout and Customer Portal Endpoints
paymentRouter.post("/checkout", requireAuth, PaymentController.createCheckoutSession);
paymentRouter.post("/portal", requireAuth, PaymentController.createBillingPortalSession);

// Webhook endpoint (Requires raw request stream bypass, secured by signature verification)
paymentRouter.post("/webhook", PaymentController.handleWebhook);
