/**
 * Convert Notion block objects to Markdown text.
 * Pure functions — no side effects, all inputs readonly.
 *
 * Type safety: uses runtime narrowing helpers (isRecord, Array.isArray)
 * instead of bare `as` casts, per codebase-integrity §1.5.
 */
import type { NotionRichText, NotionBlock } from '../types/notion.js';

// --- Runtime Narrowing Helpers (P5: type safety without `as` casts) ---

/** Validate a value is a non-null object (not array). */
function isRecord(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && !Array.isArray(val);
}

/** Extract rich_text array from a block's type-named payload. */
function getBlockRichText(block: NotionBlock): readonly NotionRichText[] {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return [];
  const rt: unknown = payload['rich_text'];
  if (!Array.isArray(rt)) return [];
  return rt as readonly NotionRichText[];
}

/** Extract to_do checked state. */
function getBlockChecked(block: NotionBlock): boolean {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return false;
  return payload['checked'] === true;
}

/** Extract code block language. */
function getBlockLanguage(block: NotionBlock): string {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return '';
  const lang: unknown = payload['language'];
  return typeof lang === 'string' ? lang : '';
}

/** Extract callout icon emoji. */
function getBlockIcon(block: NotionBlock): string {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return '';
  const icon: unknown = payload['icon'];
  if (!isRecord(icon)) return '';
  return typeof icon['emoji'] === 'string' ? icon['emoji'] : '';
}

/** Extract URL from image (external/file), bookmark, or embed blocks. */
function getBlockUrl(block: NotionBlock): string {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return '';
  if (isRecord(payload['external']) && typeof payload['external']['url'] === 'string') {
    return payload['external']['url'];
  }
  if (isRecord(payload['file']) && typeof payload['file']['url'] === 'string') {
    return payload['file']['url'];
  }
  if (typeof payload['url'] === 'string') return payload['url'];
  return '';
}

/** Extract caption rich text from image/bookmark/embed blocks. */
function getBlockCaption(block: NotionBlock): readonly NotionRichText[] {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return [];
  const cap: unknown = payload['caption'];
  if (!Array.isArray(cap)) return [];
  return cap as readonly NotionRichText[];
}

/** Extract table row cells. */
function getBlockCells(block: NotionBlock): readonly (readonly NotionRichText[])[] {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return [];
  const cells: unknown = payload['cells'];
  if (!Array.isArray(cells)) return [];
  return cells as readonly (readonly NotionRichText[])[];
}

/** Extract child page/database title. */
function getBlockTitle(block: NotionBlock): string {
  const payload: unknown = block[block.type];
  if (!isRecord(payload)) return '';
  return typeof payload['title'] === 'string' ? payload['title'] : '';
}

// --- Rich Text Conversion ---

/**
 * Convert Notion rich text array to Markdown string.
 * Handles: bold, italic, strikethrough, code, links.
 * Annotation nesting order: link > bold/italic > strikethrough.
 */
export function richTextToMarkdown(richTexts: readonly NotionRichText[]): string {
  return richTexts
    .map((rt) => {
      const text = rt.plain_text;
      if (!text) return '';

      const { bold, italic, strikethrough, code } = rt.annotations;

      // Code takes precedence — other formatting inside inline code is meaningless
      if (code) {
        const wrapped = `\`${text}\``;
        return rt.href ? `[${wrapped}](${rt.href})` : wrapped;
      }

      let result = text;

      // Apply strikethrough
      if (strikethrough) result = `~~${result}~~`;

      // Apply bold + italic (combined or individual)
      if (bold && italic) {
        result = `***${result}***`;
      } else if (bold) {
        result = `**${result}**`;
      } else if (italic) {
        result = `*${result}*`;
      }

      // Apply link (outermost)
      if (rt.href) {
        result = `[${result}](${rt.href})`;
      }

      return result;
    })
    .join('');
}

// --- Block Conversion ---

/**
 * Convert a table block with its table_row children to Markdown table.
 */
function tableToMarkdown(block: NotionBlock): string {
  const children = block.children ?? [];
  if (children.length === 0) return '';

  const rows = children.map((row) => {
    const cells = getBlockCells(row);
    return cells.map((cell) => richTextToMarkdown(cell).replace(/\|/g, '\\|'));
  });

  if (rows.length === 0) return '';

  const lines: string[] = [];
  const header = rows[0] ?? [];
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    lines.push(`| ${row.join(' | ')} |`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Convert a single block to Markdown lines.
 * Returns the converted text with appropriate formatting.
 */
function blockToMarkdown(
  block: NotionBlock,
  depth: number,
  maxDepth: number,
  numberedCounter: { count: number }
): string {
  const indent = '  '.repeat(depth);
  const text = richTextToMarkdown(getBlockRichText(block));

  switch (block.type) {
    case 'paragraph':
      return text ? `${text}\n` : '\n';

    case 'heading_1':
      return `# ${text}\n`;

    case 'heading_2':
      return `## ${text}\n`;

    case 'heading_3':
      return `### ${text}\n`;

    case 'bulleted_list_item': {
      let result = `${indent}- ${text}\n`;
      if (block.children) {
        result += notionBlocksToMarkdown(block.children, depth + 1, maxDepth);
      }
      return result;
    }

    case 'numbered_list_item': {
      numberedCounter.count++;
      let result = `${indent}${numberedCounter.count}. ${text}\n`;
      if (block.children) {
        result += notionBlocksToMarkdown(block.children, depth + 1, maxDepth);
      }
      return result;
    }

    case 'to_do': {
      const checked = getBlockChecked(block);
      return `${indent}- [${checked ? 'x' : ' '}] ${text}\n`;
    }

    case 'code': {
      const lang = getBlockLanguage(block);
      return `\`\`\`${lang}\n${text}\n\`\`\`\n`;
    }

    case 'quote': {
      const lines = text.split('\n');
      return lines.map((line) => `> ${line}`).join('\n') + '\n';
    }

    case 'callout': {
      const icon = getBlockIcon(block);
      const prefix = icon ? `${icon} ` : '';
      return `> ${prefix}${text}\n`;
    }

    case 'divider':
      return '---\n';

    case 'table':
      return tableToMarkdown(block);

    case 'toggle': {
      let result = `**${text}**\n`;
      if (block.children) {
        result += notionBlocksToMarkdown(block.children, depth, maxDepth);
      }
      return result;
    }

    case 'image': {
      const url = getBlockUrl(block);
      const caption = richTextToMarkdown(getBlockCaption(block));
      return `![${caption || 'image'}](${url})\n`;
    }

    case 'bookmark': {
      const url = getBlockUrl(block);
      const caption = richTextToMarkdown(getBlockCaption(block));
      return `[${caption || url}](${url})\n`;
    }

    case 'embed': {
      const url = getBlockUrl(block);
      return `[embed](${url})\n`;
    }

    case 'child_page':
      return `📄 ${getBlockTitle(block)}\n`;

    case 'child_database':
      return `🗄️ ${getBlockTitle(block)}\n`;

    case 'synced_block':
      return '<!-- synced block omitted -->\n';

    default:
      return `<!-- unsupported: ${block.type} -->\n`;
  }
}

// --- Main Conversion Function ---

/**
 * Convert an array of Notion blocks to Markdown text.
 *
 * @param blocks - Readonly array of Notion block objects
 * @param depth - Current indentation depth (0 = top level)
 * @param maxDepth - Maximum recursion depth (default: 3)
 * @returns Markdown string
 */
export function notionBlocksToMarkdown(
  blocks: readonly NotionBlock[],
  depth: number = 0,
  maxDepth: number = 3
): string {
  if (depth > maxDepth) return '';

  const parts: string[] = [];
  let numberedCounter = { count: 0 };
  let prevType = '';

  for (const block of blocks) {
    // Reset numbered list counter when a non-numbered block appears
    if (block.type !== 'numbered_list_item' && prevType === 'numbered_list_item') {
      numberedCounter = { count: 0 };
    }

    // Add blank line between non-list blocks for readability
    if (
      parts.length > 0 &&
      !block.type.includes('list_item') &&
      !prevType.includes('list_item') &&
      block.type !== 'divider'
    ) {
      parts.push('\n');
    }

    parts.push(blockToMarkdown(block, depth, maxDepth, numberedCounter));
    prevType = block.type;
  }

  return parts.join('');
}
