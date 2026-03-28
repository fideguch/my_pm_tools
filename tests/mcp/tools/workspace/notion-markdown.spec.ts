import { test, expect } from '@playwright/test';
import {
  richTextToMarkdown,
  notionBlocksToMarkdown,
} from '../../../../src/utils/notion-markdown.js';
import { rt } from '../../../scenarios/fixtures/mock-notion.js';
import type { NotionBlock } from '../../../../src/types/notion.js';

/** Helper to create a block with a type-named payload. */
function block(
  type: string,
  payload: Record<string, unknown>,
  opts?: { has_children?: boolean; children?: NotionBlock[] }
): NotionBlock {
  return {
    id: `blk-${Math.random().toString(36).slice(2, 8)}`,
    type,
    has_children: opts?.has_children ?? false,
    children: opts?.children,
    [type]: payload,
  };
}

test.describe('richTextToMarkdown', () => {
  test('converts plain text', () => {
    expect(richTextToMarkdown([rt('Hello world')])).toBe('Hello world');
  });

  test('converts bold, italic, and code annotations', () => {
    const segments = [
      rt('bold', { bold: true }),
      rt(' '),
      rt('italic', { italic: true }),
      rt(' '),
      rt('code', { code: true }),
    ];
    expect(richTextToMarkdown(segments)).toBe('**bold** *italic* `code`');
  });

  test('converts bold+italic combined', () => {
    expect(richTextToMarkdown([rt('important', { bold: true, italic: true })])).toBe(
      '***important***'
    );
  });

  test('converts links', () => {
    expect(richTextToMarkdown([rt('Click', { href: 'https://example.com' })])).toBe(
      '[Click](https://example.com)'
    );
  });
});

test.describe('notionBlocksToMarkdown', () => {
  test('converts simple paragraph', () => {
    const blocks = [block('paragraph', { rich_text: [rt('Hello world')] })];
    expect(notionBlocksToMarkdown(blocks)).toBe('Hello world\n');
  });

  test('converts headings 1/2/3', () => {
    const blocks = [
      block('heading_1', { rich_text: [rt('Title')] }),
      block('heading_2', { rich_text: [rt('Subtitle')] }),
      block('heading_3', { rich_text: [rt('Section')] }),
    ];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('# Title\n');
    expect(result).toContain('## Subtitle\n');
    expect(result).toContain('### Section\n');
  });

  test('converts bulleted list with nesting', () => {
    const child = block('bulleted_list_item', { rich_text: [rt('A1')] });
    const blocks = [
      block(
        'bulleted_list_item',
        { rich_text: [rt('A')] },
        { has_children: true, children: [child] }
      ),
      block('bulleted_list_item', { rich_text: [rt('B')] }),
    ];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('- A\n');
    expect(result).toContain('  - A1\n');
    expect(result).toContain('- B\n');
  });

  test('converts numbered list with counter reset', () => {
    const blocks = [
      block('numbered_list_item', { rich_text: [rt('First')] }),
      block('numbered_list_item', { rich_text: [rt('Second')] }),
      block('paragraph', { rich_text: [rt('Break')] }),
      block('numbered_list_item', { rich_text: [rt('New first')] }),
    ];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('1. First\n');
    expect(result).toContain('2. Second\n');
    expect(result).toContain('Break\n');
    // Counter reset after paragraph
    expect(result).toMatch(/1\. New first/);
  });

  test('converts to-do items', () => {
    const blocks = [
      block('to_do', { rich_text: [rt('Buy milk')], checked: false }),
      block('to_do', { rich_text: [rt('Write code')], checked: true }),
    ];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('- [ ] Buy milk\n');
    expect(result).toContain('- [x] Write code\n');
  });

  test('converts code block with language', () => {
    const blocks = [block('code', { rich_text: [rt('const x = 1;')], language: 'typescript' })];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('```typescript\n');
    expect(result).toContain('const x = 1;\n');
    expect(result).toContain('```\n');
  });

  test('converts quote block', () => {
    const blocks = [block('quote', { rich_text: [rt('quoted text')] })];
    expect(notionBlocksToMarkdown(blocks)).toContain('> quoted text\n');
  });

  test('converts callout with emoji', () => {
    const blocks = [
      block('callout', {
        rich_text: [rt('Be careful')],
        icon: { type: 'emoji', emoji: '⚠️' },
      }),
    ];
    expect(notionBlocksToMarkdown(blocks)).toContain('> ⚠️ Be careful\n');
  });

  test('converts table with header', () => {
    const rows = [
      block('table_row', { cells: [[rt('Name')], [rt('Age')]] }),
      block('table_row', { cells: [[rt('Alice')], [rt('30')]] }),
    ];
    const blocks = [block('table', { table_width: 2 }, { has_children: true, children: rows })];
    const result = notionBlocksToMarkdown(blocks);
    expect(result).toContain('| Name | Age |');
    expect(result).toContain('| --- | --- |');
    expect(result).toContain('| Alice | 30 |');
  });

  test('converts divider', () => {
    const blocks = [block('divider', {})];
    expect(notionBlocksToMarkdown(blocks)).toContain('---\n');
  });

  test('converts image with caption', () => {
    const blocks = [
      block('image', {
        type: 'external',
        external: { url: 'https://example.com/img.png' },
        caption: [rt('Screenshot')],
      }),
    ];
    expect(notionBlocksToMarkdown(blocks)).toContain(
      '![Screenshot](https://example.com/img.png)\n'
    );
  });

  test('renders unsupported block as HTML comment', () => {
    const blocks = [block('synced_block', {})];
    expect(notionBlocksToMarkdown(blocks)).toContain('<!-- synced block omitted -->\n');
  });

  test('renders unknown block type as HTML comment', () => {
    const blocks = [block('some_future_type', {})];
    expect(notionBlocksToMarkdown(blocks)).toContain('<!-- unsupported: some_future_type -->\n');
  });

  test('respects maxDepth limit', () => {
    const deep = block('paragraph', { rich_text: [rt('deep')] });
    const mid = block(
      'bulleted_list_item',
      { rich_text: [rt('mid')] },
      { has_children: true, children: [deep] }
    );
    const top = block(
      'bulleted_list_item',
      { rich_text: [rt('top')] },
      { has_children: true, children: [mid] }
    );
    // maxDepth=1 means only depth 0 and 1 are rendered
    const result = notionBlocksToMarkdown([top], 0, 1);
    expect(result).toContain('- top\n');
    expect(result).toContain('  - mid\n');
    // 'deep' should not appear because it's at depth 2
    expect(result).not.toContain('deep');
  });
});
