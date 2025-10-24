# Unsent Message Debug Guide

## Issue Description
When unsending a message that is NOT the most recent one, the left panel should show the actual last message, not "You unsent a message". However, the fix is not working as expected.

## Current Implementation

### Backend Changes
1. **`backend/Communication/unsent_message.php`**:
   - Enhanced to query and return `actual_last_message`, `actual_last_sender_id`, and `actual_last_sent_at`
   - These fields contain information about the actual most recent message (excluding unsent messages)

### Frontend Changes
1. **`frontend/app/ParentSection/Message/page.js`**:
   - Modified `handleMessageUnsent` function to check if the unsent message was the last message
   - If not the last message, use `actual_last_message` from backend to update the left panel
   - Added extensive debugging logs to track the unsent message flow

## Debugging Steps

### Step 1: Check SSE Connection
1. Open browser console (F12)
2. Look for "SSE connection opened" or "SSE connected successfully" logs
3. Verify that the connection status shows "Live" (green dot) in the UI

### Step 2: Check Unsent Message Event
1. Clear the console
2. Unsent a message
3. Look for these logs:
   - "SSE: Received message_unsent event:"
   - "SSE: Actual last message data:"
   - "=== MESSAGE UNSENT EVENT RECEIVED ==="
   - "handleMessageUnsent called with data:"

### Step 3: Check Data Values
When the unsent message event is received, check:
- `actual_last_message`: Should contain the text of the actual last message
- `actual_last_sender_id`: Should contain the ID of who sent the actual last message
- `actual_last_sent_at`: Should contain the timestamp of the actual last message

### Step 4: Verify Update Logic
Check if these logs appear:
- "Updated last message using backend data:"
- "Updated chat [ID]: lastMessage=[text]"

## Expected Behavior

### Scenario 1: Unsent the Most Recent Message
- Left panel should show: "You unsent a message"
- Timestamp should show when the unsent message was sent

### Scenario 2: Unsent an Older Message
- Left panel should show: The actual most recent message text
- Timestamp should show when the actual most recent message was sent

## Common Issues

### Issue 1: SSE Event Not Received
**Symptom**: No "SSE: Received message_unsent event" logs
**Possible Causes**:
- SSE connection is not established
- Backend is not writing to `sse_events.txt`
- SSE endpoint is not reading from `sse_events.txt`

**Solution**: Check backend logs and verify SSE connection

### Issue 2: Conversation Not Loaded
**Symptom**: Right panel shows "Loading conversation..."
**Possible Causes**:
- Conversation messages haven't been fetched yet
- `manuallyLoadConversation` function hasn't completed

**Solution**: Wait for conversation to load before unsending messages

### Issue 3: Update Logic Not Working
**Symptom**: Logs show event received but left panel doesn't update
**Possible Causes**:
- `actual_last_message` is null or undefined
- Chat matching logic is not finding the correct chat
- State update is not triggering a re-render

**Solution**: Check the actual data values in the logs

## Testing Checklist

- [ ] SSE connection is established (green "Live" indicator)
- [ ] Conversation is fully loaded (messages visible in right panel)
- [ ] Console logs show "SSE: Received message_unsent event"
- [ ] Console logs show actual_last_message has correct data
- [ ] Console logs show "handleMessageUnsent called with data"
- [ ] Console logs show "Updated last message using backend data"
- [ ] Left panel updates to show correct message

## Next Steps

1. Share console logs when unsending a message
2. Verify backend logs show SSE event being written
3. Check if `sse_events.txt` contains the event data
4. Verify SSE endpoint is reading and sending the events

