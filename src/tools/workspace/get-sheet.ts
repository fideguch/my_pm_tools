import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';

/**
 * Get values from a Google Sheets spreadsheet range.
 * First row is treated as headers, remaining rows as data.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceGetSheet(
  google: GoogleClient,
  args: {
    spreadsheetId: string;
    range: string;
  }
): Promise<CallToolResult> {
  try {
    const response = await google.getSheetValues(args.spreadsheetId, args.range);

    const values = response.values ?? [];
    const firstRow = values[0];
    const headers = firstRow ? Array.from(firstRow) : [];
    const rows = values.length > 1 ? values.slice(1).map((row) => Array.from(row)) : [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              spreadsheetId: args.spreadsheetId,
              range: response.range,
              headers,
              rows,
              totalRows: rows.length,
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
      content: [{ type: 'text', text: `Get sheet failed: ${message}` }],
    };
  }
}
