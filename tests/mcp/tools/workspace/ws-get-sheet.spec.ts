import { test, expect } from '@playwright/test';
import { workspaceGetSheet } from '../../../../src/tools/workspace/get-sheet.js';
import { createMockGoogle, MOCK_SHEET_VALUES } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_get_sheet tool', () => {
  test('returns sheet data with headers', async () => {
    const google = createMockGoogle([MOCK_SHEET_VALUES]);

    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C3',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.range).toBe('Sheet1!A1:C3');
    expect(data.headers).toEqual(['Name', 'Priority', 'Status']);
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0]).toEqual(['Fix login', 'P0', 'Open']);
    expect(data.rows[1]).toEqual(['Add dashboard', 'P1', 'Backlog']);
    expect(data.totalRows).toBe(2);
  });

  test('returns error for non-existent spreadsheet', async () => {
    const google = createMockGoogle([new Error('Google API error 404: Not Found')]);

    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'bad-id',
      range: 'Sheet1!A1:Z',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get sheet failed');
    expect(text).toContain('404');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 500: Internal Server Error')]);

    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C3',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get sheet failed');
    expect(text).toContain('500');
  });

  test('handles empty sheet', async () => {
    const google = createMockGoogle([{ range: 'Sheet1!A1:Z', majorDimension: 'ROWS', values: [] }]);

    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'empty-sheet',
      range: 'Sheet1!A1:Z',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.headers).toEqual([]);
    expect(data.rows).toHaveLength(0);
    expect(data.totalRows).toBe(0);
  });

  test('handles single-row sheet (headers only)', async () => {
    const google = createMockGoogle([
      {
        range: 'Sheet1!A1:C1',
        majorDimension: 'ROWS',
        values: [['Name', 'Priority', 'Status']],
      },
    ]);

    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'headers-only',
      range: 'Sheet1!A1:C1',
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.headers).toEqual(['Name', 'Priority', 'Status']);
    expect(data.rows).toHaveLength(0);
    expect(data.totalRows).toBe(0);
  });
});
