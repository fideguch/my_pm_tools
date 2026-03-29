import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';
import { is2DArray } from '../../utils/type-guards.js';

/**
 * Update cell values in a Google Sheets range.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceUpdateSheet(
  google: GoogleClient,
  args: {
    spreadsheetId: string;
    range: string;
    values: string;
    valueInputOption: 'RAW' | 'USER_ENTERED';
  }
): Promise<CallToolResult> {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(args.values);
    } catch {
      return {
        isError: true,
        content: [{ type: 'text', text: `Invalid values JSON: ${args.values.slice(0, 100)}` }],
      };
    }
    if (!is2DArray(parsed)) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Invalid values: expected 2D array (array of arrays). Example: [["A1","B1"],["A2","B2"]]',
          },
        ],
      };
    }

    const values = parsed;
    const response = await google.updateSheetValues(
      args.spreadsheetId,
      args.range,
      values,
      args.valueInputOption
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              spreadsheetId: response.spreadsheetId,
              updatedRange: response.updatedRange,
              updatedRows: response.updatedRows,
              updatedColumns: response.updatedColumns,
              updatedCells: response.updatedCells,
              message: 'Sheet values updated successfully',
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
      content: [{ type: 'text', text: `Update sheet failed: ${message}` }],
    };
  }
}
