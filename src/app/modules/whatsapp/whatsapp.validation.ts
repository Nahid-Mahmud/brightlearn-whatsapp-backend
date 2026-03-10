import { z } from 'zod';

// ─── WhatsApp Validation Schemas ─────────────────────────────────────────────
// Zod schemas for validating WhatsApp API request payloads.

const singlePhoneNumberSchema = z
  .string('Phone number is required')
  .min(1, 'Phone number is required')
  .regex(
    /^\d{10,15}$/,
    'Phone number must be 10-15 digits without spaces, dashes, or country code prefix (+). Example: 8801XXXXXXXXX'
  );

const sendMessageValidationSchema = z.object({
  body: z.object({
    phoneNumber: z.union([
      singlePhoneNumberSchema,
      z
        .array(singlePhoneNumberSchema)
        .min(1, 'At least one phone number is required'),
    ]),
    message: z
      .string('Message is required')
      .min(1, 'Message cannot be empty')
      .max(4096, 'Message must not exceed 4096 characters'),
  }),
});

const sendBulkMessageValidationSchema = z.object({
  body: z.object({
    phoneNumbers: z.union([
      z
        .string('Phone numbers are required')
        .min(1, 'Phone numbers are required')
        .refine(
          (value) => {
            const numbers = value
              .split(/[\n,]+/)
              .map((num) => num.trim())
              .filter(Boolean);

            if (numbers.length === 0) {
              return false;
            }

            return numbers.every((num) => /^\d{10,15}$/.test(num));
          },
          {
            message:
              'Each phone number must be 10-15 digits without spaces, dashes, or country code prefix (+). Use commas or new lines to separate numbers.',
          }
        )
        .transform((value) =>
          value
            .split(/[\n,]+/)
            .map((num) => num.trim())
            .filter(Boolean)
        ),
      z
        .array(singlePhoneNumberSchema)
        .min(1, 'At least one phone number is required'),
    ]),
    message: z
      .string('Message is required')
      .min(1, 'Message cannot be empty')
      .max(4096, 'Message must not exceed 4096 characters'),
  }),
});

export const whatsappValidation = {
  sendMessageValidationSchema,
  sendBulkMessageValidationSchema,
};
