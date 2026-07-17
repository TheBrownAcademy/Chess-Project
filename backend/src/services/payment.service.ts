import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { PaymentGateway } from "./gateways/payment-gateway.interface.js";
import { StripeGateway } from "./gateways/stripe.gateway.js";
import { PayPalGateway } from "./gateways/paypal.gateway.js";
import {
  handleSubscriptionCreatedOrUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionTrialWillEnd,
} from "./payment/subscription-handler.js";
import {
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired,
  handleCheckoutSessionAsyncPaymentSucceeded,
  handleCheckoutSessionAsyncPaymentFailed,
} from "./payment/checkout-handler.js";
import {
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleInvoicePaymentActionRequired,
} from "./payment/invoice-handler.js";
import {
  handleChargeDisputeCreated,
} from "./payment/charge-handler.js";

export class PaymentService {
  /**
   * Returns the active payment gateway class instance based on configuration.
   */
  private static getGateway(): PaymentGateway {
    const provider = env.PAYMENT_PROVIDER || "stripe";
    switch (provider) {
      case "stripe":
        return new StripeGateway();
      case "paypal":
        return new PayPalGateway();
      default:
        throw new Error(`Unsupported payment provider configuration: ${provider}`);
    }
  }

  /**
   * Resolves the gateway customer ID. If missing, registers a new profile with the gateway.
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, gatewayCustomerId: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    if (user.gatewayCustomerId) {
      return user.gatewayCustomerId;
    }

    // Delegate creation to the active gateway implementation
    const gateway = this.getGateway();
    const gatewayCustomerId = await gateway.createCustomer(user.email, user.name || undefined);

    // Save ID to database
    await prisma.user.update({
      where: { id: userId },
      data: { gatewayCustomerId },
    });

    return gatewayCustomerId;
  }

  /**
   * Initiates a payment checkout session. Resolves price and product details from the DB.
   */
  static async createCheckoutSession(userId: string, planIdentifier: string): Promise<string> {
    const gatewayCustomerId = await this.getOrCreateCustomer(userId);

    // 1. Fetch the product pricing configuration from the database instead of hardcoded env mappings
    const product = await prisma.product.findUnique({
      where: { identifier: planIdentifier },
    });

    if (!product || !product.isActive) {
      throw new Error(`Product plan '${planIdentifier}' is unavailable or inactive.`);
    }

    const gateway = this.getGateway();

    // 2. Dispatch checkout session creation to the active provider
    const checkoutUrl = await gateway.createCheckoutSession(
      gatewayCustomerId,
      product.gatewayPriceId,
      env.STRIPE_SUCCESS_URL || `${env.CLIENT_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      env.STRIPE_CANCEL_URL || `${env.CLIENT_ORIGIN}/pricing`,
      { userId, productId: product.id }
    );

    return checkoutUrl;
  }

  /**
   * Creates a self-service customer portal session.
   */
  static async createBillingPortalSession(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gatewayCustomerId: true },
    });

    if (!user || !user.gatewayCustomerId) {
      throw new Error("No billing profile customer ID found for this account.");
    }

    const gateway = this.getGateway();
    const portalUrl = await gateway.createBillingPortalSession(
      user.gatewayCustomerId,
      `${env.CLIENT_ORIGIN}/profile`
    );

    return portalUrl;
  }

  /**
   * Safe parses signatures, handles event audits, and manages subscription lifecycle state.
   */
  static async handleWebhookEvent(rawBody: string | Buffer, signature: string): Promise<any> {
    const provider = env.PAYMENT_PROVIDER || "stripe";
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || "mock_secret";

    const gateway = this.getGateway();
    
    // 1. Verify signatures and extract normalized payloads via the active gateway
    const verifiedEvent = await gateway.constructWebhookEvent(rawBody, signature, webhookSecret);
    const { gatewayEventId, eventType, payload } = verifiedEvent;

    // 2. Persistent Idempotency Check: search the WebhookEvent database table
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { gatewayEventId },
    });

    if (existingEvent) {
      console.log(`[PaymentService]: Webhook event '${gatewayEventId}' already processed. Skipping...`);
      return { received: true, eventId: gatewayEventId, status: "duplicate" };
    }

    // 3. Process the action logic using modular event-specific handlers
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(payload);
        break;
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(payload);
        break;
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutSessionAsyncPaymentSucceeded(payload);
        break;
      case "checkout.session.async_payment_failed":
        await handleCheckoutSessionAsyncPaymentFailed(payload);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionCreatedOrUpdated(payload);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(payload);
        break;
      case "customer.subscription.trial_will_end":
        await handleSubscriptionTrialWillEnd(payload);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(payload);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(payload);
        break;
      case "invoice.payment_action_required":
        await handleInvoicePaymentActionRequired(payload);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(payload);
        break;
      default:
        console.log(`[PaymentService]: Unhandled webhook event type '${eventType}'. Ignoring...`);
        break;
    }

    // 4. Save WebhookEvent audit record to prevent duplicates in future retry loops
    await prisma.webhookEvent.create({
      data: {
        gatewayEventId,
        provider,
        eventType,
        processed: true,
        payload: payload as any,
      },
    });

    return { received: true, eventId: gatewayEventId, type: eventType, status: "processed" };
  }
}
