import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID } from '../graphql/queries.js';
import { ADD_PROJECT_ITEM } from '../graphql/mutations.js';

interface GetProjectIdResponse {
  readonly user: {
    readonly projectV2: { readonly id: string } | null;
  };
}

interface AddItemResponse {
  readonly addProjectV2ItemById: {
    readonly item: { readonly id: string };
  };
}

interface GetNodeIdResponse {
  readonly node_id: string;
}

export async function addItem(
  gql: typeof graphql,
  args: {
    owner: string;
    projectNumber: number;
    repo: string;
    itemNumber: number;
    itemType: 'issue' | 'pr';
  }
): Promise<CallToolResult> {
  let projectData: GetProjectIdResponse;
  try {
    projectData = await gql<GetProjectIdResponse>(GET_PROJECT_ID, {
      login: args.owner,
      number: args.projectNumber,
    });
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `GitHub API error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  const project = projectData.user.projectV2;
  if (!project) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Project #${args.projectNumber} not found for user '${args.owner}'.`,
        },
      ],
    };
  }

  // Get the node ID of the issue or PR via GraphQL
  let nodeId: string;
  try {
    const response = await gql<GetNodeIdResponse>(
      `query GetNodeId($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          ${args.itemType === 'pr' ? 'pullRequest' : 'issue'}(number: $number) {
            id
          }
        }
      }`,
      {
        owner: args.repo.split('/')[0],
        repo: args.repo.split('/')[1],
        number: args.itemNumber,
      }
    );

    // Dynamic GraphQL query returns issue OR pullRequest based on itemType.
    // Type assertion required because response shape varies at runtime.
    const repoData = response as unknown as {
      repository: {
        issue?: { id: string };
        pullRequest?: { id: string };
      };
    };

    nodeId = repoData.repository.issue?.id ?? repoData.repository.pullRequest?.id ?? '';
  } catch {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `${args.itemType === 'pr' ? 'PR' : 'Issue'} #${args.itemNumber} not found in ${args.repo}.`,
        },
      ],
    };
  }

  if (!nodeId) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Could not resolve node ID for ${args.repo}#${args.itemNumber}.`,
        },
      ],
    };
  }

  let result: AddItemResponse;
  try {
    result = await gql<AddItemResponse>(ADD_PROJECT_ITEM, {
      projectId: project.id,
      contentId: nodeId,
    });
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `GitHub API error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            itemId: result.addProjectV2ItemById.item.id,
            message: `Added ${args.repo}#${args.itemNumber} to Project #${args.projectNumber}`,
          },
          null,
          2
        ),
      },
    ],
  };
}
