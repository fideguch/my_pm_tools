import { test, expect } from '@playwright/test';
import {
  createMockNotion,
  MOCK_NOTION_QUERY,
  MOCK_NOTION_PAGE,
  MOCK_NOTION_SEARCH,
} from './fixtures/mock-notion.js';
import { notionQueryDatabase } from '../../src/tools/notion/query-database.js';
import { notionCreatePage } from '../../src/tools/notion/create-page.js';
import { notionSearch } from '../../src/tools/notion/search.js';

// ---------------------------------------------------------------------------
// Notion DB Query → verify results structure
// ---------------------------------------------------------------------------

test.describe('Notion database query workflows', () => {
  test('should return results with properties and pagination metadata', async () => {
    // Given: a mock Notion client returning query results
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    // When: querying a database
    const result = await notionQueryDatabase(notion, {
      databaseId: 'db-uuid',
      pageSize: 10,
    });

    // Then: response contains structured results
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toBeInstanceOf(Array);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0]).toHaveProperty('id');
    expect(data.results[0]).toHaveProperty('properties');
    expect(data.results[0]).toHaveProperty('url');
    expect(data).toHaveProperty('totalResults');
    expect(data).toHaveProperty('hasMore');
  });

  test('should handle filter and sort parameters', async () => {
    // Given: a mock Notion client
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    // When: querying with filter and sorts
    const result = await notionQueryDatabase(notion, {
      databaseId: 'db-uuid',
      filter: '{"property":"Status","select":{"equals":"In Progress"}}',
      sorts: '[{"property":"Priority","direction":"ascending"}]',
      pageSize: 50,
    });

    // Then: response is successful with results
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalResults).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Notion page creation → verify response
// ---------------------------------------------------------------------------

test.describe('Notion page creation workflows', () => {
  test('should create a page and return id and url', async () => {
    // Given: a mock Notion client returning a created page
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    // When: creating a page under a database
    const result = await notionCreatePage(notion, {
      parentId: 'db-uuid',
      parentType: 'database',
      properties: '{"Name":{"title":[{"text":{"content":"New Task"}}]}}',
    });

    // Then: response contains page id and url
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page).toHaveProperty('id');
    expect(data.page).toHaveProperty('url');
    expect(data.message).toBe('Page created successfully');
  });

  test('should create a page with content blocks', async () => {
    // Given: a mock Notion client
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    // When: creating a page with body content
    const result = await notionCreatePage(notion, {
      parentId: 'page-uuid',
      parentType: 'page',
      properties: '{"Name":{"title":[{"text":{"content":"Sub Page"}}]}}',
      content: 'First paragraph\n\nSecond paragraph',
    });

    // Then: response is successful
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
  });
});

// ---------------------------------------------------------------------------
// Auth not configured → verify error message
// ---------------------------------------------------------------------------

test.describe('Notion auth not configured', () => {
  test('should return error when Notion API call fails', async () => {
    // Given: a mock Notion client that throws an error
    const notion = createMockNotion([new Error('Unauthorized: invalid token')]);

    // When: attempting to search
    const result = await notionSearch(notion, { query: 'test' });

    // Then: error is returned without throwing
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Notion search failed');
  });
});

// ---------------------------------------------------------------------------
// Notion search → verify pagination metadata
// ---------------------------------------------------------------------------

test.describe('Notion search pagination', () => {
  test('should return pagination metadata in search results', async () => {
    // Given: a mock Notion client returning search results
    const notion = createMockNotion([MOCK_NOTION_SEARCH]);

    // When: searching the workspace
    const result = await notionSearch(notion, {
      query: 'Sprint Planning',
      filter: 'page',
      pageSize: 10,
    });

    // Then: response contains pagination fields
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('totalResults');
    expect(data).toHaveProperty('hasMore');
    expect(typeof data.hasMore).toBe('boolean');
  });
});
