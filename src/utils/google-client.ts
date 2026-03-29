/**
 * Google Workspace API client abstraction.
 * Pattern: follows GhRunner (src/utils/gh-cli.ts) — injectable interface + factory.
 * Uses google-auth-library for OAuth2 token refresh, raw fetch for API calls.
 *
 * APIs: Drive v3, Sheets v4, Calendar v3, Gmail v1
 * Scopes: drive.readonly, spreadsheets.readonly, calendar.readonly, gmail.readonly
 *         spreadsheets (write), calendar (write)
 */
import type {
  GoogleCredentials,
  DriveSearchResponse,
  DriveSearchOpts,
  SheetValuesResponse,
  SheetUpdateResponse,
  SheetAppendResponse,
  EventListResponse,
  EventListParams,
  CalendarEventInput,
  CalendarEventResponse,
  GmailListResponse,
  GmailListOpts,
  GmailMessageResponse,
} from '../types/workspace.js';

/** Options for googleFetchCore — supports GET (default) and write methods. */
interface GoogleFetchOptions {
  readonly method?: string;
  readonly body?: string;
  readonly contentType?: string;
}

/** Injectable Google client interface — mirrors GhRunner pattern. */
export interface GoogleClient {
  readonly searchDrive: (query: string, opts?: DriveSearchOpts) => Promise<DriveSearchResponse>;
  readonly exportFile: (fileId: string, mimeType: string) => Promise<string>;
  readonly getSheetValues: (spreadsheetId: string, range: string) => Promise<SheetValuesResponse>;
  readonly updateSheetValues: (
    spreadsheetId: string,
    range: string,
    values: readonly (readonly string[])[],
    inputOption?: string
  ) => Promise<SheetUpdateResponse>;
  readonly appendSheetValues: (
    spreadsheetId: string,
    range: string,
    values: readonly (readonly string[])[],
    inputOption?: string,
    insertDataOption?: string
  ) => Promise<SheetAppendResponse>;
  readonly listEvents: (calendarId: string, params: EventListParams) => Promise<EventListResponse>;
  readonly createEvent: (
    calendarId: string,
    event: CalendarEventInput
  ) => Promise<CalendarEventResponse>;
  readonly listGmailMessages: (query: string, opts?: GmailListOpts) => Promise<GmailListResponse>;
  readonly getGmailMessage: (messageId: string) => Promise<GmailMessageResponse>;
}

/** Maximum retry attempts for rate-limited requests. */
const MAX_RETRIES = 3;

/** Response format selector for googleFetchCore. */
type ResponseFormat = 'json' | 'text';

/**
 * Core fetch with OAuth2 bearer token and retry on 429.
 * Shared by JSON and text response paths — eliminates duplication.
 * Supports GET (default) and write methods via opts parameter.
 */
async function googleFetchCore(
  url: string,
  accessToken: string,
  format: 'json',
  opts?: GoogleFetchOptions
): Promise<unknown>;
async function googleFetchCore(
  url: string,
  accessToken: string,
  format: 'text',
  opts?: GoogleFetchOptions
): Promise<string>;
async function googleFetchCore(
  url: string,
  accessToken: string,
  format: ResponseFormat,
  opts?: GoogleFetchOptions
): Promise<unknown> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    if (opts?.body) {
      headers['Content-Type'] = opts.contentType ?? 'application/json';
    }
    const res = await fetch(url, {
      method: opts?.method ?? 'GET',
      headers,
      ...(opts?.body ? { body: opts.body } : {}),
    });

    if (res.status === 429) {
      const backoff = Math.pow(2, attempt) * 1000;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw new Error('Google API rate limit exceeded after retries.');
    }

    if (res.status === 403) {
      const errorBody: unknown = await res.json().catch(() => ({}));
      const body =
        errorBody != null && typeof errorBody === 'object'
          ? (errorBody as Record<string, unknown>)
          : {};
      const errObj = body['error'];
      const msg =
        typeof errObj === 'object' && errObj !== null
          ? JSON.stringify(errObj)
          : String(body['message'] ?? res.statusText);
      if (
        msg.includes('insufficient') ||
        msg.includes('scope') ||
        msg.includes('PERMISSION_DENIED')
      ) {
        throw new Error(
          `Google API 403: Insufficient OAuth scope. Write operations require updated scopes. ` +
            `Re-authorize with: spreadsheets, calendar. See docs/workspace-bridge.md for steps.`
        );
      }
      throw new Error(`Google API error 403: ${msg}`);
    }

    if (!res.ok) {
      if (format === 'json') {
        const errorBody: unknown = await res.json().catch(() => ({}));
        const body =
          errorBody != null && typeof errorBody === 'object'
            ? (errorBody as Record<string, unknown>)
            : {};
        const errorMsg =
          typeof body['error'] === 'object' && body['error'] !== null
            ? JSON.stringify(body['error'])
            : res.statusText;
        throw new Error(`Google API error ${res.status}: ${errorMsg}`);
      }
      throw new Error(`Google API error ${res.status}: ${res.statusText}`);
    }

    if (format === 'text') return res.text();

    const data: unknown = await res.json();
    if (data == null || typeof data !== 'object') {
      throw new Error('Google API returned non-object response.');
    }
    return data;
  }

  throw new Error('Google API request failed.');
}

/**
 * Typed JSON fetch with runtime validation — no `as` casts at call sites.
 */
async function googleFetch<T>(
  url: string,
  accessToken: string,
  opts?: GoogleFetchOptions
): Promise<T> {
  return (await googleFetchCore(url, accessToken, 'json', opts)) as T;
}

/**
 * Fetch that returns raw text (for Drive export endpoints).
 */
async function googleFetchText(
  url: string,
  accessToken: string,
  opts?: GoogleFetchOptions
): Promise<string> {
  return googleFetchCore(url, accessToken, 'text', opts);
}

/**
 * Get a fresh access token using the refresh token.
 * Uses the OAuth2 token endpoint directly — avoids full google-auth-library import
 * for lighter dependency if google-auth-library is not installed.
 */
async function refreshAccessToken(creds: GoogleCredentials): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth2 token refresh failed (${res.status}): ${body}`);
  }

  const raw: unknown = await res.json();
  const data = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const token = data['access_token'];
  if (typeof token !== 'string') {
    throw new Error('OAuth2 token refresh returned no access_token.');
  }
  return token;
}

/**
 * Create a real GoogleClient that calls Google Workspace APIs.
 * Refreshes OAuth2 access token on each call for simplicity.
 * In tests, replace with createMockGoogle from test fixtures.
 */
export function createGoogleClient(creds: GoogleCredentials): GoogleClient {
  let cachedToken: string | undefined;
  let tokenExpiry = 0;

  async function getToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) return cachedToken;
    cachedToken = await refreshAccessToken(creds);
    tokenExpiry = now + 3500 * 1000; // ~58 min (tokens last 60 min)
    return cachedToken;
  }

  return {
    searchDrive: async (query, opts) => {
      const token = await getToken();
      const safeQuery = query.replace(/'/g, "\\'");
      const params = new URLSearchParams({
        q: `${safeQuery} and trashed = false`,
        pageSize: String(opts?.limit ?? 20),
        fields: 'files(id,name,mimeType,webViewLink,modifiedTime),nextPageToken',
      });
      if (opts?.mimeType) {
        params.set('q', `${safeQuery} and mimeType = '${opts.mimeType}' and trashed = false`);
      }
      return googleFetch<DriveSearchResponse>(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        token
      );
    },

    exportFile: async (fileId, mimeType) => {
      const token = await getToken();
      const params = new URLSearchParams({ mimeType });
      return googleFetchText(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?${params.toString()}`,
        token
      );
    },

    getSheetValues: async (spreadsheetId, range) => {
      const token = await getToken();
      const encodedRange = encodeURIComponent(range);
      return googleFetch<SheetValuesResponse>(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
        token
      );
    },

    listEvents: async (calendarId, params) => {
      const token = await getToken();
      const q = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: String(params.limit ?? 20),
      });
      if (params.timeMin) q.set('timeMin', params.timeMin);
      if (params.timeMax) q.set('timeMax', params.timeMax);
      if (params.query) q.set('q', params.query);
      const encodedCalId = encodeURIComponent(calendarId);
      return googleFetch<EventListResponse>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}/events?${q.toString()}`,
        token
      );
    },

    listGmailMessages: async (query, opts) => {
      const token = await getToken();
      const params = new URLSearchParams({
        q: query,
        maxResults: String(opts?.limit ?? 10),
      });
      return googleFetch<GmailListResponse>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        token
      );
    },

    getGmailMessage: async (messageId) => {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set('format', 'metadata');
      params.append('metadataHeaders', 'Subject');
      params.append('metadataHeaders', 'From');
      params.append('metadataHeaders', 'Date');
      return googleFetch<GmailMessageResponse>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?${params.toString()}`,
        token
      );
    },

    updateSheetValues: async (spreadsheetId, range, values, inputOption) => {
      const token = await getToken();
      const encodedRange = encodeURIComponent(range);
      const option = inputOption ?? 'USER_ENTERED';
      const params = new URLSearchParams({ valueInputOption: option });
      return googleFetch<SheetUpdateResponse>(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?${params.toString()}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ range, values }),
        }
      );
    },

    appendSheetValues: async (spreadsheetId, range, values, inputOption, insertDataOption) => {
      const token = await getToken();
      const encodedRange = encodeURIComponent(range);
      const option = inputOption ?? 'USER_ENTERED';
      const insertOpt = insertDataOption ?? 'INSERT_ROWS';
      const params = new URLSearchParams({
        valueInputOption: option,
        insertDataOption: insertOpt,
      });
      return googleFetch<SheetAppendResponse>(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?${params.toString()}`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ range, values }),
        }
      );
    },

    createEvent: async (calendarId, event) => {
      const token = await getToken();
      const encodedCalId = encodeURIComponent(calendarId);
      return googleFetch<CalendarEventResponse>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}/events`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(event),
        }
      );
    },
  };
}
