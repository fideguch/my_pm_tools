/**
 * Shared field-value extraction helpers for project items.
 * Used by list-items and sprint-report to avoid duplicated logic.
 */
import type { ItemNode, ProjectItem } from '../types/index.js';
import { hasField, isSelectValue, isNumberValue, isIterationValue } from '../types/index.js';

/**
 * Extract a field value from a project item by field name.
 * Returns the display value (name, number, or title) or null if not found.
 * Uses type guard functions for safe narrowing — no `as` casts needed.
 */
export function getFieldValue(item: ItemNode, fieldName: string): string | number | null {
  for (const fv of item.fieldValues.nodes) {
    if (!hasField(fv)) continue;
    if (fv.field.name !== fieldName) continue;

    if (isSelectValue(fv)) return fv.name;
    if (isNumberValue(fv)) return fv.number;
    if (isIterationValue(fv)) return fv.title;
  }
  return null;
}

/** Check whether an item has the 'blocked' label. */
export function isBlocked(item: ItemNode): boolean {
  const labels = item.content?.labels?.nodes ?? [];
  return labels.some((l) => l.name === 'blocked');
}

/** Convert a raw GraphQL ItemNode into a normalized ProjectItem. */
export function toProjectItem(item: ItemNode): ProjectItem {
  const status = getFieldValue(item, 'Status');
  const priority = getFieldValue(item, 'Priority');
  const estimate = getFieldValue(item, 'Estimate');

  return {
    itemId: item.id,
    number: item.content?.number ?? null,
    title: item.content?.title ?? '(Draft)',
    state: item.content?.state ?? null,
    status: typeof status === 'string' ? status : null,
    priority: typeof priority === 'string' ? priority : null,
    estimate: typeof estimate === 'number' ? estimate : null,
    sprint:
      (() => {
        const val = getFieldValue(item, 'Sprint');
        return typeof val === 'string' ? val : null;
      })() ??
      (() => {
        const val = getFieldValue(item, 'Iteration');
        return typeof val === 'string' ? val : null;
      })(),
    isBlocked: isBlocked(item),
  };
}
