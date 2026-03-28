import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_FULL } from '../graphql/queries.js';
import type {
  ProjectV2,
  FieldNode,
  IterationFieldNode,
  Iteration,
  ItemNode,
  SprintReport,
} from '../types/index.js';
import { isIterationValue } from '../types/index.js';
import { getFieldValue, isBlocked } from '../utils/field-helpers.js';

interface GetProjectFullResponse {
  readonly user: {
    readonly projectV2: ProjectV2 | null;
  };
}

function isIterationField(field: FieldNode): field is IterationFieldNode {
  return 'configuration' in field;
}

function getIterationId(item: ItemNode): string | null {
  for (const fv of item.fieldValues.nodes) {
    if (isIterationValue(fv)) {
      return fv.iterationId;
    }
  }
  return null;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function findTargetSprint(
  fields: readonly FieldNode[],
  sprintFilter: string
): { iteration: Iteration; fieldId: string } | null {
  const iterField = fields.find(isIterationField);
  if (!iterField) return null;

  const allIterations = [
    ...iterField.configuration.iterations,
    ...iterField.configuration.completedIterations,
  ].sort((a, b) => b.startDate.localeCompare(a.startDate));

  if (allIterations.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);

  if (sprintFilter === 'current') {
    const current = allIterations.find((it) => {
      const end = addDays(it.startDate, it.duration);
      return it.startDate <= today && today <= end;
    });
    const iteration = current ?? allIterations[0]!;
    return { iteration, fieldId: iterField.id };
  }

  if (sprintFilter === 'previous') {
    let foundCurrent = false;
    for (const it of allIterations) {
      const end = addDays(it.startDate, it.duration);
      if (it.startDate <= today && today <= end) {
        foundCurrent = true;
        continue;
      }
      if (foundCurrent) {
        return { iteration: it, fieldId: iterField.id };
      }
    }
    const iteration = allIterations.length > 1 ? allIterations[1]! : allIterations[0]!;
    return { iteration, fieldId: iterField.id };
  }

  // Match by title
  const match = allIterations.find((it) => it.title === sprintFilter);
  return match ? { iteration: match, fieldId: iterField.id } : null;
}

export async function sprintReport(
  gql: typeof graphql,
  args: { owner: string; projectNumber: number; sprint: string }
): Promise<CallToolResult> {
  let data: GetProjectFullResponse;
  try {
    data = await gql<GetProjectFullResponse>(GET_PROJECT_FULL, {
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

  const project = data.user.projectV2;
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

  const target = findTargetSprint(project.fields.nodes, args.sprint);

  if (!target) {
    // List available sprints
    const iterField = project.fields.nodes.find(isIterationField);
    const available = iterField
      ? [...iterField.configuration.iterations, ...iterField.configuration.completedIterations]
          .map((it) => `${it.title} (${it.startDate})`)
          .join(', ')
      : 'none';

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Sprint '${args.sprint}' not found. Available: ${available}`,
        },
      ],
    };
  }

  const { iteration } = target;
  const sprintEnd = addDays(iteration.startDate, iteration.duration);

  // Filter items for this sprint
  const sprintItems = project.items.nodes.filter((item) => getIterationId(item) === iteration.id);

  // Calculate stats
  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  let completed = 0;
  let estimateTotal = 0;
  let estimateCompleted = 0;
  const blockedItems: { number: number | null; title: string }[] = [];

  for (const item of sprintItems) {
    const rawStatus = getFieldValue(item, 'Status');
    const status = typeof rawStatus === 'string' ? rawStatus : 'Unknown';
    const rawPriority = getFieldValue(item, 'Priority');
    const priority = typeof rawPriority === 'string' ? rawPriority : 'Unset';
    const estimate = getFieldValue(item, 'Estimate');

    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    const pKey = priority.startsWith('P') ? priority.split(' ')[0]! : priority;
    priorityCounts[pKey] = (priorityCounts[pKey] ?? 0) + 1;

    if (typeof estimate === 'number') {
      estimateTotal += estimate;
      if (status === 'Done') {
        estimateCompleted += estimate;
      }
    }

    if (status === 'Done') {
      completed++;
    }

    if (isBlocked(item)) {
      blockedItems.push({
        number: item.content?.number ?? null,
        title: item.content?.title ?? '(Draft)',
      });
    }
  }

  const total = sprintItems.length;
  const report: SprintReport = {
    sprint: iteration.title,
    period: { start: iteration.startDate, end: sprintEnd },
    summary: {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      blocked: blockedItems.length,
    },
    velocity: {
      estimateTotal,
      estimateCompleted,
    },
    statusBreakdown: statusCounts,
    priorityDistribution: priorityCounts,
    blockedItems,
  };

  const itemCount = project.items.nodes.length;
  const truncated = itemCount >= 200;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ...report,
            truncated,
            ...(truncated && {
              warning: `Project has ${itemCount}+ items. Sprint report may be incomplete.`,
            }),
          },
          null,
          2
        ),
      },
    ],
  };
}
