import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { whatsappService } from './whatsapp.service';

// ─── WhatsApp Controller ─────────────────────────────────────────────────────
// Request handlers for WhatsApp API endpoints.

const sendMessage = catchAsync(async (req, res) => {
  const { phoneNumber, message } = req.body;

  const result = await whatsappService.sendMessage(phoneNumber, message);

  sendResponse(res, {
    success: true,
    message: 'Message queued successfully for delivery',
    data: result,
    statusCode: StatusCodes.OK,
  });
});

const sendBulkMessage = catchAsync(async (req, res) => {
  const { phoneNumbers, message } = req.body;

  // Split phone numbers by commas or newlines and trim whitespace
  const numbers = phoneNumbers
    .split(/[\n,]+/)
    .map((num: string) => num.trim())
    .filter(Boolean);

  const results = [];
  for (const number of numbers) {
    try {
      const result = await whatsappService.sendMessage(number, message);
      results.push({ number, success: true, result });
      // Add a small delay between messages to avoid rate limiting/spam detection
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );
    } catch (error) {
      results.push({ number, success: false, error: (error as Error).message });
    }
  }

  sendResponse(res, {
    success: true,
    message: `Processed ${results.length} messages`,
    data: results,
    statusCode: StatusCodes.OK,
  });
});

const getStatus = catchAsync(async (_req, res) => {
  const result = await whatsappService.getStatus();

  sendResponse(res, {
    success: true,
    message: 'WhatsApp status retrieved successfully',
    data: result,
    statusCode: StatusCodes.OK,
  });
});

export const whatsappController = {
  sendMessage,
  sendBulkMessage,
  getStatus,
};
