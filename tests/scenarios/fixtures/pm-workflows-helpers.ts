// Shared constants and helpers for pm-workflows scenario tests

export const MOCK_PROJECT_ID = { user: { projectV2: { id: 'PVT_test' } } };

export const MOCK_FIELDS_WITH_STATUS = {
  node: {
    fields: {
      nodes: [
        {
          id: 'PVTSSF_status',
          name: 'Status',
          options: [
            { id: 'opt_backlog', name: 'Backlog' },
            { id: 'opt_dev', name: '開発中' },
            { id: 'opt_review', name: 'レビュー中' },
            { id: 'opt_done', name: 'Done' },
          ],
        },
      ],
    },
  },
};

export function makeUpdateResponse(itemId: string) {
  return {
    updateProjectV2ItemFieldValue: { projectV2Item: { id: itemId } },
  };
}
