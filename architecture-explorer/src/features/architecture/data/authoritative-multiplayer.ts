import type { Architecture } from "../model/types";

export const authoritativeMultiplayer: Architecture = {
  id: "authoritative-multiplayer", title: "Authoritative Multiplayer", shortTitle: "Authoritative Game", category: "games", level: "system", complexity: "High",
  description: "Game clients отправляют намерения, а authoritative server проверяет правила, обновляет game state и рассылает подтверждённые snapshots.",
  keyIdea: "Клиент не является источником истины: сервер решает, какое игровое состояние действительно.",
  suitableFor: ["Соревновательный multiplayer", "Игры с anti-cheat требованиями", "Общее realtime state"], notIdealFor: ["Полностью single-player game", "Простая asynchronous turn-based игра"],
  stack: [{ name: "WebSocket / UDP-based protocol" }, { name: "Dedicated game server" }, { name: "Redis", note: "optional session coordination" }], alternatives: [{ name: "Peer-to-peer", note: "меньше server cost, слабее trust" }],
  tradeoffs: { pros: ["Единая истина", "Лучше anti-cheat", "Предсказуемое разрешение конфликтов"], cons: ["Server latency влияет на UX", "Нужны prediction и reconciliation", "Game server capacity стоит денег"] },
  interactionStyles: ["realtime"], tags: ["games", "multiplayer", "authoritative-state"],
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
