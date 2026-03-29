import { test, expect } from '@playwright/test';
import { workspaceAppendSheet } from '../../../../src/tools/workspace/append-sheet.js';
import { createMockGoogle, MOCK_SHEET_APPEND } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_append_sheet tool', () => {
  test('appends rows successfully', async () => {
    const google = createMockGoogle([MOCK_SHEET_APPEND]);

    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A:C',
      values: JSON.stringify([['New Task', 'P1', 'Open']]),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.tableRange).toBe('Sheet1!A1:C3');
    expect(data.updatedRange).toBe('Sheet1!A4:C4');
    expect(data.updatedRows).toBe(1);
    expect(data.updatedCells).toBe(3);
    expect(data.message).toBe('Rows appended successfully');
  });

  test('returns error for invalid JSON values', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A:C',
      values: '{bad json',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid values JSON');
  });

  test('returns error for non-2D array values', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A:C',
      values: JSON.stringify({ key: 'value' }),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('expected 2D array');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 500: Internal Server Error')]);

    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A:C',
      values: JSON.stringify([['A', 'B', 'C']]),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Append sheet failed');
    expect(text).toContain('500');
  });

  test('supports OVERWRITE insertDataOption', async () => {
    const google = createMockGoogle([MOCK_SHEET_APPEND]);

    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A:C',
      values: JSON.stringify([['A', 'B', 'C']]),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
  });
});
