"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { architectures, architectureById } from "../data";
import { ArchitectureExplorer } from "./ArchitectureExplorer";
import { ArchitectureGraph } from "@/features/graph/ui/ArchitectureGraph";
import { ArchitectureInspector } from "@/features/inspector/ui/ArchitectureInspector";
import { uiLabels } from "@/shared/ui/ui-labels";

export type WorkspaceLayout = "desktop" | "medium" | "compact";

function useWorkspaceLayout() {
  const [layout, setLayout] = useState<WorkspaceLayout>("desktop");

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 767px)");
    const medium = window.matchMedia("(max-width: 1279px)");
    const update = () => setLayout(compact.matches ? "compact" : medium.matches ? "medium" : "desktop");
    compact.addEventListener("change", update);
    medium.addEventListener("change", update);
    update();
    return () => {
      compact.removeEventListener("change", update);
      medium.removeEventListener("change", update);
    };
  }, []);

  return layout;
}

export function ArchitectureWorkspace() {
  const searchParams = useSearchParams();
  const layout = useWorkspaceLayout();
  const [openPanel, setOpenPanel] = useState<"explorer" | "inspector" | null>(null);
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  const requestedArchitectureId = searchParams.get("architecture");
  const architecture = architectureById.get(requestedArchitectureId ?? "") ?? architectures[0];
  const requestedNodeId = searchParams.get("node");
  const selectedNode = architecture.nodes.find((node) => node.id === requestedNodeId);

  function writeUrl(architectureId: string, nodeId?: string, replace = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("architecture", architectureId);
    if (nodeId) params.set("node", nodeId);
    else params.delete("node");
    window.history[replace ? "replaceState" : "pushState"](null, "", `?${params.toString()}`);
  }

  useEffect(() => {
    const architectureIsInvalid = requestedArchitectureId !== architecture.id;
    const nodeIsInvalid = requestedNodeId !== null && !selectedNode;
    if (architectureIsInvalid || nodeIsInvalid) writeUrl(architecture.id, selectedNode?.id, true);
    // URL normalization intentionally follows the current search params only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedArchitectureId, requestedNodeId, architecture.id, selectedNode]);

  function selectArchitecture(id: string) {
    writeUrl(id);
    setOpenPanel(null);
  }

  function selectNode(id?: string) {
    writeUrl(architecture.id, id);
    if (id && layout === "desktop") setInspectorCollapsed(false);
    if (id && layout !== "desktop") setOpenPanel("inspector");
  }

  const explorerOpen = layout !== "desktop" && openPanel === "explorer";
  const inspectorOpen = layout !== "desktop" && (openPanel === "inspector" || Boolean(selectedNode));
  const drawerOpen = layout !== "desktop" && (explorerOpen || inspectorOpen);

  function dismissPanels() {
    if (selectedNode) selectNode(undefined);
    setOpenPanel(null);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const panel = document.querySelector<HTMLElement>(explorerOpen ? ".explorer-panel.is-open" : ".inspector-panel.is-open");
    if (!panel) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])";
    const focusables = () => [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => element.offsetParent !== null);
    focusables()[0]?.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissPanels();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      previouslyFocused?.focus();
    };
    // dismissPanels intentionally closes the current URL-backed selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, explorerOpen]);

  return (
    <main className={`workspace-shell layout-${layout} ${explorerCollapsed ? "explorer-collapsed" : ""} ${inspectorCollapsed ? "inspector-collapsed" : ""}`} data-layout={layout}>
      {drawerOpen && (
        <button
          type="button"
          className="panel-backdrop"
          aria-label={explorerOpen ? uiLabels.closeExplorer : uiLabels.closeInspectorPanel}
          onClick={dismissPanels}
        />
      )}
      <ArchitectureExplorer
        key={architecture.category}
        architectures={architectures}
        selectedId={architecture.id}
        onSelect={selectArchitecture}
        isDrawer={layout !== "desktop"}
        isOpen={explorerOpen}
        onClose={() => setOpenPanel(null)}
      />
      <ArchitectureGraph
        key={architecture.id}
        architecture={architecture}
        architectures={architectures}
        selectedNodeId={selectedNode?.id}
        layout={layout}
        onSelectArchitecture={selectArchitecture}
        onSelectNode={selectNode}
        onOpenExplorer={() => { if (selectedNode) selectNode(undefined); setOpenPanel("explorer"); }}
        onOpenInspector={() => { selectNode(undefined); setOpenPanel("inspector"); }}
        explorerCollapsed={explorerCollapsed}
        inspectorCollapsed={inspectorCollapsed}
        onToggleExplorer={() => setExplorerCollapsed((collapsed) => !collapsed)}
        onToggleInspector={() => setInspectorCollapsed((collapsed) => !collapsed)}
        backgroundInert={drawerOpen}
      />
      <ArchitectureInspector
        architecture={architecture}
        node={selectedNode}
        isDrawer={layout !== "desktop"}
        isOpen={inspectorOpen}
        onClose={() => selectNode(undefined)}
        onDismiss={dismissPanels}
        onSelectNode={selectNode}
      />
    </main>
  );
}
