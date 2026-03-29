import { test, expect } from '@playwright/test';
import { notionUpdatePage } from '../../../../src/tools/notion/update-page.js';
import { createMockNotion, MOCK_NOTION_PAGE } from '../../../scenarios/fixtures/mock-notion.js';

test.describe('notion_update_page tool', () => {
  test('updates page properties successfully', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: JSON.stringify({
        Status: { status: { name: 'Done' } },
      }),
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.url).toBe('https://www.notion.so/page-uuid-1234');
    expect(data.page.lastEditedTime).toBe('2026-03-28T12:00:00.000Z');
    expect(data.message).toBe('Page updated successfully');
  });

  test('returns error for invalid JSON properties', async () => {
    const notion = createMockNotion([]);

    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: 'not valid json',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid properties JSON');
  });

  test('returns error for non-object properties', async () => {
    const notion = createMockNotion([]);

    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: JSON.stringify(['not', 'an', 'object']),
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('properties must be a JSON object');
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: page not found')]);

    const result = await notionUpdatePage(notion, {
      pageId: 'nonexistent-page',
      properties: JSON.stringify({ Status: { status: { name: 'Done' } } }),
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to update Notion page');
    expect(text).toContain('404');
  });

  test('updates multiple properties at once', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: JSON.stringify({
        Priority: { select: { name: 'High' } },
        'Due Date': { date: { start: '2026-04-15' } },
        Done: { checkbox: true },
      }),
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
  });
});
