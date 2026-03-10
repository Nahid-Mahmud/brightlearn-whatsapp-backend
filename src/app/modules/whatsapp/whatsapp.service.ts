import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import {
  getClientStatus,
  getWhatsAppClient,
} from '../../../config/whatsapp.client';
import { enqueueMessage, getQueueStats } from '../../../config/messageQueue';

const sendMessage = async (phoneNumber: string, message: string) => {
  const status = getClientStatus();
  const client = getWhatsAppClient();

  if (status !== 'ready' || !client) {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      `WhatsApp client is not ready. Current status: ${status}. Please scan the QR code first.`
    );
  }

  try {
    // Format phone number to WhatsApp chat ID
    const chatId = `${phoneNumber}@c.us`;

    // Send message directly
    const sentMessage = await client.sendMessage(chatId, message);

    return {
      phoneNumber,
      status: 'sent',
      message,
      messageId: sentMessage.id._serialized,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // eslint-disable-next-line no-console
    console.error('[WhatsApp Service] Failed to send message:', errorMessage);

    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send WhatsApp message: ${errorMessage}`
    );
  }
};

const bulkSendMessages = async (
  messages: { phoneNumber: string; message: string }[]
) => {
  const status = getClientStatus();

  if (status !== 'ready') {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      `WhatsApp client is not ready. Current status: ${status}. Please scan the QR code first.`
    );
  }

  const results = await Promise.allSettled(
    messages.map(async ({ phoneNumber, message }) => {
      try {
        const result = await enqueueMessage(phoneNumber, message);
        return {
          phoneNumber,
          status: 'queued' as const,
          jobId: result.jobId,
          queuedAt: result.queuedAt,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';

        // eslint-disable-next-line no-console
        console.error(
          `[WhatsApp Service] Failed to enqueue bulk message for ${phoneNumber}:`,
          errorMessage
        );

        return {
          phoneNumber,
          status: 'failed' as const,
          error: errorMessage,
        };
      }
    })
  );

  const successfulEnqueues = results.filter(
    (result) =>
      result.status === 'fulfilled' && result.value.status === 'queued'
  ).length;

  const failedEnqueues = results.length - successfulEnqueues;

  return {
    total: messages.length,
    successful: successfulEnqueues,
    failed: failedEnqueues,
    results: results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : {
            phoneNumber: 'unknown',
            status: 'failed' as const,
            error: result.reason?.message || 'Unknown error',
          }
    ),
    message: `Bulk message queueing completed: ${successfulEnqueues} queued, ${failedEnqueues} failed.`,
  };
};

const getStatus = async () => {
  const clientStatus = getClientStatus();
  const queueStats = await getQueueStats();

  return {
    client: {
      status: clientStatus,
      isReady: clientStatus === 'ready',
    },
    queue: queueStats,
  };
};

export const whatsappService = {
  sendMessage,
  bulkSendMessages,
  getStatus,
};
