export type ArchitectureComplexity = "Low" | "Medium" | "High";
export type ArchitectureLevel = "system" | "computer";

export type ArchitectureCategory =
  | "computer-systems" | "web-frontend" | "application-architecture"
  | "messaging-workflows" | "realtime-collaboration" | "data-content-media"
  | "distributed-scale" | "games";

export const architectureCategoryOrder: readonly ArchitectureCategory[] = [
  "computer-systems",
  "web-frontend",
  "application-architecture",
  "messaging-workflows",
  "realtime-collaboration",
  "data-content-media",
  "distributed-scale",
  "games",
];

export type InteractionStyle = "request-response" | "realtime" | "async" | "batch";
export type NodeKind = "client" | "server" | "api" | "domain" | "database" | "infrastructure" | "external" | "compute" | "memory";
export type EdgeKind = "request" | "data" | "event" | "async" | "realtime" | "control";

export interface Technology { name: string; note?: string }
export interface ArchitectureExample { name: string; note: string; sourceUrl: string }

export interface ArchitectureNode {
  id: string;
  kind: NodeKind;
  label: string;
  subtitle?: string;
  position: { x: number; y: number };
  description: string;
  reason: string;
  responsibilities: string[];
  useCases: string[];
  avoidWhen?: string[];
  stack?: Technology[];
  alternatives?: Technology[];
  tradeoffs?: { pros: string[]; cons: string[] };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type: EdgeKind;
  bidirectional?: boolean;
}

export type FlowKind = "request" | "response" | "message" | "data" | "control";
export type FlowDuration = "short" | "normal" | "long";
export type FlowScope = "canonical" | "reference" | "typical" | "example" | "implementation-specific";
export type FlowFidelity = "simplified" | "detailed";

export interface SourceRef {
  title: string;
  url: string;
}

export interface FlowTransferStep {
  type: "transfer";
  from: string;
  to: string;
  kind: FlowKind;
  label?: string;
  edgeId?: string;
  duration?: FlowDuration;
}

export interface FlowActivateStep {
  type: "activate";
  nodeId: string;
  label?: string;
  duration?: FlowDuration;
}

export interface FlowWaitStep {
  type: "wait";
  label: string;
  duration?: FlowDuration;
}

export interface FlowOutcomeStep {
  type: "outcome";
  nodeId?: string;
  outcome: "success" | "miss" | "accepted" | "failure" | "timeout";
  label: string;
  duration?: FlowDuration;
}

export interface FlowSequenceStep {
  type: "sequence";
  steps: FlowStep[];
}

export interface FlowParallelStep {
  type: "parallel";
  steps: FlowStep[];
}

export interface FlowBranchPath {
  id: string;
  label: string;
  selected?: boolean;
  steps: FlowStep[];
}

export interface FlowBranchStep {
  type: "branch";
  condition: string;
  paths: FlowBranchPath[];
}

export type FlowStep =
  | FlowTransferStep | FlowActivateStep | FlowWaitStep | FlowOutcomeStep
  | FlowSequenceStep | FlowParallelStep | FlowBranchStep;

export interface FlowScene {
  id: string;
  title: string;
  description: string;
  flow: FlowStep;
}

export interface FlowScenario {
  id: string;
  title: string;
  description?: string;
  scope?: FlowScope;
  fidelity?: FlowFidelity;
  assumptions?: string[];
  sources?: SourceRef[];
  steps: FlowScene[];
}

export interface Architecture {
  id: string;
  title: string;
  shortTitle: string;
  category: ArchitectureCategory;
  level: ArchitectureLevel;
  complexity: ArchitectureComplexity;
  description: string;
  keyIdea: string;
  suitableFor: string[];
  notIdealFor?: string[];
  stack?: Technology[];
  alternatives?: Technology[];
  examples?: ArchitectureExample[];
  tradeoffs: { pros: string[]; cons: string[] };
  interactionStyles?: InteractionStyle[];
  tags?: string[];
  flowScenarios?: FlowScenario[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
