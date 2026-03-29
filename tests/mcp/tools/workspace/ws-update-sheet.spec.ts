import { test, expect } from '@playwright/test';
import { workspaceUpdateSheet } from '../../../../src/tools/workspace/update-sheet.js';
import { createMockGoogle, MOCK_SHEET_UPDATE } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_update_sheet tool', () => {
  test('updates sheet values successfully', async () => {
    const google = createMockGoogle([MOCK_SHEET_UPDATE]);

    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C2',
      values: JSON.stringify([
        ['Name', 'Priority', 'Status'],
        ['Fix login', 'P0', 'Done'],
      ]),
      valueInputOption: 'USER_ENTERED',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.updatedRange).toBe('Sheet1!A1:C2');
    expect(data.updatedRows).toBe(2);
    expect(data.updatedColumns).toBe(3);
    expect(data.updatedCells).toBe(6);
    expect(data.message).toBe('Sheet values updated successfully');
  });

  test('returns error for invalid JSON values', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C2',
      values: 'not-json',
      valueInputOption: 'USER_ENTERED',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid values JSON');
  });

  test('returns error for non-2D array values', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C2',
      values: JSON.stringify(['not', 'a', '2d', 'array']),
      valueInputOption: 'USER_ENTERED',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('expected 2D array');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 403: Insufficient scope')]);

    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C2',
      values: JSON.stringify([['A', 'B']]),
      valueInputOption: 'USER_ENTERED',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Update sheet failed');
    expect(text).toContain('403');
  });

  test('supports RAW value input option', async () => {
    const google = createMockGoogle([MOCK_SHEET_UPDATE]);

    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:B1',
      values: JSON.stringify([['=SUM(A2:A10)', '100']]),
      valueInputOption: 'RAW',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
  });
});
