import { z } from 'zod';

// ─── WhatsApp Validation Schemas ─────────────────────────────────────────────
// Zod schemas for validating WhatsApp API request payloads.

const sendMessageValidationSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string('Phone number is required')
      .min(1, 'Phone number is required')
      .regex(
        /^\d{10,15}$/,
        'Phone number must be 10-15 digits without spaces, dashes, or country code prefix (+). Example: 8801XXXXXXXXX'
      ),
    message: z
      .string('Message is required')
      .min(1, 'Message cannot be empty')
      .max(4096, 'Message must not exceed 4096 characters'),
  }),
});

export const whatsappValidation = {
  sendMessageValidationSchema,
};
