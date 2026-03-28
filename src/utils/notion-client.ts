/**
 * Notion API client abstraction.
 * Pattern: follows GhRunner (src/utils/gh-cli.ts) — injectable interface + factory.
 * In tests, replace with createMockNotion from fixtures.
 *
 * API Version: 2022-06-28 (stable)
 * Rate Limit: 3 req/s average, 429 → Retry-After header
 */
import type {
  NotionSearchParams,
  NotionSearchResponse,
  NotionPageResponse,
  NotionBlockChildrenResponse,
  NotionQueryParams,
  NotionQueryResponse,
  NotionCreateParams,
  NotionBlockInput,
} from '../types/notion.js';

/** Injectable Notion client interface — mirrors GhRunner pattern. */
export interface NotionClient {
  readonly search: (params: NotionSearchParams) => Promise<NotionSearchResponse>;
  readonly getPage: (pageId: string) => Promise<NotionPageResponse>;
  readonly getBlockChildren: (
    blockId: string,
    cursor?: string
  ) => Promise<NotionBlockChildrenResponse>;
  readonly queryDatabase: (dbId: string, params: NotionQueryParams) => Promise<NotionQueryResponse>;
  readonly createPage: (params: NotionCreateParams) => Promise<NotionPageResponse>;
  readonly appendBlocks: (
    blockId: string,
    children: readonly NotionBlockInput[]
  ) => Promise<NotionBlockChildrenResponse>;
}

/** Maximum retry attempts for rate-limited requests. */
const MAX_RETRIES = 3;

/** Notion API base URL. */
const BASE_URL = 'https://api.notion.com/v1';

/** Required headers for all Notion API requests. */
function notionHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch with automatic retry on 429 (rate limit).
 * Reads Retry-After header for backoff duration.
 */
async function notionFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<unknown> {
  const headers = notionHeaders(token);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '1', 10);
      const waitMs = Math.max(retryAfter, 1) * 1000;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw new Error('Notion API rate limit exceeded after retries.');
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const code = typeof body['code'] === 'string' ? body['code'] : '';
      const msg = typeof body['message'] === 'string' ? body['message'] : res.statusText;
      throw new Error(`Notion API error ${res.status}: ${code} - ${msg}`);
    }

    return res.json();
  }

  throw lastError ?? new Error('Notion API request failed.');
}

/**
 * Create a real NotionClient that calls the Notion REST API.
 * In tests, replace with createMockNotion from test fixtures.
 */
export function createNotionClient(token: string): NotionClient {
  return {
    search: async (params) => {
      return (await notionFetch(`${BASE_URL}/search`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      })) as NotionSearchResponse;
    },

    getPage: async (pageId) => {
      return (await notionFetch(`${BASE_URL}/pages/${pageId}`, token, {
        method: 'GET',
      })) as NotionPageResponse;
    },

    getBlockChildren: async (blockId, cursor) => {
      const params = new URLSearchParams({ page_size: '100' });
      if (cursor) params.set('start_cursor', cursor);
      return (await notionFetch(
        `${BASE_URL}/blocks/${blockId}/children?${params.toString()}`,
        token,
        { method: 'GET' }
      )) as NotionBlockChildrenResponse;
    },

    queryDatabase: async (dbId, params) => {
      return (await notionFetch(`${BASE_URL}/databases/${dbId}/query`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      })) as NotionQueryResponse;
    },

    createPage: async (params) => {
      return (await notionFetch(`${BASE_URL}/pages`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      })) as NotionPageResponse;
    },

    appendBlocks: async (blockId, children) => {
      return (await notionFetch(`${BASE_URL}/blocks/${blockId}/children`, token, {
        method: 'PATCH',
        body: JSON.stringify({ children }),
      })) as NotionBlockChildrenResponse;
    },
  };
}
