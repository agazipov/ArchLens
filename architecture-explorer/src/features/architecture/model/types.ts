export type ArchitectureComplexity = "Low" | "Medium" | "High";
export type ArchitectureLevel = "system" | "computer";

export type ArchitectureCategory =
  | "fundamentals" | "commerce" | "business" | "realtime" | "collaboration"
  | "games" | "content" | "media" | "notifications" | "data" | "distributed";

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
  label?: string;
  type: EdgeKind;
  bidirectional?: boolean;
}

export interface ArchitectureWalkthroughStep {
  nodeId: string;
  edgeIds?: string[];
  title: string;
  description: string;
}

export interface ArchitectureWalkthrough {
  title: string;
  example: string;
  steps: ArchitectureWalkthroughStep[];
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
  walkthrough?: ArchitectureWalkthrough;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
