import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import type { NotionPage } from '../../types/notion.js';

/** Format a database row for the response envelope. */
function formatRow(page: NotionPage): {
  id: string;
  properties: Record<string, unknown>;
  url: string;
} {
  return {
    id: page.id,
    properties: page.properties,
    url: page.url,
  };
}

/**
 * Query a Notion database with optional filter and sort.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionQueryDatabase(
  notion: NotionClient,
  args: {
    databaseId: string;
    filter?: string;
    sorts?: string;
    pageSize?: number;
  }
): Promise<CallToolResult> {
  // Parse filter JSON string
  let parsedFilter: unknown;
  if (args.filter) {
    try {
      parsedFilter = JSON.parse(args.filter);
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid filter JSON: could not parse the provided filter string. Ensure it follows Notion filter syntax.`,
          },
        ],
      };
    }
  }

  // Parse sorts JSON string
  let parsedSorts: readonly unknown[] | undefined;
  if (args.sorts) {
    try {
      const parsed: unknown = JSON.parse(args.sorts);
      if (!Array.isArray(parsed)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Invalid sorts JSON: expected an array of sort objects.`,
            },
          ],
        };
      }
      parsedSorts = parsed as readonly unknown[];
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid sorts JSON: could not parse the provided sorts string. Ensure it follows Notion sort syntax.`,
          },
        ],
      };
    }
  }

  try {
    const response = await notion.queryDatabase(args.databaseId, {
      filter: parsedFilter,
      sorts: parsedSorts,
      page_size: args.pageSize,
    });

    const results = response.results.map(formatRow);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              results,
              totalResults: results.length,
              hasMore: response.has_more,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Notion database query failed: ${message}` }],
    };
  }
}
