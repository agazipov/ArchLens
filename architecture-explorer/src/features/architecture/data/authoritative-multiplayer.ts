import type { Architecture } from "../model/types";

export const authoritativeMultiplayer: Architecture = {
  id: "authoritative-multiplayer", title: "Authoritative Multiplayer", shortTitle: "Authoritative Game", category: "games", level: "system", complexity: "High",
  description: "Game clients отправляют намерения, а authoritative server проверяет правила, обновляет game state и рассылает подтверждённые snapshots.",
  keyIdea: "Клиент не является источником истины: сервер решает, какое игровое состояние действительно.",
  suitableFor: ["Соревновательный multiplayer", "Игры с anti-cheat требованиями", "Общее realtime state"], notIdealFor: ["Полностью single-player game", "Простая asynchronous turn-based игра"],
  stack: [{ name: "WebSocket / UDP-based protocol" }, { name: "Dedicated game server" }, { name: "Redis", note: "optional session coordination" }], alternatives: [{ name: "Peer-to-peer", note: "меньше server cost, слабее trust" }],
  tradeoffs: { pros: ["Единая истина", "Лучше anti-cheat", "Предсказуемое разрешение конфликтов"], cons: ["Server latency влияет на UX", "Нужны prediction и reconciliation", "Game server capacity стоит денег"] },
  interactionStyles: ["realtime"], tags: ["games", "multiplayer", "authoritative-state"],
  flowScenarios: [{
    id: "player-input-tick",
    title: "Player input to authoritative snapshot",
    description: "Client сообщает намерение, server проверяет его, обновляет canonical state и возвращает подтверждённый snapshot.",
    scope: "reference",
    fidelity: "simplified",
    assumptions: ["Показан один input в одном simulation tick.", "Client prediction, rollback, packet loss и interest management не показаны.", "Snapshot может быть delta-compressed, хотя здесь обозначен как единый data transfer."],
    sources: [{ title: "Roblox Creator Hub: Server authority model", url: "https://create.roblox.com/docs/projects/server-authority" }],
    steps: [
      { id: "input", title: "Client отправляет input, а не state", description: "Недоверенный client сообщает намерение игрока через realtime transport.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "clients", to: "gateway", edgeId: "clients-gateway", kind: "message", label: "player input" },
        { type: "transfer", from: "gateway", to: "server", edgeId: "gateway-server", kind: "message", label: "input stream" },
      ] } },
      { id: "validate", title: "Server проверяет input", description: "Сценарий продолжает valid path; invalid input был бы отброшен без изменения canonical state.", flow: { type: "branch", condition: "Input passes server rules", paths: [
        { id: "rejected", label: "Rejected", steps: [
          { type: "outcome", nodeId: "server", outcome: "failure", label: "input rejected" },
        ] },
        { id: "accepted", label: "Accepted", selected: true, steps: [
          { type: "activate", nodeId: "server", label: "simulate tick" },
          { type: "transfer", from: "server", to: "state", edgeId: "server-state", kind: "control", label: "authoritative update" },
        ] },
      ] } },
      { id: "snapshot", title: "Server формирует authoritative snapshot", description: "Canonical state возвращает подтверждённый результат simulation tick.", flow: { type: "transfer", from: "state", to: "server", edgeId: "server-state", kind: "data", label: "world snapshot" } },
      { id: "broadcast", title: "Snapshot возвращается clients", description: "Transport рассылает authoritative state; clients reconciliate локальное представление.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "server", to: "gateway", edgeId: "gateway-server", kind: "data", label: "state update" },
        { type: "transfer", from: "gateway", to: "clients", edgeId: "clients-gateway", kind: "data", label: "snapshot" },
        { type: "outcome", nodeId: "clients", outcome: "success", label: "client reconciled" },
      ] } },
    ],
  }],
  nodes: [
    { id: "clients", kind: "client", label: "Game Clients", subtitle: "Player input", position: { x: 20, y: 170 }, description: "Отправляют input и локально отображают предсказанное состояние.", reason: "Игроку нужен отзывчивый UI, но client state нельзя считать доверенным.", responsibilities: ["Input", "Prediction", "Rendering"], useCases: ["Move", "Shoot", "Interact"], avoidWhen: ["Решение исхода матча"] },
    { id: "gateway", kind: "infrastructure", label: "Realtime Transport", position: { x: 300, y: 170 }, description: "Передаёт частые input и state updates с минимальной задержкой.", reason: "Игровой трафик отличается от обычного page-oriented HTTP.", responsibilities: ["Connections", "Packet delivery", "Rate control"], useCases: ["Input stream", "Snapshots"], stack: [{ name: "WebSocket" }, { name: "UDP-based protocol" }] },
    { id: "server", kind: "server", label: "Authoritative Game Server", position: { x: 580, y: 170 }, description: "Симулирует мир и принимает окончательные решения по правилам игры.", reason: "Недоверенные клиенты не должны самостоятельно изменять shared game state.", responsibilities: ["Simulation", "Validation", "Conflict resolution"], useCases: ["Physics", "Combat", "Scoring"] },
    { id: "state", kind: "infrastructure", label: "Game State", subtitle: "In-memory session", position: { x: 860, y: 170 }, description: "Быстрое состояние текущего матча, обычно живущее вместе с game server session.", reason: "Realtime simulation требует latency ниже, чем постоянная запись каждого tick в database.", responsibilities: ["World snapshot", "Player state", "Match clock"], useCases: ["Active match", "Snapshot broadcast"], avoidWhen: ["Долговременный профиль игрока"] },
  ],
  edges: [
    { id: "clients-gateway", source: "clients", target: "gateway", label: "input / snapshots", type: "realtime", bidirectional: true },
    { id: "gateway-server", source: "gateway", target: "server", label: "realtime stream", type: "realtime", bidirectional: true },
    { id: "server-state", source: "server", target: "state", label: "authoritative updates", type: "data", bidirectional: true },
  ],
};
