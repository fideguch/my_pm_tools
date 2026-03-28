import { test, expect } from '@playwright/test';
import { workspaceSearchGmail } from '../../../../src/tools/workspace/search-gmail.js';
import {
  createMockGoogle,
  MOCK_GMAIL_LIST,
  MOCK_GMAIL_MESSAGE,
} from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_search_gmail tool', () => {
  test('returns email messages with metadata', async () => {
    const google = createMockGoogle([MOCK_GMAIL_LIST, MOCK_GMAIL_MESSAGE, MOCK_GMAIL_MESSAGE]);

    const result = await workspaceSearchGmail(google, { query: 'weekly report', limit: 10 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalEstimate).toBe(2);
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0].id).toBe('msg-1');
    expect(data.messages[0].subject).toBe('Weekly Report');
    expect(data.messages[0].from).toBe('pm@example.com');
    expect(data.messages[0].snippet).toContain('authentication module');
  });

  test('returns empty results', async () => {
    const google = createMockGoogle([{ messages: [], resultSizeEstimate: 0 }]);

    const result = await workspaceSearchGmail(google, { query: 'nonexistent', limit: 10 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalEstimate).toBe(0);
    expect(data.messages).toHaveLength(0);
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 401: Unauthorized')]);

    const result = await workspaceSearchGmail(google, { query: 'fail', limit: 10 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Gmail search failed');
    expect(text).toContain('401');
  });

  test('extracts Subject, From, Date headers', async () => {
    const google = createMockGoogle([MOCK_GMAIL_LIST, MOCK_GMAIL_MESSAGE, MOCK_GMAIL_MESSAGE]);

    const result = await workspaceSearchGmail(google, { query: 'report', limit: 10 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    const msg = data.messages[0];
    expect(msg.subject).toBe('Weekly Report');
    expect(msg.from).toBe('pm@example.com');
    expect(msg.date).toBe('Thu, 28 Mar 2026 10:00:00 +0900');
  });

  test('handles messages with missing headers', async () => {
    const noHeaders = {
      id: 'msg-no-headers',
      threadId: 'thread-x',
      snippet: 'Some text...',
      payload: { headers: [] },
    };
    const listWithOne = {
      messages: [{ id: 'msg-no-headers', threadId: 'thread-x' }],
      resultSizeEstimate: 1,
    };
    const google = createMockGoogle([listWithOne, noHeaders]);

    const result = await workspaceSearchGmail(google, { query: 'test', limit: 10 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].subject).toBe('');
    expect(data.messages[0].from).toBe('');
    expect(data.messages[0].date).toBe('');
  });
});
