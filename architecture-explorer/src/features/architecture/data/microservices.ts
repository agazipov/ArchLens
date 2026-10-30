import type { Architecture } from "../model/types";

export const microservices: Architecture = {
  id: "microservices", title: "Microservices", shortTitle: "Microservices", category: "distributed", level: "system", complexity: "High",
  description: "Gateway направляет requests в independently deployed services, каждый из которых владеет своей business capability и данными.",
  keyIdea: "Microservices покупают независимое масштабирование и организационные границы ценой distributed systems, observability и deployment complexity.",
  suitableFor: ["Несколько автономных команд", "Разные scaling profiles", "Capabilities с независимыми release cycles"], notIdealFor: ["Небольшая команда", "Неясные domain boundaries", "Продукт, который помещается в modular monolith"],
  stack: [{ name: "HTTP / gRPC" }, { name: "Kafka / NATS", note: "для event interactions" }, { name: "Containers" }, { name: "Observability stack" }], alternatives: [{ name: "Modular Monolith" }],
  tradeoffs: { pros: ["Независимый deployment", "Независимое масштабирование", "Явное capability ownership"], cons: ["Network failures и eventual consistency", "Сложные tracing, testing и operations", "Cross-service transactions и schema evolution"] },
  interactionStyles: ["request-response", "async"], tags: ["microservices", "distributed", "service-ownership"],
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
    { id: "gateway-orders", source: "gateway", target: "orders", label: "orders API", type: "request" },
    { id: "gateway-billing", source: "gateway", target: "billing", label: "billing API", type: "request" },
    { id: "users-db-edge", source: "users", target: "users-db", label: "owned data", type: "data" },
    { id: "orders-db-edge", source: "orders", target: "orders-db", label: "owned data", type: "data" },
    { id: "billing-db-edge", source: "billing", target: "billing-db", label: "owned data", type: "data" },
    { id: "orders-billing", source: "orders", target: "billing", label: "payment requested", type: "event" },
  ],
};
