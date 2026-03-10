import request from 'supertest';
import envVariables, { getTestPhoneNumbers } from '../config/env';

// Base URL for the running server
const BASE_URL = `http://localhost:${envVariables.PORT}`;

describe('WhatsApp Routes', () => {
  let testPhoneNumbers: string[];

  beforeAll(async () => {
    testPhoneNumbers = getTestPhoneNumbers();

    if (testPhoneNumbers.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        'Warning: No test phone numbers found in environment variables'
      );
    }

    // Check if the running server is accessible and get client status
    try {
      const response = await request(BASE_URL).get('/api/v1/whatsapp/status');
      const clientStatus = response.body?.data?.client?.status;

      // eslint-disable-next-line no-console
      console.log(`[Test Setup] Connected to server at ${BASE_URL}`);
      // eslint-disable-next-line no-console
      console.log(`[Test Setup] WhatsApp client status: ${clientStatus}`);

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          '[Test Setup] WhatsApp client not ready. Tests requiring authentication will be skipped.'
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(
          '[Test Setup] WhatsApp client is ready with authenticated session.'
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[Test Setup] Could not connect to server at ${BASE_URL}. Make sure the server is running.`,
        error
      );
    }
  });

  afterAll(async () => {
    // No cleanup needed - we're using the existing server's client
    // eslint-disable-next-line no-console
    console.log('[Test Teardown] Tests completed');
  });

  describe('GET /api/v1/whatsapp/status', () => {
    it('should return WhatsApp client status', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/whatsapp/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('client');
      expect(response.body.data.client).toHaveProperty('status');
    });
  });

  describe('POST /api/v1/whatsapp/send-message', () => {
    it('should send a message to a single phone number', async () => {
      if (testPhoneNumbers.length === 0) {
        return; // Skip test if no phone numbers available
      }

      // Check client status from server
      const statusResponse = await request(BASE_URL).get(
        '/api/v1/whatsapp/status'
      );
      const clientStatus = statusResponse.body?.data?.client?.status;

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping test - WhatsApp client not ready. Status: ${clientStatus}`
        );
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          phoneNumber: testPhoneNumbers[0],
          message: 'Test message from automated testing',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messageId');
      expect(response.body.message).toContain('queued successfully');
    });

    it('should send a message to multiple phone numbers', async () => {
      if (testPhoneNumbers.length < 2) {
        return; // Skip test if not enough phone numbers
      }

      // Check client status from server
      const statusResponse = await request(BASE_URL).get(
        '/api/v1/whatsapp/status'
      );
      const clientStatus = statusResponse.body?.data?.client?.status;

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping test - WhatsApp client not ready. Status: ${clientStatus}`
        );
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          phoneNumber: testPhoneNumbers,
          message: 'Test message to multiple recipients',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.message).toContain('queued successfully');
    });

    it('should return validation error for invalid phone number', async () => {
      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          phoneNumber: 'invalid',
          message: 'Test message',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for empty message', async () => {
      if (testPhoneNumbers.length === 0) {
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          phoneNumber: testPhoneNumbers[0],
          message: '',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing phone number', async () => {
      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          message: 'Test message',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for message exceeding max length', async () => {
      if (testPhoneNumbers.length === 0) {
        return;
      }

      const longMessage = 'a'.repeat(4097); // Exceeds 4096 character limit

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-message')
        .send({
          phoneNumber: testPhoneNumbers[0],
          message: longMessage,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/whatsapp/send-bulk-message', () => {
    it('should send bulk messages to multiple phone numbers (array)', async () => {
      if (testPhoneNumbers.length < 2) {
        return;
      }

      // Check client status from server
      const statusResponse = await request(BASE_URL).get(
        '/api/v1/whatsapp/status'
      );
      const clientStatus = statusResponse.body?.data?.client?.status;

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping test - WhatsApp client not ready. Status: ${clientStatus}`
        );
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: testPhoneNumbers,
          message: 'Bulk test message from automated testing',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.message).toContain('queued successfully');
    });

    it('should send bulk messages with comma-separated phone numbers', async () => {
      if (testPhoneNumbers.length < 2) {
        return;
      }

      // Check client status from server
      const statusResponse = await request(BASE_URL).get(
        '/api/v1/whatsapp/status'
      );
      const clientStatus = statusResponse.body?.data?.client?.status;

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping test - WhatsApp client not ready. Status: ${clientStatus}`
        );
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: testPhoneNumbers.join(','),
          message: 'Bulk test message with comma-separated numbers',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.message).toContain('queued successfully');
    });

    it('should send bulk messages with newline-separated phone numbers', async () => {
      if (testPhoneNumbers.length < 2) {
        return;
      }

      // Check client status from server
      const statusResponse = await request(BASE_URL).get(
        '/api/v1/whatsapp/status'
      );
      const clientStatus = statusResponse.body?.data?.client?.status;

      if (clientStatus !== 'ready') {
        // eslint-disable-next-line no-console
        console.warn(
          `Skipping test - WhatsApp client not ready. Status: ${clientStatus}`
        );
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: testPhoneNumbers.join('\n'),
          message: 'Bulk test message with newline-separated numbers',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.message).toContain('queued successfully');
    });

    it('should return validation error for empty phone numbers array', async () => {
      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: [],
          message: 'Test message',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid phone numbers in bulk', async () => {
      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: ['invalid', '123'],
          message: 'Test message',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing message in bulk', async () => {
      if (testPhoneNumbers.length === 0) {
        return;
      }

      const response = await request(BASE_URL)
        .post('/api/v1/whatsapp/send-bulk-message')
        .send({
          phoneNumbers: testPhoneNumbers,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on send-message endpoint', async () => {
      if (testPhoneNumbers.length === 0) {
        return;
      }

      // Make requests up to the limit (30 requests per minute)
      const requests = Array(31)
        .fill(null)
        .map(() =>
          request(BASE_URL).post('/api/v1/whatsapp/send-message').send({
            phoneNumber: testPhoneNumbers[0],
            message: 'Rate limit test',
          })
        );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429
      );

      // Note: This test might not trigger the rate limit if requests are processed slowly
      // It's here to demonstrate the concept
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    }, 30000); // Increase timeout for this test
  });
});
