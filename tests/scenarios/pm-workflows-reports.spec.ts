import { test, expect } from '@playwright/test';
import { sprintReport } from '../../src/tools/sprint-report.js';

// ---------------------------------------------------------------------------
// Scenario 1: Sprint Report with Pagination
// ---------------------------------------------------------------------------

test.describe('Scenario: Sprint Report with Pagination', () => {
  // Given a project with 150+ items spread across 2 pages,
  // When generating a sprint report,
  // Then all items are fetched via pagination and the report is complete.

  const SPRINT_ID = 'iter_s1';
  const TODAY = new Date().toISOString().slice(0, 10);

  function makeSprintItem(id: string, status: string) {
    return {
      id,
      content: {
        number: parseInt(id.replace('PVTI_', ''), 10),
        title: `Item ${id}`,
        state: 'OPEN',
        labels: { nodes: [] },
      },
      fieldValues: {
        nodes: [
          { field: { name: 'Status' }, name: status },
          {
            field: { name: 'Sprint' },
            title: 'Sprint 1',
            startDate: TODAY,
            duration: 14,
            iterationId: SPRINT_ID,
          },
        ],
      },
    };
  }

  // Page 1: 100 items
  const PAGE_1_ITEMS = Array.from({ length: 100 }, (_, i) =>
    makeSprintItem(`PVTI_${i + 1}`, i % 2 === 0 ? 'Backlog' : '開発中')
  );
  // Page 2: 60 items (total 160)
  const PAGE_2_ITEMS = Array.from({ length: 60 }, (_, i) =>
    makeSprintItem(`PVTI_${i + 101}`, i < 30 ? '開発中' : 'Done')
  );

  const MOCK_FULL_PAGE1 = {
    user: {
      projectV2: {
        id: 'PVT_test',
        title: 'My Project',
        fields: {
          nodes: [
            {
              id: 'PVTIF_iter',
              name: 'Sprint',
              configuration: {
                iterations: [{ id: SPRINT_ID, title: 'Sprint 1', startDate: TODAY, duration: 14 }],
                completedIterations: [],
              },
            },
          ],
        },
        items: {
          pageInfo: { hasNextPage: true, endCursor: 'cursor_after_100' },
          nodes: PAGE_1_ITEMS,
        },
      },
    },
  };

  const MOCK_FULL_PAGE2 = {
    user: {
      projectV2: {
        id: 'PVT_test',
        title: 'My Project',
        fields: { nodes: [] },
        items: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: PAGE_2_ITEMS,
        },
      },
    },
  };

  test('fetches all pages and reports correct total item count', async () => {
    // Given: mock returns page 1 (100 items, hasNextPage=true) then page 2 (60 items)
    let callCount = 0;
    const gql = (async () => {
      callCount++;
      return callCount === 1 ? MOCK_FULL_PAGE1 : MOCK_FULL_PAGE2;
    }) as unknown as Parameters<typeof sprintReport>[0];

    // When: sprint report is requested for 'current'
    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    // Then: no error, all 160 items fetched across 2 pages
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.totalItemsFetched).toBe(160);
    expect(data.pagesFetched).toBe(2);
    expect(data.summary.total).toBe(160);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4: Sprint Report with No Iteration Field
// ---------------------------------------------------------------------------

test.describe('Scenario: Sprint Report with No Iteration Field', () => {
  // Given a project that has no iteration/sprint field configured,
  // When requesting a sprint report,
  // Then a helpful error is returned listing available fields.

  const MOCK_FULL_NO_ITER = {
    user: {
      projectV2: {
        id: 'PVT_test',
        title: 'No-Iter Project',
        fields: {
          nodes: [
            {
              id: 'PVTSSF_status',
              name: 'Status',
              options: [
                { id: 'opt_backlog', name: 'Backlog' },
                { id: 'opt_done', name: 'Done' },
              ],
            },
            { id: 'PVTF_priority', name: 'Priority', dataType: 'SINGLE_SELECT' },
          ],
        },
        items: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [],
        },
      },
    },
  };

  test('returns isError with message listing available fields', async () => {
    // Given: project has Status and Priority fields but NO iteration field
    const gql = (async () => MOCK_FULL_NO_ITER) as unknown as Parameters<typeof sprintReport>[0];

    // When: requesting sprint report for 'current'
    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'current',
    });

    // Then: error with helpful message; does not crash
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Sprint 'current' not found");
    // "none" is listed because no iteration field exists
    expect(text).toContain('none');
  });

  test('returns isError when requesting a named sprint that does not exist', async () => {
    // Given: same project with no iteration field
    const gql = (async () => MOCK_FULL_NO_ITER) as unknown as Parameters<typeof sprintReport>[0];

    // When: requesting a named sprint
    const result = await sprintReport(gql, {
      owner: 'fideguch',
      projectNumber: 1,
      sprint: 'Sprint 99',
    });

    // Then: error message mentions the missing sprint name
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Sprint 'Sprint 99' not found");
  });
});
