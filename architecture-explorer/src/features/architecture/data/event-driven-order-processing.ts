import type { Architecture } from "../model/types";

export const eventDrivenOrderProcessing: Architecture = {
  id: "event-driven-order-processing", title: "Event-driven Order Processing", shortTitle: "Event-driven Orders", category: "messaging-workflows", level: "system", complexity: "High",
  description: "Order API надёжно сохраняет заказ и публикует событие, после чего независимые consumers запускают оплату, уведомления и fulfillment.",
  keyIdea: "Очередь убирает долгие и ненадёжные шаги из request path, но требует идемпотентных consumers и явных состояний заказа.",
  suitableFor: ["Несколько post-order процессов", "Пиковый поток заказов", "Интеграции с разной доступностью"], notIdealFor: ["Очень простой checkout", "Все шаги обязаны завершиться в одном синхронном ответе"],
  stack: [{ name: "PostgreSQL" }, { name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }], alternatives: [{ name: "Synchronous order workflow" }, { name: "Workflow System" }],
  tradeoffs: { pros: ["Быстрый приём заказа", "Независимые consumers", "Буферизация пиков"], cons: ["Eventual consistency", "Повторная доставка", "Сложнее tracing и recovery"] },
  interactionStyles: ["request-response", "async"], tags: ["orders", "events", "queue"],
  flowScenarios: [{
    id: "place-order-fanout",
    title: "Place order and fan out",
    description: "Order API фиксирует заказ, быстро отвечает client и публикует событие независимым consumers.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Надёжность между database commit и event publication обеспечена transactional outbox или эквивалентным relay, который не показан отдельным узлом.", "Consumers идемпотентны, потому что broker может доставить message повторно.", "Показан старт downstream work, а не полный payment/fulfillment lifecycle."],
    sources: [{ title: "Azure Architecture Center: Publisher-Subscriber", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber" }],
    steps: [
      { id: "submit", title: "Checkout отправляет order command", description: "Синхронная trust boundary принимает подтверждённую корзину.", flow: { type: "transfer", from: "client", to: "order-api", edgeId: "client-api", kind: "request", label: "place order" } },
      { id: "commit", title: "Order сохраняется до fan-out", description: "Database становится system of record для принятой команды.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "order-api", to: "database", edgeId: "api-db", kind: "data", label: "pending order" },
        { type: "outcome", nodeId: "database", outcome: "accepted", label: "order committed" },
      ] } },
      { id: "accept-and-publish", title: "Response и publication развязываются", description: "Client получает order id, а relay публикует durable event без ожидания consumers.", flow: { type: "parallel", steps: [
        { type: "transfer", from: "order-api", to: "client", edgeId: "client-api", kind: "response", label: "202 + order id" },
        { type: "transfer", from: "order-api", to: "bus", edgeId: "api-bus", kind: "message", label: "OrderCreated" },
      ] } },
      { id: "fanout", title: "Subscribers начинают работу параллельно", description: "Broker копирует событие независимым consumers; failure одного не блокирует остальных.", flow: { type: "parallel", steps: [
        { type: "transfer", from: "bus", to: "payment", edgeId: "bus-payment", kind: "message", label: "start payment" },
        { type: "transfer", from: "bus", to: "notification", edgeId: "bus-notification", kind: "message", label: "send confirmation" },
        { type: "transfer", from: "bus", to: "fulfillment", edgeId: "bus-fulfillment", kind: "message", label: "prepare fulfillment" },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Checkout Client", position: { x: 20, y: 220 }, description: "Отправляет подтверждённую корзину и получает идентификатор заказа.", reason: "Покупателю нужен быстрый и однозначный результат приёма команды.", responsibilities: ["Checkout request", "Order status UI"], useCases: ["Place order", "Track order"] },
    { id: "order-api", kind: "api", label: "Order API", position: { x: 280, y: 220 }, description: "Валидирует команду, создаёт заказ и инициирует дальнейшую обработку.", reason: "Приём заказа остаётся синхронной trust boundary.", responsibilities: ["Validation", "Order creation", "Event publication"], useCases: ["Create order", "Get status"] },
    { id: "database", kind: "database", label: "Order Database", position: { x: 540, y: 40 }, description: "Хранит заказ и его авторитетное состояние.", reason: "События не заменяют system of record.", responsibilities: ["Order state", "Transactions", "Processing status"], useCases: ["Pending payment", "Paid", "Fulfilled"], stack: [{ name: "PostgreSQL" }] },
    { id: "bus", kind: "infrastructure", label: "Event / Queue", position: { x: 540, y: 400 }, description: "Надёжно доставляет order-created work независимым consumers.", reason: "Downstream systems работают с разной скоростью и могут временно падать.", responsibilities: ["Durable delivery", "Retry", "Backpressure"], useCases: ["Order created", "Order paid"], stack: [{ name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }] },
    { id: "payment", kind: "server", label: "Payment Worker", position: { x: 820, y: 160 }, description: "Выполняет payment step и сообщает результат.", reason: "Payment provider latency не должна удерживать исходный request.", responsibilities: ["Charge", "Retry policy", "Result event"], useCases: ["Authorize", "Capture"] },
    { id: "notification", kind: "server", label: "Notification Worker", position: { x: 820, y: 320 }, description: "Отправляет подтверждения и изменения статуса.", reason: "Доставка сообщения — отдельный ненадёжный side effect.", responsibilities: ["Templates", "Delivery", "Retry"], useCases: ["Order confirmation", "Status update"] },
    { id: "fulfillment", kind: "server", label: "Fulfillment Worker", position: { x: 820, y: 480 }, description: "Передаёт оплаченный заказ в складской или delivery процесс.", reason: "Fulfillment имеет собственный lifecycle и внешние зависимости.", responsibilities: ["Reserve stock", "Create shipment", "Report status"], useCases: ["Warehouse request", "Shipping"] },
  ],
  edges: [
    { id: "client-api", source: "client", target: "order-api", label: "place order", type: "request", bidirectional: true },
    { id: "api-db", source: "order-api", target: "database", label: "save order", type: "data" },
    { id: "api-bus", source: "order-api", target: "bus", label: "order created", type: "event" },
    { id: "bus-payment", source: "bus", target: "payment", label: "consume", type: "async" },
    { id: "bus-notification", source: "bus", target: "notification", label: "consume", type: "async" },
    { id: "bus-fulfillment", source: "bus", target: "fulfillment", label: "consume", type: "async" },
  ],
};
