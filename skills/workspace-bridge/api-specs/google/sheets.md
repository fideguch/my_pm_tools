# Google Sheets API v4 Reference

## Base Configuration

- **Base URL**: `https://sheets.googleapis.com/v4`
- **Auth**: `Authorization: Bearer {access_token}` (OAuth 2.0)
- **Scopes**: `https://www.googleapis.com/auth/spreadsheets.readonly`

## Rate Limits

- **300 read requests/minute** per project
- **60 read requests/minute** per user per project
- On 429: exponential backoff with jitter

## Endpoints Used

### GET /spreadsheets/{spreadsheetId}/values/{range}

Read cell values from a range.

```
GET /spreadsheets/{spreadsheetId}/values/{range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE
```

**Range notation:**

- `Sheet1!A1:D10` — specific range
- `Sheet1` — entire sheet
- `A1:D10` — first sheet, specific range

**Response:**

```json
{
  "range": "Sheet1!A1:D10",
  "majorDimension": "ROWS",
  "values": [
    ["Header1", "Header2", "Header3"],
    ["value1", "value2", "value3"]
  ]
}
```

### GET /spreadsheets/{spreadsheetId}

Get spreadsheet metadata (sheet names, properties).

```
GET /spreadsheets/{spreadsheetId}?fields=sheets.properties
```

**Response:**

```json
{
  "sheets": [
    {
      "properties": {
        "sheetId": 0,
        "title": "Sheet1",
        "index": 0
      }
    }
  ]
}
```

## Pagination

Sheets API does not use cursor-based pagination for value reads. For large sheets, use range notation to fetch specific sections.

## Value Render Options

| Option              | Description                             |
| ------------------- | --------------------------------------- |
| `FORMATTED_VALUE`   | Values as displayed in the UI (default) |
| `UNFORMATTED_VALUE` | Raw numeric/boolean values              |
| `FORMULA`           | Cell formulas instead of values         |
