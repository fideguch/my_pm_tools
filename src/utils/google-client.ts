/**
 * Google Workspace API client abstraction.
 * Pattern: follows GhRunner (src/utils/gh-cli.ts) — injectable interface + factory.
 * Uses google-auth-library for OAuth2 token refresh, raw fetch for API calls.
 *
 * APIs: Drive v3, Sheets v4, Calendar v3, Gmail v1
 * Scopes: drive.readonly, spreadsheets.readonly, calendar.readonly, gmail.readonly
 *         spreadsheets (write), calendar (write)
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  GoogleCredentials,
  DriveSearchResponse,
  DriveSearchOpts,
  SheetValuesResponse,
  SheetUpdateResponse,
  SheetAppendResponse,
  SpreadsheetMetadata,
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
  readonly getSpreadsheetMetadata: (spreadsheetId: string) => Promise<SpreadsheetMetadata>;
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
      signal: AbortSignal.timeout(30000),
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

/** Default path to gcloud Application Default Credentials file. */
const ADC_PATH = join(homedir(), '.config', 'gcloud', 'application_default_credentials.json');

/**
 * ADC file shape — only the fields we need for OAuth2 refresh.
 * gcloud ADC files contain additional fields (type, project_id, etc.) which we ignore.
 */
interface AdcFile {
  readonly client_id?: string;
  readonly client_secret?: string;
  readonly refresh_token?: string;
}

/**
 * Load Google OAuth2 credentials from gcloud Application Default Credentials.
 * Reads ~/.config/gcloud/application_default_credentials.json and extracts
 * client_id, client_secret, and refresh_token.
 *
 * @returns GoogleCredentials if the file exists and contains required fields, null otherwise.
 */
export function loadCredentialsFromADC(path?: string): GoogleCredentials | null {
  const adcPath = path ?? ADC_PATH;
  try {
    const raw = readFileSync(adcPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return null;

    const adc = parsed as AdcFile;
    const clientId = adc.client_id;
    const clientSecret = adc.client_secret;
    const refreshToken = adc.refresh_token;

    if (
      typeof clientId !== 'string' ||
      clientId === '' ||
      typeof clientSecret !== 'string' ||
      clientSecret === '' ||
      typeof refreshToken !== 'string' ||
      refreshToken === ''
    ) {
      return null;
    }

    return { clientId, clientSecret, refreshToken };
  } catch {
    // File doesn't exist or isn't valid JSON — graceful fallback
    return null;
  }
}

/**
 * Convenience factory: create a GoogleClient using ADC auto-detection.
 * Falls back to env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
 * if ADC file is not available.
 *
 * @throws Error if neither ADC nor env vars provide valid credentials.
 */
export function createGoogleClientFromADC(): GoogleClient {
  const adcCreds = loadCredentialsFromADC();
  if (adcCreds) {
    return createGoogleClient(adcCreds);
  }

  // Fallback: env vars
  const clientId = process.env['GOOGLE_CLIENT_ID'] ?? '';
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'] ?? '';
  const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'] ?? '';

  if (clientId && clientSecret && refreshToken) {
    return createGoogleClient({ clientId, clientSecret, refreshToken });
  }

  throw new Error(
    'Google credentials not found. Provide either:\n' +
      '  1. gcloud ADC file at ~/.config/gcloud/application_default_credentials.json\n' +
      '  2. Environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN'
  );
}

/** Detect if query already uses Drive API operators (pass-through mode). */
function isDriveOperatorQuery(q: string): boolean {
  return /\b(contains|!=|<=|>=|in\b|has\b|not\b)/i.test(q) || /\s=\s/.test(q);
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
      const baseQuery = isDriveOperatorQuery(query) ? safeQuery : `name contains '${safeQuery}'`;
      const safeMimeType = opts?.mimeType ? opts.mimeType.replace(/'/g, "\\'") : undefined;
      const params = new URLSearchParams({
        q: safeMimeType
          ? `${baseQuery} and mimeType = '${safeMimeType}' and trashed = false`
          : `${baseQuery} and trashed = false`,
        pageSize: String(opts?.limit ?? 20),
        fields: 'files(id,name,mimeType,webViewLink,modifiedTime),nextPageToken',
      });
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

    getSpreadsheetMetadata: async (spreadsheetId) => {
      const token = await getToken();
      const params = new URLSearchParams({
        fields: 'spreadsheetId,properties.title,sheets.properties',
      });
      return googleFetch<SpreadsheetMetadata>(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?${params.toString()}`,
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
