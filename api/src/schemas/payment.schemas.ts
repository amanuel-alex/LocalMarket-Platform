import { z } from "zod";

/** Buyer initiates STK push for an order (mock). */
export const initiatePaymentSchema = z.object({
  orderId: z.string().cuid(),
  /** MSISDN-style digits, optional in mock (e.g. 2547xxxxxxxx). */
  phone: z.string().trim().regex(/^\d{10,15}$/).optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/**
 * Simplified Daraja-style callback payload (mock).
 * Real API nests `Body.stkCallback`; we accept a flat shape for the MVP and document extension.
 */
export const mpesaCallbackSchema = z.object({
  CheckoutRequestID: z.string().min(1),
  /** M-Pesa: 0 = success. */
  ResultCode: z.coerce.number().int(),
  ResultDesc: z.string().optional(),
});

export type MpesaCallbackInput = z.infer<typeof mpesaCallbackSchema>;
