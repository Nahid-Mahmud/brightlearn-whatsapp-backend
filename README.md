# WhatsApp Backend API

A Node.js backend application built with Express and WhatsApp Web.js for managing WhatsApp messaging functionality with real-time socket support.

## Features

- 🚀 WhatsApp Web.js integration for messaging
- 📱 Real-time communication with Socket.IO
- 🔄 Message queue with BullMQ and Redis
- ✅ Comprehensive testing with Jest
- 📝 TypeScript for type safety
- 🎨 ESLint and Prettier for code quality

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **Redis** (v6 or higher) - For message queue functionality

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables** (see below)

## Environment Setup

### `.env` File (Development/Production)

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Redis Configuration
REDIS_USER_NAME=default
REDIS_PASSWORD=your_redis_password
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Phone Numbers (Optional - comma-separated for testing, no + sign)
TEST_PHONE_NUMBERS=1234567890,0987654321
```

### `.env.test` File (Testing)

Create a `.env.test` file in the root directory for testing environment:

```env
# Server Configuration
PORT=5001
NODE_ENV=test

# Redis Configuration
REDIS_USER_NAME=default
REDIS_PASSWORD=your_redis_password
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Phone Numbers (Required for tests, No + sign)
TEST_PHONE_NUMBERS=1234567890,0987654321
```

### Environment Variables Description

| Variable   | Description                                            | Required | Default |
| ---------- | ------------------------------------------------------ | -------- | ------- |
| `PORT`     | Port number for the server                             | Yes      | -       |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | Yes      | -       |

| `REDIS_USER_NAME` | Redis username | Yes | - |
| `REDIS_PASSWORD` | Redis password | Yes | - |
| `REDIS_HOST` | Redis host address | Yes | - |
| `REDIS_PORT` | Redis port number | Yes | - |
| `TEST_PHONE_NUMBERS` | Comma-separated test phone numbers | No | - |

## Running the Application

### Development Mode

```bash
pnpm dev
```

The server will start on the port specified in your `.env` file (default: 5000) with hot-reload enabled.

### Production Mode

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## Testing

### Run All Tests

```bash
pnpm test
```

## Available Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start development server with hot-reload |
| `pnpm build`        | Build the application for production     |
| `pnpm start`        | Start production server                  |
| `pnpm test`         | Run all tests with Jest                  |
| `pnpm lint`         | Run ESLint                               |
| `pnpm format`       | Format code with Prettier                |
| `pnpm format:check` | Check code formatting                    |

## Project Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── modules/           # Feature modules
│   │   │   └── whatsapp/      # WhatsApp module
│   │   └── routes/            # Express routes
│   ├── config/                # Configuration files
│   │   ├── env.ts             # Environment variables
│   │   └── whatsapp.client.ts # WhatsApp client config
│   ├── errors/                # Error handlers
│   ├── interfaces/            # TypeScript interfaces
│   ├── middlewares/           # Express middlewares
│   ├── tests/                 # Test files
│   └── utils/                 # Utility functions
├── .env                       # Development environment variables
├── .env.test                  # Test environment variables
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## API Documentation

The API runs on `http://localhost:PORT` where PORT is defined in your `.env` file.

### WhatsApp Routes

All WhatsApp-related routes are available under `/api/v1/whatsapp`. Below are curl examples for each endpoint:

#### 1. Get WhatsApp Status

Check the status of the WhatsApp client and message queue.

```bash
curl -X GET http://localhost:5000/api/v1/whatsapp/status
```

**Response:**

```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "data": {
    "clientStatus": "ready",
    "queueStatus": {
      "waiting": 0,
      "active": 0,
      "completed": 5,
      "failed": 0
    }
  }
}
```

#### 2. Send Message to Single Number

Send a WhatsApp message to a single phone number.

```bash
curl -X POST http://localhost:5000/api/v1/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "8801234567890",
    "message": "Hello from WhatsApp API!"
  }'
```

**Note:** Phone number format should be: `{country_code}{number}` (no + sign, no spaces). Example: `8801234567890` for Bangladesh, `919876543210` for India.

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_123456789"
  }
}
```

#### 3. Send Bulk Messages

Send messages to multiple phone numbers (comma separated).

```bash
curl -X POST http://localhost:5000/api/v1/whatsapp/send-bulk-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["8801234567890", "919876543210", "14155552671"],
    "message": "Bulk message from WhatsApp API!"
  }'
```

For more detailed API documentation and testing examples, refer to [TESTING_GUIDE.md](TESTING_GUIDE.md).

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis server is running
   - Verify Redis credentials in `.env` file
   - Check Redis port is accessible

2. **WhatsApp Client Issues**
   - Ensure you have a stable internet connection
   - Clear the `.wwebjs_auth` folder and reconnect
   - Check puppeteer dependencies are installed

3. **Test Failures**
   - Ensure `.env.test` file exists and is properly configured
   - Check Redis is accessible for test environment

4. **Browser Instance Still Active After Server Restart**
   - Sometimes the Chrome browser instance remains active and causes errors when restarting the server
   - For Linux, run: `pkill -f chrome`
   - This will terminate all Chrome processes and allow a clean restart

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

ISC
