import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  notionSearchSchema,
  notionGetPageSchema,
  notionQueryDatabaseSchema,
  notionCreatePageSchema,
  notionAppendBlocksSchema,
} from '../../schemas/notion.js';
import { createNotionClient } from '../../utils/notion-client.js';
import type { NotionClient } from '../../utils/notion-client.js';
import { notionSearch } from './search.js';
import { notionGetPage } from './get-page.js';
import { notionQueryDatabase } from './query-database.js';
import { notionCreatePage } from './create-page.js';
import { notionAppendBlocks } from './append-blocks.js';

/** Lazy-initialized Notion client singleton. */
let cachedClient: NotionClient | undefined;

/** Error result for missing NOTION_TOKEN configuration. */
const NOT_CONFIGURED = {
  isError: true as const,
  content: [
    {
      type: 'text' as const,
      text: 'Notion未設定。NOTION_TOKEN環境変数を設定してください。',
    },
  ],
};

/**
 * Get or create the Notion client. Returns undefined if NOTION_TOKEN is not set.
 */
function getClient(): NotionClient | undefined {
  if (cachedClient) return cachedClient;
  const token = process.env['NOTION_TOKEN'];
  if (!token) return undefined;
  cachedClient = createNotionClient(token);
  return cachedClient;
}

/**
 * Register all Notion tools on the MCP server.
 * Lazy client creation: reads NOTION_TOKEN from process.env on first tool call.
 */
export function registerNotionTools(server: McpServer): void {
  // --- Read-only tools ---

  server.registerTool(
    'notion_search',
    {
      description: 'Search Notion workspace for pages and databases by title',
      inputSchema: notionSearchSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return notionSearch(client, args);
    }
  );

  server.registerTool(
    'notion_get_page',
    {
      description:
        'Get a Notion page with its content converted to Markdown (recursive block fetch)',
      inputSchema: notionGetPageSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return notionGetPage(client, args);
    }
  );

  server.registerTool(
    'notion_query_database',
    {
      description:
        'Query a Notion database with optional filter and sort (JSON filter/sort syntax)',
      inputSchema: notionQueryDatabaseSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return notionQueryDatabase(client, args);
    }
  );

  // --- Write tools ---

  server.registerTool(
    'notion_create_page',
    {
      description:
        'Create a new Notion page under a database or page with optional paragraph content',
      inputSchema: notionCreatePageSchema,
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return notionCreatePage(client, args);
    }
  );

  server.registerTool(
    'notion_append_blocks',
    {
      description: 'Append paragraph blocks to an existing Notion page or block',
      inputSchema: notionAppendBlocksSchema,
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async (args) => {
      const client = getClient();
      if (!client) return NOT_CONFIGURED;
      return notionAppendBlocks(client, args);
    }
  );
}
