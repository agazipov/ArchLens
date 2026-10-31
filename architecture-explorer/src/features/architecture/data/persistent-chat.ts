import type { Architecture } from "../model/types";

export const persistentChat: Architecture = {
  id: "persistent-chat", title: "Persistent Chat", shortTitle: "Persistent Chat", category: "realtime-collaboration", level: "system", complexity: "Medium",
  description: "Клиенты держат WebSocket-соединение с realtime backend, сообщения сохраняются в PostgreSQL, а Redis помогает с presence и эфемерной координацией.",
  keyIdea: "Realtime delivery не заменяет долговременный source of truth: соединения эфемерны, история сообщений — нет.",
  suitableFor: ["Командный чат", "Support chat", "Presence и typing indicators"], notIdealFor: ["Редкие однонаправленные обновления", "Приложение без истории сообщений"],
  stack: [{ name: "WebSocket" }, { name: "Socket.IO" }, { name: "PostgreSQL" }, { name: "Redis" }], alternatives: [{ name: "Server-Sent Events" }, { name: "Managed realtime" }],
  tradeoffs: { pros: ["Низкая latency доставки", "Долговременная история", "Presence отделён от durable data"], cons: ["Reconnect и duplicate delivery", "Stateful connections", "Нужно согласовать realtime events и database state"] },
  interactionStyles: ["request-response", "realtime"], tags: ["chat", "websocket", "presence"],
  flowScenarios: [{
    id: "send-durable-message",
    title: "Send durable chat message",
    description: "Realtime backend принимает message, сохраняет history, разрешает live recipients и broadcast-ит подтверждённое событие.",
    scope: "example",
    fidelity: "simplified",
    assumptions: ["WebSocket session уже установлена и authenticated.", "Durable message записывается до broadcast; другие products могут выбрать иной acknowledgement policy.", "Один агрегированный Client node представляет sender и подключённых recipients."],
    sources: [{ title: "RFC 6455: The WebSocket Protocol", url: "https://www.rfc-editor.org/rfc/rfc6455.html" }],
    steps: [
      { id: "send", title: "Client отправляет message по WebSocket", description: "Persistent two-way channel передаёт command без нового HTTP request.", flow: { type: "transfer", from: "client", to: "realtime", edgeId: "client-realtime", kind: "message", label: "send message" } },
      { id: "durability-and-routing", title: "History и routing готовятся параллельно", description: "PostgreSQL сохраняет durable record, Redis предоставляет ephemeral connection routing.", flow: { type: "parallel", steps: [
        { type: "transfer", from: "realtime", to: "postgres", edgeId: "realtime-postgres", kind: "data", label: "persist message" },
        { type: "transfer", from: "realtime", to: "redis", edgeId: "realtime-redis", kind: "data", label: "resolve recipients" },
      ] } },
      { id: "broadcast", title: "Подтверждённое событие доставляется clients", description: "Sender получает canonical id, а online recipients — новое сообщение.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "realtime", to: "client", edgeId: "client-realtime", kind: "message", label: "message created" },
        { type: "outcome", nodeId: "client", outcome: "success", label: "message displayed" },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Chat Client", position: { x: 20, y: 220 }, description: "Загружает историю и поддерживает постоянный канал для новых сообщений.", reason: "Пользователь ожидает немедленную доставку без polling.", responsibilities: ["Message UI", "Reconnect", "Local delivery state"], useCases: ["Send", "Receive", "Presence"] },
    { id: "realtime", kind: "server", label: "Realtime Backend", position: { x: 300, y: 220 }, description: "Аутентифицирует соединения, принимает сообщения и доставляет события подключённым клиентам.", reason: "Долгоживущие соединения требуют отдельного connection lifecycle.", responsibilities: ["Connection registry", "Rooms", "Message commands"], useCases: ["Chat rooms", "Direct messages", "Typing events"], stack: [{ name: "WebSocket" }, { name: "Socket.IO" }] },
    { id: "postgres", kind: "database", label: "PostgreSQL", subtitle: "Message history", position: { x: 580, y: 80 }, description: "Хранит авторитетную историю сообщений и membership.", reason: "После reconnect клиент должен восстановить подтверждённое состояние.", responsibilities: ["Durable messages", "Conversation membership", "Ordering data"], useCases: ["History", "Unread state", "Search source"], stack: [{ name: "PostgreSQL" }] },
    { id: "redis", kind: "infrastructure", label: "Redis", subtitle: "Ephemeral state", position: { x: 580, y: 360 }, description: "Хранит presence, short-lived connection mappings и pub/sub между instances.", reason: "Эфемерное состояние имеет другой lifecycle и latency profile, чем message history.", responsibilities: ["Presence", "Connection routing", "Pub/Sub"], useCases: ["Online users", "Typing", "Multi-instance fan-out"], avoidWhen: ["Единственный source of truth для сообщений"], stack: [{ name: "Redis" }] },
  ],
  edges: [
    { id: "client-realtime", source: "client", target: "realtime", label: "WebSocket", type: "realtime", bidirectional: true },
    { id: "realtime-postgres", source: "realtime", target: "postgres", label: "persist / history", type: "data" },
    { id: "realtime-redis", source: "realtime", target: "redis", label: "presence / pub-sub", type: "data" },
  ],
};
