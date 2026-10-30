"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronLeft, ChevronRight, Info, Menu, MousePointer2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Play, X } from "lucide-react";
import type { Architecture, EdgeKind } from "@/features/architecture/model/types";
import type { WorkspaceLayout } from "@/features/architecture/ui/ArchitectureWorkspace";
import { uiLabels } from "@/shared/ui/ui-labels";
import { ArchitectureNodeCard, type ArchitectureFlowNode } from "./ArchitectureNodeCard";

const nodeTypes: NodeTypes = { architectureNode: ArchitectureNodeCard };

function ArchitectureEdge({
  id,
  label,
  data,
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
  const layout = data?.layout as WorkspaceLayout | undefined;
  const isReturnLane = id === "execution-cache";
  const routeCenterY = isReturnLane
    ? layout === "compact"
      ? (sourceY + targetY) / 2 + 32
      : Math.max(sourceY, targetY) + 104
    : undefined;
  const [path, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    centerY: routeCenterY,
    borderRadius: 10,
  });
  const isHorizontal = !isReturnLane && Math.abs(sourceY - targetY) < 16;
  const labelX = isHorizontal ? (sourceX + targetX) / 2 : defaultLabelX;
  const labelY = isHorizontal ? Math.min(sourceY, targetY) - 58 : defaultLabelY;
  const showFlowParticle = data?.showFlowParticle === true;
  const particleColor = typeof style?.stroke === "string" ? style.stroke : "#9a86d8";

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
      {showFlowParticle && (
        <circle className="flow-particle" r="4.5" fill={particleColor} aria-hidden="true">
          <animateMotion
            path={path}
            dur="2s"
            repeatCount="indefinite"
            keyPoints="0;1;1"
            keyTimes="0;0.65;1"
            calcMode="spline"
            keySplines="0.12 0 0.39 0; 0 0 1 1"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes="0;0.035;0.62;0.65;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
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
  explorerCollapsed: boolean;
  inspectorCollapsed: boolean;
  onToggleExplorer: () => void;
  onToggleInspector: () => void;
  backgroundInert: boolean;
}

const compactProcessorPositions: Record<string, { x: number; y: number }> = {
  "main-memory": { x: 0, y: 0 },
  cache: { x: 220, y: 0 },
  fetch: { x: 0, y: 160 },
  "decode-control": { x: 220, y: 160 },
  registers: { x: 0, y: 320 },
  execution: { x: 220, y: 320 },
  clock: { x: 110, y: 480 },
};

export function ArchitectureGraph({
  architecture,
  architectures,
  selectedNodeId,
  layout,
  onSelectArchitecture,
  onSelectNode,
  onOpenExplorer,
  onOpenInspector,
  explorerCollapsed,
  inspectorCollapsed,
  onToggleExplorer,
  onToggleInspector,
  backgroundInert,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance<ArchitectureFlowNode, Edge> | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);
  const compactProcessor = layout === "compact" && architecture.id === "processor-architecture";
  const activeStep = walkthroughStep === null ? undefined : architecture.walkthrough?.steps[walkthroughStep];
  const currentStepNumber = walkthroughStep ?? 0;
  const fitOptions = useMemo(() => ({ padding: compactProcessor ? 0.08 : 0.2, maxZoom: compactProcessor ? 1 : 1.1 }), [compactProcessor]);

  const fitGraph = useCallback((duration = 180, preferReadable = false) => {
    requestAnimationFrame(() => {
      const instance = instanceRef.current;
      if (!instance) return;
      void instance.fitView({ ...fitOptions, duration }).then(() => {
        if (preferReadable && layout === "desktop" && architecture.id === "processor-architecture") {
          void instance.zoomTo(Math.min(instance.getZoom() * 1.22, 0.92), { duration });
        }
      });
    });
  }, [architecture.id, fitOptions, layout]);

  const nodes = useMemo<ArchitectureFlowNode[]>(() => architecture.nodes.map((node) => {
    const selectedRelated = !selectedNodeId || node.id === selectedNodeId || architecture.edges.some((edge) => (edge.source === selectedNodeId && edge.target === node.id) || (edge.target === selectedNodeId && edge.source === node.id));
    return {
    id: node.id,
    type: "architectureNode",
    position: compactProcessor ? compactProcessorPositions[node.id] ?? node.position : node.position,
    data: {
      architectureNode: node,
      onActivate: onSelectNode,
      walkthroughActive: activeStep?.nodeId === node.id,
      muted: activeStep ? activeStep.nodeId !== node.id : !selectedRelated,
    },
    selected: node.id === selectedNodeId,
    draggable: false,
    focusable: false,
    selectable: true,
  };
  }), [activeStep, architecture, compactProcessor, selectedNodeId, onSelectNode]);

  const edges = useMemo<Edge[]>(() => architecture.edges.map((edge) => {
    const selectedRelated = !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
    const walkthroughRelated = !activeStep || activeStep.edgeIds?.includes(edge.id) === true;
    const related = selectedNodeId ? selectedRelated : activeStep ? walkthroughRelated : true;
    const idleFlow = !selectedNodeId && !activeStep;
    const color = edgeColors[edge.type];
    return {
      ...edge,
      type: "architectureEdge",
      animated: false,
      data: { showFlowParticle: idleFlow, layout },
      className: selectedNodeId || activeStep ? (related ? "is-related" : "is-muted") : undefined,
      style: { stroke: color, strokeWidth: related && (selectedNodeId || activeStep) ? 2.8 : 2 },
      markerStart: edge.bidirectional ? { type: MarkerType.ArrowClosed, width: 20, height: 20, color } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color },
      focusable: false,
      ariaLabel: `${edge.source} — ${edge.target}: ${edge.label ?? uiLabels.edgeKinds[edge.type]}`,
    };
  }), [activeStep, architecture, layout, selectedNodeId]);

  const presentEdgeKinds = useMemo(() => [...new Set(architecture.edges.map((edge) => edge.type))], [architecture.edges]);
  const hasBidirectionalEdges = architecture.edges.some((edge) => edge.bidirectional);

  useEffect(() => {
    const timer = window.setTimeout(() => fitGraph(0, true), 30);
    return () => window.clearTimeout(timer);
  }, [architecture.id, fitGraph]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitGraph(180, true), 190);
    return () => window.clearTimeout(timer);
  }, [layout, fitGraph]);

  useEffect(() => {
    if (layout !== "compact" || walkthroughStep === null) return;
    canvasRef.current?.closest<HTMLElement>(".workspace-shell")?.scrollTo({ top: 0, left: 0 });
  }, [layout, walkthroughStep]);

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
      timer = window.setTimeout(() => fitGraph(180, true), 140);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [fitGraph]);

  return (
    <section className="graph-shell" aria-label={`${uiLabels.graphLabel} «${architecture.title}»`} aria-hidden={backgroundInert} inert={backgroundInert ? true : undefined}>
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
          {layout === "desktop" && <button type="button" className="toolbar-icon-button" onClick={onToggleExplorer} aria-label={explorerCollapsed ? uiLabels.showExplorer : uiLabels.hideExplorer}>{explorerCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>}
          <div className="graph-title"><div className="graph-eyebrow">{uiLabels.interactiveMap}</div><h1>{architecture.title}</h1></div>
        </div>
        <div className="toolbar-actions">
          <div className="graph-hint"><MousePointer2 size={13} /> {uiLabels.selectNodeHint}</div>
          {layout === "desktop" && <button type="button" className="toolbar-icon-button" onClick={onToggleInspector} aria-label={inspectorCollapsed ? uiLabels.showInspector : uiLabels.hideInspector}>{inspectorCollapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}</button>}
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
          proOptions={{ hideAttribution: true }}
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
        {architecture.walkthrough && walkthroughStep === null && <button type="button" className="walkthrough-launch" onClick={() => setWalkthroughStep(0)}><Play size={15} fill="currentColor" /> {uiLabels.startWalkthrough}</button>}
        {architecture.walkthrough && activeStep && (
          <section className="walkthrough-card" aria-live="polite">
            <div className="walkthrough-card-heading"><span>{architecture.walkthrough.title}</span><button type="button" onClick={() => setWalkthroughStep(null)} aria-label={uiLabels.closeWalkthrough}><X size={15} /></button></div>
            <div className="walkthrough-progress">{uiLabels.step} {currentStepNumber + 1} / {architecture.walkthrough.steps.length}</div>
            <h2>{activeStep.title}</h2>
            <p>{activeStep.description}</p>
            <code>{architecture.walkthrough.example}</code>
            <div className="walkthrough-actions">
              <button type="button" disabled={currentStepNumber === 0} onClick={() => setWalkthroughStep((step) => step === null ? 0 : Math.max(0, step - 1))}><ChevronLeft size={15} /> {uiLabels.previousStep}</button>
              {currentStepNumber < architecture.walkthrough.steps.length - 1 ? <button type="button" onClick={() => setWalkthroughStep((step) => step === null ? 0 : step + 1)}>{uiLabels.nextStep} <ChevronRight size={15} /></button> : <button type="button" onClick={() => setWalkthroughStep(null)}>{uiLabels.finishWalkthrough}</button>}
            </div>
          </section>
        )}
        <details className="edge-legend" aria-label={uiLabels.edgeTypes} open={layout === "compact" ? undefined : true}>
          <summary>{uiLabels.edgeTypes}</summary>
          <div className="edge-legend-content">
            {presentEdgeKinds.map((kind) => <span key={kind}><i style={{ background: edgeColors[kind] }} />{uiLabels.edgeKinds[kind]}</span>)}
            <span className="edge-direction">→ {uiLabels.arrowDirection}</span>
            {hasBidirectionalEdges && <span className="edge-direction">↔ {uiLabels.bidirectional}</span>}
          </div>
        </details>
      </div>
    </section>
  );
}
