---
name: workspace-bridge
description: >-
  Notion + Google Workspace bridge for GitHub Project Manager.
  Provides 16 MCP tools for reading/writing Notion pages and databases,
  searching Google Drive, reading/writing Sheets, listing/creating Calendar events,
  and searching Gmail. Extends the core project management workflow
  with external knowledge and document integration.
type: automation
best_for:
  - 'Syncing Notion databases with GitHub Project boards'
  - 'Pulling Google Sheets data into sprint reports'
  - 'Searching Google Drive for project documents'
  - 'Listing Calendar events for sprint planning'
  - 'Searching Gmail for stakeholder communication'
triggers:
  - 'workspace-bridge'
  - 'Notion連携'
  - 'Google連携'
  - 'Notionからデータ取得'
  - 'スプレッドシート読み込み'
  - 'Driveから検索'
  - 'カレンダー確認'
  - 'Gmail検索'
  - 'sync notion'
  - 'fetch from sheets'
  - 'search drive'
  - 'check calendar'
estimated_time: '1-5 min per operation'
---

# Workspace Bridge

Notion + Google Workspace bridge for GitHub Project Manager. Provides read/write access to external PM tools through 16 MCP tools.

---

## Supported Tools (16)

### Notion Tools (7)

| Tool                    | Operation | Description                                       |
| ----------------------- | --------- | ------------------------------------------------- |
| `notion_search`         | Read      | Search workspace for pages and databases by title |
| `notion_get_page`       | Read      | Get page content converted to Markdown            |
| `notion_query_database` | Read      | Query database with filter/sort                   |
| `notion_create_page`    | Write     | Create page under database or page                |
| `notion_append_blocks`  | Write     | Append paragraph blocks to existing page          |
| `notion_update_page`    | Write     | Update page properties                            |
| `notion_archive_page`   | Write     | Archive (soft-delete) a page                      |

### Google Workspace Tools (9)

| Tool                     | Operation | Description                                   |
| ------------------------ | --------- | --------------------------------------------- |
| `workspace_search_drive` | Read      | Search Drive for files by query and MIME type |
| `workspace_get_doc`      | Read      | Export Google Docs as Markdown                |
| `workspace_get_sheet`    | Read      | Read spreadsheet range (headers + rows)       |
| `workspace_get_slides`   | Read      | Export Slides as plain text                   |
| `workspace_list_events`  | Read      | List Calendar events with time range filter   |
| `workspace_search_gmail` | Read      | Search Gmail with metadata extraction         |
| `workspace_update_sheet` | Write     | Write values to spreadsheet cell range        |
| `workspace_append_sheet` | Write     | Append rows to a spreadsheet                  |
| `workspace_create_event` | Write     | Create a Calendar event with attendees        |

---

## Auth Setup

### Notion

1. Create an integration at https://www.notion.so/my-integrations
2. Copy the Internal Integration Token
3. Set the environment variable:
   ```bash
   export NOTION_TOKEN="ntn_xxxxxxxxxxxxx"
   ```
4. Share target pages/databases with the integration in Notion UI

### Google Workspace

1. Create OAuth 2.0 credentials in Google Cloud Console
2. Enable APIs: Drive, Sheets, Calendar, Gmail
3. Obtain a refresh token via OAuth flow
4. Set environment variables:
   ```bash
   export GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
   export GOOGLE_REFRESH_TOKEN="1//xxxxx"
   ```

> **Security**: Never commit tokens to git. Use `.env` files (added to `.gitignore`) or a secret manager.

---

## Usage Examples

### Notion: Search and read a page

```
notion_search({ query: "Sprint 5 Planning" })
→ Returns page IDs matching the query

notion_get_page({ pageId: "page-uuid-1234" })
→ Returns page content as Markdown
```

### Notion: Query a database

```
notion_query_database({
  databaseId: "db-uuid",
  filter: '{"property":"Status","select":{"equals":"In Progress"}}',
  sorts: '[{"property":"Priority","direction":"ascending"}]'
})
→ Returns filtered/sorted rows
```

### Google: Read spreadsheet data

```
workspace_get_sheet({
  spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  range: "Sheet1!A1:D10"
})
→ Returns headers + data rows
```

### Google: Search Drive

```
workspace_search_drive({
  query: "Sprint Report",
  mimeType: "application/vnd.google-apps.document",
  limit: 10
})
→ Returns matching file list with URLs
```

### Google: List Calendar events

```
workspace_list_events({
  calendarId: "primary",
  timeMin: "2026-03-28T00:00:00Z",
  timeMax: "2026-04-04T00:00:00Z",
  limit: 20
})
→ Returns events in the time range
```

### Notion: Update page properties

```
notion_update_page({
  pageId: "page-uuid-1234",
  properties: '{"Status":{"status":{"name":"Done"}}}'
})
→ Returns updated page object
```

### Notion: Archive a page

```
notion_archive_page({
  pageId: "page-uuid-1234"
})
→ Returns archived page confirmation
```

### Google: Write to spreadsheet

```
workspace_update_sheet({
  spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  range: "Sheet1!B2:D2",
  values: [[42, "Sprint 5", "2026-03-28"]]
})
→ Returns updated cell count
```

### Google: Append rows to spreadsheet

```
workspace_append_sheet({
  spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
  range: "Sheet1!A:D",
  values: [["Sprint 5", "2026-03-28", 42, "Done"]]
})
→ Returns appended range
```

### Google: Create Calendar event

```
workspace_create_event({
  calendarId: "primary",
  summary: "Sprint 5 Review",
  start: "2026-04-06T14:00:00+09:00",
  end: "2026-04-06T15:00:00+09:00",
  description: "Sprint 5 demo and retrospective",
  attendees: ["team@example.com"]
})
→ Returns created event with ID and link
```

---

## API Spec References

Detailed API specifications are maintained in `api-specs/`:

- `api-specs/notion.md` — Notion API v1 reference
- `api-specs/google/drive.md` — Google Drive API v3
- `api-specs/google/sheets.md` — Google Sheets API v4
- `api-specs/google/calendar.md` — Google Calendar API v3
- `api-specs/google/gmail.md` — Gmail API v1

Update protocol: see `refresh-specs.md`.
