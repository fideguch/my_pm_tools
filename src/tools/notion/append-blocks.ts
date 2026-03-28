import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import type { NotionBlockInput } from '../../types/notion.js';

/** Convert plain text to paragraph block inputs (split by double newline). */
function textToParagraphBlocks(text: string): readonly NotionBlockInput[] {
  return text.split('\n\n').map((paragraph) => ({
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: paragraph } }],
    },
  }));
}

/**
 * Append paragraph blocks to a Notion page or block.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionAppendBlocks(
  notion: NotionClient,
  args: {
    blockId: string;
    content: string;
  }
): Promise<CallToolResult> {
  try {
    const children = textToParagraphBlocks(args.content);

    await notion.appendBlocks(args.blockId, children);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              blockId: args.blockId,
              blocksAppended: children.length,
              message: `Appended ${children.length} blocks`,
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
      content: [{ type: 'text', text: `Failed to append blocks: ${message}` }],
    };
  }
}
