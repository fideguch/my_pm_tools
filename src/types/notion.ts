/**
 * TypeScript types for Notion REST API responses.
 * All fields are readonly to enforce immutability (codebase-integrity §1.6).
 * Covers: Pages, Blocks, Databases, Rich Text, Search, and Property Values.
 *
 * API Version: 2022-06-28 (stable)
 * Reference: skills/workspace-bridge/api-specs/notion.md
 */

// --- Rich Text ---

export interface NotionAnnotations {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strikethrough: boolean;
  readonly underline: boolean;
  readonly code: boolean;
  readonly color: string;
}

export interface NotionRichText {
  readonly type: 'text' | 'mention' | 'equation';
  readonly plain_text: string;
  readonly annotations: NotionAnnotations;
  readonly href: string | null;
  readonly text?: {
    readonly content: string;
    readonly link: { readonly url: string } | null;
  };
}

// --- Blocks ---

export interface NotionBlock {
  readonly id: string;
  readonly type: string;
  readonly has_children: boolean;
  /** Populated by recursive fetch — not present in initial API response. */
  readonly children?: readonly NotionBlock[];
  /** Dynamic payload key matching block.type (e.g. block.paragraph, block.heading_1). */
  readonly [key: string]: unknown;
}

// --- Pages ---

export interface NotionPartialUser {
  readonly object: 'user';
  readonly id: string;
}

export interface NotionParent {
  readonly type: string;
  readonly database_id?: string;
  readonly page_id?: string;
  readonly workspace?: boolean;
}

export interface NotionPage {
  readonly object: 'page';
  readonly id: string;
  readonly created_time: string;
  readonly last_edited_time: string;
  readonly created_by: NotionPartialUser;
  readonly last_edited_by: NotionPartialUser;
  readonly parent: NotionParent;
  readonly url: string;
  readonly public_url: string | null;
  readonly properties: Record<string, unknown>;
  readonly in_trash: boolean;
  readonly archived: boolean;
}

// --- API Responses ---

export interface NotionSearchResponse {
  readonly object: 'list';
  readonly results: readonly NotionPage[];
  readonly has_more: boolean;
  readonly next_cursor: string | null;
}

export type NotionPageResponse = NotionPage;

export interface NotionBlockChildrenResponse {
  readonly object: 'list';
  readonly results: readonly NotionBlock[];
  readonly has_more: boolean;
  readonly next_cursor: string | null;
}

export interface NotionQueryResponse {
  readonly object: 'list';
  readonly results: readonly NotionPage[];
  readonly has_more: boolean;
  readonly next_cursor: string | null;
}

// --- API Request Parameters ---

export interface NotionSearchParams {
  readonly query?: string;
  readonly filter?: {
    readonly property: 'object';
    readonly value: 'page' | 'database';
  };
  readonly sort?: {
    readonly timestamp: 'last_edited_time';
    readonly direction: 'ascending' | 'descending';
  };
  readonly page_size?: number;
  readonly start_cursor?: string;
}

export interface NotionQueryParams {
  readonly filter?: unknown;
  readonly sorts?: readonly unknown[];
  readonly page_size?: number;
  readonly start_cursor?: string;
}

export interface NotionCreateParams {
  readonly parent: { readonly database_id: string } | { readonly page_id: string };
  readonly properties: Record<string, unknown>;
  readonly children?: readonly NotionBlockInput[];
}

// --- Block Input (for create/append) ---

export interface NotionBlockInput {
  readonly type: string;
  readonly [key: string]: unknown;
}

// --- Update Page Parameters ---

export interface NotionUpdatePageParams {
  readonly properties?: Record<string, unknown>;
  readonly archived?: boolean;
}
