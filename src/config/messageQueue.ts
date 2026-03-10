import { Queue, QueueEvents, Worker, type Job } from 'bullmq';
import envVariables from './env';
import { getWhatsAppClient, getClientStatus } from './whatsapp.client';

interface MessageJobData {
  phoneNumber: string;
  message: string;
}

interface MessageJobResult {
  messageId: string;
  timestamp: string;
}

interface EnqueueMessageResult {
  jobId: string;
  queuedAt: string;
}

const QUEUE_NAME = 'whatsapp-messages';

const redisConnection = {
  host: envVariables.REDIS_HOST,
  port: parseInt(envVariables.REDIS_PORT, 10),
  username: envVariables.REDIS_USER_NAME,
  password: envVariables.REDIS_PASSWORD,
};

const messageQueue = new Queue<MessageJobData, MessageJobResult>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 50,
    },
  },
});

const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

const messageWorker = new Worker<MessageJobData, MessageJobResult>(
  QUEUE_NAME,
  async (job: Job<MessageJobData, MessageJobResult>) => {
    const { phoneNumber, message } = job.data;

    const client = getWhatsAppClient();
    const status = getClientStatus();

    if (!client || status !== 'ready') {
      throw new Error(
        `WhatsApp client is not ready. Current status: ${status}`
      );
    }

    // Format phone number to WhatsApp chat ID
    const chatId = `${phoneNumber}@c.us`;

    // eslint-disable-next-line no-console
    console.log(
      `[MessageQueue] Processing job ${job.id}: sending to ${phoneNumber}`
    );

    const sentMessage = await client.sendMessage(chatId, message);

    // eslint-disable-next-line no-console
    console.log(
      `[MessageQueue] Job ${job.id} completed: messageId=${sentMessage.id._serialized}`
    );

    return {
      messageId: sentMessage.id._serialized,
      timestamp: new Date().toISOString(),
    };
  },
  {
    connection: redisConnection,
    concurrency: 1, // Serial processing to avoid WhatsApp rate limits
    limiter: {
      max: 10,
      duration: 60_000, // Max 10 messages per minute
    },
  }
);

messageWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[MessageQueue] Job ${job.id} completed successfully`);
});

messageWorker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`[MessageQueue] Job ${job?.id} failed: ${err.message}`);
});

messageWorker.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[MessageQueue] Worker error:', err.message);
});

export async function enqueueMessage(
  phoneNumber: string,
  message: string
): Promise<EnqueueMessageResult> {
  const job = await messageQueue.add('send-message', {
    phoneNumber,
    message,
  });

  // eslint-disable-next-line no-console
  console.log(`[MessageQueue] Enqueued job ${job.id} for ${phoneNumber}`);

  return {
    jobId: String(job.id),
    queuedAt: new Date().toISOString(),
  };
}

export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    messageQueue.getWaitingCount(),
    messageQueue.getActiveCount(),
    messageQueue.getCompletedCount(),
    messageQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export async function closeQueue(): Promise<void> {
  await messageWorker.close();
  await queueEvents.close();
  await messageQueue.close();
  // eslint-disable-next-line no-console
  console.log('[MessageQueue] Queue, events, and worker closed');
}
