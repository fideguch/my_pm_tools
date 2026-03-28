import { test, expect } from '@playwright/test';
import { workspaceGetDoc } from '../../../../src/tools/workspace/get-doc.js';
import { createMockGoogle, MOCK_DOC_MARKDOWN } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_get_doc tool', () => {
  test('returns document as markdown', async () => {
    const google = createMockGoogle([MOCK_DOC_MARKDOWN]);

    const result = await workspaceGetDoc(google, { documentId: 'doc-123' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.documentId).toBe('doc-123');
    expect(data.format).toBe('markdown');
    expect(data.content).toContain('# Q1 Report');
    expect(data.content).toContain('This quarter we achieved');
  });

  test('returns error for non-existent document', async () => {
    const google = createMockGoogle([new Error('Google API error 404: Not Found')]);

    const result = await workspaceGetDoc(google, { documentId: 'bad-id' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get document failed');
    expect(text).toContain('404');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 500: Internal Server Error')]);

    const result = await workspaceGetDoc(google, { documentId: 'doc-123' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get document failed');
    expect(text).toContain('500');
  });

  test('handles empty document', async () => {
    const google = createMockGoogle(['']);

    const result = await workspaceGetDoc(google, { documentId: 'empty-doc' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.documentId).toBe('empty-doc');
    expect(data.content).toBe('');
  });
});
