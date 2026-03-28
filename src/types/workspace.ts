/**
 * TypeScript types for Google Workspace API responses.
 * All fields are readonly to enforce immutability (codebase-integrity §1.6).
 * Covers: Drive, Sheets, Calendar, Gmail.
 *
 * APIs: Drive v3, Sheets v4, Calendar v3, Gmail v1
 * Reference: skills/workspace-bridge/api-specs/google/
 */

// --- Google OAuth Credentials ---

export interface GoogleCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
}

// --- Drive API v3 ---

export interface DriveFile {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly webViewLink: string;
  readonly modifiedTime: string;
}

export interface DriveSearchResponse {
  readonly files: readonly DriveFile[];
  readonly nextPageToken?: string;
}

export interface DriveSearchOpts {
  readonly mimeType?: string;
  readonly limit?: number;
}

// --- Sheets API v4 ---

export interface SheetValuesResponse {
  readonly range: string;
  readonly majorDimension: string;
  readonly values: readonly (readonly string[])[];
}

// --- Calendar API v3 ---

export interface CalendarEventTime {
  readonly dateTime?: string;
  readonly date?: string;
  readonly timeZone?: string;
}

export interface CalendarEvent {
  readonly id: string;
  readonly summary: string;
  readonly start: CalendarEventTime;
  readonly end: CalendarEventTime;
  readonly description?: string;
  readonly location?: string;
  readonly htmlLink: string;
  readonly status?: string;
}

export interface EventListResponse {
  readonly items: readonly CalendarEvent[];
  readonly nextPageToken?: string;
  readonly summary?: string;
  readonly timeZone?: string;
}

export interface EventListParams {
  readonly timeMin?: string;
  readonly timeMax?: string;
  readonly limit?: number;
  readonly query?: string;
}

// --- Gmail API v1 ---

export interface GmailMessageHeader {
  readonly name: string;
  readonly value: string;
}

export interface GmailMessagePayload {
  readonly headers: readonly GmailMessageHeader[];
  readonly mimeType?: string;
  readonly body?: {
    readonly size: number;
    readonly data?: string;
  };
  readonly parts?: readonly GmailMessagePayload[];
}

export interface GmailMessageResponse {
  readonly id: string;
  readonly threadId: string;
  readonly snippet: string;
  readonly payload: GmailMessagePayload;
  readonly internalDate?: string;
}

export interface GmailListItem {
  readonly id: string;
  readonly threadId: string;
}

export interface GmailListResponse {
  readonly messages: readonly GmailListItem[];
  readonly nextPageToken?: string;
  readonly resultSizeEstimate?: number;
}

export interface GmailListOpts {
  readonly limit?: number;
}
