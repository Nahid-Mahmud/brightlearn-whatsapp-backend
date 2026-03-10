import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

// Represents the current lifecycle state of the WhatsApp client.
type ClientStatus =
  | 'initializing'
  | 'qr_pending'
  | 'authenticated'
  | 'ready'
  | 'disconnected';

// Callbacks used to notify other parts of the app about client events.
interface WhatsAppClientCallbacks {
  onQr: (qr: string) => void;
  onReady: () => void;
  onAuthenticated: () => void;
  onDisconnected: (reason: string) => void;
  onAuthFailure: (message: string) => void;
}

// Singleton-like client state shared across this module.
let client: Client | null = null;
let clientStatus: ClientStatus = 'disconnected';
let callbacks: WhatsAppClientCallbacks | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Reconnect backoff configuration.
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

function getReconnectDelay(): number {
  // Exponential backoff: 1s, 2s, 4s... up to max delay.
  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY_MS
  );
  return delay;
}

function createClient(): Client {
  // Create a fresh WhatsApp Web client with local session persistence.
  return new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
      ],
    },
  });
}

function attachEventListeners(whatsappClient: Client): void {
  // Fired when WhatsApp asks the user to scan a QR code.
  whatsappClient.on('qr', (qr: string) => {
    clientStatus = 'qr_pending';
    // eslint-disable-next-line no-console
    console.log('[WhatsApp] QR code received');
    qrcode.generate(qr, { small: true });
    callbacks?.onQr(qr);
  });

  // Fired when authentication succeeds.
  whatsappClient.on('authenticated', () => {
    clientStatus = 'authenticated';
    reconnectAttempts = 0;
    // eslint-disable-next-line no-console
    console.log('[WhatsApp] Authenticated successfully');
    callbacks?.onAuthenticated();
  });

  // Fired when the client is fully ready to send/receive messages.
  whatsappClient.on('ready', () => {
    clientStatus = 'ready';
    reconnectAttempts = 0;
    // eslint-disable-next-line no-console
    console.log('[WhatsApp] Client is ready');
    callbacks?.onReady();
  });

  // Fired when stored credentials are invalid or login fails.
  whatsappClient.on('auth_failure', (message: string) => {
    clientStatus = 'disconnected';
    // eslint-disable-next-line no-console
    console.error('[WhatsApp] Authentication failure:', message);
    callbacks?.onAuthFailure(message);
  });

  // Fired when the connection drops; schedules automatic reconnect.
  whatsappClient.on('disconnected', (reason: string) => {
    clientStatus = 'disconnected';
    // eslint-disable-next-line no-console
    console.warn('[WhatsApp] Disconnected:', reason);
    callbacks?.onDisconnected(reason);

    // Auto-reconnect with exponential backoff
    scheduleReconnect();
  });
}

function scheduleReconnect(): void {
  // Ensure only one reconnect timer exists at a time.
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  const delay = getReconnectDelay();
  reconnectAttempts++;

  // eslint-disable-next-line no-console
  console.log(
    `[WhatsApp] Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`
  );

  reconnectTimer = setTimeout(async () => {
    // eslint-disable-next-line no-console
    console.log(
      `[WhatsApp] Attempting reconnect (attempt ${reconnectAttempts})...`
    );

    try {
      // Destroy old client if it exists
      if (client) {
        try {
          await client.destroy();
        } catch {
          // Ignore destroy errors during reconnect
        }
      }

      client = createClient();
      attachEventListeners(client);
      clientStatus = 'initializing';
      await client.initialize();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[WhatsApp] Reconnect failed:', error);
      // Retry again using the next backoff delay.
      scheduleReconnect();
    }
  }, delay);
}

export async function initializeWhatsAppClient(
  cbs: WhatsAppClientCallbacks
): Promise<void> {
  // Save callbacks so event handlers can notify the rest of the app.
  callbacks = cbs;

  if (client) {
    // eslint-disable-next-line no-console
    console.warn('[WhatsApp] Client already initialized, destroying old one');
    try {
      await client.destroy();
    } catch {
      // Ignore
    }
  }

  client = createClient();
  attachEventListeners(client);
  clientStatus = 'initializing';

  // eslint-disable-next-line no-console
  console.log('[WhatsApp] Initializing client...');

  await client.initialize();
}

// Returns the current WhatsApp client instance, if initialized.
export function getWhatsAppClient(): Client | null {
  return client;
}

// Returns the current lifecycle status for health/status endpoints.
export function getClientStatus(): ClientStatus {
  return clientStatus;
}

export async function destroyWhatsAppClient(): Promise<void> {
  // Stop pending reconnect attempts before shutting down.
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (client) {
    try {
      await client.destroy();
      // eslint-disable-next-line no-console
      console.log('[WhatsApp] Client destroyed');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[WhatsApp] Error destroying client:', error);
    }
    client = null;
    clientStatus = 'disconnected';
  }
}
