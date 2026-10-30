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
    if (id && layout !== "desktop") setOpenPanel("inspector");
  }

  const explorerOpen = layout !== "desktop" && openPanel === "explorer";
  const inspectorOpen = layout !== "desktop" && (openPanel === "inspector" || Boolean(selectedNode));
  const drawerOpen = layout !== "desktop" && (explorerOpen || inspectorOpen);

  function dismissPanels() {
    if (selectedNode) selectNode(undefined);
    setOpenPanel(null);
  }

  return (
    <main className={`workspace-shell layout-${layout}`} data-layout={layout}>
      {drawerOpen && (
        <button
          type="button"
          className="panel-backdrop"
          aria-label={explorerOpen ? uiLabels.closeExplorer : uiLabels.closeInspectorPanel}
          onClick={dismissPanels}
        />
      )}
      <ArchitectureExplorer
        architectures={architectures}
        selectedId={architecture.id}
        onSelect={selectArchitecture}
        isDrawer={layout !== "desktop"}
        isOpen={explorerOpen}
        onClose={() => setOpenPanel(null)}
      />
      <ArchitectureGraph
        architecture={architecture}
        architectures={architectures}
        selectedNodeId={selectedNode?.id}
        layout={layout}
        onSelectArchitecture={selectArchitecture}
        onSelectNode={selectNode}
        onOpenExplorer={() => { if (selectedNode) selectNode(undefined); setOpenPanel("explorer"); }}
        onOpenInspector={() => { selectNode(undefined); setOpenPanel("inspector"); }}
      />
      <ArchitectureInspector
        architecture={architecture}
        node={selectedNode}
        isDrawer={layout !== "desktop"}
        isOpen={inspectorOpen}
        onClose={() => selectNode(undefined)}
        onDismiss={dismissPanels}
      />
    </main>
  );
}
