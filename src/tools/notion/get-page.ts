import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import type { NotionBlock } from '../../types/notion.js';
import { notionBlocksToMarkdown } from '../../utils/notion-markdown.js';

/** Maximum number of pagination requests to prevent runaway loops. */
const MAX_PAGES = 10;

/**
 * Fetch all block children for a given block ID with pagination.
 * Returns flat list of blocks (children populated recursively up to maxDepth).
 */
async function fetchBlockChildren(
  notion: NotionClient,
  blockId: string,
  currentDepth: number,
  maxDepth: number,
  pageCounter: { count: number }
): Promise<{ blocks: readonly NotionBlock[]; totalFetched: number }> {
  const allBlocks: NotionBlock[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  let totalFetched = 0;

  while (hasMore && pageCounter.count < MAX_PAGES) {
    const response = await notion.getBlockChildren(blockId, cursor);
    pageCounter.count++;

    for (const block of response.results) {
      totalFetched++;

      if (block.has_children && currentDepth < maxDepth) {
        const childResult = await fetchBlockChildren(
          notion,
          block.id,
          currentDepth + 1,
          maxDepth,
          pageCounter
        );
        // Attach children to block (new object — immutable pattern)
        const blockWithChildren: NotionBlock = {
          ...block,
          children: childResult.blocks,
        };
        allBlocks.push(blockWithChildren);
        totalFetched += childResult.totalFetched;
      } else {
        allBlocks.push(block);
      }
    }

    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
  }

  return { blocks: allBlocks, totalFetched };
}

/**
 * Get a Notion page with its content converted to Markdown.
 * P1: NotionClient DI, P2: never throws, P3: paginated block fetch, P4: JSON envelope.
 */
export async function notionGetPage(
  notion: NotionClient,
  args: {
    pageId: string;
    maxDepth: number;
  }
): Promise<CallToolResult> {
  try {
    // Fetch page metadata
    const page = await notion.getPage(args.pageId);

    // Extract title from page properties
    let title = '';
    for (const prop of Object.values(page.properties)) {
      const p = prop as { type?: string; title?: Array<{ plain_text?: string }> };
      if (p.type === 'title' && Array.isArray(p.title) && p.title.length > 0) {
        title = p.title.map((t) => t.plain_text ?? '').join('');
        break;
      }
    }

    // Fetch block children with pagination and recursion
    const pageCounter = { count: 0 };
    const { blocks, totalFetched } = await fetchBlockChildren(
      notion,
      args.pageId,
      1,
      args.maxDepth,
      pageCounter
    );

    // Convert blocks to Markdown
    const markdown = notionBlocksToMarkdown(blocks, 0, args.maxDepth);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              page: {
                id: page.id,
                title,
                url: page.url,
                properties: page.properties,
              },
              markdown,
              blockCount: totalFetched,
              pagesFetched: pageCounter.count,
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
      content: [{ type: 'text', text: `Failed to get Notion page: ${message}` }],
    };
  }
}
