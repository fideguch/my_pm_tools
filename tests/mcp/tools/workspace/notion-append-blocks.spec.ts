import { test, expect } from '@playwright/test';
import { notionAppendBlocks } from '../../../../src/tools/notion/append-blocks.js';
import { createMockNotion, MOCK_NOTION_BLOCKS } from '../../../scenarios/fixtures/mock-notion.js';
import type { NotionBlockChildrenResponse } from '../../../../src/types/notion.js';

/** Build an append-blocks response with the given results. */
function appendResponse(results: readonly unknown[]): NotionBlockChildrenResponse {
  return {
    object: 'list',
    results: results as NotionBlockChildrenResponse['results'],
    has_more: false,
    next_cursor: null,
  };
}

test.describe('notion_append_blocks tool', () => {
  test('appends paragraph blocks', async () => {
    const notion = createMockNotion([MOCK_NOTION_BLOCKS]);

    const result = await notionAppendBlocks(notion, {
      blockId: 'page-uuid-1234',
      content: 'Hello world',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.blocksAppended).toBeGreaterThan(0);
  });

  test('returns error for non-existent block', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: not found')]);

    const result = await notionAppendBlocks(notion, {
      blockId: 'nonexistent',
      content: 'orphan content',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('404');
  });

  test('handles multi-paragraph content', async () => {
    const multiBlockResponse = appendResponse([
      ...MOCK_NOTION_BLOCKS.results,
      {
        id: 'blk-3',
        type: 'paragraph',
        has_children: false,
        paragraph: {
          rich_text: [{ type: 'text', plain_text: 'Second paragraph' }],
        },
      },
    ]);
    const notion = createMockNotion([multiBlockResponse]);

    const result = await notionAppendBlocks(notion, {
      blockId: 'page-uuid-1234',
      content: 'First paragraph\n\nSecond paragraph',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.blocksAppended).toBeGreaterThan(0);
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 500: internal server error')]);

    const result = await notionAppendBlocks(notion, {
      blockId: 'page-uuid-1234',
      content: 'fail content',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('500');
  });
});
