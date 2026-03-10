import { createServer, type Server } from 'http';
import { app } from './app';
import {
  broadcastAuthenticated,
  broadcastAuthFailure,
  broadcastDisconnected,
  broadcastQr,
  broadcastReady,
  initializeWhatsAppSocket,
} from './app/modules/whatsapp/whatsapp.socket';
import envVariables from './config/env';
import { closeQueue } from './config/messageQueue';

// import { prisma } from './config/prisma';
import {
  destroyWhatsAppClient,
  initializeWhatsAppClient,
} from './config/whatsapp.client';

let server: Server;

// async function connectToDb() {
//   try {
//     await prisma.$connect();
//     // eslint-disable-next-line no-console
//     console.log('Database connected successfully');
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error(`Database connection error: ${error}`);
//   }
// }

async function startServer() {
  try {
    // await connectToDb();

    // Create HTTP server from Express app (required for Socket.IO)
    server = createServer(app);

    // Initialize Socket.IO
    initializeWhatsAppSocket(server);

    // Initialize WhatsApp client with socket broadcast callbacks
    initializeWhatsAppClient({
      onQr: (qr) => broadcastQr(qr),
      onReady: () => broadcastReady(),
      onAuthenticated: () => broadcastAuthenticated(),
      onDisconnected: (reason) => broadcastDisconnected(reason),
      onAuthFailure: (message) => broadcastAuthFailure(message),
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[Server] WhatsApp client initialization error:', error);
    });

    server.listen(envVariables.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on port ${envVariables.PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

startServer();

async function gracefulShutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`${signal} signal received: closing server`);

  // Destroy WhatsApp client
  await destroyWhatsAppClient();

  // Close BullMQ queue and worker
  await closeQueue();

  if (server) {
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed');
    });
  }
}

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// handle unhandledRejection
process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

//  handle uncaughtException
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
