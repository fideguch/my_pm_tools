/**
 * TypeScript types for GitHub Projects V2 GraphQL API responses
 * and MCP tool return values.
 */

// --- GraphQL response types ---

export interface ProjectV2 {
  readonly id: string;
  readonly title: string;
  readonly fields: { readonly nodes: readonly FieldNode[] };
  readonly items: { readonly nodes: readonly ItemNode[] };
}

export type FieldNode = SingleSelectFieldNode | IterationFieldNode | BasicFieldNode;

export interface SingleSelectFieldNode {
  readonly id: string;
  readonly name: string;
  readonly options: readonly FieldOption[];
}

export interface FieldOption {
  readonly id: string;
  readonly name: string;
}

export interface IterationFieldNode {
  readonly id: string;
  readonly name: string;
  readonly configuration: {
    readonly iterations: readonly Iteration[];
    readonly completedIterations: readonly Iteration[];
  };
}

export interface Iteration {
  readonly id: string;
  readonly title: string;
  readonly startDate: string;
  readonly duration: number;
}

export interface BasicFieldNode {
  readonly id: string;
  readonly name: string;
  readonly dataType: string;
}

export interface ItemNode {
  readonly id: string;
  readonly content: ItemContent | null;
  readonly fieldValues: { readonly nodes: readonly FieldValueNode[] };
}

export interface ItemContent {
  readonly number?: number;
  readonly title?: string;
  readonly state?: string;
  readonly labels?: { readonly nodes: readonly LabelNode[] };
}

export interface LabelNode {
  readonly name: string;
}

export type FieldValueNode =
  | SingleSelectValueNode
  | NumberValueNode
  | IterationValueNode
  | Record<string, never>;

// --- Type guards for FieldValueNode discriminated union ---

/** Narrows to a field value node that has a `field` property with a name. */
export function hasField(fv: FieldValueNode): fv is (
  | SingleSelectValueNode
  | NumberValueNode
  | IterationValueNode
) & {
  readonly field: { readonly name: string };
} {
  return !!fv && 'field' in fv && fv.field != null && 'name' in fv.field;
}

/** Narrows to SingleSelectValueNode (has `field` and `name`). */
export function isSelectValue(fv: FieldValueNode): fv is SingleSelectValueNode {
  return hasField(fv) && 'name' in fv && typeof (fv as SingleSelectValueNode).name === 'string';
}

/** Narrows to NumberValueNode (has `field` and `number`). */
export function isNumberValue(fv: FieldValueNode): fv is NumberValueNode {
  return hasField(fv) && 'number' in fv && typeof (fv as NumberValueNode).number === 'number';
}

/** Narrows to IterationValueNode (has `field`, `title`, and `iterationId`). */
export function isIterationValue(fv: FieldValueNode): fv is IterationValueNode {
  return hasField(fv) && 'iterationId' in fv;
}

export interface SingleSelectValueNode {
  readonly field: { readonly name: string };
  readonly name: string;
}

export interface NumberValueNode {
  readonly field: { readonly name: string };
  readonly number: number;
}

export interface IterationValueNode {
  readonly field: { readonly name: string };
  readonly title: string;
  readonly startDate: string;
  readonly duration: number;
  readonly iterationId: string;
}

// --- Issue detail type (for get-issue tool) ---

export interface IssueDetail {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly state: string;
  readonly url: string;
  readonly labels: readonly string[];
  readonly assignees: readonly string[];
  readonly milestone: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// --- MCP tool return types ---

export interface ProjectItem {
  readonly itemId: string;
  readonly number: number | null;
  readonly title: string;
  readonly state: string | null;
  readonly status: string | null;
  readonly priority: string | null;
  readonly estimate: number | null;
  readonly sprint: string | null;
  readonly isBlocked: boolean;
}

export interface ProjectField {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly options: readonly FieldOption[];
}

export interface SprintReport {
  readonly sprint: string;
  readonly period: { readonly start: string; readonly end: string };
  readonly summary: {
    readonly total: number;
    readonly completed: number;
    readonly completionRate: number;
    readonly blocked: number;
  };
  readonly velocity: {
    readonly estimateTotal: number;
    readonly estimateCompleted: number;
  };
  readonly statusBreakdown: Record<string, number>;
  readonly priorityDistribution: Record<string, number>;
  readonly blockedItems: readonly {
    readonly number: number | null;
    readonly title: string;
  }[];
}
