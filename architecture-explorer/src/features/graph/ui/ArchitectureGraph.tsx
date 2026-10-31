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
import { buildRuntimeFrame, type RuntimeFlowParticle } from "@/features/architecture/model/flowRuntime";
import { architectureCategoryOrder, type Architecture, type EdgeKind, type FlowKind } from "@/features/architecture/model/types";
import type { WorkspaceLayout } from "@/features/architecture/ui/ArchitectureWorkspace";
import { uiLabels } from "@/shared/ui/ui-labels";
import { ArchitectureNodeCard, type ArchitectureFlowNode } from "./ArchitectureNodeCard";

const nodeTypes: NodeTypes = { architectureNode: ArchitectureNodeCard };

const FLOW_HOP_DURATION_SECONDS = 0.65;
const FLOW_REPEAT_DELAY_SECONDS = 0.7;
function flowRatio(seconds: number, cycleSeconds: number) {
  return Number((seconds / cycleSeconds).toFixed(6));
}

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
  const flowParticles = (data?.flowParticles as RuntimeFlowParticle[] | undefined) ?? [];

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
      {flowParticles.map((particle) => {
        const cycleSeconds = particle.phaseCount * FLOW_HOP_DURATION_SECONDS + FLOW_REPEAT_DELAY_SECONDS;
        const travelStart = particle.start * FLOW_HOP_DURATION_SECONDS;
        const travelEnd = particle.end * FLOW_HOP_DURATION_SECONDS;
        const fadeSeconds = 0.06;
        const fromPoint = particle.direction === "forward" ? 0 : 1;
        const toPoint = particle.direction === "forward" ? 1 : 0;
        const startsImmediately = travelStart === 0;
        const motionKeyPoints = startsImmediately ? `${fromPoint};${toPoint};${toPoint}` : `${fromPoint};${fromPoint};${toPoint};${toPoint}`;
        const motionKeyTimes = startsImmediately
          ? `0;${flowRatio(travelEnd, cycleSeconds)};1`
          : `0;${flowRatio(travelStart, cycleSeconds)};${flowRatio(travelEnd, cycleSeconds)};1`;
        const opacityValues = startsImmediately ? "0;1;1;0;0" : "0;0;1;1;0;0";
        const opacityKeyTimes = startsImmediately
          ? `0;${flowRatio(fadeSeconds, cycleSeconds)};${flowRatio(travelEnd - fadeSeconds, cycleSeconds)};${flowRatio(travelEnd, cycleSeconds)};1`
          : `0;${flowRatio(travelStart, cycleSeconds)};${flowRatio(travelStart + fadeSeconds, cycleSeconds)};${flowRatio(travelEnd - fadeSeconds, cycleSeconds)};${flowRatio(travelEnd, cycleSeconds)};1`;
        return (
          <circle key={particle.id} className={`flow-particle flow-kind-${particle.kind}`} r="4.5" fill={flowParticleColors[particle.kind]} aria-hidden="true">
            <animateMotion path={path} dur={`${cycleSeconds}s`} repeatCount="indefinite" keyPoints={motionKeyPoints} keyTimes={motionKeyTimes} calcMode="linear" />
            <animate attributeName="opacity" values={opacityValues} keyTimes={opacityKeyTimes} dur={`${cycleSeconds}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
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

const flowParticleColors: Record<FlowKind, string> = {
  request: "#6ea4df",
  response: "#66c6b2",
  message: "#d5a75d",
  data: "#a892e2",
  control: "#d27f7f",
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
  const [scenarioSelectorOpen, setScenarioSelectorOpen] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);
  const compactProcessor = layout === "compact" && architecture.id === "processor-architecture";
  const flowScenarios = architecture.flowScenarios ?? [];
  const activeScenario = flowScenarios.find((scenario) => scenario.id === activeScenarioId);
  const activeScene = walkthroughStep === null ? undefined : activeScenario?.steps[walkthroughStep];
  const currentStepNumber = walkthroughStep ?? 0;
  const runtimeFrame = buildRuntimeFrame(architecture, activeScene);
  const fitOptions = useMemo(() => ({ padding: compactProcessor ? 0.08 : 0.2, maxZoom: compactProcessor ? 1 : 1.1 }), [compactProcessor]);

  function startScenario(scenarioId: string) {
    setActiveScenarioId(scenarioId);
    setWalkthroughStep(0);
    setScenarioSelectorOpen(false);
    onSelectNode(undefined);
  }

  function closeWalkthrough() {
    setActiveScenarioId(null);
    setWalkthroughStep(null);
    setScenarioSelectorOpen(false);
  }

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

  const nodes: ArchitectureFlowNode[] = architecture.nodes.map((node) => {
    const selectedRelated = !selectedNodeId || node.id === selectedNodeId || architecture.edges.some((edge) => (edge.source === selectedNodeId && edge.target === node.id) || (edge.target === selectedNodeId && edge.source === node.id));
    const flowActive = Boolean(activeScene && runtimeFrame.activeNodeIds.has(node.id));
    const branchAlternative = Boolean(activeScene && runtimeFrame.alternativeNodeIds.has(node.id) && !flowActive);
    return {
      id: node.id,
      type: "architectureNode",
      position: compactProcessor ? compactProcessorPositions[node.id] ?? node.position : node.position,
      data: {
        architectureNode: node,
        onActivate: onSelectNode,
        flowActive,
        branchAlternative,
        muted: activeScene ? !flowActive : !selectedRelated,
      },
      selected: node.id === selectedNodeId,
      draggable: false,
      focusable: false,
      selectable: true,
    };
  });

  const edges: Edge[] = architecture.edges.map((edge) => {
    const selectedRelated = !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
    const flowRelated = runtimeFrame.activeEdgeIds.has(edge.id);
    const branchAlternative = runtimeFrame.alternativeEdgeIds.has(edge.id) && !flowRelated;
    const related = selectedNodeId ? selectedRelated : activeScene ? flowRelated : true;
    const color = edgeColors[edge.type];
    return {
      ...edge,
      type: "architectureEdge",
      animated: false,
      data: { layout, flowParticles: runtimeFrame.particlesByEdge.get(edge.id) ?? [] },
      className: selectedNodeId || activeScene ? (related ? "is-related" : branchAlternative ? "is-branch-alternative" : "is-muted") : undefined,
      style: { stroke: color, strokeWidth: related && (selectedNodeId || activeScene) ? 2.8 : 2 },
      markerStart: edge.bidirectional ? { type: MarkerType.ArrowClosed, width: 20, height: 20, color } : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color },
      focusable: false,
      ariaLabel: `${edge.source} — ${edge.target}: ${edge.label ?? uiLabels.edgeKinds[edge.type]}`,
    };
  });

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
    if (layout !== "compact" || !activeScene) return;
    canvasRef.current?.closest<HTMLElement>(".workspace-shell")?.scrollTo({ top: 0, left: 0 });
  }, [activeScene, layout]);

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
                {architectureCategoryOrder.map((category) => {
                  const items = architectures.filter((item) => item.category === category);
                  if (items.length === 0) return null;
                  return (
                  <optgroup key={category} label={uiLabels.categories[category]}>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
                  </optgroup>
                  );
                })}
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
        {flowScenarios.length > 0 && !activeScenario && !scenarioSelectorOpen && (
          <button type="button" className="walkthrough-launch" onClick={() => flowScenarios.length === 1 ? startScenario(flowScenarios[0].id) : setScenarioSelectorOpen(true)}><Play size={15} fill="currentColor" /> {uiLabels.startWalkthrough}</button>
        )}
        {scenarioSelectorOpen && (
          <section className="walkthrough-card scenario-selector" aria-label={uiLabels.selectScenario}>
            <div className="walkthrough-card-heading"><span>{uiLabels.selectScenario}</span><button type="button" onClick={closeWalkthrough} aria-label={uiLabels.closeWalkthrough}><X size={15} /></button></div>
            <div className="scenario-list">{flowScenarios.map((scenario) => <button type="button" key={scenario.id} onClick={() => startScenario(scenario.id)}><strong>{scenario.title}</strong>{scenario.description && <span>{scenario.description}</span>}</button>)}</div>
          </section>
        )}
        {activeScenario && activeScene && (
          <section className="walkthrough-card" aria-live="polite">
            <div className="walkthrough-card-heading"><span>{activeScenario.title}</span><button type="button" onClick={closeWalkthrough} aria-label={uiLabels.closeWalkthrough}><X size={15} /></button></div>
            <div className="flow-metadata">
              {activeScenario.scope && <span>{uiLabels.flowScopes[activeScenario.scope]}</span>}
              {activeScenario.fidelity && <span>{uiLabels.flowFidelities[activeScenario.fidelity]}</span>}
            </div>
            <div className="walkthrough-progress">{uiLabels.step} {currentStepNumber + 1} / {activeScenario.steps.length}</div>
            <h2>{activeScene.title}</h2>
            <p>{activeScene.description}</p>
            {runtimeFrame.kinds.length > 0 && <div className="flow-kind-list">{runtimeFrame.kinds.map((kind) => <span key={kind}><i style={{ background: flowParticleColors[kind] }} />{uiLabels.flowKinds[kind]}</span>)}</div>}
            {runtimeFrame.branches.map((branch) => <div className="flow-branch" key={branch.condition}><strong>{branch.condition}</strong><div>{branch.paths.map((path) => <span key={path.id} className={path.selected ? "is-selected" : "is-muted"}>{path.label}{path.selected && <small>{uiLabels.selectedBranch}</small>}</span>)}</div></div>)}
            {activeScenario.assumptions && activeScenario.assumptions.length > 0 && <details className="walkthrough-assumptions"><summary>{uiLabels.assumptions}</summary><ul>{activeScenario.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details>}
            {activeScenario.sources && activeScenario.sources.length > 0 && <div className="flow-sources">{activeScenario.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div>}
            <div className="walkthrough-actions">
              <button type="button" disabled={currentStepNumber === 0} onClick={() => setWalkthroughStep((step) => step === null ? 0 : Math.max(0, step - 1))}><ChevronLeft size={15} /> {uiLabels.previousStep}</button>
              {currentStepNumber < activeScenario.steps.length - 1 ? <button type="button" onClick={() => setWalkthroughStep((step) => step === null ? 0 : step + 1)}>{uiLabels.nextStep} <ChevronRight size={15} /></button> : <button type="button" onClick={closeWalkthrough}>{uiLabels.finishWalkthrough}</button>}
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
