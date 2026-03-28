import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import type { NotionPage } from '../../types/notion.js';

/** Extract a plain-text title from Notion page properties. */
function extractTitle(properties: Record<string, unknown>): string {
  for (const value of Object.values(properties)) {
    if (
      value != null &&
      typeof value === 'object' &&
      'title' in value &&
      Array.isArray((value as Record<string, unknown>)['title'])
    ) {
      const titleArr = (value as Record<string, unknown>)['title'] as readonly {
        readonly plain_text: string;
      }[];
      return titleArr.map((t) => t.plain_text).join('');
    }
  }
  return '';
}

/** Format a single search result for the response envelope. */
function formatResult(page: NotionPage): {
  id: string;
  title: string;
  url: string;
  type: string;
} {
  return {
    id: page.id,
    title: extractTitle(page.properties),
    url: page.url,
    type: page.object,
  };
}

/**
 * Search Notion workspace for pages and databases.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionSearch(
  notion: NotionClient,
  args: {
    query?: string;
    filter?: 'page' | 'database';
    pageSize?: number;
  }
): Promise<CallToolResult> {
  try {
    const response = await notion.search({
      query: args.query,
      filter: args.filter ? { property: 'object', value: args.filter } : undefined,
      page_size: args.pageSize,
    });

    const results = response.results.map(formatResult);

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
      content: [{ type: 'text', text: `Notion search failed: ${message}` }],
    };
  }
}
