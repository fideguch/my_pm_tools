import { test, expect } from '@playwright/test';
import {
  createMockGoogle,
  MOCK_SHEET_VALUES,
  MOCK_DRIVE_FILES,
  MOCK_CALENDAR_EVENTS,
  MOCK_GMAIL_LIST,
  MOCK_GMAIL_MESSAGE,
} from './fixtures/mock-google.js';
import { workspaceGetSheet } from '../../src/tools/workspace/get-sheet.js';
import { workspaceSearchDrive } from '../../src/tools/workspace/search-drive.js';
import { workspaceListEvents } from '../../src/tools/workspace/list-events.js';
import { workspaceSearchGmail } from '../../src/tools/workspace/search-gmail.js';

// ---------------------------------------------------------------------------
// Sheet data → verify headers/rows structure
// ---------------------------------------------------------------------------

test.describe('Google Sheets workflows', () => {
  test('should return headers and data rows from spreadsheet', async () => {
    // Given: a mock Google client returning sheet values
    const google = createMockGoogle([MOCK_SHEET_VALUES]);

    // When: reading a sheet range
    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C3',
    });

    // Then: response contains structured headers and rows
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.headers).toEqual(['Name', 'Priority', 'Status']);
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0]).toEqual(['Fix login', 'P0', 'Open']);
    expect(data.totalRows).toBe(2);
  });

  test('should include spreadsheet metadata in response', async () => {
    // Given: a mock Google client
    const google = createMockGoogle([MOCK_SHEET_VALUES]);

    // When: reading a sheet range
    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C3',
    });

    // Then: response includes spreadsheetId and range
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.range).toBe('Sheet1!A1:C3');
  });
});

// ---------------------------------------------------------------------------
// Drive search → verify file listing
// ---------------------------------------------------------------------------

test.describe('Google Drive search workflows', () => {
  test('should return file listing with metadata', async () => {
    // Given: a mock Google client returning drive files
    const google = createMockGoogle([MOCK_DRIVE_FILES]);

    // When: searching Drive
    const result = await workspaceSearchDrive(google, {
      query: 'Report',
      limit: 10,
    });

    // Then: response contains file list with expected fields
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.files).toHaveLength(2);
    expect(data.files[0]).toHaveProperty('id');
    expect(data.files[0]).toHaveProperty('name');
    expect(data.files[0]).toHaveProperty('mimeType');
    expect(data.files[0]).toHaveProperty('url');
    expect(data.totalFiles).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Calendar events → verify event format
// ---------------------------------------------------------------------------

test.describe('Google Calendar workflows', () => {
  test('should return events with time and metadata', async () => {
    // Given: a mock Google client returning calendar events
    const google = createMockGoogle([MOCK_CALENDAR_EVENTS]);

    // When: listing events
    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    // Then: response contains properly formatted events
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.events).toHaveLength(2);
    expect(data.events[0]).toHaveProperty('id');
    expect(data.events[0]).toHaveProperty('summary');
    expect(data.events[0]).toHaveProperty('start');
    expect(data.events[0]).toHaveProperty('end');
    expect(data.calendarId).toBe('primary');
    expect(data.totalEvents).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Gmail search → verify message metadata
// ---------------------------------------------------------------------------

test.describe('Gmail search workflows', () => {
  test('should return messages with subject, from, date, snippet', async () => {
    // Given: a mock Google client returning gmail list then message detail
    const google = createMockGoogle([MOCK_GMAIL_LIST, MOCK_GMAIL_MESSAGE, MOCK_GMAIL_MESSAGE]);

    // When: searching Gmail
    const result = await workspaceSearchGmail(google, {
      query: 'weekly report',
      limit: 10,
    });

    // Then: response contains message metadata
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0]).toHaveProperty('id');
    expect(data.messages[0]).toHaveProperty('subject');
    expect(data.messages[0]).toHaveProperty('from');
    expect(data.messages[0]).toHaveProperty('date');
    expect(data.messages[0]).toHaveProperty('snippet');
    expect(data.totalEstimate).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Auth not configured → verify error message
// ---------------------------------------------------------------------------

test.describe('Google Workspace auth not configured', () => {
  test('should return error when Google API call fails', async () => {
    // Given: a mock Google client that throws an auth error
    const google = createMockGoogle([new Error('Invalid credentials')]);

    // When: attempting to search Drive
    const result = await workspaceSearchDrive(google, {
      query: 'test',
      limit: 10,
    });

    // Then: error is returned without throwing
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Drive search failed');
  });
});
