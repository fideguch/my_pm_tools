/**
 * Mock Notion client factory for tests.
 * Pattern: follows createMockGql (tests/scenarios/fixtures/mock-gql.ts) —
 * sequential response matching, same call tracking pattern.
 */
import type { NotionClient } from '../../../src/utils/notion-client.js';
import type {
  NotionSearchResponse,
  NotionPageResponse,
  NotionBlockChildrenResponse,
  NotionQueryResponse,
} from '../../../src/types/notion.js';

/**
 * Create a mock NotionClient that returns responses in sequence.
 * Each client method call consumes the next response from the array.
 * If a response is an Error instance, it is thrown instead.
 */
export function createMockNotion(responses: readonly unknown[]): NotionClient {
  let callIndex = 0;
  function next(): unknown {
    const resp = responses[callIndex++];
    if (resp instanceof Error) throw resp;
    return resp;
  }

  return {
    search: async () => next() as NotionSearchResponse,
    getPage: async () => next() as NotionPageResponse,
    getBlockChildren: async () => next() as NotionBlockChildrenResponse,
    queryDatabase: async () => next() as NotionQueryResponse,
    createPage: async () => next() as NotionPageResponse,
    appendBlocks: async () => next() as NotionBlockChildrenResponse,
  };
}

// --- Mock Data Constants (API response shape verified against Notion API docs) ---

/** Helper to create a simple rich text segment. */
function rt(
  content: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    strikethrough?: boolean;
    href?: string;
  }
) {
  return {
    type: 'text' as const,
    plain_text: content,
    text: { content, link: opts?.href ? { url: opts.href } : null },
    annotations: {
      bold: opts?.bold ?? false,
      italic: opts?.italic ?? false,
      strikethrough: opts?.strikethrough ?? false,
      underline: false,
      code: opts?.code ?? false,
      color: 'default',
    },
    href: opts?.href ?? null,
  };
}

export const MOCK_NOTION_PAGE: NotionPageResponse = {
  object: 'page',
  id: 'page-uuid-1234',
  created_time: '2026-03-28T00:00:00.000Z',
  last_edited_time: '2026-03-28T12:00:00.000Z',
  created_by: { object: 'user', id: 'user-1' },
  last_edited_by: { object: 'user', id: 'user-1' },
  parent: { type: 'database_id', database_id: 'db-uuid' },
  url: 'https://www.notion.so/page-uuid-1234',
  public_url: null,
  properties: {
    Name: {
      type: 'title',
      title: [rt('Test Page')],
    },
  },
  in_trash: false,
  archived: false,
};

export const MOCK_NOTION_BLOCKS: NotionBlockChildrenResponse = {
  object: 'list',
  results: [
    {
      id: 'blk-1',
      type: 'heading_1',
      has_children: false,
      heading_1: { rich_text: [rt('Title')] },
    },
    {
      id: 'blk-2',
      type: 'paragraph',
      has_children: false,
      paragraph: { rich_text: [rt('Hello world')] },
    },
  ],
  has_more: false,
  next_cursor: null,
};

export const MOCK_NOTION_SEARCH: NotionSearchResponse = {
  object: 'list',
  results: [MOCK_NOTION_PAGE],
  has_more: false,
  next_cursor: null,
};

export const MOCK_NOTION_QUERY: NotionQueryResponse = {
  object: 'list',
  results: [MOCK_NOTION_PAGE],
  has_more: false,
  next_cursor: null,
};

export { rt };
