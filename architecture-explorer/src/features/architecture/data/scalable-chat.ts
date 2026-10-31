import type { Architecture } from "../model/types";

export const scalableChat: Architecture = {
  id: "scalable-chat", title: "Scalable Chat", shortTitle: "Scalable Chat", category: "realtime-collaboration", level: "system", complexity: "High",
  description: "Несколько WebSocket servers обслуживают connections, Pub/Sub маршрутизирует сообщения между instances, а message service сохраняет историю.",
  keyIdea: "При горизонтальном масштабировании connection state распределён, поэтому realtime instances нуждаются в shared routing channel.",
  suitableFor: ["Много одновременных connections", "Несколько realtime instances", "Rooms с участниками на разных servers"], notIdealFor: ["Небольшой чат на одном instance", "Редкие server-push события"],
  stack: [{ name: "WebSocket / Socket.IO" }, { name: "Redis Pub/Sub" }, { name: "NATS" }, { name: "PostgreSQL" }], alternatives: [{ name: "Managed realtime" }, { name: "Persistent Chat" }],
  tradeoffs: { pros: ["Горизонтальное масштабирование connections", "Cross-instance fan-out", "Message persistence отделена от transport"], cons: ["Сложнее ordering", "Connection routing и reconnect", "Pub/Sub добавляет failure mode"] },
  interactionStyles: ["realtime", "async"], tags: ["chat", "websocket", "pubsub"],
  nodes: [
    { id: "clients", kind: "client", label: "Clients", position: { x: 20, y: 220 }, description: "Подключаются к любому доступному realtime instance.", reason: "Connections распределяются между servers для capacity и availability.", responsibilities: ["Connect", "Send", "Receive", "Reconnect"], useCases: ["Rooms", "Direct messages", "Presence"] },
    { id: "servers", kind: "server", label: "WebSocket Servers × N", position: { x: 300, y: 220 }, description: "Управляют локальными connections и отправляют сообщения локальным clients.", reason: "Один process ограничен количеством connections и не обеспечивает redundancy.", responsibilities: ["Connection lifecycle", "Local fan-out", "Authentication"], useCases: ["Socket sessions", "Room subscriptions"] },
    { id: "pubsub", kind: "infrastructure", label: "Pub/Sub", position: { x: 580, y: 220 }, description: "Передаёт realtime events между servers, не знающими connections друг друга.", reason: "Получатели одной room могут находиться на разных instances.", responsibilities: ["Cross-instance routing", "Broadcast", "Presence events"], useCases: ["Room message", "User online"], stack: [{ name: "Redis Pub/Sub" }, { name: "NATS" }] },
    { id: "message-service", kind: "server", label: "Message Service", position: { x: 860, y: 80 }, description: "Проверяет message rules и сохраняет долговременную историю.", reason: "Transport servers не должны становиться единственным владельцем durable messages.", responsibilities: ["Message validation", "Persistence", "History API"], useCases: ["Create message", "Load history"] },
    { id: "database", kind: "database", label: "Message Database", position: { x: 1120, y: 80 }, description: "Хранит канонические messages и conversation membership.", reason: "Pub/Sub эфемерен и не восстанавливает историю после reconnect.", responsibilities: ["Durable history", "Conversation state", "Indexes"], useCases: ["Messages", "Unread cursors"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "clients-servers", source: "clients", target: "servers", label: "WebSocket", type: "realtime", bidirectional: true },
    { id: "servers-pubsub", source: "servers", target: "pubsub", label: "publish / subscribe", type: "event", bidirectional: true },
    { id: "servers-message", source: "servers", target: "message-service", label: "message command", type: "request" },
    { id: "message-db", source: "message-service", target: "database", label: "persist / history", type: "data" },
    { id: "message-pubsub", source: "message-service", target: "pubsub", label: "message accepted", type: "event" },
  ],
};
