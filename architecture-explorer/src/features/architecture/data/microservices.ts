import type { Architecture } from "../model/types";

export const microservices: Architecture = {
  id: "microservices", title: "Microservices", shortTitle: "Microservices", category: "distributed-scale", level: "system", complexity: "High",
  description: "Gateway направляет requests в independently deployed services, каждый из которых владеет своей business capability и данными.",
  keyIdea: "Microservices покупают независимое масштабирование и организационные границы ценой distributed systems, observability и deployment complexity.",
  suitableFor: ["Несколько автономных команд", "Разные scaling profiles", "Capabilities с независимыми release cycles"], notIdealFor: ["Небольшая команда", "Неясные domain boundaries", "Продукт, который помещается в modular monolith"],
  stack: [{ name: "HTTP / gRPC" }, { name: "Kafka / NATS", note: "для event interactions" }, { name: "Containers" }, { name: "Observability stack" }], alternatives: [{ name: "Modular Monolith" }],
  tradeoffs: { pros: ["Независимый deployment", "Независимое масштабирование", "Явное capability ownership"], cons: ["Network failures и eventual consistency", "Сложные tracing, testing и operations", "Cross-service transactions и schema evolution"] },
  interactionStyles: ["request-response", "async"], tags: ["microservices", "distributed", "service-ownership"],
  flowScenarios: [{
    id: "accept-order-and-request-payment",
    title: "Accept an order and request payment",
    description: "Orders Service фиксирует собственное состояние, публикует integration event и отвечает через gateway до завершения Billing work.",
    scope: "example",
    fidelity: "detailed",
    assumptions: ["Каждый service изменяет только собственную database.", "Payment requested event доставляется at least once, поэтому Billing consumer идемпотентен.", "Показан accepted boundary, а не полное завершение distributed business process."],
    sources: [{ title: "Microsoft: Integration events between microservices", url: "https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/integration-event-based-microservice-communications" }],
    steps: [
      { id: "route", title: "Gateway направляет order command", description: "External boundary применяет authentication и скрывает внутреннюю service topology.", flow: { type: "transfer", from: "gateway", to: "orders", edgeId: "gateway-orders", kind: "request", label: "place order" } },
      { id: "persist-and-publish", title: "Orders сохраняет state и запрашивает payment", description: "Service владеет order transaction, затем сообщает Billing о значимом domain transition.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "orders", to: "orders-db", edgeId: "orders-db-edge", kind: "data", label: "persist pending order" },
        { type: "transfer", from: "orders", to: "billing", edgeId: "orders-billing", kind: "message", label: "payment requested" },
      ] } },
      { id: "accepted", title: "Caller получает accepted order", description: "Synchronous response подтверждает order ownership, но не притворяется завершённым payment workflow.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "orders", to: "gateway", edgeId: "gateway-orders", kind: "response", label: "202 order accepted" },
        { type: "outcome", nodeId: "gateway", outcome: "accepted", label: "order id returned" },
      ] } },
      { id: "billing", title: "Billing обрабатывает event независимо", description: "Billing применяет финансовые правила и записывает результат только в своё хранилище.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "billing", label: "process payment request" },
        { type: "transfer", from: "billing", to: "billing-db", edgeId: "billing-db-edge", kind: "data", label: "record payment state" },
        { type: "outcome", nodeId: "billing", outcome: "success", label: "payment work completed" },
      ] } },
    ],
  }],
  nodes: [
    { id: "gateway", kind: "api", label: "API Gateway", position: { x: 20, y: 260 }, description: "Предоставляет единый внешний endpoint и направляет requests в services.", reason: "Clients не должны знать внутреннюю service topology.", responsibilities: ["Routing", "Authentication", "Rate limits"], useCases: ["Public API", "Mobile backend"] },
    { id: "users", kind: "server", label: "Users Service", position: { x: 300, y: 20 }, description: "Независимо владеет user capability и contract.", reason: "Identity lifecycle имеет отдельное ownership и release cadence.", responsibilities: ["Users API", "User policies", "Service operations"], useCases: ["Register", "Profile"] },
    { id: "orders", kind: "server", label: "Orders Service", position: { x: 300, y: 260 }, description: "Владеет order lifecycle и публикует значимые изменения.", reason: "Orders образуют самостоятельную business capability.", responsibilities: ["Order API", "Order state", "Domain events"], useCases: ["Place", "Cancel", "Complete"] },
    { id: "billing", kind: "server", label: "Billing Service", position: { x: 300, y: 500 }, description: "Владеет payment decisions и финансовым состоянием.", reason: "Денежные правила требуют отдельной модели, access и audit.", responsibilities: ["Payment API", "Refund", "Ledger policy"], useCases: ["Charge", "Refund"] },
    { id: "users-db", kind: "database", label: "Users Data", position: { x: 580, y: 20 }, description: "Хранилище, изменяемое только Users Service.", reason: "Shared database schema разрушает независимость services.", responsibilities: ["User persistence", "Schema ownership"], useCases: ["Profiles"] },
    { id: "orders-db", kind: "database", label: "Orders Data", position: { x: 580, y: 260 }, description: "Хранилище, изменяемое только Orders Service.", reason: "Order service должен контролировать свои invariants и schema.", responsibilities: ["Order persistence", "Schema ownership"], useCases: ["Orders", "Order history"] },
    { id: "billing-db", kind: "database", label: "Billing Data", position: { x: 580, y: 500 }, description: "Изолированное финансовое хранилище Billing Service.", reason: "Financial data имеет отдельные consistency и security requirements.", responsibilities: ["Payment state", "Audit data"], useCases: ["Transactions", "Refunds"] },
  ],
  edges: [
    { id: "gateway-users", source: "gateway", target: "users", label: "users API", type: "request" },
    { id: "gateway-orders", source: "gateway", target: "orders", label: "orders API", type: "request", bidirectional: true },
    { id: "gateway-billing", source: "gateway", target: "billing", label: "billing API", type: "request" },
    { id: "users-db-edge", source: "users", target: "users-db", label: "owned data", type: "data" },
    { id: "orders-db-edge", source: "orders", target: "orders-db", label: "owned data", type: "data" },
    { id: "billing-db-edge", source: "billing", target: "billing-db", label: "owned data", type: "data" },
    { id: "orders-billing", source: "orders", target: "billing", label: "payment requested", type: "event" },
  ],
};
