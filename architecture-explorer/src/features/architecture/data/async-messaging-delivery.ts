import type { Architecture } from "../model/types";

export const asyncMessagingDelivery: Architecture = {
  id: "async-messaging-delivery", title: "Async Messaging Delivery", shortTitle: "Async Delivery", category: "realtime", level: "system", complexity: "High",
  description: "Message API принимает сообщение, queue буферизует delivery work, а workers выбирают online WebSocket, push или email fallback для получателей.",
  keyIdea: "Принять сообщение и доставить его всем получателям — разные этапы; асинхронный fan-out защищает sender latency от числа и доступности recipients.",
  suitableFor: ["Fan-out нескольким получателям", "Online и offline delivery", "Пиковый message traffic"], notIdealFor: ["Небольшой чат с прямой delivery", "Строго синхронное подтверждение каждого получателя"],
  stack: [{ name: "RabbitMQ / Kafka / NATS" }, { name: "WebSocket" }, { name: "Push provider" }, { name: "Email provider" }], alternatives: [{ name: "Persistent Chat" }, { name: "Notification Service" }],
  tradeoffs: { pros: ["Sender response не зависит от fan-out", "Каналы масштабируются отдельно", "Retry для offline delivery"], cons: ["Eventual delivery", "Дедупликация и ordering", "Сложный per-recipient status"] },
  interactionStyles: ["request-response", "async", "realtime"], tags: ["messaging", "fanout", "delivery"],
  nodes: [
    { id: "sender", kind: "client", label: "Sender", position: { x: 20, y: 220 }, description: "Отправляет message command и получает подтверждение приёма.", reason: "Пользователь не должен ждать delivery каждому recipient.", responsibilities: ["Compose message", "Submit", "Show accepted state"], useCases: ["Direct message", "Group message"] },
    { id: "api", kind: "api", label: "Message API", position: { x: 280, y: 220 }, description: "Авторизует sender, сохраняет message intent и создаёт delivery jobs.", reason: "Приём сообщения остаётся доверенной синхронной границей.", responsibilities: ["Authorization", "Validation", "Recipient expansion"], useCases: ["Send message", "Create delivery jobs"] },
    { id: "queue", kind: "infrastructure", label: "Delivery Queue", position: { x: 540, y: 220 }, description: "Буферизует jobs для каждого recipient или partition.", reason: "Fan-out rate может существенно превышать sender request rate.", responsibilities: ["Buffering", "Partitioning", "Retry"], useCases: ["Recipient jobs", "Backpressure"], stack: [{ name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }] },
    { id: "workers", kind: "server", label: "Delivery Workers × N", position: { x: 800, y: 220 }, description: "Определяют доступность recipient и выбирают подходящий channel.", reason: "Channel policy и retries не должны жить в request handler.", responsibilities: ["Channel selection", "Fan-out", "Idempotency"], useCases: ["Online delivery", "Offline fallback"] },
    { id: "websocket", kind: "infrastructure", label: "WebSocket", position: { x: 1060, y: 20 }, description: "Доставляет message активному connected client.", reason: "Online recipients ожидают минимальную latency.", responsibilities: ["Realtime push", "Connection routing"], useCases: ["Active chat"] },
    { id: "push", kind: "external", label: "Push Provider", position: { x: 1060, y: 220 }, description: "Уведомляет offline mobile или web client.", reason: "Disconnected client недоступен через WebSocket.", responsibilities: ["Device push", "Provider status"], useCases: ["Offline notification"] },
    { id: "email", kind: "external", label: "Email Provider", position: { x: 1060, y: 420 }, description: "Используется как более медленный fallback channel.", reason: "Некоторые сообщения должны дойти без установленного приложения.", responsibilities: ["Email delivery", "Bounce status"], useCases: ["Digest", "Escalation"] },
  ],
  edges: [
    { id: "sender-api", source: "sender", target: "api", label: "send", type: "request" },
    { id: "api-queue", source: "api", target: "queue", label: "delivery jobs", type: "async" },
    { id: "queue-workers", source: "queue", target: "workers", label: "consume", type: "async" },
    { id: "workers-websocket", source: "workers", target: "websocket", label: "online", type: "realtime" },
    { id: "workers-push", source: "workers", target: "push", label: "offline push", type: "request" },
    { id: "workers-email", source: "workers", target: "email", label: "fallback", type: "request" },
  ],
};
