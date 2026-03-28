import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { graphql } from '@octokit/graphql';
import type { GhRunner } from '../utils/gh-cli.js';
import { createGhRunner } from '../utils/gh-cli.js';
import {
  addItemSchema,
  moveStatusSchema,
  setPrioritySchema,
  listItemsSchema,
  listFieldsSchema,
  sprintReportSchema,
  getIssueSchema,
  editIssueSchema,
  manageLabelsSchema,
  manageAssigneesSchema,
  setIssueStateSchema,
} from '../schemas/index.js';
import { listFields } from './list-fields.js';
import { listItems } from './list-items.js';
import { addItem } from './add-item.js';
import { moveStatus } from './move-status.js';
import { setPriority } from './set-priority.js';
import { sprintReport } from './sprint-report.js';
import { getIssue } from './get-issue.js';
import { editIssue } from './edit-issue.js';
import { manageLabels } from './manage-labels.js';
import { manageAssignees } from './manage-assignees.js';
import { setIssueState } from './set-issue-state.js';
import { registerNotionTools } from './notion/index.js';
import { registerWorkspaceTools } from './workspace/index.js';

/**
 * Register all project management tools on the MCP server.
 * @param gh - Optional GhRunner for issue write operations. Defaults to real gh CLI.
 */
export function registerTools(server: McpServer, gql: typeof graphql, gh?: GhRunner): void {
  const ghRunner = gh ?? createGhRunner();

  // --- Read-only tools (GraphQL) ---

  server.registerTool(
    'project_list_fields',
    {
      description: 'List all fields and their options in a GitHub Project V2',
      inputSchema: listFieldsSchema,
    },
    async (args) => listFields(gql, args)
  );

  server.registerTool(
    'project_list_items',
    {
      description: 'List all items in a GitHub Project V2 with status and metadata',
      inputSchema: listItemsSchema,
    },
    async (args) => listItems(gql, args)
  );

  server.registerTool(
    'project_sprint_report',
    {
      description: 'Generate a sprint report with velocity, completion rate, and blocker stats',
      inputSchema: sprintReportSchema,
      annotations: { readOnlyHint: true },
    },
    async (args) => sprintReport(gql, args)
  );

  server.registerTool(
    'project_get_issue',
    {
      description: 'Get detailed information about a specific issue by number',
      inputSchema: getIssueSchema,
      annotations: { readOnlyHint: true },
    },
    async (args) => getIssue(gql, args)
  );

  // --- Write tools (GraphQL) ---

  server.registerTool(
    'project_add_item',
    {
      description: 'Add an Issue or Pull Request to a GitHub Project V2',
      inputSchema: addItemSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => addItem(gql, args)
  );

  server.registerTool(
    'project_move_status',
    {
      description:
        "Change the status of a project item (e.g. 'Backlog', '開発中', 'Done'). Supports aliases like 'dev'→'開発中'",
      inputSchema: moveStatusSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => moveStatus(gql, args)
  );

  server.registerTool(
    'project_set_priority',
    {
      description: 'Set the priority of a project item (P0-P4)',
      inputSchema: setPrioritySchema,
      annotations: { destructiveHint: false },
    },
    async (args) => setPriority(gql, args)
  );

  // --- Write tools (gh CLI) ---

  server.registerTool(
    'project_edit_issue',
    {
      description: 'Edit the title and/or body of an issue',
      inputSchema: editIssueSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => editIssue(ghRunner, args)
  );

  server.registerTool(
    'project_manage_labels',
    {
      description: 'Add or remove labels on an issue',
      inputSchema: manageLabelsSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => manageLabels(ghRunner, args)
  );

  server.registerTool(
    'project_manage_assignees',
    {
      description: 'Add or remove assignees on an issue',
      inputSchema: manageAssigneesSchema,
      annotations: { destructiveHint: false },
    },
    async (args) => manageAssignees(ghRunner, args)
  );

  server.registerTool(
    'project_set_issue_state',
    {
      description: 'Close or reopen an issue',
      inputSchema: setIssueStateSchema,
      annotations: { destructiveHint: true },
    },
    async (args) => setIssueState(ghRunner, args)
  );

  // --- Workspace Bridge tools (Notion + Google) ---

  registerNotionTools(server);
  registerWorkspaceTools(server);
}
