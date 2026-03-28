# Gmail API v1 Reference

## Base Configuration

- **Base URL**: `https://gmail.googleapis.com/gmail/v1`
- **Auth**: `Authorization: Bearer {access_token}` (OAuth 2.0)
- **Scopes**: `https://www.googleapis.com/auth/gmail.readonly`

## Rate Limits

- **250 quota units/second** per user
- `messages.list` = 5 units, `messages.get` = 5 units
- On 429: exponential backoff with jitter

## Endpoints Used

### GET /users/me/messages

List messages matching a query.

```
GET /users/me/messages?q={query}&maxResults=100&pageToken=...
```

**Query syntax** (same as Gmail search box):

- `from:pm@example.com`
- `subject:weekly report`
- `after:2026/03/01 before:2026/04/01`
- `has:attachment filename:pdf`
- `label:INBOX is:unread`

**Response:**

```json
{
  "messages": [{ "id": "msg-id", "threadId": "thread-id" }],
  "nextPageToken": "string | undefined",
  "resultSizeEstimate": 42
}
```

### GET /users/me/messages/{id}

Get message metadata and content.

```
GET /users/me/messages/{id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date
```

**Response:**

```json
{
  "id": "string",
  "threadId": "string",
  "snippet": "Preview text...",
  "payload": {
    "headers": [
      { "name": "Subject", "value": "Weekly Report" },
      { "name": "From", "value": "pm@example.com" },
      { "name": "Date", "value": "Thu, 28 Mar 2026 10:00:00 +0900" }
    ]
  }
}
```

## Pagination

- Request: `pageToken` parameter
- Response: `nextPageToken` field (absent when no more pages)
- Max `maxResults`: 500

## Format Options

| Format     | Description                                    | Use Case                     |
| ---------- | ---------------------------------------------- | ---------------------------- |
| `metadata` | Headers only (specified via `metadataHeaders`) | Subject/From/Date extraction |
| `minimal`  | IDs and labels only                            | Quick list                   |
| `full`     | Complete message with body                     | Full content reading         |
