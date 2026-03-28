# Notion API v1 Reference

## Base Configuration

- **Base URL**: `https://api.notion.com/v1`
- **Version Header**: `Notion-Version: 2022-06-28`
- **Auth**: `Authorization: Bearer {NOTION_TOKEN}` (Internal Integration Token)
- **Content-Type**: `application/json`

## Rate Limits

- **3 requests/second** per integration
- On 429: respect `Retry-After` header (seconds)
- Recommended: exponential backoff with jitter

## Endpoints Used

### POST /search

Search workspace for pages and databases.

```
POST /search
{
  "query": "string",
  "filter": { "property": "object", "value": "page" | "database" },
  "page_size": 100,           // max 100
  "start_cursor": "uuid"      // pagination
}
```

Response: `{ object: "list", results: Page[], has_more: boolean, next_cursor: string | null }`

### GET /pages/{page_id}

Retrieve page metadata and properties.

```
GET /pages/{page_id}
```

Response: `{ object: "page", id, properties, url, parent, created_time, last_edited_time, ... }`

### GET /blocks/{block_id}/children

Retrieve block children (page content).

```
GET /blocks/{block_id}/children?page_size=100&start_cursor=...
```

Response: `{ object: "list", results: Block[], has_more: boolean, next_cursor: string | null }`

### POST /databases/{database_id}/query

Query a database with filter and sort.

```
POST /databases/{database_id}/query
{
  "filter": { ... },          // Notion filter object
  "sorts": [ ... ],           // Array of sort objects
  "page_size": 100,
  "start_cursor": "uuid"
}
```

Response: `{ object: "list", results: Page[], has_more: boolean, next_cursor: string | null }`

### POST /pages

Create a new page.

```
POST /pages
{
  "parent": { "database_id": "uuid" } | { "page_id": "uuid" },
  "properties": { ... },
  "children": [ Block, ... ]  // optional initial content
}
```

Response: Page object

### PATCH /blocks/{block_id}/children

Append blocks to a page or block.

```
PATCH /blocks/{block_id}/children
{
  "children": [ Block, ... ]
}
```

Response: `{ object: "list", results: Block[] }`

## Block Types Supported

| Type                 | Structure                                     |
| -------------------- | --------------------------------------------- |
| `paragraph`          | `{ rich_text: RichText[] }`                   |
| `heading_1`          | `{ rich_text: RichText[] }`                   |
| `heading_2`          | `{ rich_text: RichText[] }`                   |
| `heading_3`          | `{ rich_text: RichText[] }`                   |
| `bulleted_list_item` | `{ rich_text: RichText[] }`                   |
| `numbered_list_item` | `{ rich_text: RichText[] }`                   |
| `to_do`              | `{ rich_text: RichText[], checked: boolean }` |
| `code`               | `{ rich_text: RichText[], language: string }` |
| `divider`            | `{}`                                          |

## Property Types

| Type           | Read Format                    | Write Format                                    |
| -------------- | ------------------------------ | ----------------------------------------------- |
| `title`        | `{ title: RichText[] }`        | `{ title: [{ text: { content: "..." } }] }`     |
| `rich_text`    | `{ rich_text: RichText[] }`    | `{ rich_text: [{ text: { content: "..." } }] }` |
| `number`       | `{ number: 42 }`               | `{ number: 42 }`                                |
| `select`       | `{ select: { name: "..." } }`  | `{ select: { name: "..." } }`                   |
| `multi_select` | `{ multi_select: [{ name }] }` | `{ multi_select: [{ name: "..." }] }`           |
| `date`         | `{ date: { start, end? } }`    | `{ date: { start: "2026-03-28" } }`             |
| `checkbox`     | `{ checkbox: true }`           | `{ checkbox: true }`                            |
| `url`          | `{ url: "https://..." }`       | `{ url: "https://..." }`                        |
| `relation`     | `{ relation: [{ id }] }`       | `{ relation: [{ id: "uuid" }] }`                |
| `status`       | `{ status: { name } }`         | `{ status: { name: "..." } }`                   |

## Error Codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| 400  | Invalid request body or parameters               |
| 401  | Invalid or expired token                         |
| 403  | Integration not shared with target resource      |
| 404  | Resource not found                               |
| 429  | Rate limited — retry after `Retry-After` seconds |
| 502  | Notion internal error — retry                    |
