# Google Drive API v3 Reference

## Base Configuration

- **Base URL**: `https://www.googleapis.com/drive/v3`
- **Auth**: `Authorization: Bearer {access_token}` (OAuth 2.0)
- **Scopes**: `https://www.googleapis.com/auth/drive.readonly`

## Rate Limits

- **12,000 queries/minute** per project (default)
- **Per-user limit**: 12 queries/second
- On 403 `userRateLimitExceeded`: exponential backoff

## Endpoints Used

### GET /files

Search for files.

```
GET /files?q={query}&fields=files(id,name,mimeType,webViewLink,modifiedTime)&pageSize=100&pageToken=...
```

**Query syntax examples:**

- `name contains 'Sprint'`
- `mimeType = 'application/vnd.google-apps.document'`
- `'folder-id' in parents`
- `modifiedTime > '2026-03-01T00:00:00'`

**Response:**

```json
{
  "files": [
    {
      "id": "string",
      "name": "string",
      "mimeType": "string",
      "webViewLink": "string",
      "modifiedTime": "string (RFC 3339)"
    }
  ],
  "nextPageToken": "string | undefined"
}
```

### GET /files/{fileId}/export

Export Google Workspace files to other formats.

```
GET /files/{fileId}/export?mimeType=text/plain
```

**Supported export MIME types:**

- Google Docs → `text/plain`, `text/html`, `application/pdf`
- Google Sheets → `text/csv`, `application/pdf`
- Google Slides → `text/plain`, `application/pdf`

**Response:** Raw file content in requested format.

## Pagination

- Request: `pageToken` parameter
- Response: `nextPageToken` field (absent when no more pages)
- Max `pageSize`: 1000

## Common MIME Types

| Type          | MIME                                       |
| ------------- | ------------------------------------------ |
| Google Docs   | `application/vnd.google-apps.document`     |
| Google Sheets | `application/vnd.google-apps.spreadsheet`  |
| Google Slides | `application/vnd.google-apps.presentation` |
| Folder        | `application/vnd.google-apps.folder`       |
| PDF           | `application/pdf`                          |
