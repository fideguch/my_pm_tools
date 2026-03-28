import { test, expect } from '@playwright/test';
import { workspaceListEvents } from '../../../../src/tools/workspace/list-events.js';
import { createMockGoogle, MOCK_CALENDAR_EVENTS } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_list_events tool', () => {
  test('returns calendar events', async () => {
    const google = createMockGoogle([MOCK_CALENDAR_EVENTS]);

    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.calendarId).toBe('primary');
    expect(data.totalEvents).toBe(2);
    expect(data.events).toHaveLength(2);
    expect(data.events[0].summary).toBe('Sprint Planning');
    expect(data.events[1].summary).toBe('Daily Standup');
  });

  test('returns empty events', async () => {
    const google = createMockGoogle([
      { items: [], summary: 'Primary Calendar', timeZone: 'Asia/Tokyo' },
    ]);

    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalEvents).toBe(0);
    expect(data.events).toHaveLength(0);
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 403: Forbidden')]);

    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('List events failed');
    expect(text).toContain('403');
  });

  test('formats event dates correctly', async () => {
    const google = createMockGoogle([MOCK_CALENDAR_EVENTS]);

    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.events[0].start.dateTime).toBe('2026-03-28T10:00:00+09:00');
    expect(data.events[0].end.dateTime).toBe('2026-03-28T11:00:00+09:00');
  });

  test('handles events with missing optional fields', async () => {
    const google = createMockGoogle([MOCK_CALENDAR_EVENTS]);

    const result = await workspaceListEvents(google, {
      calendarId: 'primary',
      limit: 20,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    // First event has location and description
    expect(data.events[0].location).toBe('Room A');
    expect(data.events[0].description).toBe('Sprint 5 planning session');
    // Second event has neither location nor description
    expect(data.events[1]).not.toHaveProperty('location');
    expect(data.events[1]).not.toHaveProperty('description');
  });
});
