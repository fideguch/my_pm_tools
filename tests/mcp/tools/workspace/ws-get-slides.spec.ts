import { test, expect } from '@playwright/test';
import { workspaceGetSlides } from '../../../../src/tools/workspace/get-slides.js';
import { createMockGoogle, MOCK_SLIDES_TEXT } from '../../../scenarios/fixtures/mock-google.js';

test.describe('workspace_get_slides tool', () => {
  test('returns presentation as text', async () => {
    const google = createMockGoogle([MOCK_SLIDES_TEXT]);

    const result = await workspaceGetSlides(google, { presentationId: 'slides-789' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.presentationId).toBe('slides-789');
    expect(data.format).toBe('text');
    expect(data.content).toContain('Project Overview');
    expect(data.content).toContain('Timeline');
  });

  test('returns error for non-existent presentation', async () => {
    const google = createMockGoogle([new Error('Google API error 404: Not Found')]);

    const result = await workspaceGetSlides(google, { presentationId: 'bad-id' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get slides failed');
    expect(text).toContain('404');
  });

  test('returns error on API failure', async () => {
    const google = createMockGoogle([new Error('Google API error 500: Internal Server Error')]);

    const result = await workspaceGetSlides(google, { presentationId: 'slides-789' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Get slides failed');
    expect(text).toContain('500');
  });

  test('handles empty presentation', async () => {
    const google = createMockGoogle(['']);

    const result = await workspaceGetSlides(google, { presentationId: 'empty-slides' });

    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.presentationId).toBe('empty-slides');
    expect(data.content).toBe('');
  });
});
