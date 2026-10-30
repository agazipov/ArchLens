"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BaseEdge,
  Background,
  BackgroundVariant,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  ReactFlow,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Info, Menu, MousePointer2 } from "lucide-react";
import type { Architecture, EdgeKind } from "@/features/architecture/model/types";
import type { WorkspaceLayout } from "@/features/architecture/ui/ArchitectureWorkspace";
import { uiLabels } from "@/shared/ui/ui-labels";
import { ArchitectureNodeCard, type ArchitectureFlowNode } from "./ArchitectureNodeCard";

const nodeTypes: NodeTypes = { architectureNode: ArchitectureNodeCard };

function ArchitectureEdge({
  id,
  label,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerStart,
  markerEnd,
  style,
  interactionWidth,
}: EdgeProps) {
  const [path, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const isHorizontal = Math.abs(sourceY - targetY) < 16;
  const labelX = isHorizontal ? (sourceX + targetX) / 2 : defaultLabelX;
  const labelY = isHorizontal ? Math.min(sourceY, targetY) - 58 : defaultLabelY;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="flow-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes: EdgeTypes = { architectureEdge: ArchitectureEdge };

const edgeColors: Record<EdgeKind, string> = {
  request: "#6592c8",
  data: "#9a86d8",
  event: "#d29a52",
  async: "#69a982",
  realtime: "#55b8c5",
  control: "#c67878",
};

interface Props {
  architecture: Architecture;
  architectures: Architecture[];
  selectedNodeId?: string;
  layout: WorkspaceLayout;
  onSelectArchitecture: (id: string) => void;
  onSelectNode: (id?: string) => void;
  onOpenExplorer: () => void;
  onOpenInspector: () => void;
}

const fitOptions = { padding: 0.2, maxZoom: 1.1 } as const;

export function ArchitectureGraph({
  architecture,
  architectures,
  selectedNodeId,
  layout,
  onSelectArchitecture,
  onSelectNode,
  onOpenExplorer,
  onOpenInspector,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance<ArchitectureFlowNode, Edge> | null>(null);

  const fitGraph = useCallback((duration = 180) => {
    requestAnimationFrame(() => {
      void instanceRef.current?.fitView({ ...fitOptions, duration });
    });
  }, []);

  const nodes = useMemo<ArchitectureFlowNode[]>(() => architecture.nodes.map((node) => ({
    id: node.id,
    type: "architectureNode",
    position: node.position,
    data: { architectureNode: node, onActivate: onSelectNode },
    selected: node.id === selectedNodeId,
    draggable: false,
    focusable: false,
    selectable: true,
  })), [architecture, selectedNodeId, onSelectNode]);

  const edges = useMemo<Edge[]>(() => architecture.edges.map((edge) => {
    const related = !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
    const color = edgeColors[edge.type];
    return {
      ...edge,
      type: "architectureEdge",
      animated: related && (edge.type === "event" || edge.type === "async" || edge.type === "realtime"),
      className: selectedNodeId ? (related ? "is-related" : "is-muted") : undefined,
      style: { stroke: color, strokeWidth: related && selectedNodeId ? 2.4 : 1.7 },
      markerStart: edge.bidirectional ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color },
      focusable: false,
      ariaLabel: `${edge.source} — ${edge.target}: ${edge.label ?? uiLabels.edgeKinds[edge.type]}`,
    };
  }), [architecture, selectedNodeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitGraph(0), 30);
    return () => window.clearTimeout(timer);
  }, [architecture.id, fitGraph]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitGraph(), 190);
    return () => window.clearTimeout(timer);
  }, [layout, fitGraph]);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    let previous = { width: container.clientWidth, height: container.clientHeight };
    let timer: number | undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const substantial = Math.abs(width - previous.width) >= 64 || Math.abs(height - previous.height) >= 64;
      previous = { width, height };
      if (!substantial) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fitGraph(), 140);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [fitGraph]);

  return (
    <section className="graph-shell" aria-label={`${uiLabels.graphLabel} «${architecture.title}»`}>
      <div className="graph-toolbar">
        <div className="toolbar-leading">
          {layout === "medium" && <button type="button" className="toolbar-button" onClick={onOpenExplorer}><Menu size={15} />{uiLabels.architectureExplorer}</button>}
          {layout === "compact" && (
            <label className="compact-architecture-select">
              <span>{uiLabels.architectureSelection}</span>
              <select value={architecture.id} onChange={(event) => onSelectArchitecture(event.target.value)}>
                {[...Map.groupBy(architectures, (item) => item.category).entries()].map(([category, items]) => (
                  <optgroup key={category} label={uiLabels.categories[category]}>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          )}
          <div className="graph-title"><div className="graph-eyebrow">{uiLabels.interactiveMap}</div><h1>{architecture.title}</h1></div>
        </div>
        <div className="toolbar-actions">
          <div className="graph-hint"><MousePointer2 size={13} /> {uiLabels.selectNodeHint}</div>
          {layout !== "desktop" && <button type="button" className="toolbar-button" onClick={onOpenInspector}><Info size={15} />{uiLabels.overview}</button>}
        </div>
      </div>
      <div className="graph-canvas" ref={canvasRef}>
        <ReactFlow<ArchitectureFlowNode, Edge>
          key={architecture.id}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => { instanceRef.current = instance; }}
          onPaneClick={() => onSelectNode(undefined)}
          fitView
          fitViewOptions={fitOptions}
          minZoom={0.35}
          maxZoom={1.8}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          ariaLabelConfig={{
            "controls.ariaLabel": uiLabels.zoomControls,
            "controls.zoomIn.ariaLabel": uiLabels.zoomIn,
            "controls.zoomOut.ariaLabel": uiLabels.zoomOut,
            "controls.fitView.ariaLabel": uiLabels.fitView,
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#29303a" />
          <Controls showInteractive={false} position="bottom-right" fitViewOptions={{ ...fitOptions, duration: 180 }} aria-label={uiLabels.zoomControls} />
        </ReactFlow>
        <div className="edge-legend" aria-label={uiLabels.edgeTypes}>
          {(Object.keys(edgeColors) as EdgeKind[]).map((kind) => <span key={kind}><i style={{ background: edgeColors[kind] }} />{uiLabels.edgeKinds[kind]}</span>)}
        </div>
      </div>
    </section>
  );
}
