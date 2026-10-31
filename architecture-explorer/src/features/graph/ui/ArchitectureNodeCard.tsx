import { Cpu, Database, Globe2, Layers2, MemoryStick, Server, SquareCode, Workflow, Wrench } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ArchitectureNode, NodeKind } from "@/features/architecture/model/types";
import { uiLabels } from "@/shared/ui/ui-labels";

export type ArchitectureFlowNode = Node<{
  architectureNode: ArchitectureNode;
  onActivate: (id: string) => void;
  flowActive?: boolean;
  branchAlternative?: boolean;
  muted?: boolean;
}, "architectureNode">;

const kindIcons: Record<NodeKind, typeof Server> = {
  client: SquareCode,
  server: Server,
  api: Globe2,
  domain: Layers2,
  database: Database,
  infrastructure: Workflow,
  external: Wrench,
  compute: Cpu,
  memory: MemoryStick,
};

export function ArchitectureNodeCard({ data, selected }: NodeProps<ArchitectureFlowNode>) {
  const node = data.architectureNode;
  const Icon = kindIcons[node.kind];
  const kindLabel = uiLabels.nodeKinds[node.kind];

  return (
    <button
      type="button"
      className={`graph-node kind-${node.kind} ${selected ? "is-selected" : ""} ${data.flowActive ? "is-flow-active" : ""} ${data.branchAlternative ? "is-branch-alternative" : ""} ${data.muted ? "is-muted" : ""}`}
      aria-label={`${node.label} — ${kindLabel}. ${uiLabels.openNodeDetails}`}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        data.onActivate(node.id);
      }}
    >
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle id="target-upper" type="target" position={Position.Left} className="node-handle node-handle-route" style={{ top: "32%" }} />
      <Handle id="target-lower" type="target" position={Position.Left} className="node-handle node-handle-route" style={{ top: "68%" }} />
      <span className="node-topline"><span>{kindLabel}</span><Icon size={14} /></span>
      <span className="node-title">{node.label}</span>
      {node.subtitle && <span className="node-subtitle">{node.subtitle}</span>}
      <span className="node-tooltip" role="tooltip">{node.description}</span>
      <Handle type="source" position={Position.Right} className="node-handle" />
      <Handle id="source-upper" type="source" position={Position.Right} className="node-handle node-handle-route" style={{ top: "32%" }} />
      <Handle id="source-lower" type="source" position={Position.Right} className="node-handle node-handle-route" style={{ top: "68%" }} />
    </button>
  );
}
