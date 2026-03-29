/**
 * Zod input schemas for Notion MCP tools.
 * All fields have .describe() for LLM tool discovery (codebase-integrity §1.7).
 */
import { z } from 'zod';

/** notion_search input schema */
export const notionSearchSchema = {
  query: z.string().optional().describe('Search query text (searches page titles)'),
  filter: z.enum(['page', 'database']).optional().describe('Filter results by object type'),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Results per page (max 100, default 10)'),
};

/** notion_get_page input schema */
export const notionGetPageSchema = {
  pageId: z.string().min(1).describe('Notion page ID (UUID format, with or without dashes)'),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(3)
    .describe('Max block recursion depth (default 3)'),
};

/** notion_query_database input schema */
export const notionQueryDatabaseSchema = {
  databaseId: z.string().min(1).describe('Notion database ID'),
  filter: z.string().optional().describe('JSON filter object following Notion filter syntax'),
  sorts: z.string().optional().describe('JSON sorts array following Notion sort syntax'),
  pageSize: z.number().int().min(1).max(100).optional().describe('Results per page (max 100)'),
};

/** notion_create_page input schema */
export const notionCreatePageSchema = {
  parentId: z.string().min(1).describe('Parent database or page ID'),
  parentType: z.enum(['database', 'page']).describe('Type of parent (database or page)'),
  properties: z
    .string()
    .min(1)
    .describe('Page properties as JSON string (Notion properties format)'),
  content: z.string().optional().describe('Page body as plain text (added as paragraph blocks)'),
};

/** notion_append_blocks input schema */
export const notionAppendBlocksSchema = {
  blockId: z.string().min(1).describe('Target block or page ID to append content to'),
  content: z.string().min(1).describe('Content as plain text (added as paragraph blocks)'),
};

/** notion_update_page input schema */
export const notionUpdatePageSchema = {
  pageId: z.string().min(1).describe('Notion page ID (UUID format, with or without dashes)'),
  properties: z
    .string()
    .min(1)
    .describe(
      'Properties to update as JSON string (same format as Notion API). ' +
        'Updatable: title, rich_text, number, select, multi_select, date, checkbox, url, email, phone_number, relation, people, status. ' +
        'Read-only: formula, rollup, created_time, last_edited_time'
    ),
};

/** notion_archive_page input schema */
export const notionArchivePageSchema = {
  pageId: z.string().min(1).describe('Notion page ID (UUID format, with or without dashes)'),
  archive: z
    .boolean()
    .default(true)
    .describe('true = archive the page (default), false = unarchive'),
};
