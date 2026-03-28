import { test, expect } from '@playwright/test';
import { workspaceSearchDrive } from '../../../../src/tools/workspace/search-drive.js';
import { createMockGoogle, MOCK_DRIVE_FILES } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_search_drive tool', () => {
  test('returns matching files', async () => {
    const google = createMockGoogle([MOCK_DRIVE_FILES]);

    const result = await workspaceSearchDrive(google, { query: 'Report', limit: 20 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalFiles).toBe(2);
    expect(data.files).toHaveLength(2);
    expect(data.files[0].id).toBe('doc-123');
    expect(data.files[0].name).toBe('Q1 Report');
    expect(data.files[0].url).toBe('https://docs.google.com/document/d/doc-123');
  });

  test('returns empty results for no matches', async () => {
    const google = createMockGoogle([{ files: [] }]);

    const result = await workspaceSearchDrive(google, { query: 'nonexistent', limit: 20 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalFiles).toBe(0);
    expect(data.files).toHaveLength(0);
  });

  test('filters by mimeType', async () => {
    const filtered = {
      files: [MOCK_DRIVE_FILES.files[1]],
    };
    const google = createMockGoogle([filtered]);

    const result = await workspaceSearchDrive(google, {
      query: 'Data',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      limit: 20,
    });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalFiles).toBe(1);
    expect(data.files[0].mimeType).toBe('application/vnd.google-apps.spreadsheet');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 404: Not Found')]);

    const result = await workspaceSearchDrive(google, { query: 'fail', limit: 20 });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Drive search failed');
    expect(text).toContain('404');
  });

  test('respects limit parameter', async () => {
    const singleFile = { files: [MOCK_DRIVE_FILES.files[0]] };
    const google = createMockGoogle([singleFile]);

    const result = await workspaceSearchDrive(google, { query: 'Report', limit: 1 });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalFiles).toBe(1);
    expect(data.files).toHaveLength(1);
  });
});
