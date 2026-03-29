import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import { isRecord } from '../../utils/type-guards.js';

/**
 * Update properties on an existing Notion page.
 * Supports 13 property types. Read-only types are rejected by Notion API.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionUpdatePage(
  notion: NotionClient,
  args: {
    pageId: string;
    properties: string;
  }
): Promise<CallToolResult> {
  try {
    let properties: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(args.properties);
      if (!isRecord(parsed)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                'properties must be a JSON object. ' +
                'Updatable types: title, rich_text, number, select, multi_select, date, ' +
                'checkbox, url, email, phone_number, relation, people, status. ' +
                'Read-only: formula, rollup, created_time, last_edited_time.',
            },
          ],
        };
      }
      properties = parsed;
    } catch {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Invalid properties JSON: ${args.properties.slice(0, 100)}`,
          },
        ],
      };
    }

    const page = await notion.updatePage(args.pageId, { properties });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              page: {
                id: page.id,
                url: page.url,
                lastEditedTime: page.last_edited_time,
              },
              message: 'Page updated successfully',
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
      content: [{ type: 'text', text: `Failed to update Notion page: ${message}` }],
    };
  }
}
