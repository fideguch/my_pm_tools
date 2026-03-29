import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';

/**
 * Archive (or unarchive) a Notion page.
 * Archive is reversible — pass archive=false to unarchive.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionArchivePage(
  notion: NotionClient,
  args: {
    pageId: string;
    archive: boolean;
  }
): Promise<CallToolResult> {
  try {
    const page = await notion.updatePage(args.pageId, { archived: args.archive });

    const action = args.archive ? 'archived' : 'unarchived';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              page: {
                id: page.id,
                url: page.url,
                archived: page.archived,
              },
              message: `Page ${action} successfully`,
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
      content: [{ type: 'text', text: `Failed to archive Notion page: ${message}` }],
    };
  }
}
