import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { whatsappController } from './whatsapp.controller';
import { validateRequest } from '../../../middlewares/validateRequest';
import { whatsappValidation } from './whatsapp.validation';

const router = Router();

// Dedicated rate limiter for the send-message endpoint
const whatsappSendRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many WhatsApp messages sent. Please try again after a minute.',
    status: 429,
  },
});

router.post(
  '/send-message',
  whatsappSendRateLimiter,
  validateRequest(whatsappValidation.sendMessageValidationSchema),
  whatsappController.sendMessage
);

router.get('/status', whatsappController.getStatus);

export const whatsappRoutes = router;
