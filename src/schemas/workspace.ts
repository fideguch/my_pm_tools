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
