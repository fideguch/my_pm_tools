import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';

/**
 * Get a Google Docs document exported as Markdown via Drive export API.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceGetDoc(
  google: GoogleClient,
  args: {
    documentId: string;
  }
): Promise<CallToolResult> {
  try {
    const content = await google.exportFile(args.documentId, 'text/markdown');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              documentId: args.documentId,
              format: 'markdown',
              content,
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
      content: [{ type: 'text', text: `Get document failed: ${message}` }],
    };
  }
}
