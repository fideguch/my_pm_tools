import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import type { NotionBlockInput } from '../../types/notion.js';

/** Convert plain text lines into paragraph block inputs. */
function textToParagraphBlocks(text: string): readonly NotionBlockInput[] {
  return text.split('\n\n').map((paragraph) => ({
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: paragraph } }],
    },
  }));
}

/**
 * Create a new Notion page under a database or another page.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionCreatePage(
  notion: NotionClient,
  args: {
    parentId: string;
    parentType: 'database' | 'page';
    properties: string;
    content?: string;
  }
): Promise<CallToolResult> {
  try {
    const parent =
      args.parentType === 'database' ? { database_id: args.parentId } : { page_id: args.parentId };

    const properties = JSON.parse(args.properties) as Record<string, unknown>;

    const children: readonly NotionBlockInput[] | undefined = args.content
      ? textToParagraphBlocks(args.content)
      : undefined;

    const page = await notion.createPage({
      parent,
      properties,
      children,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              page: {
                id: page.id,
                url: page.url,
              },
              message: 'Page created successfully',
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
      content: [{ type: 'text', text: `Failed to create Notion page: ${message}` }],
    };
  }
}
