import type { CheckoutSessionResponse, BillingPortalResponse } from "../types/payment";

export class PaymentService {
  /**
   * Triggers the backend to spawn a Stripe/gateway Checkout Session for a specific tier.
   */
  static async createCheckoutSession(planId: string): Promise<CheckoutSessionResponse> {
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize checkout session.");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[PaymentService.createCheckoutSession] Error:", error);
      return {
        status: "fail",
        message: error.message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Requests a self-service customer portal session URL from the backend.
   */
  static async createBillingPortalSession(): Promise<BillingPortalResponse> {
    try {
      const response = await fetch("/api/payments/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize customer portal.");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[PaymentService.createBillingPortalSession] Error:", error);
      return {
        status: "fail",
        message: error.message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Retrieves checkout session details from the backend for success verification.
   */
  static async getCheckoutSession(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/payments/checkout-session/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to retrieve checkout session details.");
      }

      return await response.json();
    } catch (error: any) {
      console.error("[PaymentService.getCheckoutSession] Error:", error);
      return {
        status: "fail",
        message: error.message || "An unexpected error occurred.",
      };
    }
  }
}
