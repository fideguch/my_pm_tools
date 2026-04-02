import { z } from 'zod';

/** Common parameters shared across most tools. */
export const projectParams = {
  owner: z.string().describe('GitHub username or organization'),
  projectNumber: z.number().int().positive().describe('GitHub Project V2 number'),
};

/** Common repo parameter for issue-level operations. */
export const repoParam = {
  repo: z
    .string()
    .regex(
      /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
      "Must be in 'owner/repo' format (alphanumeric, hyphens, dots, underscores)"
    )
    .describe("Repository in 'owner/repo' format"),
};

/** project_add_item input schema */
export const addItemSchema = {
  ...projectParams,
  ...repoParam,
  itemNumber: z.number().int().positive().describe('Issue or Pull Request number'),
  itemType: z.enum(['issue', 'pr']).default('issue').describe('Type of item to add'),
};

/** project_move_status input schema */
export const moveStatusSchema = {
  ...projectParams,
  itemId: z.string().describe('Project item ID (PVTI_...)'),
  status: z.string().describe("Target status name (e.g. '開発中', 'Done')"),
};

/** project_set_priority input schema */
export const setPrioritySchema = {
  ...projectParams,
  itemId: z.string().describe('Project item ID (PVTI_...)'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']).describe('Priority level'),
};

/** project_list_items input schema */
export const listItemsSchema = {
  ...projectParams,
  statusFilter: z.string().optional().describe('Filter by status name (optional)'),
  priorityFilter: z.string().optional().describe('Filter by priority (optional)'),
};

/** project_list_fields input schema */
export const listFieldsSchema = {
  ...projectParams,
};

/** project_sprint_report input schema */
export const sprintReportSchema = {
  ...projectParams,
  sprint: z
    .string()
    .default('current')
    .describe("Sprint selector: 'current', 'previous', or a sprint title"),
};

/** project_get_issue input schema */
export const getIssueSchema = {
  ...repoParam,
  issueNumber: z.number().int().positive().describe('Issue number'),
};

/** project_edit_issue input schema */
export const editIssueSchema = {
  ...repoParam,
  issueNumber: z.number().int().positive().describe('Issue number'),
  title: z.string().optional().describe('New title (optional)'),
  body: z.string().optional().describe('New body (optional)'),
};

/** project_manage_labels input schema */
export const manageLabelsSchema = {
  ...repoParam,
  issueNumber: z.number().int().positive().describe('Issue number'),
  addLabels: z.array(z.string()).optional().describe('Labels to add'),
  removeLabels: z.array(z.string()).optional().describe('Labels to remove'),
};

/** project_manage_assignees input schema */
export const manageAssigneesSchema = {
  ...repoParam,
  issueNumber: z.number().int().positive().describe('Issue number'),
  addAssignees: z.array(z.string()).optional().describe('GitHub usernames to assign'),
  removeAssignees: z.array(z.string()).optional().describe('GitHub usernames to unassign'),
};

/** project_create_issue input schema */
export const createIssueSchema = {
  ...repoParam,
  title: z.string().describe('Issue title (supports Japanese)'),
  body: z.string().optional().describe('Issue body in Markdown (supports Japanese)'),
  labels: z.array(z.string()).optional().describe('Labels to apply (e.g. ["bug", "feature"])'),
  assignees: z.array(z.string()).optional().describe('GitHub usernames to assign'),
  template: z
    .string()
    .optional()
    .describe('Issue template filename (e.g. "bug_report.yml", "feature_request.yml")'),
};

/** project_set_issue_state input schema */
export const setIssueStateSchema = {
  ...repoParam,
  issueNumber: z.number().int().positive().describe('Issue number'),
  state: z.enum(['open', 'closed']).describe('Target state'),
  reason: z
    .enum(['completed', 'not_planned'])
    .optional()
    .describe("Close reason (only for state='closed')"),
};
