# Software Architecture Document (SAD)
## WhatsApp Backend API

> **Beginner-Friendly Guide to Understanding This Project**

---

## Table of Contents
1. [What is This Project?](#what-is-this-project)
2. [Big Picture Architecture](#big-picture-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure Explained](#project-structure-explained)
5. [How Data Flows Through the System](#how-data-flows-through-the-system)
6. [Key Components Deep Dive](#key-components-deep-dive)
7. [Why These Choices Were Made](#why-these-choices-were-made)
8. [Common Interview Questions](#common-interview-questions)

---

## What is This Project?

This is a **WhatsApp Messaging Backend API** built with Node.js. Think of it as a server that:
- Connects to WhatsApp Web using a real WhatsApp account
- Provides HTTP endpoints to send messages
- Handles bulk messaging (sending to many numbers at once)
- Uses a message queue to manage high volumes of messages
- Provides real-time updates via WebSockets

**Real-world analogy**: Imagine a mailroom that receives requests to send letters (messages), organizes them, and sends them out through WhatsApp instead of traditional mail.

---

## Big Picture Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  (Web Apps, Mobile Apps, Other Services)                                    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTP Requests / WebSocket
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS SERVER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │──│ Controllers  │──│  Services    │──│  Validation  │    │
│  │  (/api/v1/*) │  │ (Request     │  │ (Business    │  │   (Zod)      │    │
│  │              │  │  Handling)   │  │   Logic)     │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  WhatsApp    │ │  BullMQ      │ │   Socket.IO  │
        │   Client     │ │  (Queue)     │ │  (Real-time) │
        │(whatsapp-web │ │              │ │              │
        │    .js)      │ │   + Redis    │ │              │
        └──────────────┘ └──────────────┘ └──────────────┘
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  WhatsApp    │ │    Redis     │ │   Clients    │
            │   Servers    │ │   Server     │ │  (Browsers)  │
            └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Technology Stack

### Core Technologies

| Technology | Purpose | Why It's Used |
|------------|---------|---------------|
| **Node.js** | Runtime environment | JavaScript on the server, non-blocking I/O |
| **TypeScript** | Programming language | Adds type safety, better developer experience |
| **Express.js** | Web framework | Minimal, flexible, industry standard |
| **whatsapp-web.js** | WhatsApp integration | Unofficial library to control WhatsApp Web |
| **BullMQ** | Message queue | Handles background jobs, rate limiting |
| **Redis** | Data store | Fast in-memory storage for queues |
| **Socket.IO** | Real-time communication | Bidirectional event-based communication |
| **Zod** | Data validation | Type-safe schema validation |
| **Jest** | Testing framework | Unit and integration testing |

### Supporting Tools

| Tool | Purpose |
|------|---------|
| **Puppeteer** | Headless browser (WhatsApp Web runs in Chrome) |
| **Prisma** | Database ORM (configured but not actively used) |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |

---

## Project Structure Explained

```
backend/
├── src/
│   ├── app/
│   │   ├── modules/
│   │   │   └── whatsapp/           # WhatsApp feature module
│   │   │       ├── whatsapp.controller.ts   # Handles HTTP requests
│   │   │       ├── whatsapp.service.ts      # Business logic
│   │   │       ├── whatsapp.route.ts        # Route definitions
│   │   │       ├── whatsapp.validation.ts   # Input validation
│   │   │       └── whatsapp.socket.ts       # Real-time events
│   │   └── routes/
│   │       └── index.ts            # Central route registry
│   │
│   ├── config/
│   │   ├── env.ts                  # Environment variables
│   │   ├── whatsapp.client.ts      # WhatsApp client setup
│   │   ├── messageQueue.ts         # BullMQ queue configuration
│   │   ├── prisma.ts               # Database connection (unused)
│   │   └── multer.config.ts        # File upload config
│   │
│   ├── middlewares/
│   │   ├── globalErrorHandler.ts   # Central error handling
│   │   ├── validateRequest.ts      # Request validation middleware
│   │   └── notFound.ts             # 404 handler
│   │
│   ├── errors/
│   │   ├── AppError.ts             # Custom error class
│   │   ├── ApiError.ts             # API error class
│   │   └── handle*.ts              # Specific error handlers
│   │
│   ├── utils/
│   │   ├── catchAsync.ts           # Async error wrapper
│   │   ├── sendResponse.ts         # Standardized responses
│   │   └── jwt.ts                  # JWT utilities
│   │
│   ├── interfaces/
│   │   └── error.types.ts          # TypeScript type definitions
│   │
│   ├── tests/
│   │   ├── whatsapp.service.test.ts    # Unit tests
│   │   └── whatapp.route.test.ts       # Integration tests
│   │
│   ├── app.ts                      # Express app configuration
│   └── server.ts                   # Server entry point
│
├── prisma/
│   └── schema.prisma               # Database schema (unused)
│
├── .env                            # Environment variables
├── .env.test                       # Test environment variables
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

---

## How Data Flows Through the System

### Example: Sending a Single Message

```
Step 1: Client sends HTTP POST request
┌─────────────────────────────────────────────────────────────┐
POST /api/v1/whatsapp/send-message
{
  "phoneNumber": "8801234567890",
  "message": "Hello!"
}
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 2: Route receives request
┌─────────────────────────────────────────────────────────────┐
whatsapp.route.ts
- Applies rate limiting (30 requests/minute)
- Validates input with Zod schema
- Passes to controller
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 3: Controller processes request
┌─────────────────────────────────────────────────────────────┐
whatsapp.controller.ts
- Extracts data from request body
- Calls service method
- Sends standardized response
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 4: Service executes business logic
┌─────────────────────────────────────────────────────────────┐
whatsapp.service.ts
- Checks if WhatsApp client is ready
- Formats phone number (adds @c.us suffix)
- Sends message via WhatsApp client
- Returns result with message ID
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 5: Response sent back to client
┌─────────────────────────────────────────────────────────────┐
{
  "success": true,
  "message": "Message queued successfully",
  "data": {
    "messageId": "msg_abc123",
    "status": "sent"
  }
}
└─────────────────────────────────────────────────────────────┘
```

### Example: Sending Bulk Messages (Uses Queue)

```
Step 1: Client sends bulk request
┌─────────────────────────────────────────────────────────────┐
POST /api/v1/whatsapp/send-bulk-message
{
  "phoneNumbers": ["8801...", "8801...", "8801..."],
  "message": "Bulk message!"
}
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 2: Service enqueues messages
┌─────────────────────────────────────────────────────────────┐
whatsapp.service.ts
- Validates client is ready
- For each phone number:
  - Calls enqueueMessage() → adds to BullMQ queue
- Returns summary: X queued, Y failed
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 3: Worker processes queue
┌─────────────────────────────────────────────────────────────┐
messageQueue.ts (Worker)
- Runs continuously in background
- Processes messages one at a time (concurrency: 1)
- Rate limited: max 10 messages/minute
- Sends via WhatsApp client
- Retries failed messages (3 attempts)
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components Deep Dive

### 1. WhatsApp Client (`config/whatsapp.client.ts`)

**What it does:**
- Creates a connection to WhatsApp Web using Puppeteer (headless Chrome)
- Manages authentication lifecycle (QR code → Authenticated → Ready)
- Handles automatic reconnection with exponential backoff

**Key States:**
```
initializing → qr_pending → authenticated → ready
                    ↓
              disconnected → (auto-reconnect)
```

**Why it matters:** This is the heart of the application. Without this, no messages can be sent.

---

### 2. Message Queue (`config/messageQueue.ts`)

**What it does:**
- Uses BullMQ (built on Redis) to manage message jobs
- Ensures messages are sent reliably even under high load
- Provides retry logic for failed messages

**Queue Configuration:**
```typescript
// Each job is retried 3 times with exponential backoff
attempts: 3,
backoff: {
  type: 'exponential',
  delay: 2000,  // 2s, 4s, 8s
}

// Worker processes 1 message at a time to avoid WhatsApp rate limits
concurrency: 1,
limiter: {
  max: 10,
  duration: 60000,  // 10 messages per minute
}
```

**Why it matters:** Without a queue, sending 1000 messages would overwhelm the system and likely get the WhatsApp account banned.

---

### 3. Socket.IO (`app/modules/whatsapp/whatsapp.socket.ts`)

**What it does:**
- Provides real-time updates to connected clients
- Broadcasts events: QR code, ready status, disconnections

**Events emitted:**
| Event | When | Data |
|-------|------|------|
| `whatsapp:qr` | New QR code generated | QR code string |
| `whatsapp:ready` | Client ready to send | Status |
| `whatsapp:authenticated` | Authentication success | Status |
| `whatsapp:disconnected` | Connection lost | Reason |
| `whatsapp:auth_failure` | Authentication failed | Error message |

**Why it matters:** Users need to know when to scan QR codes and if the system is ready.

---

### 4. Validation (`app/modules/whatsapp/whatsapp.validation.ts`)

**What it does:**
- Uses Zod schemas to validate all incoming data
- Prevents invalid phone numbers or oversized messages

**Phone Number Rules:**
- Must be 10-15 digits
- No spaces, dashes, or + prefix
- Example: `8801234567890` (Bangladesh)

**Message Rules:**
- Cannot be empty
- Maximum 4096 characters

**Why it matters:** Catches errors early before they reach business logic. WhatsApp has strict formatting requirements.

---

### 5. Error Handling (`middlewares/globalErrorHandler.ts`)

**What it does:**
- Central error handler for the entire application
- Handles different error types differently:
  - Zod validation errors → 400 Bad Request
  - Prisma database errors → Custom handling
  - WhatsApp not ready → 503 Service Unavailable
  - JWT errors → 401 Unauthorized

**Response format:**
```json
{
  "success": false,
  "message": "Error description",
  "errorSources": [{"path": "field", "message": "details"}],
  "stack": "..."  // Only in development
}
```

**Why it matters:** Consistent error responses make debugging easier and improve API usability.

---

## Why These Choices Were Made

### Why TypeScript?
- **Type safety**: Catches errors at compile time, not runtime
- **Better IDE support**: Autocomplete, refactoring, inline documentation
- **Self-documenting**: Types show intent clearly

### Why Express.js?
- **Industry standard**: Most Node.js developers know it
- **Minimal**: Doesn't force unnecessary patterns
- **Middleware ecosystem**: Easy to add functionality

### Why whatsapp-web.js?
- **Unofficial but reliable**: Uses WhatsApp Web like a real user
- **No API key needed**: Uses your own WhatsApp account
- **Feature rich**: Supports media, groups, etc.

### Why BullMQ + Redis?
- **Reliability**: Jobs persist even if server restarts
- **Rate limiting**: Prevents WhatsApp account bans
- **Scalability**: Can add more workers if needed
- **Observability**: Built-in job metrics

### Why Socket.IO?
- **Real-time updates**: QR codes expire quickly, need immediate display
- **Bidirectional**: Can receive and send events
- **Fallbacks**: Works even with proxies/firewalls

### Why Zod over Joi/Yup?
- **TypeScript native**: Infers types from schemas
- **Small bundle**: Lightweight
- **Great errors**: Clear validation messages

---

## Common Interview Questions

### Q1: How does the WhatsApp client maintain connection?
**A:** The client uses `LocalAuth` strategy which saves session data to `.wwebjs_auth` folder. After initial QR scan, subsequent restarts use saved credentials. If disconnected, exponential backoff retry (1s, 2s, 4s... up to 30s) automatically reconnects.

### Q2: How do you prevent WhatsApp from banning the account?
**A:** Multiple safeguards:
1. **Rate limiting**: API endpoints limited to 30 requests/minute
2. **Queue rate limiting**: Worker sends max 10 messages/minute
3. **Serial processing**: `concurrency: 1` prevents parallel sends
4. **Retries with backoff**: Failed messages retry with delays

### Q3: What happens if the server crashes while sending messages?
**A:** BullMQ persists jobs in Redis. When server restarts, the worker continues processing from where it left off. Jobs have 3 retry attempts before being marked as failed.

### Q4: How do you handle authentication?
**A:** WhatsApp Web.js handles it:
1. First run: Generate QR code → user scans with phone
2. Session saved to `.wwebjs_auth` folder
3. Subsequent runs: Use saved session
4. If session invalid: Generate new QR code

### Q5: What's the difference between `send-message` and `send-bulk-message`?
**A:**
- `send-message`: Single message sent immediately (or array for immediate bulk)
- `send-bulk-message`: Always uses queue, accepts array or comma/newline-separated string, better for large batches

### Q6: How would you scale this to send 10,000 messages?
**A:**
1. Increase Redis connection pool
2. Add multiple worker instances (horizontal scaling)
3. Implement job prioritization
4. Add monitoring/alerting for queue depth
5. Consider multiple WhatsApp accounts (sharding)

### Q7: Why is there both a service layer and a controller layer?
**A:** Separation of concerns:
- **Controller**: HTTP-specific (req/res handling, status codes)
- **Service**: Business logic (can be reused by other entry points like CLI, jobs, etc.)

### Q8: How do you test this without sending real messages?
**A:** Unit tests mock the WhatsApp client using Jest mocks. Integration tests check against a running server but skip if WhatsApp client isn't ready.

### Q9: What security measures are in place?
**A:**
1. Input validation (Zod schemas)
2. Rate limiting (express-rate-limit)
3. CORS configuration
4. Error messages don't leak stack traces in production
5. Environment variables for secrets

### Q10: Why is Prisma included but not used?
**A:** Likely for future expansion. Currently, the app doesn't need a database (uses Redis for queue state, file system for auth). Prisma is ready if features like message history or user management are added.

---

## Quick Reference: File Purposes

| File | Purpose | Interview Tip |
|------|---------|---------------|
| `server.ts` | Entry point, starts HTTP server | Mention graceful shutdown handling |
| `app.ts` | Express configuration | Mention middleware stack order |
| `whatsapp.client.ts` | WhatsApp connection | Mention Puppeteer and headless Chrome |
| `messageQueue.ts` | Background jobs | Mention BullMQ + Redis pattern |
| `whatsapp.socket.ts` | Real-time events | Mention WebSocket vs HTTP |
| `catchAsync.ts` | Async error wrapper | Mention avoiding try-catch repetition |
| `globalErrorHandler.ts` | Error responses | Mention centralized error handling |

---

## Architecture Patterns Used

1. **Layered Architecture**: Routes → Controllers → Services
2. **Module Pattern**: Each feature in its own folder
3. **Singleton Pattern**: WhatsApp client instance
4. **Observer Pattern**: Socket.IO event broadcasting
5. **Queue Pattern**: BullMQ for background processing
6. **Factory Pattern**: Error creation (AppError, ApiError)

---

## Summary

This is a production-ready WhatsApp messaging backend that:
- ✅ Connects to WhatsApp Web programmatically
- ✅ Provides REST APIs for messaging
- ✅ Handles bulk messaging via job queues
- ✅ Implements rate limiting to prevent bans
- ✅ Provides real-time status updates
- ✅ Has comprehensive error handling
- ✅ Includes unit and integration tests

**Key Takeaway**: The architecture prioritizes reliability over speed. Messages may take time to send (due to rate limiting), but they will be delivered reliably.

---

*Good luck with your interview! 🚀*
