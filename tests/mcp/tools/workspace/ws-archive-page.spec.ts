import { test, expect } from '@playwright/test';
import { notionArchivePage } from '../../../../src/tools/notion/archive-page.js';
import { createMockNotion, MOCK_NOTION_PAGE } from '../../../scenarios/fixtures/mock-notion.js';

test.describe('notion_archive_page tool', () => {
  test('archives a page successfully', async () => {
    const archivedPage = { ...MOCK_NOTION_PAGE, archived: true };
    const notion = createMockNotion([archivedPage]);

    const result = await notionArchivePage(notion, {
      pageId: 'page-uuid-1234',
      archive: true,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.archived).toBe(true);
    expect(data.message).toBe('Page archived successfully');
  });

  test('unarchives a page successfully', async () => {
    const unarchivedPage = { ...MOCK_NOTION_PAGE, archived: false };
    const notion = createMockNotion([unarchivedPage]);

    const result = await notionArchivePage(notion, {
      pageId: 'page-uuid-1234',
      archive: false,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.archived).toBe(false);
    expect(data.message).toBe('Page unarchived successfully');
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: page not found')]);

    const result = await notionArchivePage(notion, {
      pageId: 'nonexistent-page',
      archive: true,
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to archive Notion page');
    expect(text).toContain('404');
  });

  test('returns error on permission denied', async () => {
    const notion = createMockNotion([new Error('Notion API error 403: restricted_resource')]);

    const result = await notionArchivePage(notion, {
      pageId: 'restricted-page',
      archive: true,
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Failed to archive Notion page');
    expect(text).toContain('403');
  });

  test('returns correct url in response', async () => {
    const page = { ...MOCK_NOTION_PAGE, archived: true };
    const notion = createMockNotion([page]);

    const result = await notionArchivePage(notion, {
      pageId: 'page-uuid-1234',
      archive: true,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.url).toBe('https://www.notion.so/page-uuid-1234');
  });
});
