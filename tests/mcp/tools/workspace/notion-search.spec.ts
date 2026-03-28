import { test, expect } from '@playwright/test';
import { notionSearch } from '../../../../src/tools/notion/search.js';
import {
  createMockNotion,
  MOCK_NOTION_SEARCH,
  MOCK_NOTION_PAGE,
} from '../../../scenarios/fixtures/mock-notion.js';

/** Build a search response with the given results and pagination metadata. */
function searchResponse(
  results: readonly unknown[],
  opts?: { has_more?: boolean; next_cursor?: string | null }
) {
  return {
    object: 'list' as const,
    results,
    has_more: opts?.has_more ?? false,
    next_cursor: opts?.next_cursor ?? null,
  };
}

/** Page mock with object='database' for type filter tests. */
const MOCK_DATABASE_RESULT = {
  ...MOCK_NOTION_PAGE,
  object: 'database' as const,
  id: 'db-uuid-5678',
  url: 'https://www.notion.so/db-uuid-5678',
};

test.describe('notion_search tool', () => {
  test('returns matching pages', async () => {
    const notion = createMockNotion([MOCK_NOTION_SEARCH]);

    const result = await notionSearch(notion, { query: 'Test' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalResults).toBe(1);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('page-uuid-1234');
    expect(data.results[0].title).toBe('Test Page');
    expect(data.results[0].type).toBe('page');
  });

  test('returns empty results for no matches', async () => {
    const notion = createMockNotion([searchResponse([])]);

    const result = await notionSearch(notion, { query: 'nonexistent' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalResults).toBe(0);
    expect(data.results).toHaveLength(0);
  });

  test('filters by page type', async () => {
    const notion = createMockNotion([searchResponse([MOCK_NOTION_PAGE])]);

    const result = await notionSearch(notion, { query: 'Test', filter: 'page' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalResults).toBe(1);
    expect(data.results[0].type).toBe('page');
  });

  test('filters by database type', async () => {
    const notion = createMockNotion([searchResponse([MOCK_DATABASE_RESULT])]);

    const result = await notionSearch(notion, { query: 'db', filter: 'database' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalResults).toBe(1);
    expect(data.results[0].type).toBe('database');
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 500: internal')]);

    const result = await notionSearch(notion, { query: 'fail' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Notion search failed');
    expect(text).toContain('500');
  });

  test('handles pagination metadata', async () => {
    const notion = createMockNotion([
      searchResponse([MOCK_NOTION_PAGE], { has_more: true, next_cursor: 'cursor_abc' }),
    ]);

    const result = await notionSearch(notion, { query: 'Test' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.hasMore).toBe(true);
    expect(data.totalResults).toBe(1);
  });
});
