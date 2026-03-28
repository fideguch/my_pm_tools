import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';

/**
 * Search Google Drive for files matching a query.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceSearchDrive(
  google: GoogleClient,
  args: {
    query: string;
    mimeType?: string;
    limit: number;
  }
): Promise<CallToolResult> {
  try {
    const response = await google.searchDrive(args.query, {
      mimeType: args.mimeType,
      limit: args.limit,
    });

    const files = response.files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      url: f.webViewLink,
      modifiedTime: f.modifiedTime,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              files,
              totalFiles: files.length,
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
      content: [{ type: 'text', text: `Drive search failed: ${message}` }],
    };
  }
}
