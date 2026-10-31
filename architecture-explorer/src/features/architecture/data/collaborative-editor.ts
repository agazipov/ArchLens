import type { Architecture } from "../model/types";

export const collaborativeEditor: Architecture = {
  id: "collaborative-editor", title: "Collaborative Editor", shortTitle: "Collaborative Editor", category: "realtime-collaboration", level: "system", complexity: "High",
  description: "Clients отправляют операции через realtime gateway, collaboration engine упорядочивает concurrent changes и сохраняет document state.",
  keyIdea: "Совместное редактирование требует отдельного coordination layer, потому что несколько пользователей одновременно меняют одно состояние.",
  suitableFor: ["Документы и whiteboards", "Совместное редактирование", "Presence и live cursors"], notIdealFor: ["Редкие независимые edits", "Обычный CRUD record locking достаточен"],
  stack: [{ name: "WebSocket" }, { name: "OT" }, { name: "CRDT" }, { name: "PostgreSQL" }], alternatives: [{ name: "Pessimistic locking" }, { name: "Last-write-wins" }],
  tradeoffs: { pros: ["Одновременная работа", "Мгновенная доставка edits", "Централизованная persistence policy"], cons: ["Сложное conflict resolution", "Ordering и reconnect", "Нужно compact/rebuild operation history"] },
  interactionStyles: ["realtime", "async"], tags: ["collaboration", "ot", "crdt"],
  flowScenarios: [{
    id: "concurrent-edit",
    title: "Concurrent document edit",
    description: "Операция одного клиента объединяется с canonical document state, сохраняется и рассылается остальным участникам.",
    scope: "example",
    fidelity: "simplified",
    assumptions: ["Показана централизованная gateway/engine topology; CRDT не требует единственного central authority.", "Client уже присоединился к document room и применил local edit оптимистично.", "Presence и reconnect sync не показаны."],
    sources: [
      { title: "Yjs: A Collaborative Editor", url: "https://docs.yjs.dev/getting-started/a-collaborative-editor" },
      { title: "Yjs: Document Updates", url: "https://docs.yjs.dev/api/document-updates" },
    ],
    steps: [
      { id: "local-edit", title: "Client создаёт document update", description: "Editor немедленно применяет локальное изменение и отправляет компактную operation.", flow: { type: "transfer", from: "clients", to: "gateway", edgeId: "clients-gateway", kind: "message", label: "document update" } },
      { id: "route", title: "Gateway маршрутизирует update", description: "Document room направляет operation в collaboration engine.", flow: { type: "transfer", from: "gateway", to: "engine", edgeId: "gateway-engine", kind: "message", label: "room update" } },
      { id: "merge", title: "Engine объединяет изменение", description: "Ordering/CRDT logic применяет update к согласованному document state.", flow: { type: "activate", nodeId: "engine", label: "merge update" } },
      { id: "broadcast-persist", title: "Broadcast и persistence идут независимо", description: "Remote clients не обязаны ждать завершения snapshot write, если durability policy это допускает.", flow: { type: "parallel", steps: [
        { type: "sequence", steps: [
          { type: "transfer", from: "engine", to: "gateway", edgeId: "gateway-engine", kind: "message", label: "merged update" },
          { type: "transfer", from: "gateway", to: "clients", edgeId: "clients-gateway", kind: "message", label: "broadcast update" },
        ] },
        { type: "transfer", from: "engine", to: "database", edgeId: "engine-db", kind: "data", label: "operation log" },
      ] } },
      { id: "converged", title: "Clients сходятся к одному состоянию", description: "Получив все updates, участники отображают согласованную версию документа.", flow: { type: "outcome", nodeId: "clients", outcome: "success", label: "document converged" } },
    ],
  }],
  nodes: [
    { id: "clients", kind: "client", label: "Editor Clients", position: { x: 20, y: 170 }, description: "Применяют локальные edits оптимистично и получают remote operations.", reason: "Редактор должен оставаться отзывчивым при сетевой задержке.", responsibilities: ["Local edits", "Optimistic view", "Remote apply"], useCases: ["Text edit", "Cursor", "Selection"] },
    { id: "gateway", kind: "server", label: "Realtime Gateway", position: { x: 300, y: 170 }, description: "Аутентифицирует sessions и маршрутизирует document operations.", reason: "Persistent connections имеют отдельный lifecycle от collaboration logic.", responsibilities: ["Connections", "Document rooms", "Presence"], useCases: ["Join document", "Broadcast"] },
    { id: "engine", kind: "domain", label: "Collaboration Engine", position: { x: 580, y: 170 }, description: "Согласует concurrent edits и формирует каноническую последовательность изменений.", reason: "Без coordination одновременные edits расходятся или перезаписывают друг друга.", responsibilities: ["Ordering", "Conflict resolution", "Versioning"], useCases: ["OT transform", "CRDT merge"], stack: [{ name: "OT" }, { name: "CRDT" }] },
    { id: "database", kind: "database", label: "Document Store", position: { x: 860, y: 170 }, description: "Хранит snapshots, operations и access metadata.", reason: "Document должен восстанавливаться после restart и долгого offline period.", responsibilities: ["Snapshots", "Operation log", "Permissions"], useCases: ["Document load", "Recovery", "History"], stack: [{ name: "PostgreSQL" }, { name: "Object storage" }] },
  ],
  edges: [
    { id: "clients-gateway", source: "clients", target: "gateway", label: "operations / presence", type: "realtime", bidirectional: true },
    { id: "gateway-engine", source: "gateway", target: "engine", label: "ordered stream", type: "realtime", bidirectional: true },
    { id: "engine-db", source: "engine", target: "database", label: "snapshot / operations", type: "data" },
  ],
};
