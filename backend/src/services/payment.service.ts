import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { PaymentGateway } from "./gateways/payment-gateway.interface.js";
import { StripeGateway } from "./gateways/stripe.gateway.js";
import { PayPalGateway } from "./gateways/paypal.gateway.js";

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

    // 3. Process the action logic
    if (eventType === "invoice.payment_succeeded" || eventType === "checkout.session.completed") {
      // Stub payload processing
      const userId = payload.metadata?.userId || "mock-user-id";
      const productId = payload.metadata?.productId;

      // Find the database product referenced
      const product = productId
        ? await prisma.product.findUnique({ where: { id: productId } })
        : await prisma.product.findFirst({ where: { gatewayPriceId: payload.lines?.data[0]?.price?.id } });

      if (!product) {
        throw new Error("Target product could not be identified during webhook processing.");
      }

      // Upsert user subscription linked to the Product model
      const subscription = await prisma.subscription.upsert({
        where: { gatewaySubscriptionId: payload.subscription || "mock_sub" },
        update: {
          status: "ACTIVE",
          currentPeriodStart: new Date(payload.period_start * 1000),
          currentPeriodEnd: new Date(payload.period_end * 1000),
        },
        create: {
          userId,
          productId: product.id,
          status: "ACTIVE",
          gatewaySubscriptionId: payload.subscription || "mock_sub",
          currentPeriodStart: new Date(payload.period_start * 1000),
          currentPeriodEnd: new Date(payload.period_end * 1000),
        },
      });

      // Log Payment transaction with audit traits (e.g. metadata bucket for debugging/refunds)
      await prisma.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amount: payload.amount_paid || 0,
          currency: payload.currency || "usd",
          status: "SUCCEEDED",
          paymentMethod: "card",
          gatewayPaymentIntentId: payload.payment_intent || `pi_${Math.random().toString(36).substring(7)}`,
          gatewayInvoiceId: payload.id || `in_${Math.random().toString(36).substring(7)}`,
          provider,
          gatewayCustomerId: payload.customer,
          gatewayMetadata: {
            gatewayEventId,
            receiptEmail: payload.customer_email || null,
            chargeId: payload.charge || null,
          },
        },
      });

      console.log(`[PaymentService]: Subscriptions updated and payment recorded for user ${userId}`);
    } else if (eventType === "customer.subscription.deleted" || eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      const gatewaySubscriptionId = payload.id || "mock_sub";
      
      await prisma.subscription.update({
        where: { gatewaySubscriptionId },
        data: {
          status: "CANCELED",
          endedAt: new Date(),
        },
      });

      console.log(`[PaymentService]: Terminated subscription ${gatewaySubscriptionId}`);
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
