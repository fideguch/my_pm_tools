import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';

/**
 * Get a Google Slides presentation exported as plain text via Drive export API.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceGetSlides(
  google: GoogleClient,
  args: {
    presentationId: string;
  }
): Promise<CallToolResult> {
  try {
    const content = await google.exportFile(args.presentationId, 'text/plain');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              presentationId: args.presentationId,
              format: 'text',
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
      content: [{ type: 'text', text: `Get slides failed: ${message}` }],
    };
  }
}
