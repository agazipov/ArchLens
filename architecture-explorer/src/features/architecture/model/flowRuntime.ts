import type { Architecture, FlowKind, FlowScene, FlowStep, FlowTransferStep } from "./types.ts";

const flowDurationUnits = { short: 0.75, normal: 1, long: 1.5 } as const;

export interface RuntimeFlowParticle {
  id: string;
  edgeId: string;
  kind: FlowKind;
  label?: string;
  direction: "forward" | "reverse";
  start: number;
  end: number;
  phaseCount: number;
}

export interface RuntimeBranchState {
  condition: string;
  paths: { id: string; label: string; selected: boolean }[];
}

export interface RuntimeFlowFrame {
  particlesByEdge: Map<string, RuntimeFlowParticle[]>;
  activeNodeIds: Set<string>;
  activeEdgeIds: Set<string>;
  alternativeNodeIds: Set<string>;
  alternativeEdgeIds: Set<string>;
  branches: RuntimeBranchState[];
  kinds: FlowKind[];
  phaseCount: number;
}

function stepDuration(step: Extract<FlowStep, { duration?: unknown }>) {
  return flowDurationUnits[step.duration ?? "normal"];
}

function resolveTransferEdge(architecture: Architecture, transfer: FlowTransferStep) {
  if (transfer.edgeId) return architecture.edges.find((edge) => edge.id === transfer.edgeId);
  return architecture.edges.find((edge) =>
    (edge.source === transfer.from && edge.target === transfer.to)
    || (edge.source === transfer.to && edge.target === transfer.from));
}

export function buildRuntimeFrame(architecture: Architecture, scene?: FlowScene): RuntimeFlowFrame {
  const particlesByEdge = new Map<string, RuntimeFlowParticle[]>();
  const particles: RuntimeFlowParticle[] = [];
  const activeNodeIds = new Set<string>();
  const activeEdgeIds = new Set<string>();
  const alternativeNodeIds = new Set<string>();
  const alternativeEdgeIds = new Set<string>();
  const branches: RuntimeBranchState[] = [];
  const kinds = new Set<FlowKind>();

  function collectAlternative(step: FlowStep): void {
    if (step.type === "transfer") {
      alternativeNodeIds.add(step.from);
      alternativeNodeIds.add(step.to);
      const edge = resolveTransferEdge(architecture, step);
      if (edge) alternativeEdgeIds.add(edge.id);
    } else if (step.type === "activate") alternativeNodeIds.add(step.nodeId);
    else if (step.type === "outcome" && step.nodeId) alternativeNodeIds.add(step.nodeId);
    else if (step.type === "sequence" || step.type === "parallel") step.steps.forEach(collectAlternative);
    else if (step.type === "branch") step.paths.forEach((path) => path.steps.forEach(collectAlternative));
  }

  function visit(step: FlowStep, start: number): number {
    if (step.type === "transfer") {
      const edge = resolveTransferEdge(architecture, step);
      const end = start + stepDuration(step);
      activeNodeIds.add(step.from);
      activeNodeIds.add(step.to);
      kinds.add(step.kind);
      if (edge) {
        activeEdgeIds.add(edge.id);
        particles.push({
          id: `${edge.id}-${particles.length}`,
          edgeId: edge.id,
          kind: step.kind,
          label: step.label,
          direction: edge.source === step.from ? "forward" : "reverse",
          start,
          end,
          phaseCount: 1,
        });
      }
      return end;
    }
    if (step.type === "activate") {
      activeNodeIds.add(step.nodeId);
      return start + stepDuration(step);
    }
    if (step.type === "wait") return start + stepDuration(step);
    if (step.type === "outcome") {
      if (step.nodeId) activeNodeIds.add(step.nodeId);
      return start + stepDuration(step);
    }
    if (step.type === "sequence") return step.steps.reduce((cursor, child) => visit(child, cursor), start);
    if (step.type === "parallel") return Math.max(start, ...step.steps.map((child) => visit(child, start)));

    const selectedPath = step.paths.find((path) => path.selected) ?? step.paths[0];
    branches.push({ condition: step.condition, paths: step.paths.map((path) => ({ id: path.id, label: path.label, selected: path.id === selectedPath.id })) });
    step.paths.filter((path) => path.id !== selectedPath.id).forEach((path) => path.steps.forEach(collectAlternative));
    return selectedPath.steps.reduce((cursor, child) => visit(child, cursor), start);
  }

  const phaseCount = scene ? Math.max(1, visit(scene.flow, 0)) : 1;
  particles.forEach((particle) => {
    particle.phaseCount = phaseCount;
    const edgeParticles = particlesByEdge.get(particle.edgeId) ?? [];
    edgeParticles.push(particle);
    particlesByEdge.set(particle.edgeId, edgeParticles);
  });

  return { particlesByEdge, activeNodeIds, activeEdgeIds, alternativeNodeIds, alternativeEdgeIds, branches, kinds: [...kinds], phaseCount };
}
