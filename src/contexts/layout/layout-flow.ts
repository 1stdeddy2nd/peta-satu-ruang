import type { LayoutElement } from "./layout-types";

export function regionChildren(
  elements: LayoutElement[],
  regionId: string,
  { includeHidden = false } = {}
): LayoutElement[] {
  return elements
    .filter(
      (el) =>
        el.placement === "flow" &&
        el.regionId === regionId &&
        (includeHidden || el.visible)
    )
    .sort((a, b) => a.flowOrder - b.flowOrder);
}

export function sequenceFlowOrder(orderedIds: string[]): Map<string, number> {
  return new Map(orderedIds.map((id, index) => [id, index]));
}
