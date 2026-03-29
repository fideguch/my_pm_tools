import { test, expect } from '@playwright/test';
import { workspaceCreateEvent } from '../../../../src/tools/workspace/create-event.js';
import {
  createMockGoogle,
  MOCK_CALENDAR_EVENT_CREATED,
} from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_create_event tool', () => {
  test('creates timed event successfully', async () => {
    const google = createMockGoogle([MOCK_CALENDAR_EVENT_CREATED]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Sprint Planning',
      startDateTime: '2026-04-01T10:00:00+09:00',
      endDateTime: '2026-04-01T11:00:00+09:00',
      description: 'Sprint 6 planning',
      location: 'Room A',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.event.id).toBe('evt-new-1');
    expect(data.event.summary).toBe('Sprint Planning');
    expect(data.event.status).toBe('confirmed');
    expect(data.message).toBe('Event created successfully');
  });

  test('creates all-day event successfully', async () => {
    const allDayEvent = {
      ...MOCK_CALENDAR_EVENT_CREATED,
      start: { date: '2026-04-01' },
      end: { date: '2026-04-02' },
    };
    const google = createMockGoogle([allDayEvent]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Company Holiday',
      startDateTime: '2026-04-01',
      endDateTime: '2026-04-02',
      allDay: true,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.event.id).toBe('evt-new-1');
    expect(data.event.summary).toBe('Sprint Planning'); // mock returns fixed data
    expect(data.message).toBe('Event created successfully');
  });

  test('returns error for timed event without timezone offset', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Bad Event',
      startDateTime: '2026-04-01T10:00:00',
      endDateTime: '2026-04-01T11:00:00',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('RFC3339 with timezone offset');
  });

  test('returns error for all-day event with invalid date format', async () => {
    const google = createMockGoogle([]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Bad Holiday',
      startDateTime: '04/01/2026',
      endDateTime: '04/02/2026',
      allDay: true,
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('YYYY-MM-DD');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 403: Insufficient scope')]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Sprint Planning',
      startDateTime: '2026-04-01T10:00:00+09:00',
      endDateTime: '2026-04-01T11:00:00+09:00',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Create event failed');
    expect(text).toContain('403');
  });

  test('accepts UTC timezone (Z suffix)', async () => {
    const google = createMockGoogle([MOCK_CALENDAR_EVENT_CREATED]);

    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'UTC Meeting',
      startDateTime: '2026-04-01T01:00:00Z',
      endDateTime: '2026-04-01T02:00:00Z',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.event.id).toBe('evt-new-1');
  });
});
