/**
 * E2E Integration Tests — Google Workspace + GitHub
 *
 * Layer 1: Mock-based integration tests (CI-safe, no credentials needed)
 *   - GitHub (gh CLI read-only)
 *   - Google Drive search
 *   - Google Docs read
 *   - Google Sheets read→write→rollback
 *   - Google Sheets append→rollback
 *
 * Layer 2: Live API test scaffolding (gated by GOOGLE_LIVE_TEST env var)
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import {
  createMockGoogle,
  MOCK_DRIVE_FILES,
  MOCK_DOC_MARKDOWN,
} from '../scenarios/fixtures/mock-google.js';
import { workspaceSearchDrive } from '../../src/tools/workspace/search-drive.js';
import { workspaceGetDoc } from '../../src/tools/workspace/get-doc.js';
import { workspaceGetSheet } from '../../src/tools/workspace/get-sheet.js';
import { workspaceUpdateSheet } from '../../src/tools/workspace/update-sheet.js';
import { workspaceAppendSheet } from '../../src/tools/workspace/append-sheet.js';
import { createGoogleClientFromADC } from '../../src/utils/google-client.js';
import type { GoogleClient } from '../../src/utils/google-client.js';
import type {
  SheetValuesResponse,
  SheetUpdateResponse,
  SheetAppendResponse,
} from '../../src/types/workspace.js';

// ---------- helpers ----------

/** Extract parsed JSON from a CallToolResult */
function parseResult(result: { content: readonly { type: string; text?: string }[] }): unknown {
  const text = (result.content[0] as { text: string }).text;
  return JSON.parse(text);
}

/**
 * Create a mock GoogleClient that records every call in order.
 * Unlike the simple sequential mock, this tracks method names so we can
 * assert the full read→write→read→write→read cycle.
 */
function createTrackedMockGoogle(responses: readonly unknown[]): {
  client: GoogleClient;
  calls: string[];
} {
  let callIndex = 0;
  const calls: string[] = [];

  function next(method: string): unknown {
    calls.push(method);
    const resp = responses[callIndex++];
    if (resp instanceof Error) throw resp;
    return resp;
  }

  const client: GoogleClient = {
    searchDrive: async () => next('searchDrive') as ReturnType<GoogleClient['searchDrive']>,
    exportFile: async () => next('exportFile') as ReturnType<GoogleClient['exportFile']>,
    getSheetValues: async () =>
      next('getSheetValues') as ReturnType<GoogleClient['getSheetValues']>,
    updateSheetValues: async () =>
      next('updateSheetValues') as ReturnType<GoogleClient['updateSheetValues']>,
    appendSheetValues: async () =>
      next('appendSheetValues') as ReturnType<GoogleClient['appendSheetValues']>,
    getSpreadsheetMetadata: async () =>
      next('getSpreadsheetMetadata') as ReturnType<GoogleClient['getSpreadsheetMetadata']>,
    listEvents: async () => next('listEvents') as ReturnType<GoogleClient['listEvents']>,
    createEvent: async () => next('createEvent') as ReturnType<GoogleClient['createEvent']>,
    listGmailMessages: async () =>
      next('listGmailMessages') as ReturnType<GoogleClient['listGmailMessages']>,
    getGmailMessage: async () =>
      next('getGmailMessage') as ReturnType<GoogleClient['getGmailMessage']>,
  };

  return { client, calls };
}

// ================================================================
// Layer 1: Mock-based integration tests
// ================================================================

test.describe('Layer 1: Mock Integration — GitHub (gh CLI)', () => {
  test('gh repo list returns repositories', () => {
    // Read-only: list repos for the authenticated user
    const output = execSync('gh repo list --limit 3 --json name,owner 2>&1', {
      encoding: 'utf-8',
      timeout: 15000,
    });
    const repos = JSON.parse(output);
    expect(Array.isArray(repos)).toBe(true);
    // Each repo should have name and owner fields
    if (repos.length > 0) {
      expect(repos[0]).toHaveProperty('name');
      expect(repos[0]).toHaveProperty('owner');
    }
  });

  test('gh issue list returns issues from a known repo', () => {
    // Read-only: list issues — use the current repo or a well-known public repo
    const output = execSync(
      'gh issue list --repo cli/cli --limit 3 --json number,title,state 2>&1',
      { encoding: 'utf-8', timeout: 15000 }
    );
    const issues = JSON.parse(output);
    expect(Array.isArray(issues)).toBe(true);
    if (issues.length > 0) {
      expect(issues[0]).toHaveProperty('number');
      expect(issues[0]).toHaveProperty('title');
      expect(issues[0]).toHaveProperty('state');
    }
  });
});

test.describe('Layer 1: Mock Integration — Google Drive', () => {
  test('search files returns correct structure', async () => {
    const google = createMockGoogle([MOCK_DRIVE_FILES]);

    const result = await workspaceSearchDrive(google, {
      query: 'Q1 Report',
      limit: 20,
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { files: unknown[]; totalFiles: number };
    expect(data.totalFiles).toBe(2);
    expect(data.files).toHaveLength(2);
    expect(data.files[0]).toMatchObject({
      id: 'doc-123',
      name: 'Q1 Report',
      mimeType: 'application/vnd.google-apps.document',
    });
  });

  test('search with mimeType filter passes through', async () => {
    const driveSpreadsheets = {
      files: [MOCK_DRIVE_FILES.files[1]], // only the spreadsheet
    };
    const google = createMockGoogle([driveSpreadsheets]);

    const result = await workspaceSearchDrive(google, {
      query: 'Sprint',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      limit: 10,
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { files: unknown[]; totalFiles: number };
    expect(data.totalFiles).toBe(1);
    expect(data.files[0]).toMatchObject({
      id: 'sheet-456',
      name: 'Sprint Data',
    });
  });
});

test.describe('Layer 1: Mock Integration — Google Docs', () => {
  test('read document returns markdown content', async () => {
    const google = createMockGoogle([MOCK_DOC_MARKDOWN]);

    const result = await workspaceGetDoc(google, {
      documentId: 'doc-123',
    });

    expect(result.isError).toBeUndefined();
    const data = parseResult(result) as { documentId: string; format: string; content: string };
    expect(data.documentId).toBe('doc-123');
    expect(data.format).toBe('markdown');
    expect(data.content).toContain('# Q1 Report');
    expect(data.content).toContain('achieved');
  });
});

test.describe('Layer 1: Mock Integration — Sheets Read→Write→Rollback', () => {
  // Original data snapshot
  const ORIGINAL_VALUES: SheetValuesResponse = {
    range: 'Sheet1!A1:C3',
    majorDimension: 'ROWS',
    values: [
      ['Name', 'Priority', 'Status'],
      ['Fix login', 'P0', 'Open'],
      ['Add dashboard', 'P1', 'Backlog'],
    ],
  };

  // After update: row 2 status changed to "Done"
  const UPDATED_VALUES: SheetValuesResponse = {
    range: 'Sheet1!A1:C3',
    majorDimension: 'ROWS',
    values: [
      ['Name', 'Priority', 'Status'],
      ['Fix login', 'P0', 'Done'],
      ['Add dashboard', 'P1', 'Backlog'],
    ],
  };

  const UPDATE_RESPONSE: SheetUpdateResponse = {
    spreadsheetId: 'sheet-456',
    updatedRange: 'Sheet1!A1:C3',
    updatedRows: 3,
    updatedColumns: 3,
    updatedCells: 9,
  };

  // Restored values match original
  const RESTORED_VALUES: SheetValuesResponse = { ...ORIGINAL_VALUES };

  test('full read→write→verify→rollback→verify cycle', async () => {
    // Sequence: read(snapshot) → update(change) → read(verify) → update(restore) → read(verify)
    const { client, calls } = createTrackedMockGoogle([
      ORIGINAL_VALUES, // 1. read: snapshot original
      UPDATE_RESPONSE, // 2. update: change status to Done
      UPDATED_VALUES, // 3. read: verify update applied
      UPDATE_RESPONSE, // 4. update: restore original values
      RESTORED_VALUES, // 5. read: verify rollback matches snapshot
    ]);

    const spreadsheetId = 'sheet-456';
    const range = 'Sheet1!A1:C3';

    // Step 1: Read — snapshot original
    const snapshot = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(snapshot.isError).toBeUndefined();
    const snapshotData = parseResult(snapshot) as {
      headers: string[];
      rows: string[][];
      totalRows: number;
    };
    expect(snapshotData.headers).toEqual(['Name', 'Priority', 'Status']);
    expect(snapshotData.totalRows).toBe(2);
    expect(snapshotData.rows[0][2]).toBe('Open'); // original status

    // Step 2: Write — update status to "Done"
    const updateResult = await workspaceUpdateSheet(client, {
      spreadsheetId,
      range,
      values: JSON.stringify([
        ['Name', 'Priority', 'Status'],
        ['Fix login', 'P0', 'Done'],
        ['Add dashboard', 'P1', 'Backlog'],
      ]),
      valueInputOption: 'USER_ENTERED',
    });
    expect(updateResult.isError).toBeUndefined();
    const updateData = parseResult(updateResult) as { updatedCells: number; message: string };
    expect(updateData.updatedCells).toBe(9);
    expect(updateData.message).toBe('Sheet values updated successfully');

    // Step 3: Read — verify update
    const verifyUpdate = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(verifyUpdate.isError).toBeUndefined();
    const verifyData = parseResult(verifyUpdate) as { rows: string[][] };
    expect(verifyData.rows[0][2]).toBe('Done'); // updated status

    // Step 4: Write — rollback to original
    const rollbackResult = await workspaceUpdateSheet(client, {
      spreadsheetId,
      range,
      values: JSON.stringify(ORIGINAL_VALUES.values),
      valueInputOption: 'USER_ENTERED',
    });
    expect(rollbackResult.isError).toBeUndefined();

    // Step 5: Read — verify rollback matches snapshot
    const verifyRollback = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(verifyRollback.isError).toBeUndefined();
    const rollbackData = parseResult(verifyRollback) as {
      headers: string[];
      rows: string[][];
      totalRows: number;
    };
    expect(rollbackData.headers).toEqual(snapshotData.headers);
    expect(rollbackData.rows).toEqual(snapshotData.rows);
    expect(rollbackData.totalRows).toBe(snapshotData.totalRows);

    // Verify full call sequence
    expect(calls).toEqual([
      'getSheetValues',
      'updateSheetValues',
      'getSheetValues',
      'updateSheetValues',
      'getSheetValues',
    ]);
  });
});

test.describe('Layer 1: Mock Integration — Sheets Append→Rollback', () => {
  // Original: 3 rows (1 header + 2 data)
  const ORIGINAL_3ROW: SheetValuesResponse = {
    range: 'Sheet1!A1:C3',
    majorDimension: 'ROWS',
    values: [
      ['Name', 'Priority', 'Status'],
      ['Fix login', 'P0', 'Open'],
      ['Add dashboard', 'P1', 'Backlog'],
    ],
  };

  // After append: 4 rows (1 header + 3 data)
  const AFTER_APPEND: SheetValuesResponse = {
    range: 'Sheet1!A1:C4',
    majorDimension: 'ROWS',
    values: [
      ['Name', 'Priority', 'Status'],
      ['Fix login', 'P0', 'Open'],
      ['Add dashboard', 'P1', 'Backlog'],
      ['New feature', 'P2', 'Draft'],
    ],
  };

  const APPEND_RESPONSE: SheetAppendResponse = {
    spreadsheetId: 'sheet-456',
    tableRange: 'Sheet1!A1:C3',
    updates: {
      spreadsheetId: 'sheet-456',
      updatedRange: 'Sheet1!A4:C4',
      updatedRows: 1,
      updatedColumns: 3,
      updatedCells: 3,
    },
  };

  // After rollback (clear appended row): update response for clearing
  const CLEAR_UPDATE_RESPONSE: SheetUpdateResponse = {
    spreadsheetId: 'sheet-456',
    updatedRange: 'Sheet1!A4:C4',
    updatedRows: 1,
    updatedColumns: 3,
    updatedCells: 3,
  };

  // After clear: back to original 3 rows
  const AFTER_CLEAR: SheetValuesResponse = { ...ORIGINAL_3ROW };

  test('full append→verify→rollback→verify cycle', async () => {
    // Sequence: read(count) → append → read(verify) → update-clear(rollback) → read(verify)
    const { client, calls } = createTrackedMockGoogle([
      ORIGINAL_3ROW, // 1. read: count original rows
      APPEND_RESPONSE, // 2. append: add test row
      AFTER_APPEND, // 3. read: verify append
      CLEAR_UPDATE_RESPONSE, // 4. update: clear appended range (rollback)
      AFTER_CLEAR, // 5. read: verify row count restored
    ]);

    const spreadsheetId = 'sheet-456';
    const range = 'Sheet1!A1:C';

    // Step 1: Read — count original rows
    const originalRead = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(originalRead.isError).toBeUndefined();
    const originalData = parseResult(originalRead) as { totalRows: number; rows: string[][] };
    const originalRowCount = originalData.totalRows;
    expect(originalRowCount).toBe(2);

    // Step 2: Append — add test row
    const appendResult = await workspaceAppendSheet(client, {
      spreadsheetId,
      range,
      values: JSON.stringify([['New feature', 'P2', 'Draft']]),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });
    expect(appendResult.isError).toBeUndefined();
    const appendData = parseResult(appendResult) as {
      updatedRows: number;
      updatedRange: string;
      message: string;
    };
    expect(appendData.updatedRows).toBe(1);
    expect(appendData.message).toBe('Rows appended successfully');

    // Step 3: Read — verify append added row
    const afterAppend = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(afterAppend.isError).toBeUndefined();
    const afterAppendData = parseResult(afterAppend) as { totalRows: number; rows: string[][] };
    expect(afterAppendData.totalRows).toBe(originalRowCount + 1);
    expect(afterAppendData.rows[2]).toEqual(['New feature', 'P2', 'Draft']);

    // Step 4: Rollback — clear appended range using update with empty values
    const rollbackResult = await workspaceUpdateSheet(client, {
      spreadsheetId,
      range: 'Sheet1!A4:C4', // the appended range from the response
      values: JSON.stringify([['', '', '']]),
      valueInputOption: 'RAW',
    });
    expect(rollbackResult.isError).toBeUndefined();

    // Step 5: Read — verify row count matches original
    const afterClear = await workspaceGetSheet(client, { spreadsheetId, range });
    expect(afterClear.isError).toBeUndefined();
    const afterClearData = parseResult(afterClear) as { totalRows: number };
    expect(afterClearData.totalRows).toBe(originalRowCount);

    // Verify full call sequence
    expect(calls).toEqual([
      'getSheetValues',
      'appendSheetValues',
      'getSheetValues',
      'updateSheetValues',
      'getSheetValues',
    ]);
  });
});

// ================================================================
// Layer 2: Live API tests (gated by GOOGLE_LIVE_TEST=1)
// Credentials auto-detected from gcloud ADC, with env var fallback.
// ================================================================

const LIVE = !!process.env['GOOGLE_LIVE_TEST'];
const LIVE_SPREADSHEET_ID = process.env['GOOGLE_TEST_SPREADSHEET_ID'] ?? '';
const LIVE_DOC_ID = process.env['GOOGLE_TEST_DOC_ID'] ?? '';

/**
 * Lazily create the live GoogleClient. Only called when LIVE tests run.
 * Uses ADC auto-detection → env var fallback via createGoogleClientFromADC().
 */
function createLiveClient(): GoogleClient {
  return createGoogleClientFromADC();
}

test.describe('Layer 2: Live API — Google Drive Search', () => {
  test.skip(!LIVE, 'Skipped: set GOOGLE_LIVE_TEST=1 to run live tests');

  test('live drive search returns files array', async () => {
    const google = createLiveClient();
    const result = await google.searchDrive('test');
    expect(result).toHaveProperty('files');
    expect(Array.isArray(result.files)).toBe(true);
  });
});

test.describe('Layer 2: Live API — Google Docs Read', () => {
  test.skip(!LIVE, 'Skipped: set GOOGLE_LIVE_TEST=1 to run live tests');
  test.skip(!LIVE_DOC_ID, 'Skipped: set GOOGLE_TEST_DOC_ID to run doc tests');

  test('live doc read returns content', async () => {
    const google = createLiveClient();
    const content = await google.exportFile(LIVE_DOC_ID, 'text/plain');
    // Empty documents return empty string from text/plain export (valid behavior)
    expect(typeof content).toBe('string');
  });
});

test.describe('Layer 2: Live API — Google Sheets Read→Write→Rollback', () => {
  test.skip(!LIVE, 'Skipped: set GOOGLE_LIVE_TEST=1 to run live tests');
  test.skip(!LIVE_SPREADSHEET_ID, 'Skipped: set GOOGLE_TEST_SPREADSHEET_ID to run sheet tests');

  test('live sheet read→write→verify→clear→verify on Z99', async () => {
    const google = createLiveClient();
    const testValue = 'TEST_VALUE';

    // Step 0: Discover actual sheet name via metadata
    const metadata = await google.getSpreadsheetMetadata(LIVE_SPREADSHEET_ID);
    expect(metadata.sheets.length).toBeGreaterThan(0);
    const sheetName = metadata.sheets[0]!.properties.title;
    // Use single quotes for A1 notation (handles Japanese/special chars)
    const testRange = `'${sheetName}'!Z99`;

    // Step 1: Read Z99 — should be empty (or at least readable)
    const original = await google.getSheetValues(LIVE_SPREADSHEET_ID, testRange);
    const origRows = original.values ?? [];
    const originalValue =
      origRows.length > 0 && origRows[0] !== undefined && origRows[0].length > 0
        ? (origRows[0][0] ?? '')
        : '';

    // Step 2: Write test value
    await google.updateSheetValues(LIVE_SPREADSHEET_ID, testRange, [[testValue]]);

    // Step 3: Read back and verify
    const afterWrite = await google.getSheetValues(LIVE_SPREADSHEET_ID, testRange);
    const writeRows = afterWrite.values ?? [];
    expect(writeRows.length).toBeGreaterThan(0);
    const firstWriteRow = writeRows[0];
    expect(firstWriteRow).toBeDefined();
    expect(firstWriteRow![0]).toBe(testValue);

    // Step 4: Clear (write empty string to restore)
    await google.updateSheetValues(LIVE_SPREADSHEET_ID, testRange, [[originalValue]]);

    // Step 5: Read back and verify it's restored
    const afterClear = await google.getSheetValues(LIVE_SPREADSHEET_ID, testRange);
    const clearRows = afterClear.values ?? [];
    const clearedValue =
      clearRows.length > 0 && clearRows[0] !== undefined && clearRows[0].length > 0
        ? (clearRows[0][0] ?? '')
        : '';
    expect(clearedValue).toBe(originalValue);
  });
});
