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
  NotionUpdatePageParams,
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
  readonly updatePage: (
    pageId: string,
    params: NotionUpdatePageParams
  ) => Promise<NotionPageResponse>;
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

/** Options for notionFetch — avoids RequestInit `as` casts. */
interface NotionFetchOptions {
  readonly method?: string;
  readonly body?: string;
}

/**
 * Fetch with automatic retry on 429 (rate limit).
 * Reads Retry-After header for backoff duration.
 * Returns parsed JSON validated as a non-null object.
 */
async function notionFetch<T>(
  url: string,
  token: string,
  options: NotionFetchOptions = {}
): Promise<T> {
  const headers = notionHeaders(token);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: options.method,
      body: options.body,
      headers,
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
      const errorBody: unknown = await res.json().catch(() => ({}));
      const body =
        errorBody != null && typeof errorBody === 'object'
          ? (errorBody as Record<string, unknown>)
          : {};
      const code = typeof body['code'] === 'string' ? body['code'] : '';
      const msg = typeof body['message'] === 'string' ? body['message'] : res.statusText;
      throw new Error(`Notion API error ${res.status}: ${code} - ${msg}`);
    }

    const data: unknown = await res.json();
    if (data == null || typeof data !== 'object') {
      throw new Error('Notion API returned non-object response.');
    }
    return data as T;
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
      return notionFetch<NotionSearchResponse>(`${BASE_URL}/search`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    getPage: async (pageId) => {
      return notionFetch<NotionPageResponse>(`${BASE_URL}/pages/${pageId}`, token, {
        method: 'GET',
      });
    },

    getBlockChildren: async (blockId, cursor) => {
      const params = new URLSearchParams({ page_size: '100' });
      if (cursor) params.set('start_cursor', cursor);
      return notionFetch<NotionBlockChildrenResponse>(
        `${BASE_URL}/blocks/${blockId}/children?${params.toString()}`,
        token,
        { method: 'GET' }
      );
    },

    queryDatabase: async (dbId, params) => {
      return notionFetch<NotionQueryResponse>(`${BASE_URL}/databases/${dbId}/query`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    createPage: async (params) => {
      return notionFetch<NotionPageResponse>(`${BASE_URL}/pages`, token, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },

    appendBlocks: async (blockId, children) => {
      return notionFetch<NotionBlockChildrenResponse>(
        `${BASE_URL}/blocks/${blockId}/children`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ children }),
        }
      );
    },

    updatePage: async (pageId, params) => {
      return notionFetch<NotionPageResponse>(`${BASE_URL}/pages/${pageId}`, token, {
        method: 'PATCH',
        body: JSON.stringify(params),
      });
    },
  };
}
