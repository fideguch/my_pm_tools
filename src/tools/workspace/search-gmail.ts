import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';
import type { GmailMessageResponse } from '../../types/workspace.js';

/** Extract a specific header value from a Gmail message payload. */
function extractHeader(message: GmailMessageResponse, headerName: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === headerName.toLowerCase()
  );
  return header?.value ?? '';
}

/**
 * Search Gmail messages and return metadata (subject, from, date, snippet).
 * Fetches message list, then retrieves metadata for each message.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceSearchGmail(
  google: GoogleClient,
  args: {
    query: string;
    limit: number;
  }
): Promise<CallToolResult> {
  try {
    const listResponse = await google.listGmailMessages(args.query, {
      limit: args.limit,
    });

    const messageIds = (listResponse.messages ?? []).map((m) => m.id);
    const details = await Promise.all(messageIds.map((id) => google.getGmailMessage(id)));

    const messages = details.map((msg) => ({
      id: msg.id,
      subject: extractHeader(msg, 'Subject'),
      from: extractHeader(msg, 'From'),
      date: extractHeader(msg, 'Date'),
      snippet: msg.snippet,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              messages,
              totalEstimate: listResponse.resultSizeEstimate ?? messages.length,
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
      content: [{ type: 'text', text: `Gmail search failed: ${message}` }],
    };
  }
}
