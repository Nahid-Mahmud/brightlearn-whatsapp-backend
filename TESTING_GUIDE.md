# WhatsApp Testing & Troubleshooting Guide

## Problem Summary

Your tests were **passing incorrectly** while actual WhatsApp messages were **not being sent**. Here's what was wrong:

### Root Causes

1. **Weak Test Assertions** ❌
   - Tests only checked if `success` and `message` properties existed
   - Did NOT check if `success === true` or if status code was 200
   - **Result**: Tests passed even when getting 503 errors

2. **WhatsApp Client Not Initialized in Tests** ❌
   - Tests imported `app` from `app.ts`
   - WhatsApp client is initialized in `server.ts`, not in `app.ts`
   - **Result**: Client status was "disconnected" during tests

## What Was Fixed

### ✅ Test Assertions Fixed

- Now properly check `response.body.success === true`
- Now verify status code is 200 with `.expect(200)`
- Now verify response data structure (messageId, results, etc.)

### ✅ WhatsApp Client Initialization Added

- `beforeAll()` now initializes WhatsApp client before tests run
- Tests wait up to 60 seconds for client to be ready
- Tests skip if client is not ready (with warning)

### ✅ Proper Cleanup Added

- `afterAll()` destroys WhatsApp client after tests complete

## How to Run Tests Properly

### Option 1: Run with QR Code Scanning (Full Integration Test)

```bash
# Run tests - you'll need to scan QR code when prompted
npm test
# or
pnpm test
```

When the test starts:

1. Watch console for `[Test Setup] QR Code received`
2. Scan the QR code displayed in terminal
3. Wait for `[Test Setup] WhatsApp client is ready`
4. Tests will then execute with real WhatsApp integration

**Note**: QR code appears in the terminal. Use your phone's WhatsApp to scan it.

### Option 2: Use Already Authenticated Session

If you've already authenticated WhatsApp in production:

```bash
# The .wwebjs_auth folder contains your session
# Tests will use this session automatically
pnpm test
```

No QR code scanning needed if session is valid!

## Checking Production Environment

### Is WhatsApp Connected in Production?

Check the status endpoint:

```bash
curl http://localhost:5000/api/v1/whatsapp/status
```

Expected response when working:

```json
{
  "success": true,
  "data": {
    "client": {
      "status": "ready",
      "isReady": true
    },
    "queue": {...}
  }
}
```

If `status` is not "ready", messages won't send!

### Common Issues & Solutions

#### Issue: Client Status is "disconnected"

**Solution**: Start/restart the server

```bash
pnpm run dev
```

Watch for QR code in console and scan it with WhatsApp on your phone.

#### Issue: Client Status is "qr_pending"

**Solution**: Scan the QR code displayed in the terminal with your phone's WhatsApp.

#### Issue: Client Status is "authenticated" but not "ready"

**Solution**: Wait a few more seconds. If it doesn't become "ready" after 30 seconds:

1. Stop the server (Ctrl+C)
2. Delete authentication data: `rm -rf .wwebjs_auth`
3. Restart server and scan QR code again

#### Issue: Tests pass but no messages on phone

**Possible causes**:

1. Phone number format is wrong (should be with country code, e.g., `919876543210`)
2. WhatsApp client is not ready (check status as above)
3. Message is in queue but worker hasn't processed it yet
4. Wrong phone number in `.env.test`

### Verify Phone Number Format

Phone numbers must be in format: `{country_code}{number}` (no + sign, no spaces)

Examples:

- ✅ Correct: `919876543210` (India)
- ✅ Correct: `14155552671` (USA)
- ❌ Wrong: `+919876543210`
- ❌ Wrong: `+1-415-555-2671`
- ❌ Wrong: `9876543210` (missing country code)

### Check Environment Variables

**.env.test file**:

```env
NODE_ENV=test
PORT=5000
# Add your phone numbers (comma-separated)
TEST_PHONE_NUMBERS=919876543210,919876543211
# Redis config...
```

## Test Behavior After Fixes

### When WhatsApp is Ready ✅

- All tests run normally
- Messages are sent to real phone numbers
- Tests verify actual success responses

### When WhatsApp is Not Ready ⚠️

- Tests check client status first
- Tests that need client will skip with warning message
- Tests show clear message: `WhatsApp client not ready. Status: disconnected`
- Validation tests (that don't need client) still run

### When Tests Fail ❌

- Now tests fail with clear error messages
- Status code mismatches are caught
- `success: false` responses cause test failure
- You'll see exact reason for failure

## Running Server in Production

```bash
# Start the server
pnpm run dev
# or for production
pnpm start
```

Watch the console logs:

```
[WhatsApp] Initializing client...
[WhatsApp] QR code received
```

Scan the QR code, then you'll see:

```
[WhatsApp] Authenticated successfully
[WhatsApp] Client is ready
```

Once you see "Client is ready", you can send messages!

## Sending Test Messages Manually

### Using curl:

```bash
# Single message
curl -X POST http://localhost:5000/api/v1/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "919876543210",
    "message": "Hello from WhatsApp API!"
  }'

# Bulk message
curl -X POST http://localhost:5000/api/v1/whatsapp/send-bulk-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumbers": ["919876543210", "919876543211"],
    "message": "Bulk test message"
  }'
```

### Expected Success Response:

```json
{
  "success": true,
  "message": "Message queued successfully for delivery",
  "data": {
    "phoneNumber": "919876543210",
    "status": "sent",
    "message": "Hello from WhatsApp API!",
    "messageId": "...",
    "timestamp": "2026-03-10T..."
  }
}
```

## Troubleshooting Checklist

- [ ] Is server running?
- [ ] Did you scan the QR code?
- [ ] Is client status "ready"? (check `/api/v1/whatsapp/status`)
- [ ] Are phone numbers in correct format? (country code + number, no +)
- [ ] Is Redis running? (needed for message queue)
- [ ] Are TEST_PHONE_NUMBERS set in `.env.test`?
- [ ] Is the phone number registered on WhatsApp?

## Summary

**Before**: Tests passed with 503 errors, no actual messages sent  
**After**: Tests properly validate success, initialize WhatsApp client, and send real messages

**Key improvement**: Tests now fail when they should, giving you accurate feedback about system health!
