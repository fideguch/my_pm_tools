/**
 * Mock Google client factory for tests.
 * Pattern: follows createMockGql (tests/scenarios/fixtures/mock-gql.ts) —
 * sequential response matching, same call tracking pattern.
 */
import type { GoogleClient } from '../../../src/utils/google-client.js';
import type {
  DriveSearchResponse,
  SheetValuesResponse,
  EventListResponse,
  GmailListResponse,
  GmailMessageResponse,
} from '../../../src/types/workspace.js';

/**
 * Create a mock GoogleClient that returns responses in sequence.
 * Each client method call consumes the next response from the array.
 * If a response is an Error instance, it is thrown instead.
 */
export function createMockGoogle(responses: readonly unknown[]): GoogleClient {
  let callIndex = 0;
  function next(): unknown {
    const resp = responses[callIndex++];
    if (resp instanceof Error) throw resp;
    return resp;
  }

  return {
    searchDrive: async () => next() as DriveSearchResponse,
    exportFile: async () => next() as string,
    getSheetValues: async () => next() as SheetValuesResponse,
    listEvents: async () => next() as EventListResponse,
    listGmailMessages: async () => next() as GmailListResponse,
    getGmailMessage: async () => next() as GmailMessageResponse,
  };
}

// --- Mock Data Constants (API response shape verified against Google API docs) ---

export const MOCK_DRIVE_FILES: DriveSearchResponse = {
  files: [
    {
      id: 'doc-123',
      name: 'Q1 Report',
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: 'https://docs.google.com/document/d/doc-123',
      modifiedTime: '2026-03-28T00:00:00.000Z',
    },
    {
      id: 'sheet-456',
      name: 'Sprint Data',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      webViewLink: 'https://docs.google.com/spreadsheets/d/sheet-456',
      modifiedTime: '2026-03-27T00:00:00.000Z',
    },
  ],
};

export const MOCK_DOC_MARKDOWN = '# Q1 Report\n\nThis quarter we achieved...\n';

export const MOCK_SHEET_VALUES: SheetValuesResponse = {
  range: 'Sheet1!A1:C3',
  majorDimension: 'ROWS',
  values: [
    ['Name', 'Priority', 'Status'],
    ['Fix login', 'P0', 'Open'],
    ['Add dashboard', 'P1', 'Backlog'],
  ],
};

export const MOCK_SLIDES_TEXT = 'Slide 1: Project Overview\nSlide 2: Timeline\n';

export const MOCK_CALENDAR_EVENTS: EventListResponse = {
  items: [
    {
      id: 'evt-1',
      summary: 'Sprint Planning',
      start: { dateTime: '2026-03-28T10:00:00+09:00' },
      end: { dateTime: '2026-03-28T11:00:00+09:00' },
      description: 'Sprint 5 planning session',
      location: 'Room A',
      htmlLink: 'https://calendar.google.com/event?eid=evt-1',
    },
    {
      id: 'evt-2',
      summary: 'Daily Standup',
      start: { dateTime: '2026-03-28T09:00:00+09:00' },
      end: { dateTime: '2026-03-28T09:15:00+09:00' },
      htmlLink: 'https://calendar.google.com/event?eid=evt-2',
    },
  ],
  summary: 'Primary Calendar',
  timeZone: 'Asia/Tokyo',
};

export const MOCK_GMAIL_LIST: GmailListResponse = {
  messages: [
    { id: 'msg-1', threadId: 'thread-1' },
    { id: 'msg-2', threadId: 'thread-2' },
  ],
  resultSizeEstimate: 2,
};

export const MOCK_GMAIL_MESSAGE: GmailMessageResponse = {
  id: 'msg-1',
  threadId: 'thread-1',
  snippet: 'This week we completed the authentication module...',
  payload: {
    headers: [
      { name: 'Subject', value: 'Weekly Report' },
      { name: 'From', value: 'pm@example.com' },
      { name: 'Date', value: 'Thu, 28 Mar 2026 10:00:00 +0900' },
    ],
  },
};
