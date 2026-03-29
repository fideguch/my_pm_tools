import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';
import { is2DArray } from '../../utils/type-guards.js';

/**
 * Append rows to a Google Sheets range.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceAppendSheet(
  google: GoogleClient,
  args: {
    spreadsheetId: string;
    range: string;
    values: string;
    valueInputOption: 'RAW' | 'USER_ENTERED';
    insertDataOption: 'INSERT_ROWS' | 'OVERWRITE';
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
    const response = await google.appendSheetValues(
      args.spreadsheetId,
      args.range,
      values,
      args.valueInputOption,
      args.insertDataOption
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              spreadsheetId: response.spreadsheetId,
              tableRange: response.tableRange,
              updatedRange: response.updates.updatedRange,
              updatedRows: response.updates.updatedRows,
              updatedCells: response.updates.updatedCells,
              message: 'Rows appended successfully',
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
      content: [{ type: 'text', text: `Append sheet failed: ${message}` }],
    };
  }
}
