import { create } from "zustand";

export type WorkspaceMode = "analysis" | "layout";

interface WorkspaceState {
  mode: WorkspaceMode;
  panelOpen: boolean;
  guidanceDismissed: boolean;
  guidanceLoaded: boolean;

  setMode: (mode: WorkspaceMode) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  dismissGuidance: () => void;
  loadGuidance: () => Promise<void>;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
  mode: "analysis",
  panelOpen: true,
  guidanceDismissed: false,
  guidanceLoaded: false,

  setMode: (mode) => set({ mode }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),

  dismissGuidance: () => {
    set({ guidanceDismissed: true });
    void fetch("/api/guidance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    });
  },

  loadGuidance: async () => {
    try {
      const res = await fetch("/api/guidance");
      const data = await res.json();
      set({ guidanceDismissed: Boolean(data?.dismissed), guidanceLoaded: true });
    } catch {
      set({ guidanceLoaded: true });
    }
  },
}));
