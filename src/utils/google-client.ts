/**
 * Google Workspace API client abstraction.
 * Pattern: follows GhRunner (src/utils/gh-cli.ts) — injectable interface + factory.
 * Uses google-auth-library for OAuth2 token refresh, raw fetch for API calls.
 *
 * APIs: Drive v3, Sheets v4, Calendar v3, Gmail v1
 * Scopes: drive.readonly, spreadsheets.readonly, calendar.readonly, gmail.readonly
 */
import type {
  GoogleCredentials,
  DriveSearchResponse,
  DriveSearchOpts,
  SheetValuesResponse,
  EventListResponse,
  EventListParams,
  GmailListResponse,
  GmailListOpts,
  GmailMessageResponse,
} from '../types/workspace.js';

/** Injectable Google client interface — mirrors GhRunner pattern. */
export interface GoogleClient {
  readonly searchDrive: (query: string, opts?: DriveSearchOpts) => Promise<DriveSearchResponse>;
  readonly exportFile: (fileId: string, mimeType: string) => Promise<string>;
  readonly getSheetValues: (spreadsheetId: string, range: string) => Promise<SheetValuesResponse>;
  readonly listEvents: (calendarId: string, params: EventListParams) => Promise<EventListResponse>;
  readonly listGmailMessages: (query: string, opts?: GmailListOpts) => Promise<GmailListResponse>;
  readonly getGmailMessage: (messageId: string) => Promise<GmailMessageResponse>;
}

/** Maximum retry attempts for rate-limited requests. */
const MAX_RETRIES = 3;

/**
 * Fetch with OAuth2 bearer token and retry on 429.
 * Returns parsed JSON or throws descriptive error.
 */
async function googleFetch(url: string, accessToken: string): Promise<unknown> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const backoff = Math.pow(2, attempt) * 1000;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw new Error('Google API rate limit exceeded after retries.');
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const errorMsg =
        typeof body['error'] === 'object' && body['error'] !== null
          ? JSON.stringify(body['error'])
          : res.statusText;
      throw new Error(`Google API error ${res.status}: ${errorMsg}`);
    }

    return res.json();
  }

  throw new Error('Google API request failed.');
}

/**
 * Fetch that returns raw text (for Drive export endpoints).
 */
async function googleFetchText(url: string, accessToken: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const backoff = Math.pow(2, attempt) * 1000;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw new Error('Google API rate limit exceeded after retries.');
    }

    if (!res.ok) {
      throw new Error(`Google API error ${res.status}: ${res.statusText}`);
    }

    return res.text();
  }

  throw new Error('Google API request failed.');
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

  const data = (await res.json()) as Record<string, unknown>;
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
      const params = new URLSearchParams({
        q: `${query} and trashed = false`,
        pageSize: String(opts?.limit ?? 20),
        fields: 'files(id,name,mimeType,webViewLink,modifiedTime),nextPageToken',
      });
      if (opts?.mimeType) {
        params.set('q', `${query} and mimeType = '${opts.mimeType}' and trashed = false`);
      }
      return (await googleFetch(
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
        token
      )) as DriveSearchResponse;
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
      return (await googleFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
        token
      )) as SheetValuesResponse;
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
      return (await googleFetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}/events?${q.toString()}`,
        token
      )) as EventListResponse;
    },

    listGmailMessages: async (query, opts) => {
      const token = await getToken();
      const params = new URLSearchParams({
        q: query,
        maxResults: String(opts?.limit ?? 10),
      });
      return (await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        token
      )) as GmailListResponse;
    },

    getGmailMessage: async (messageId) => {
      const token = await getToken();
      const params = new URLSearchParams();
      params.set('format', 'metadata');
      params.append('metadataHeaders', 'Subject');
      params.append('metadataHeaders', 'From');
      params.append('metadataHeaders', 'Date');
      return (await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?${params.toString()}`,
        token
      )) as GmailMessageResponse;
    },
  };
}
