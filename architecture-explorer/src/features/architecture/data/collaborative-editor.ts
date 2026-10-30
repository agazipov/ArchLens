import type { Architecture } from "../model/types";

export const collaborativeEditor: Architecture = {
  id: "collaborative-editor", title: "Collaborative Editor", shortTitle: "Collaborative Editor", category: "collaboration", level: "system", complexity: "High",
  description: "Clients отправляют операции через realtime gateway, collaboration engine упорядочивает concurrent changes и сохраняет document state.",
  keyIdea: "Совместное редактирование требует отдельного coordination layer, потому что несколько пользователей одновременно меняют одно состояние.",
  suitableFor: ["Документы и whiteboards", "Совместное редактирование", "Presence и live cursors"], notIdealFor: ["Редкие независимые edits", "Обычный CRUD record locking достаточен"],
  stack: [{ name: "WebSocket" }, { name: "OT" }, { name: "CRDT" }, { name: "PostgreSQL" }], alternatives: [{ name: "Pessimistic locking" }, { name: "Last-write-wins" }],
  tradeoffs: { pros: ["Одновременная работа", "Мгновенная доставка edits", "Централизованная persistence policy"], cons: ["Сложное conflict resolution", "Ordering и reconnect", "Нужно compact/rebuild operation history"] },
  interactionStyles: ["realtime", "async"], tags: ["collaboration", "ot", "crdt"],
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
