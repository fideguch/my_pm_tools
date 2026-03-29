import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  workspaceSearchDriveSchema,
  workspaceGetDocSchema,
  workspaceGetSheetSchema,
  workspaceGetSlidesSchema,
  workspaceListEventsSchema,
  workspaceSearchGmailSchema,
  workspaceUpdateSheetSchema,
  workspaceAppendSheetSchema,
  workspaceCreateEventSchema,
} from '../../schemas/workspace.js';
import { createGoogleClient } from '../../utils/google-client.js';
import type { GoogleClient } from '../../utils/google-client.js';
import { workspaceSearchDrive } from './search-drive.js';
import { workspaceGetDoc } from './get-doc.js';
import { workspaceGetSheet } from './get-sheet.js';
import { workspaceGetSlides } from './get-slides.js';
import { workspaceListEvents } from './list-events.js';
import { workspaceSearchGmail } from './search-gmail.js';
import { workspaceUpdateSheet } from './update-sheet.js';
import { workspaceAppendSheet } from './append-sheet.js';
import { workspaceCreateEvent } from './create-event.js';

/** Lazy-initialized Google client singleton. */
let cachedClient: GoogleClient | undefined;

/** Error result for missing Google Workspace configuration. */
const NOT_CONFIGURED = {
  isError: true as const,
  content: [
    {
      type: 'text' as const,
      text: 'Google Workspace未設定。GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN環境変数を設定してください。',
    },
  ],
};

/**
 * Get or create the Google client. Returns undefined if credentials are not set.
 */
function getClient(): GoogleClient | undefined {
  if (cachedClient) return cachedClient;
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
  const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'];
  if (!clientId || !clientSecret || !refreshToken) return undefined;
  cachedClient = createGoogleClient({ clientId, clientSecret, refreshToken });
  return cachedClient;
}

/**
 * Register all Google Workspace tools on the MCP server.
 * Lazy client creation: reads credentials from process.env on first tool call.
 */
export function registerWorkspaceTools(server: McpServer): void {
  // --- Drive ---

  server.registerTool(
    'workspace_search_drive',
    {
      description: 'Search Google Drive for files by query and optional MIME type filter',
      inputSchema: workspaceSearchDriveSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceSearchDrive(client, args);
    }
  );

  // --- Docs ---

  server.registerTool(
    'workspace_get_doc',
    {
      description: 'Get a Google Docs document exported as Markdown via Drive export API',
      inputSchema: workspaceGetDocSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceGetDoc(client, args);
    }
  );

  // --- Sheets ---

  server.registerTool(
    'workspace_get_sheet',
    {
      description:
        'Get values from a Google Sheets range (first row as headers, rest as data rows)',
      inputSchema: workspaceGetSheetSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceGetSheet(client, args);
    }
  );

  // --- Slides ---

  server.registerTool(
    'workspace_get_slides',
    {
      description: 'Get a Google Slides presentation exported as plain text via Drive export API',
      inputSchema: workspaceGetSlidesSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceGetSlides(client, args);
    }
  );

  // --- Calendar ---

  server.registerTool(
    'workspace_list_events',
    {
      description: 'List events from a Google Calendar with optional time range filter',
      inputSchema: workspaceListEventsSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceListEvents(client, args);
    }
  );

  // --- Gmail ---

  server.registerTool(
    'workspace_search_gmail',
    {
      description: 'Search Gmail messages and return subject, from, date, and snippet for each',
      inputSchema: workspaceSearchGmailSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceSearchGmail(client, args);
    }
  );

  // --- Sheets Write ---

  server.registerTool(
    'workspace_update_sheet',
    {
      description:
        'Update cell values in a Google Sheets range (PUT — overwrites the range completely)',
      inputSchema: workspaceUpdateSheetSchema,
      annotations: { idempotentHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceUpdateSheet(client, args);
    }
  );

  server.registerTool(
    'workspace_append_sheet',
    {
      description:
        'Append rows to a Google Sheets table (POST — adds rows after the last row in the table)',
      inputSchema: workspaceAppendSheetSchema,
      annotations: { idempotentHint: false, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceAppendSheet(client, args);
    }
  );

  // --- Calendar Write ---

  server.registerTool(
    'workspace_create_event',
    {
      description:
        'Create a Google Calendar event (timed or all-day). Supports RFC3339 datetimes and IANA timezones.',
      inputSchema: workspaceCreateEventSchema,
      annotations: { idempotentHint: false, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return workspaceCreateEvent(client, args);
    }
  );
}
