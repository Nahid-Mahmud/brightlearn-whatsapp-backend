import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { whatsappService } from './whatsapp.service';

// ─── WhatsApp Controller ─────────────────────────────────────────────────────
// Request handlers for WhatsApp API endpoints.

const sendMessage = catchAsync(async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (Array.isArray(phoneNumber)) {
    const result = await whatsappService.bulkSendMessages(
      phoneNumber.map((number: string) => ({ phoneNumber: number, message }))
    );

    sendResponse(res, {
      success: true,
      message: 'Bulk messages queued successfully for delivery',
      data: result,
      statusCode: StatusCodes.OK,
    });

    return;
  }

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

  const numbers = Array.isArray(phoneNumbers)
    ? phoneNumbers
    : phoneNumbers
        .split(/[\n,]+/)
        .map((num: string) => num.trim())
        .filter(Boolean);

  const result = await whatsappService.bulkSendMessages(
    numbers.map((phoneNumber: string) => ({ phoneNumber, message }))
  );

  sendResponse(res, {
    success: true,
    message: 'Bulk messages queued successfully for delivery',
    data: result,
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
