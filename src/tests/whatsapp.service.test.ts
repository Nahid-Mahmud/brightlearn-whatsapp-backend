import { StatusCodes } from 'http-status-codes';
import { Client } from 'whatsapp-web.js';

jest.mock('../config/whatsapp.client');
jest.mock('../config/messageQueue');

import AppError from '../errors/AppError';
import { getClientStatus, getWhatsAppClient } from '../config/whatsapp.client';
import { enqueueMessage, getQueueStats } from '../config/messageQueue';
import { whatsappService } from '../app/modules/whatsapp/whatsapp.service';

const mockedGetClientStatus = getClientStatus as jest.MockedFunction<
  typeof getClientStatus
>;
const mockedGetWhatsAppClient = getWhatsAppClient as jest.MockedFunction<
  typeof getWhatsAppClient
>;
const mockedEnqueueMessage = enqueueMessage as jest.MockedFunction<
  typeof enqueueMessage
>;
const mockedGetQueueStats = getQueueStats as jest.MockedFunction<
  typeof getQueueStats
>;

// TypeScript interfaces for mock objects
interface MockMessage {
  id: {
    _serialized: string;
  };
}

interface MockWhatsAppClient {
  sendMessage: jest.MockedFunction<
    (chatId: string, message: string) => Promise<MockMessage>
  >;
}

describe('WhatsApp Service', () => {
  // Dummy/sandbox test phone numbers
  const testPhoneNumbers = ['8801111111111', '8801222222222'];
  const testMessage = 'Hello, this is a test message!';

  // Mock client object with proper typing
  const mockClient: MockWhatsAppClient = {
    sendMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully when client is ready', async () => {
      // Arrange
      const expectedMessageId = 'test-message-id-12345';
      const expectedChatId = `${testPhoneNumbers[0]}@c.us`;

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockResolvedValue({
        id: { _serialized: expectedMessageId },
      });

      // Act
      const result = await whatsappService.sendMessage(
        testPhoneNumbers[0],
        testMessage
      );

      // Assert
      expect(mockedGetClientStatus).toHaveBeenCalledTimes(1);
      expect(mockedGetWhatsAppClient).toHaveBeenCalledTimes(1);
      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expectedChatId,
        testMessage
      );
      expect(result).toEqual({
        phoneNumber: testPhoneNumbers[0],
        status: 'sent',
        message: testMessage,
        messageId: expectedMessageId,
        timestamp: expect.any(String),
      });

      // Verify timestamp is a valid ISO string
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should throw AppError when client status is not ready', async () => {
      // Arrange
      const nonReadyStatuses: (
        | 'initializing'
        | 'qr_pending'
        | 'authenticated'
        | 'disconnected'
      )[] = ['initializing', 'qr_pending', 'authenticated', 'disconnected'];

      for (const status of nonReadyStatuses) {
        mockedGetClientStatus.mockReturnValue(status);
        mockedGetWhatsAppClient.mockReturnValue(null);

        // Act & Assert
        await expect(
          whatsappService.sendMessage(testPhoneNumbers[0], testMessage)
        ).rejects.toThrow(
          new AppError(
            StatusCodes.SERVICE_UNAVAILABLE,
            `WhatsApp client is not ready. Current status: ${status}. Please scan the QR code first.`
          )
        );
      }
    });

    it('should throw AppError when client is null even with ready status', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(null);

      // Act & Assert
      await expect(
        whatsappService.sendMessage(testPhoneNumbers[0], testMessage)
      ).rejects.toThrow(
        new AppError(
          StatusCodes.SERVICE_UNAVAILABLE,
          `WhatsApp client is not ready. Current status: ready. Please scan the QR code first.`
        )
      );
    });

    it('should handle client sendMessage failure with Error object', async () => {
      // Arrange
      const errorMessage = 'Network timeout error';
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        whatsappService.sendMessage(testPhoneNumbers[0], testMessage)
      ).rejects.toThrow(
        new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Failed to send WhatsApp message: ${errorMessage}`
        )
      );

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        '[WhatsApp Service] Failed to send message:',
        errorMessage
      );
    });

    it('should handle client sendMessage failure with unknown error', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockRejectedValue('Unknown error string');

      // Act & Assert
      await expect(
        whatsappService.sendMessage(testPhoneNumbers[0], testMessage)
      ).rejects.toThrow(
        new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Failed to send WhatsApp message: Unknown error occurred`
        )
      );

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        '[WhatsApp Service] Failed to send message:',
        'Unknown error occurred'
      );
    });

    it('should format phone number correctly for different formats', async () => {
      // Arrange
      const phoneNumbers = [
        '8801111111111',
        '+8801111111111',
        '88-01111111111',
      ];
      const expectedMessageId = 'test-message-id';

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockResolvedValue({
        id: { _serialized: expectedMessageId },
      });

      // Act & Assert
      for (const phoneNumber of phoneNumbers) {
        await whatsappService.sendMessage(phoneNumber, testMessage);
        expect(mockClient.sendMessage).toHaveBeenCalledWith(
          `${phoneNumber}@c.us`,
          testMessage
        );
      }
    });
  });

  describe('bulkSendMessages', () => {
    const bulkMessages = [
      { phoneNumber: testPhoneNumbers[0], message: testMessage },
      { phoneNumber: testPhoneNumbers[1], message: 'Second test message' },
    ];

    it('should enqueue all messages successfully', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedEnqueueMessage
        .mockResolvedValueOnce({
          jobId: 'job-1',
          queuedAt: '2026-03-10T10:00:00.000Z',
        })
        .mockResolvedValueOnce({
          jobId: 'job-2',
          queuedAt: '2026-03-10T10:00:01.000Z',
        });

      // Act
      const result = await whatsappService.bulkSendMessages(bulkMessages);

      // Assert
      expect(mockedEnqueueMessage).toHaveBeenCalledTimes(2);
      expect(mockedEnqueueMessage).toHaveBeenNthCalledWith(
        1,
        testPhoneNumbers[0],
        testMessage
      );
      expect(mockedEnqueueMessage).toHaveBeenNthCalledWith(
        2,
        testPhoneNumbers[1],
        'Second test message'
      );

      expect(result).toEqual({
        total: 2,
        successful: 2,
        failed: 0,
        results: [
          {
            phoneNumber: testPhoneNumbers[0],
            status: 'queued',
            jobId: 'job-1',
            queuedAt: '2026-03-10T10:00:00.000Z',
          },
          {
            phoneNumber: testPhoneNumbers[1],
            status: 'queued',
            jobId: 'job-2',
            queuedAt: '2026-03-10T10:00:01.000Z',
          },
        ],
        message: 'Bulk message queueing completed: 2 queued, 0 failed.',
      });
    });

    it('should handle partial failures in bulk messaging', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedEnqueueMessage
        .mockResolvedValueOnce({
          jobId: 'job-1',
          queuedAt: '2026-03-10T10:00:00.000Z',
        })
        .mockRejectedValueOnce(new Error('Queue is full'));

      // Act
      const result = await whatsappService.bulkSendMessages(bulkMessages);

      // Assert
      expect(result).toEqual({
        total: 2,
        successful: 1,
        failed: 1,
        results: [
          {
            phoneNumber: testPhoneNumbers[0],
            status: 'queued',
            jobId: 'job-1',
            queuedAt: '2026-03-10T10:00:00.000Z',
          },
          {
            phoneNumber: testPhoneNumbers[1],
            status: 'failed',
            error: 'Queue is full',
          },
        ],
        message: 'Bulk message queueing completed: 1 queued, 1 failed.',
      });

      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        `[WhatsApp Service] Failed to enqueue bulk message for ${testPhoneNumbers[1]}:`,
        'Queue is full'
      );
    });

    it('should handle all messages failing', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedEnqueueMessage
        .mockRejectedValueOnce(new Error('Redis connection failed'))
        .mockRejectedValueOnce('Unknown error');

      // Act
      const result = await whatsappService.bulkSendMessages(bulkMessages);

      // Assert
      expect(result).toEqual({
        total: 2,
        successful: 0,
        failed: 2,
        results: [
          {
            phoneNumber: testPhoneNumbers[0],
            status: 'failed',
            error: 'Redis connection failed',
          },
          {
            phoneNumber: testPhoneNumbers[1],
            status: 'failed',
            error: 'Unknown error occurred',
          },
        ],
        message: 'Bulk message queueing completed: 0 queued, 2 failed.',
      });
    });

    it('should throw AppError when client is not ready for bulk messaging', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('qr_pending');

      // Act & Assert
      await expect(
        whatsappService.bulkSendMessages(bulkMessages)
      ).rejects.toThrow(
        new AppError(
          StatusCodes.SERVICE_UNAVAILABLE,
          `WhatsApp client is not ready. Current status: qr_pending. Please scan the QR code first.`
        )
      );
    });

    it('should handle empty messages array', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');

      // Act
      const result = await whatsappService.bulkSendMessages([]);

      // Assert
      expect(result).toEqual({
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'Bulk message queueing completed: 0 queued, 0 failed.',
      });

      expect(mockedEnqueueMessage).not.toHaveBeenCalled();
    });

    it('should handle large batch of messages', async () => {
      // Arrange
      const largeBatch = Array.from({ length: 100 }, (_, i) => ({
        phoneNumber: `88099${String(i).padStart(8, '0')}`,
        message: `Message ${i + 1}`,
      }));

      mockedGetClientStatus.mockReturnValue('ready');
      // Mock successful enqueue for all messages
      mockedEnqueueMessage.mockImplementation(async (phoneNumber) => ({
        jobId: `job-${phoneNumber}`,
        queuedAt: new Date().toISOString(),
      }));

      // Act
      const result = await whatsappService.bulkSendMessages(largeBatch);

      // Assert
      expect(result.total).toBe(100);
      expect(result.successful).toBe(100);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(100);
      expect(mockedEnqueueMessage).toHaveBeenCalledTimes(100);
    });
  });

  describe('getStatus', () => {
    it('should return status when client is ready', async () => {
      // Arrange
      const mockQueueStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        paused: 0,
      };

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetQueueStats.mockResolvedValue(mockQueueStats);

      // Act
      const result = await whatsappService.getStatus();

      // Assert
      expect(result).toEqual({
        client: {
          status: 'ready',
          isReady: true,
        },
        queue: mockQueueStats,
      });

      expect(mockedGetClientStatus).toHaveBeenCalledTimes(1);
      expect(mockedGetQueueStats).toHaveBeenCalledTimes(1);
    });

    it('should return status when client is not ready', async () => {
      // Arrange
      const mockQueueStats = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      };

      mockedGetClientStatus.mockReturnValue('qr_pending');
      mockedGetQueueStats.mockResolvedValue(mockQueueStats);

      // Act
      const result = await whatsappService.getStatus();

      // Assert
      expect(result).toEqual({
        client: {
          status: 'qr_pending',
          isReady: false,
        },
        queue: mockQueueStats,
      });
    });

    it('should handle all possible client statuses', async () => {
      // Arrange
      const allStatuses: (
        | 'initializing'
        | 'qr_pending'
        | 'authenticated'
        | 'ready'
        | 'disconnected'
      )[] = [
        'initializing',
        'qr_pending',
        'authenticated',
        'ready',
        'disconnected',
      ];

      const mockQueueStats = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      };

      mockedGetQueueStats.mockResolvedValue(mockQueueStats);

      // Act & Assert
      for (const status of allStatuses) {
        mockedGetClientStatus.mockReturnValue(status);

        const result = await whatsappService.getStatus();

        expect(result).toEqual({
          client: {
            status,
            isReady: status === 'ready',
          },
          queue: mockQueueStats,
        });
      }
    });

    it('should handle queue stats error', async () => {
      // Arrange
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetQueueStats.mockRejectedValue(
        new Error('Redis connection failed')
      );

      // Act & Assert
      await expect(whatsappService.getStatus()).rejects.toThrow(
        'Redis connection failed'
      );
    });

    it('should return detailed queue statistics', async () => {
      // Arrange
      const detailedQueueStats = {
        waiting: 25,
        active: 5,
        completed: 1500,
        failed: 12,
        delayed: 8,
        paused: 0,
      };

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetQueueStats.mockResolvedValue(detailedQueueStats);

      // Act
      const result = await whatsappService.getStatus();

      // Assert
      expect(result.queue).toEqual(detailedQueueStats);
      expect(result.client.isReady).toBe(true);
    });
  });

  describe('Edge Cases and Integration Scenarios', () => {
    it('should handle concurrent sendMessage calls', async () => {
      // Arrange
      const concurrentMessages = testPhoneNumbers.map((phoneNumber, index) => ({
        phoneNumber,
        message: `Concurrent message ${index + 1}`,
      }));

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockImplementation(async () => ({
        id: { _serialized: `concurrent-msg-${Date.now()}-${Math.random()}` },
      }));

      // Act
      const promises = concurrentMessages.map(({ phoneNumber, message }) =>
        whatsappService.sendMessage(phoneNumber, message)
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(2);
      results.forEach((result, index) => {
        expect(result.phoneNumber).toBe(testPhoneNumbers[index]);
        expect(result.status).toBe('sent');
        expect(result.messageId).toBeDefined();
      });
    });

    it('should handle special characters in messages', async () => {
      // Arrange
      const specialMessage =
        '🎉 Special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockResolvedValue({
        id: { _serialized: 'special-char-msg-id' },
      });

      // Act
      const result = await whatsappService.sendMessage(
        testPhoneNumbers[0],
        specialMessage
      );

      // Assert
      expect(result.message).toBe(specialMessage);
      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumbers[0]}@c.us`,
        specialMessage
      );
    });

    it('should handle very long messages', async () => {
      // Arrange
      const longMessage = 'A'.repeat(4096); // Very long message
      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockResolvedValue({
        id: { _serialized: 'long-msg-id' },
      });

      // Act
      const result = await whatsappService.sendMessage(
        testPhoneNumbers[0],
        longMessage
      );

      // Assert
      expect(result.message).toBe(longMessage);
      expect(result.status).toBe('sent');
    });

    it('should handle invalid phone number formats gracefully', async () => {
      // Arrange
      const invalidPhoneNumbers = [
        '',
        '123',
        'invalid-phone',
        '+invalid',
        '00000000000',
      ];

      mockedGetClientStatus.mockReturnValue('ready');
      mockedGetWhatsAppClient.mockReturnValue(mockClient as unknown as Client);
      mockClient.sendMessage.mockRejectedValue(
        new Error('Invalid phone number')
      );

      // Act & Assert
      for (const phoneNumber of invalidPhoneNumbers) {
        await expect(
          whatsappService.sendMessage(phoneNumber, testMessage)
        ).rejects.toThrow(AppError);
      }
    });
  });
});
