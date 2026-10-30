import type { ReactNode } from "react";
import { ArrowLeft, Check, CircleAlert, Gauge, Lightbulb, Minus, Plus, X } from "lucide-react";
import type { Architecture, ArchitectureNode } from "@/features/architecture/model/types";
import { uiLabels } from "@/shared/ui/ui-labels";

interface Props {
  architecture: Architecture;
  node?: ArchitectureNode;
  isDrawer: boolean;
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

function TechnologyBadges({ items }: { items: { name: string; note?: string }[] }) {
  return <div className="technology-list">{items.map((item) => <span className="technology-badge" key={item.name}>{item.name}{item.note && <small>{item.note}</small>}</span>)}</div>;
}

function BulletList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "positive" | "negative" }) {
  const Icon = tone === "positive" ? Plus : tone === "negative" ? Minus : Check;
  return <ul className={`inspector-list tone-${tone}`}>{items.map((item) => <li key={item}><Icon size={13} /><span>{item}</span></li>)}</ul>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="inspector-section"><h3>{title}</h3>{children}</section>;
}

function ArchitectureOverview({ architecture }: { architecture: Architecture }) {
  return (
    <>
      <div className="inspector-header overview-header">
        <div className="inspector-kicker">{uiLabels.architectureOverview}</div>
        <h2>{architecture.title}</h2>
        <p>{architecture.description}</p>
        <div className="overview-badges">
          <div className={`complexity complexity-${architecture.complexity.toLowerCase()}`}><Gauge size={13} /> {uiLabels.complexityLevels[architecture.complexity]} {uiLabels.complexity}</div>
          <div className="architecture-level">{uiLabels.architectureLevels[architecture.level]}</div>
        </div>
      </div>
      <div className="inspector-scroll">
        <div className="learning-callout"><Lightbulb size={17} /><div><strong>{uiLabels.mainIdea}</strong><p>{architecture.keyIdea}</p></div></div>
        <Section title={uiLabels.fitFor}><BulletList items={architecture.suitableFor} /></Section>
        {architecture.notIdealFor && <Section title={uiLabels.notIdealFor}><BulletList items={architecture.notIdealFor} tone="negative" /></Section>}
        {architecture.interactionStyles && <Section title={uiLabels.interactionStyles}><div className="technology-list">{architecture.interactionStyles.map((style) => <span className="technology-badge" key={style}>{uiLabels.interactionStyleLabels[style]}</span>)}</div></Section>}
        {architecture.stack && <Section title={uiLabels.recommendedStack}><TechnologyBadges items={architecture.stack} /></Section>}
        {architecture.alternatives && <Section title={uiLabels.architectureAlternatives}><TechnologyBadges items={architecture.alternatives} /></Section>}
        {architecture.examples && <Section title={uiLabels.realExamples}><ul className="source-list">{architecture.examples.map((example) => <li key={example.sourceUrl}><a href={example.sourceUrl} target="_blank" rel="noreferrer">{example.name}</a><span>{example.note}</span></li>)}</ul></Section>}
        <div className="tradeoff-grid"><div><h3><span className="trade-dot positive" />{uiLabels.advantages}</h3><BulletList items={architecture.tradeoffs.pros} tone="positive" /></div><div><h3><span className="trade-dot negative" />{uiLabels.limitations}</h3><BulletList items={architecture.tradeoffs.cons} tone="negative" /></div></div>
      </div>
    </>
  );
}

function NodeInspector({ node, onClose }: { node: ArchitectureNode; onClose: () => void }) {
  return (
    <>
      <div className="inspector-header node-inspector-header">
        <button type="button" className="back-button" onClick={onClose}><ArrowLeft size={14} /> {uiLabels.overview}</button>
        <button type="button" className="close-button" onClick={onClose} aria-label={uiLabels.closeInspector}><X size={16} /></button>
        <div className={`node-kind-pill kind-${node.kind}`}>{uiLabels.nodeKinds[node.kind]}</div>
        <h2>{node.label}</h2>
        {node.subtitle && <div className="inspector-subtitle">{node.subtitle}</div>}
        <p>{node.description}</p>
      </div>
      <div className="inspector-scroll">
        <div className="reason-card"><CircleAlert size={17} /><div><strong>{uiLabels.whyHere}</strong><p>{node.reason}</p></div></div>
        <Section title={uiLabels.responsibility}><BulletList items={node.responsibilities} /></Section>
        <Section title={uiLabels.commonUses}><BulletList items={node.useCases} /></Section>
        {node.avoidWhen && <Section title={uiLabels.avoidUses}><BulletList items={node.avoidWhen} tone="negative" /></Section>}
        {node.stack && <Section title={uiLabels.possibleStack}><TechnologyBadges items={node.stack} /></Section>}
        {node.alternatives && <Section title={uiLabels.alternatives}><TechnologyBadges items={node.alternatives} /></Section>}
        {node.tradeoffs && <Section title={uiLabels.tradeoffs}><div className="node-tradeoffs"><div className="mini-trade positive"><span>{uiLabels.pros}</span><BulletList items={node.tradeoffs.pros} tone="positive" /></div><div className="mini-trade negative"><span>{uiLabels.cons}</span><BulletList items={node.tradeoffs.cons} tone="negative" /></div></div></Section>}
      </div>
    </>
  );
}

export function ArchitectureInspector({ architecture, node, isDrawer, isOpen, onClose, onDismiss }: Props) {
  const inactive = isDrawer && !isOpen;
  return (
    <aside className={`inspector-panel ${isOpen ? "is-open" : ""}`} aria-hidden={inactive} inert={inactive ? true : undefined}>
      {isDrawer && <div className="drawer-panel-bar"><span>{node ? node.label : uiLabels.architectureOverview}</span><button type="button" onClick={onDismiss} aria-label={uiLabels.closeInspectorPanel}><X size={16} /> {uiLabels.closePanel}</button></div>}
      {node ? <NodeInspector node={node} onClose={onClose} /> : <ArchitectureOverview architecture={architecture} />}
    </aside>
  );
}
