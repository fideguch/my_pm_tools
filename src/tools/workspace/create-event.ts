import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';
import type { CalendarEventInput, CalendarEventTime } from '../../types/workspace.js';

/**
 * Create a Google Calendar event.
 * Supports timed events (RFC3339 with offset) and all-day events (date only).
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceCreateEvent(
  google: GoogleClient,
  args: {
    calendarId: string;
    summary: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
    allDay?: boolean;
    description?: string;
    location?: string;
  }
): Promise<CallToolResult> {
  try {
    let start: CalendarEventTime;
    let end: CalendarEventTime;

    if (args.allDay) {
      // All-day events use date-only format
      const startDate = args.startDateTime.slice(0, 10);
      const endDate = args.endDateTime.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'All-day events require date format: YYYY-MM-DD (e.g. "2026-04-01")',
            },
          ],
        };
      }
      start = { date: startDate };
      end = { date: endDate };
    } else {
      // Timed events require timezone offset
      const offsetPattern = /[+-]\d{2}:\d{2}$|Z$/;
      if (!offsetPattern.test(args.startDateTime) || !offsetPattern.test(args.endDateTime)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Timed events require RFC3339 with timezone offset (e.g. "2026-04-01T10:00:00+09:00"). Include +HH:MM or Z.',
            },
          ],
        };
      }
      start = { dateTime: args.startDateTime, timeZone: args.timeZone };
      end = { dateTime: args.endDateTime, timeZone: args.timeZone };
    }

    const event: CalendarEventInput = {
      summary: args.summary,
      start,
      end,
      ...(args.description ? { description: args.description } : {}),
      ...(args.location ? { location: args.location } : {}),
      ...(args.timeZone ? { timeZone: args.timeZone } : {}),
    };

    const response = await google.createEvent(args.calendarId, event);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              event: {
                id: response.id,
                htmlLink: response.htmlLink,
                summary: response.summary,
                start: response.start,
                end: response.end,
                status: response.status,
              },
              message: 'Event created successfully',
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Create event failed: ${message}` }],
    };
  }
}
