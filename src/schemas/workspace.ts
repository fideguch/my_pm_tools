/**
 * Zod input schemas for Google Workspace MCP tools.
 * All fields have .describe() for LLM tool discovery (codebase-integrity §1.7).
 */
import { z } from 'zod';

/** workspace_search_drive input schema */
export const workspaceSearchDriveSchema = {
  query: z.string().min(1).describe('Drive search query (e.g. "name contains \'report\'")'),
  mimeType: z
    .string()
    .optional()
    .describe('MIME type filter (e.g. application/vnd.google-apps.document for Google Docs)'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max results (default 20)'),
};

/** workspace_get_doc input schema */
export const workspaceGetDocSchema = {
  documentId: z
    .string()
    .min(1)
    .describe('Google Docs document ID (from URL: docs.google.com/document/d/{id})'),
};

/** workspace_get_sheet input schema */
export const workspaceGetSheetSchema = {
  spreadsheetId: z
    .string()
    .min(1)
    .describe('Google Sheets spreadsheet ID (from URL: docs.google.com/spreadsheets/d/{id})'),
  range: z.string().min(1).describe("Cell range in A1 notation (e.g. 'Sheet1!A1:D10')"),
};

/** workspace_get_slides input schema */
export const workspaceGetSlidesSchema = {
  presentationId: z
    .string()
    .min(1)
    .describe('Google Slides presentation ID (from URL: docs.google.com/presentation/d/{id})'),
};

/** workspace_list_events input schema */
export const workspaceListEventsSchema = {
  calendarId: z
    .string()
    .default('primary')
    .describe("Calendar ID (default: 'primary' for the authenticated user's calendar)"),
  timeMin: z
    .string()
    .optional()
    .describe('Start time filter in RFC3339 format (e.g. 2026-03-28T00:00:00Z)'),
  timeMax: z.string().optional().describe('End time filter in RFC3339 format'),
  limit: z.number().int().min(1).max(100).default(20).describe('Max events to return (default 20)'),
};

/** workspace_search_gmail input schema */
export const workspaceSearchGmailSchema = {
  query: z
    .string()
    .min(1)
    .describe("Gmail search query (e.g. 'from:user@example.com subject:report after:2024/01/01')"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Max messages to return (default 10)'),
};

/** workspace_update_sheet input schema */
export const workspaceUpdateSheetSchema = {
  spreadsheetId: z
    .string()
    .min(1)
    .describe('Spreadsheet ID (from URL: docs.google.com/spreadsheets/d/{id})'),
  range: z.string().min(1).describe('A1 notation range (e.g. "Sheet1!A1:C10")'),
  values: z.string().min(1).describe('2D array as JSON string (e.g. [["A1","B1"],["A2","B2"]])'),
  valueInputOption: z
    .enum(['RAW', 'USER_ENTERED'])
    .default('USER_ENTERED')
    .describe('How values are interpreted: USER_ENTERED parses dates/numbers, RAW stores as-is'),
};

/** workspace_append_sheet input schema */
export const workspaceAppendSheetSchema = {
  spreadsheetId: z
    .string()
    .min(1)
    .describe('Spreadsheet ID (from URL: docs.google.com/spreadsheets/d/{id})'),
  range: z.string().min(1).describe('A1 notation range to detect table (e.g. "Sheet1!A:C")'),
  values: z.string().min(1).describe('Rows to append as JSON string 2D array'),
  valueInputOption: z
    .enum(['RAW', 'USER_ENTERED'])
    .default('USER_ENTERED')
    .describe('How values are interpreted: USER_ENTERED parses dates/numbers, RAW stores as-is'),
  insertDataOption: z
    .enum(['INSERT_ROWS', 'OVERWRITE'])
    .default('INSERT_ROWS')
    .describe('INSERT_ROWS shifts existing data down; OVERWRITE replaces data below the table'),
};

/** workspace_create_event input schema */
export const workspaceCreateEventSchema = {
  calendarId: z
    .string()
    .default('primary')
    .describe("Calendar ID (default: 'primary' for the authenticated user's calendar)"),
  summary: z.string().min(1).describe('Event title'),
  startDateTime: z
    .string()
    .min(1)
    .describe(
      'Start time in RFC3339 with timezone offset (e.g. "2026-04-01T10:00:00+09:00"). For all-day events use date only: "2026-04-01"'
    ),
  endDateTime: z
    .string()
    .min(1)
    .describe(
      'End time in RFC3339 with timezone offset. For all-day events use date only: "2026-04-02"'
    ),
  timeZone: z
    .string()
    .optional()
    .describe('IANA timezone (e.g. "Asia/Tokyo"). Used when offset is ambiguous.'),
  allDay: z
    .boolean()
    .optional()
    .describe('If true, use date-only format for start/end (e.g. "2026-04-01")'),
  description: z.string().optional().describe('Event description'),
  location: z.string().optional().describe('Location or meeting room'),
};
