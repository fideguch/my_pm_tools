# Google Calendar API v3 Reference

## Base Configuration

- **Base URL**: `https://www.googleapis.com/calendar/v3`
- **Auth**: `Authorization: Bearer {access_token}` (OAuth 2.0)
- **Scopes**: `https://www.googleapis.com/auth/calendar.readonly`

## Rate Limits

- **500 queries/second** per project (shared across all Calendar API calls)
- **Per-user limit**: approximately 10 queries/second
- On 403 `userRateLimitExceeded`: exponential backoff

## Endpoints Used

### GET /calendars/{calendarId}/events

List events from a calendar.

```
GET /calendars/{calendarId}/events?timeMin=...&timeMax=...&maxResults=250&singleEvents=true&orderBy=startTime&pageToken=...
```

**Parameters:**

- `calendarId`: Calendar ID or `primary` for the user's primary calendar
- `timeMin`: Lower bound (RFC 3339, inclusive)
- `timeMax`: Upper bound (RFC 3339, exclusive)
- `maxResults`: Max events per page (1-2500, default 250)
- `singleEvents`: `true` to expand recurring events
- `orderBy`: `startTime` (requires `singleEvents=true`) or `updated`

**Response:**

```json
{
  "summary": "Calendar Name",
  "timeZone": "Asia/Tokyo",
  "items": [
    {
      "id": "string",
      "summary": "Event Title",
      "start": { "dateTime": "2026-03-28T10:00:00+09:00" },
      "end": { "dateTime": "2026-03-28T11:00:00+09:00" },
      "description": "string (optional)",
      "location": "string (optional)",
      "htmlLink": "string"
    }
  ],
  "nextPageToken": "string | undefined"
}
```

## Pagination

- Request: `pageToken` parameter
- Response: `nextPageToken` field (absent when no more pages)
- Max `maxResults`: 2500

## Event Time Formats

| Type          | Field            | Example                     |
| ------------- | ---------------- | --------------------------- |
| Timed event   | `start.dateTime` | `2026-03-28T10:00:00+09:00` |
| All-day event | `start.date`     | `2026-03-28`                |
