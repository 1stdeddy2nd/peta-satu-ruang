import type {
  LayerFeaturePayload,
  LayerMetaPayload,
  ProjectResponse,
  ProjectSavePayload,
} from "./project-types";

let projectId: string | null = null;

export function setProjectId(id: string) {
  projectId = id;
}

export function getProjectId() {
  return projectId;
}

export async function fetchProject(): Promise<ProjectResponse> {
  const res = await fetch("/api/project");
  if (!res.ok) throw new Error("Failed to load project");
  const data = (await res.json()) as ProjectResponse;
  projectId = data.id;
  return data;
}

export async function saveProject(payload: ProjectSavePayload): Promise<void> {
  await fetch("/api/project", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Best-effort: called before the initial project fetch can possibly have
 * resolved is a bug elsewhere, not a case to recover from here, so this
 * silently no-ops rather than throwing into upload/remove handlers.
 */
export async function createLayer(
  meta: LayerMetaPayload,
  features: LayerFeaturePayload[]
): Promise<void> {
  if (!projectId) return;
  const res = await fetch("/api/project/layers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ meta, features }),
  });
  // Callers fire this without awaiting, so a failed save is otherwise silent
  // and the layer only disappears on the next reload.
  if (!res.ok) throw new Error(`Failed to save layer "${meta.name}"`);
}

export async function deleteLayer(layerId: string): Promise<void> {
  if (!projectId) return;
  await fetch(`/api/project/layers/${layerId}`, { method: "DELETE" });
}
