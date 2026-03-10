# Testing Guide

This guide covers how to set up and run tests for the WhatsApp Backend API.

## Prerequisites

Before running tests, ensure you have:

- Node.js (v18 or higher) installed
- pnpm installed
- Redis server running
- All dependencies installed (`pnpm install`)

## Test Environment Setup

### 1. Create `.env.test` File

Create a `.env.test` file in the root directory of the project:

```env
# Server Configuration
PORT=5001
NODE_ENV=test

# Redis Configuration
REDIS_USER_NAME=default
REDIS_PASSWORD=your_redis_password
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Phone Numbers (comma-separated, with country code, no + sign)
TEST_PHONE_NUMBERS=919876543210,919876543211
```

### 2. Environment Variables Explanation

| Variable             | Description                                   | Example                    |
| -------------------- | --------------------------------------------- | -------------------------- |
| `PORT`               | Port for test server (different from dev)     | `5001`                     |
| `NODE_ENV`           | Must be set to `test`                         | `test`                     |
| `REDIS_USER_NAME`    | Redis username                                | `default`                  |
| `REDIS_PASSWORD`     | Your Redis password                           | `yourpassword`             |
| `REDIS_HOST`         | Redis server host                             | `localhost`                |
| `REDIS_PORT`         | Redis server port                             | `6379`                     |
| `TEST_PHONE_NUMBERS` | Phone numbers for testing (with country code) | `919876543210,14155552671` |

### 3. Phone Number Format

Phone numbers must be in the format: `{country_code}{number}` (no + sign, no spaces)

**Examples:**

- ✅ Correct: `919876543210` (India)
- ✅ Correct: `14155552671` (USA)
- ❌ Wrong: `+919876543210`
- ❌ Wrong: `+1-415-555-2671`
- ❌ Wrong: `9876543210` (missing country code)

### 4. Start Redis Server

Make sure Redis is running before executing tests:

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

## Running Tests

## Running Tests

### Basic Test Execution

Run all tests with the following command:

```bash
pnpm test
```

This command will:

1. Set `NODE_ENV=test` environment variable
2. Load configuration from `.env.test` file
3. Execute all test files using Jest
4. Display test results in the terminal

### Test Execution Options

```bash
# Run tests with coverage report
pnpm test -- --coverage

# Run specific test file
pnpm test -- whatapp.route.test.ts

# Run tests in watch mode (re-run on file changes)
pnpm test -- --watch

# Run tests with verbose output
pnpm test -- --verbose
```

## Test Types

### 1. Route Tests (`whatapp.route.test.ts`)

Tests API endpoints and request/response handling:

- Input validation
- Response status codes
- Response data structure
- Error handling

### 2. Service Tests (`whatsapp.service.test.ts`)

Tests business logic and service layer:

- Message processing
- Phone number validation
- Service methods functionality

## WhatsApp Client in Tests

### Option 1: Run Tests Without WhatsApp Client (Unit Tests Only)

The tests are designed to work even when the WhatsApp client is not initialized:

- Validation tests will pass
- Tests that require WhatsApp client will skip with a warning
- Useful for CI/CD pipelines where WhatsApp authentication isn't available

### Option 2: Run Tests With WhatsApp Client (Integration Tests)

For full integration testing with real WhatsApp functionality:

**Method A: Using Existing Session**
If you've already authenticated WhatsApp in development:

```bash
# The .wwebjs_auth folder contains your session
pnpm test
```

Tests will use the existing session automatically (no QR code needed).

**Method B: Fresh Authentication**
If no session exists:

1. Run tests: `pnpm test`
2. Watch console for `[Test Setup] QR Code received`
3. Scan the QR code with WhatsApp on your phone
4. Wait for `[Test Setup] WhatsApp client is ready`
5. Tests will execute with real WhatsApp integration

## Understanding Test Output

### Successful Test Run

```
PASS  src/tests/whatapp.route.test.ts
  WhatsApp Routes
    GET /api/v1/whatsapp/status
      ✓ should return client and queue status (150ms)
    POST /api/v1/whatsapp/send-message
      ✓ should send a message successfully (2500ms)
    POST /api/v1/whatsapp/send-bulk-message
      ✓ should send bulk messages (3200ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Skipped Tests (WhatsApp Not Ready)

```
PASS  src/tests/whatapp.route.test.ts
  WhatsApp Routes
    GET /api/v1/whatsapp/status
      ✓ should return client status (100ms)
    POST /api/v1/whatsapp/send-message
      ○ skipped - WhatsApp client not ready. Status: disconnected

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 skipped, 2 total
```

## Troubleshooting

### Issue: Tests fail with "Redis connection refused"

**Solution:**

```bash
# Start Redis server
redis-server

# Or check if Redis is running
redis-cli ping
```

### Issue: Tests can't find `.env.test` file

**Solution:**

- Ensure `.env.test` file exists in the project root
- Check file permissions
- Verify NODE_ENV is set to "test"

### Issue: Invalid phone number in tests

**Solution:**

- Verify `TEST_PHONE_NUMBERS` in `.env.test`
- Ensure format is: `{country_code}{number}` (no +, no spaces)
- Example: `8801234567890` not `+8801234567890`

### Issue: WhatsApp client not ready during tests

**Solution:**
This is expected behavior when:

- You haven't authenticated WhatsApp yet
- Running in CI/CD environment
- Session has expired

Tests requiring WhatsApp will skip automatically. To fix:

1. Run development server: `pnpm dev`
2. Scan QR code to authenticate
3. Stop server and run tests again

### Issue: Tests timeout

**Solution:**

```bash
# Increase Jest timeout (in jest.config.ts)
testTimeout: 30000  // 30 seconds

# Or run tests with custom timeout
pnpm test -- --testTimeout=60000
```

## CI/CD Considerations

When running tests in CI/CD pipelines:

1. **Set required environment variables** in your CI/CD platform
2. **Ensure Redis is available** (use Docker service or cloud Redis)
3. **Tests will skip WhatsApp-dependent tests** automatically
4. **Use test database** if needed (configured via `.env.test`)

Example GitHub Actions setup:

```yaml
services:
  redis:
    image: redis:6
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

## Best Practices

1. **Always use `.env.test`** - Never use production credentials in tests
2. **Use test phone numbers** - Don't spam real users during testing
3. **Clean up after tests** - Tests automatically clean up WhatsApp client
4. **Run tests before commits** - Ensure your changes don't break existing functionality
5. **Check test coverage** - Run `pnpm test -- --coverage` regularly

## Test File Locations

- Route tests: `src/tests/whatapp.route.test.ts`
- Service tests: `src/tests/whatsapp.service.test.ts`
- Test configuration: `jest.config.ts`
- Test environment: `.env.test`

## Additional Commands

```bash
# Run tests with coverage and generate HTML report
pnpm test -- --coverage --coverageReporters=html

# Run only failed tests from last run
pnpm test -- --onlyFailures

# Update test snapshots (if using snapshot testing)
pnpm test -- --updateSnapshot

# Run tests silently (minimal output)
pnpm test -- --silent
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check the main [README.md](README.md) for general setup
2. Review test files for implementation details
3. Check Jest documentation: https://jestjs.io/docs/getting-started
4. Ensure all prerequisites are met (Node.js, pnpm, Redis)
