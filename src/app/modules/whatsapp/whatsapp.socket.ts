import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { getClientStatus } from '../../../config/whatsapp.client';

let io: SocketServer | null = null;

export function initializeWhatsAppSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const whatsappNamespace = io.of('/whatsapp');

  whatsappNamespace.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[WhatsApp Socket] Client connected: ${socket.id}`);

    // Send current status immediately on connect
    socket.emit('whatsapp:status', {
      status: getClientStatus(),
      timestamp: new Date().toISOString(),
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log(`[WhatsApp Socket] Client disconnected: ${socket.id}`);
    });
  });

  // eslint-disable-next-line no-console
  console.log('[WhatsApp Socket] Socket.IO initialized on /whatsapp namespace');

  return io;
}

export function broadcastQr(qr: string): void {
  if (!io) return;
  io.of('/whatsapp').emit('whatsapp:qr', {
    qr,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastReady(): void {
  if (!io) return;
  io.of('/whatsapp').emit('whatsapp:ready', {
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}

export function broadcastAuthenticated(): void {
  if (!io) return;
  io.of('/whatsapp').emit('whatsapp:authenticated', {
    status: 'authenticated',
    timestamp: new Date().toISOString(),
  });
}

export function broadcastDisconnected(reason: string): void {
  if (!io) return;
  io.of('/whatsapp').emit('whatsapp:disconnected', {
    status: 'disconnected',
    reason,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastAuthFailure(message: string): void {
  if (!io) return;
  io.of('/whatsapp').emit('whatsapp:auth_failure', {
    status: 'auth_failure',
    message,
    timestamp: new Date().toISOString(),
  });
}
