import { test, expect } from '@playwright/test';
import { notionGetPage } from '../../../../src/tools/notion/get-page.js';
import {
  createMockNotion,
  MOCK_NOTION_PAGE,
  MOCK_NOTION_BLOCKS,
} from '../../../scenarios/fixtures/mock-notion.js';
import type { NotionBlockChildrenResponse } from '../../../../src/types/notion.js';

/** Build a blocks response with pagination control. */
function blocksResponse(
  blocks: readonly unknown[],
  opts?: { has_more?: boolean; next_cursor?: string | null }
): NotionBlockChildrenResponse {
  return {
    object: 'list',
    results: blocks as NotionBlockChildrenResponse['results'],
    has_more: opts?.has_more ?? false,
    next_cursor: opts?.next_cursor ?? null,
  };
}

test.describe('notion_get_page tool', () => {
  test('returns page with markdown content', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE, MOCK_NOTION_BLOCKS]);

    const result = await notionGetPage(notion, { pageId: 'page-uuid-1234', maxDepth: 3 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.title).toBe('Test Page');
    expect(data.page.url).toBe('https://www.notion.so/page-uuid-1234');
    expect(data.markdown).toContain('Title');
    expect(data.markdown).toContain('Hello world');
  });

  test('returns error for non-existent page', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: not found')]);

    const result = await notionGetPage(notion, { pageId: 'nonexistent', maxDepth: 3 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('404');
  });

  test('handles pagination of blocks', async () => {
    const page1 = blocksResponse(MOCK_NOTION_BLOCKS.results.slice(0, 1), {
      has_more: true,
      next_cursor: 'cursor_blk2',
    });
    const page2 = blocksResponse(MOCK_NOTION_BLOCKS.results.slice(1), {
      has_more: false,
      next_cursor: null,
    });
    const notion = createMockNotion([MOCK_NOTION_PAGE, page1, page2]);

    const result = await notionGetPage(notion, { pageId: 'page-uuid-1234', maxDepth: 3 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.markdown).toContain('Title');
    expect(data.markdown).toContain('Hello world');
  });

  test('respects maxDepth limit', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE, MOCK_NOTION_BLOCKS]);

    const result = await notionGetPage(notion, { pageId: 'page-uuid-1234', maxDepth: 0 });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    // With maxDepth=0, only top-level blocks render (no child expansion)
    expect(data.page.id).toBe('page-uuid-1234');
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 500: internal server error')]);

    const result = await notionGetPage(notion, { pageId: 'page-uuid-1234', maxDepth: 3 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('500');
  });
});
