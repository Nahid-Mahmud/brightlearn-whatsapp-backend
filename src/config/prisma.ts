import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
  transactionOptions: {
    timeout: 10000,
    maxWait: 5000,
  },
});
