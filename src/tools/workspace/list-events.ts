import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';

/**
 * List events from a Google Calendar.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceListEvents(
  google: GoogleClient,
  args: {
    calendarId: string;
    timeMin?: string;
    timeMax?: string;
    limit: number;
  }
): Promise<CallToolResult> {
  try {
    const response = await google.listEvents(args.calendarId, {
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      limit: args.limit,
    });

    const events = (response.items ?? []).map((e) => ({
      id: e.id,
      summary: e.summary,
      start: e.start,
      end: e.end,
      ...(e.location ? { location: e.location } : {}),
      ...(e.description ? { description: e.description } : {}),
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              calendarId: args.calendarId,
              events,
              totalEvents: events.length,
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
      content: [{ type: 'text', text: `List events failed: ${message}` }],
    };
  }
}
