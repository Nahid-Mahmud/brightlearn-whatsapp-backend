import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { getClientStatus } from '../../../config/whatsapp.client';
import { enqueueMessage, getQueueStats } from '../../../config/messageQueue';

const sendMessage = async (phoneNumber: string, message: string) => {
  const status = getClientStatus();

  if (status !== 'ready') {
    throw new AppError(
      StatusCodes.SERVICE_UNAVAILABLE,
      `WhatsApp client is not ready. Current status: ${status}. Please scan the QR code first.`
    );
  }

  try {
    const result = await enqueueMessage(phoneNumber, message);

    return {
      phoneNumber,
      status: 'sent',
      message,
      ...result,
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
  getStatus,
};
