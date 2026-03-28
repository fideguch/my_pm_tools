import { test, expect } from '@playwright/test';
import { createCallMatcherGql } from './fixtures/mock-gql.js';
import {
  MOCK_PROJECT_ID,
  MOCK_FIELDS_WITH_STATUS,
  makeUpdateResponse,
} from './fixtures/pm-workflows-helpers.js';
import { listItems } from '../../src/tools/list-items.js';
import { addItem } from '../../src/tools/add-item.js';
import { moveStatus } from '../../src/tools/move-status.js';

// ---------------------------------------------------------------------------
// Scenario 2: Bulk Status Transition
// ---------------------------------------------------------------------------

test.describe('Scenario: Bulk Status Transition', () => {
  // Given 3 items in "Backlog",
  // When moving each to "開発中" then to "レビュー中",
  // Then all items reflect the final status "レビュー中".

  const ITEM_IDS = ['PVTI_A1', 'PVTI_A2', 'PVTI_A3'];

  test('all 3 items transition Backlog → 開発中 → レビュー中', async () => {
    for (const itemId of ITEM_IDS) {
      // Given: project and fields are fetched for each call
      const { gql: gqlDev } = createCallMatcherGql([
        { match: 'GetProjectId', response: MOCK_PROJECT_ID },
        { match: 'GetProjectFields', response: MOCK_FIELDS_WITH_STATUS },
        { match: 'UpdateItemField', response: makeUpdateResponse(itemId) },
      ]);

      // When: move to 開発中
      const devResult = await moveStatus(gqlDev, {
        owner: 'fideguch',
        projectNumber: 1,
        itemId,
        status: '開発中',
      });

      // Then: success with 開発中
      expect(devResult.isError).toBeUndefined();
      const devData = JSON.parse((devResult.content[0] as { text: string }).text);
      expect(devData.summary).toContain('開発中');

      // Given: second transition context
      const { gql: gqlReview } = createCallMatcherGql([
        { match: 'GetProjectId', response: MOCK_PROJECT_ID },
        { match: 'GetProjectFields', response: MOCK_FIELDS_WITH_STATUS },
        { match: 'UpdateItemField', response: makeUpdateResponse(itemId) },
      ]);

      // When: move to レビュー中
      const reviewResult = await moveStatus(gqlReview, {
        owner: 'fideguch',
        projectNumber: 1,
        itemId,
        status: 'レビュー中',
      });

      // Then: final status is レビュー中
      expect(reviewResult.isError).toBeUndefined();
      const reviewData = JSON.parse((reviewResult.content[0] as { text: string }).text);
      expect(reviewData.summary).toContain('レビュー中');
      expect(reviewData.data.status).toBe('レビュー中');
    }
  });
});

// ---------------------------------------------------------------------------
// Scenario 3: Add Item and Verify in List
// ---------------------------------------------------------------------------

test.describe('Scenario: Add Item and Verify in List', () => {
  // Given a project with 1 existing item,
  // When adding a new issue and then listing items,
  // Then the new item appears in the list with correct fields.

  const EXISTING_ITEMS = {
    node: {
      items: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'PVTI_existing',
            content: { number: 10, title: 'Existing Issue', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: { nodes: [{ field: { name: 'Status' }, name: 'Backlog' }] },
          },
        ],
      },
    },
  };

  const ITEMS_AFTER_ADD = {
    node: {
      items: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'PVTI_existing',
            content: { number: 10, title: 'Existing Issue', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: { nodes: [{ field: { name: 'Status' }, name: 'Backlog' }] },
          },
          {
            id: 'PVTI_new',
            content: { number: 42, title: 'New Issue', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: { nodes: [{ field: { name: 'Status' }, name: 'Backlog' }] },
          },
        ],
      },
    },
  };

  test('added issue appears in subsequent list-items call', async () => {
    // Given: project exists, GetNodeId resolves the new issue, AddProjectItem succeeds
    const { gql: addGql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      {
        match: 'GetNodeId',
        response: { repository: { issue: { id: 'I_node42' } } },
      },
      {
        match: 'AddProjectItem',
        response: { addProjectV2ItemById: { item: { id: 'PVTI_new' } } },
      },
    ]);

    // When: add the new issue
    const addResult = await addItem(addGql, {
      owner: 'fideguch',
      projectNumber: 1,
      repo: 'fideguch/my-repo',
      itemNumber: 42,
      itemType: 'issue',
    });

    // Then: addItem succeeds and returns the new item id
    expect(addResult.isError).toBeUndefined();
    const addData = JSON.parse((addResult.content[0] as { text: string }).text);
    expect(addData.itemId).toBe('PVTI_new');

    // Given: list now returns 2 items (simulating post-add state)
    const { gql: listGql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: ITEMS_AFTER_ADD },
    ]);

    // When: list items
    const listResult = await listItems(listGql, { owner: 'fideguch', projectNumber: 1 });

    // Then: 2 items, new issue is present
    expect(listResult.isError).toBeUndefined();
    const listData = JSON.parse((listResult.content[0] as { text: string }).text);
    expect(listData.items).toHaveLength(2);
    const newItem = listData.items.find((i: { number: number }) => i.number === 42);
    expect(newItem).toBeDefined();
    expect(newItem.title).toBe('New Issue');
  });

  test('list before add returns only existing item', async () => {
    // Given: only the existing item is present
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: EXISTING_ITEMS },
    ]);

    // When: list items before the add
    const result = await listItems(gql, { owner: 'fideguch', projectNumber: 1 });

    // Then: only 1 item
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].number).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Scenario 5: List Items with Combined Filters
// ---------------------------------------------------------------------------

test.describe('Scenario: List Items with Combined Filters', () => {
  // Given items with various statuses and priorities,
  // When filtering by status AND priority,
  // Then only the items matching both criteria are returned.

  const MIXED_ITEMS = {
    node: {
      items: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [
          {
            id: 'PVTI_1',
            content: { number: 1, title: 'High-pri Backlog', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: 'Backlog' },
                { field: { name: 'Priority' }, name: 'P1' },
              ],
            },
          },
          {
            id: 'PVTI_2',
            content: { number: 2, title: 'Low-pri Backlog', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: 'Backlog' },
                { field: { name: 'Priority' }, name: 'P3' },
              ],
            },
          },
          {
            id: 'PVTI_3',
            content: { number: 3, title: 'High-pri In Dev', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: '開発中' },
                { field: { name: 'Priority' }, name: 'P1' },
              ],
            },
          },
          {
            id: 'PVTI_4',
            content: { number: 4, title: 'Low-pri In Dev', state: 'OPEN', labels: { nodes: [] } },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: '開発中' },
                { field: { name: 'Priority' }, name: 'P2' },
              ],
            },
          },
          {
            id: 'PVTI_5',
            content: { number: 5, title: 'High-pri Done', state: 'CLOSED', labels: { nodes: [] } },
            fieldValues: {
              nodes: [
                { field: { name: 'Status' }, name: 'Done' },
                { field: { name: 'Priority' }, name: 'P1' },
              ],
            },
          },
        ],
      },
    },
  };

  test('status=Backlog AND priority=P1 returns exactly 1 item', async () => {
    // Given: project has 5 items with mixed status/priority
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MIXED_ITEMS },
    ]);

    // When: filtering by Backlog and P1
    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: 'Backlog',
      priorityFilter: 'P1',
    });

    // Then: only item #1 matches both criteria
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].number).toBe(1);
    expect(data.items[0].title).toBe('High-pri Backlog');
  });

  test('status=開発中 AND priority=P1 returns exactly 1 item', async () => {
    // Given: same mixed item set
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MIXED_ITEMS },
    ]);

    // When: filtering by 開発中 and P1
    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: '開発中',
      priorityFilter: 'P1',
    });

    // Then: only item #3 matches
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].number).toBe(3);
  });

  test('status=Done AND priority=P3 returns 0 items', async () => {
    // Given: no item has both Done status and P3 priority
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MIXED_ITEMS },
    ]);

    // When: filtering by Done and P3
    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      statusFilter: 'Done',
      priorityFilter: 'P3',
    });

    // Then: empty result, no error
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(0);
    expect(data.totalCount).toBe(0);
  });

  test('priority-only filter P1 returns all 3 high-priority items', async () => {
    // Given: 3 items have P1 priority across different statuses
    const { gql } = createCallMatcherGql([
      { match: 'GetProjectId', response: MOCK_PROJECT_ID },
      { match: 'GetProjectItems', response: MIXED_ITEMS },
    ]);

    // When: filtering by priority=P1 only (no status filter)
    const result = await listItems(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      priorityFilter: 'P1',
    });

    // Then: items #1, #3, #5 all match
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.items).toHaveLength(3);
    const numbers = data.items.map((i: { number: number }) => i.number).sort();
    expect(numbers).toEqual([1, 3, 5]);
  });
});
