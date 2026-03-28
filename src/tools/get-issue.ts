import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_ISSUE_BY_NUMBER } from '../graphql/queries.js';
import type { IssueDetail } from '../types/index.js';

interface GetIssueResponse {
  readonly repository: {
    readonly issue: {
      readonly id: string;
      readonly number: number;
      readonly title: string;
      readonly body: string | null;
      readonly state: string;
      readonly url: string;
      readonly labels: { readonly nodes: readonly { readonly name: string }[] };
      readonly assignees: { readonly nodes: readonly { readonly login: string }[] };
      readonly milestone: { readonly title: string } | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    } | null;
  };
}

export async function getIssue(
  gql: typeof graphql,
  args: { repo: string; issueNumber: number }
): Promise<CallToolResult> {
  const parts = args.repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Invalid repo format: '${args.repo}'. Expected 'owner/repo'.`,
        },
      ],
    };
  }
  const owner = parts[0]!;
  const repo = parts[1]!;

  let data: GetIssueResponse;
  try {
    data = await gql<GetIssueResponse>(GET_ISSUE_BY_NUMBER, {
      owner,
      repo,
      number: args.issueNumber,
    });
  } catch {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Repository '${args.repo}' not found or not accessible.`,
        },
      ],
    };
  }

  const issue = data.repository.issue;
  if (!issue) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Issue #${args.issueNumber} not found in ${args.repo}.`,
        },
      ],
    };
  }

  const detail: IssueDetail = {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    url: issue.url,
    labels: issue.labels.nodes.map((l) => l.name),
    assignees: issue.assignees.nodes.map((a) => a.login),
    milestone: issue.milestone?.title ?? null,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `#${detail.number} ${detail.title} [${detail.state}]`,
            data: detail,
          },
          null,
          2
        ),
      },
    ],
  };
}
