import { test, expect } from '@playwright/test';
import { notionCreatePage } from '../../../../src/tools/notion/create-page.js';
import { createMockNotion, MOCK_NOTION_PAGE } from '../../../scenarios/fixtures/mock-notion.js';

test.describe('notion_create_page tool', () => {
  test('creates page under database', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    const result = await notionCreatePage(notion, {
      parentType: 'database',
      parentId: 'db-uuid',
      properties: JSON.stringify({
        Name: { title: [{ text: { content: 'Test Page' } }] },
      }),
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.url).toBe('https://www.notion.so/page-uuid-1234');
  });

  test('creates page with content blocks', async () => {
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    const result = await notionCreatePage(notion, {
      parentType: 'database',
      parentId: 'db-uuid',
      properties: JSON.stringify({
        Name: { title: [{ text: { content: 'With Content' } }] },
      }),
      content: 'Hello world\n\nSecond paragraph',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
  });

  test('creates page under page parent', async () => {
    const pageParentResult = {
      ...MOCK_NOTION_PAGE,
      parent: { type: 'page_id', page_id: 'parent-page-uuid' },
    };
    const notion = createMockNotion([pageParentResult]);

    const result = await notionCreatePage(notion, {
      parentType: 'page',
      parentId: 'parent-page-uuid',
      properties: JSON.stringify({
        title: [{ text: { content: 'Sub Page' } }],
      }),
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
  });

  test('returns error for non-existent parent', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: not found')]);

    const result = await notionCreatePage(notion, {
      parentType: 'database',
      parentId: 'nonexistent',
      properties: JSON.stringify({
        Name: { title: [{ text: { content: 'Orphan' } }] },
      }),
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('404');
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 500: internal server error')]);

    const result = await notionCreatePage(notion, {
      parentType: 'database',
      parentId: 'db-uuid',
      properties: JSON.stringify({
        Name: { title: [{ text: { content: 'Fail' } }] },
      }),
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('500');
  });
});
