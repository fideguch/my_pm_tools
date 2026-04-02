import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GhRunner } from '../utils/gh-cli.js';

export async function createIssue(
  gh: GhRunner,
  args: {
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
    template?: string;
  }
): Promise<CallToolResult> {
  const ghArgs = ['issue', 'create', '--repo', args.repo, '--title', args.title];

  if (args.body) ghArgs.push('--body', args.body);
  if (args.labels && args.labels.length > 0) {
    ghArgs.push('--label', args.labels.join(','));
  }
  if (args.assignees && args.assignees.length > 0) {
    ghArgs.push('--assignee', args.assignees.join(','));
  }
  if (args.template) ghArgs.push('--template', args.template);

  let stdout: string;
  try {
    const result = await gh(ghArgs);
    stdout = result.stdout.trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to create issue: ${message}` }],
    };
  }

  // gh issue create returns the URL of the created issue
  const issueUrl = stdout;
  const issueNumberMatch = issueUrl.match(/\/(\d+)$/);
  const issueNumber = issueNumberMatch ? Number(issueNumberMatch[1]) : undefined;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `Created issue in ${args.repo}: "${args.title}"`,
            data: {
              repo: args.repo,
              issueNumber,
              url: issueUrl,
              title: args.title,
              labels: args.labels,
              assignees: args.assignees,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
