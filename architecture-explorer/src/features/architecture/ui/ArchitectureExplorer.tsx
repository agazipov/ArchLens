"use client";

import { useState } from "react";
import { Box, ChevronRight, CircleDot, Layers3, Search, X } from "lucide-react";
import type { Architecture } from "../model/types";
import { uiLabels } from "@/shared/ui/ui-labels";

interface Props {
  architectures: Architecture[];
  selectedId: string;
  onSelect: (id: string) => void;
  isDrawer: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureExplorer({ architectures, selectedId, onSelect, isDrawer, isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const visibleArchitectures = normalizedQuery
    ? architectures.filter((architecture) => [architecture.title, architecture.shortTitle, uiLabels.categories[architecture.category], ...(architecture.tags ?? [])].some((value) => value.toLocaleLowerCase("ru").includes(normalizedQuery)))
    : architectures;
  const groups = Map.groupBy(visibleArchitectures, (architecture) => architecture.category);

  return (
    <aside className={`explorer-panel ${isOpen ? "is-open" : ""}`} aria-hidden={isDrawer && !isOpen} inert={isDrawer && !isOpen ? true : undefined}>
      <div className="brand-row">
        <div className="brand-mark"><Layers3 size={18} strokeWidth={1.8} /></div>
        <div><div className="brand-name">ArchLens</div><div className="brand-subtitle">{uiLabels.brandSubtitle}</div></div>
        {isDrawer && <button type="button" className="panel-close-button" onClick={onClose} aria-label={uiLabels.closeExplorer}><X size={17} /></button>}
      </div>

      <div className="explorer-heading">
        <span>{uiLabels.architectureExplorer}</span>
        <span className="count-badge">{normalizedQuery ? `${visibleArchitectures.length}/${architectures.length}` : architectures.length}</span>
      </div>

      <label className="explorer-search">
        <Search size={14} />
        <span className="sr-only">{uiLabels.architectureSearch}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiLabels.architectureSearchPlaceholder} />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Очистить поиск"><X size={13} /></button>}
      </label>

      <nav aria-label={uiLabels.architectureSelection} className="architecture-nav">
        {visibleArchitectures.length === 0 && <p className="architecture-empty">{uiLabels.noArchitecturesFound}</p>}
        {[...groups.entries()].map(([category, items]) => (
          <details key={category} className="nav-group" open>
            <summary className="nav-group-label"><span>{uiLabels.categories[category]}</span><span>{items.length}</span></summary>
            <div className="nav-group-items">{items.map((architecture) => {
              const active = architecture.id === selectedId;
              return (
                <button type="button" key={architecture.id} onClick={() => onSelect(architecture.id)} className={`architecture-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                  <span className="architecture-link-icon">{active ? <CircleDot size={15} /> : <Box size={15} />}</span>
                  <span className="architecture-link-copy"><strong>{architecture.shortTitle}</strong><small>{uiLabels.complexityLevels[architecture.complexity]} {uiLabels.complexity}</small></span>
                  <ChevronRight size={14} className="architecture-chevron" />
                </button>
              );
            })}</div>
          </details>
        ))}
      </nav>

      <div className="explorer-footer">
        <div className="footer-status"><span className="status-dot" /> {uiLabels.learningMode}</div>
        <p>{uiLabels.learningHint}</p>
      </div>
    </aside>
  );
}
