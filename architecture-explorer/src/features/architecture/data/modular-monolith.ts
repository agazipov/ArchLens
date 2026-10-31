import type { Architecture } from "../model/types";

export const modularMonolith: Architecture = {
  id: "modular-monolith", title: "Modular Monolith", shortTitle: "Modular Monolith", category: "application-architecture", level: "system", complexity: "Medium",
  description: "Логически изолированные бизнес-модули работают в одном приложении и разворачиваются вместе.",
  keyIdea: "Границы модулей дают управляемую сложность без сетевой и операционной цены микросервисов.",
  suitableFor: ["Растущий продукт", "Несколько бизнес-направлений", "Команда, которой рано нужны микросервисы"], notIdealFor: ["Модули требуют полностью независимого масштабирования", "Разные модули обязаны иметь разные release cycles"],
  stack: [{ name: "NestJS" }, { name: "Spring Boot" }, { name: "ASP.NET Core" }, { name: "Django" }, { name: "Rails" }], alternatives: [{ name: "Microservices" }],
  tradeoffs: { pros: ["Простой deployment", "Локальные транзакции", "Явные domain boundaries"], cons: ["Нужна дисциплина зависимостей", "Модули масштабируются вместе", "Неосторожные shared tables размывают границы"] },
  interactionStyles: ["request-response"], tags: ["modules", "monolith", "domain-boundaries"],
  nodes: [
    { id: "ui-api", kind: "api", label: "UI / API", position: { x: 20, y: 220 }, description: "Единая внешняя точка входа в приложение.", reason: "Потребителям нужен стабильный контракт, не раскрывающий внутренние модули.", responsibilities: ["Transport", "Auth boundary", "Routing"], useCases: ["Web UI", "REST API", "Mobile API"] },
    { id: "application", kind: "server", label: "Application Host", subtitle: "One deployment unit", position: { x: 280, y: 220 }, description: "Запускает все модули в одном процессе или tightly coupled runtime.", reason: "Модули можно изолировать логически до появления причины разделять deployment.", responsibilities: ["Composition", "Transactions", "Cross-cutting concerns"], useCases: ["Product backend", "Business application"] },
    { id: "users", kind: "domain", label: "Users Module", position: { x: 540, y: 20 }, description: "Владеет идентичностью и профилями пользователей.", reason: "User lifecycle образует самостоятельную business capability.", responsibilities: ["Profiles", "Permissions", "User policies"], useCases: ["Registration", "Account management"] },
    { id: "orders", kind: "domain", label: "Orders Module", position: { x: 540, y: 220 }, description: "Владеет жизненным циклом заказа.", reason: "Order rules должны быть изолированы от UI и других capabilities.", responsibilities: ["Order state", "Order policies", "Coordination"], useCases: ["Create order", "Cancel order"] },
    { id: "billing", kind: "domain", label: "Billing Module", position: { x: 540, y: 420 }, description: "Владеет платежными решениями и финансовым состоянием.", reason: "Денежные правила требуют отдельной модели и ответственности.", responsibilities: ["Payment intent", "Refund policy", "Ledger coordination"], useCases: ["Charge", "Refund"] },
    { id: "database", kind: "database", label: "Shared Database", subtitle: "Separated schemas", position: { x: 820, y: 220 }, description: "Один database cluster хранит данные модулей с явным владением таблицами или схемами.", reason: "Локальные транзакции и простая эксплуатация важнее физической изоляции.", responsibilities: ["Persistence", "Transactions", "Module-owned schemas"], useCases: ["Users schema", "Orders schema", "Billing schema"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "entry-host", source: "ui-api", target: "application", label: "request", type: "request" },
    { id: "host-users", source: "application", target: "users", label: "use case", type: "request" },
    { id: "host-orders", source: "application", target: "orders", label: "use case", type: "request" },
    { id: "host-billing", source: "application", target: "billing", label: "use case", type: "request" },
    { id: "users-db", source: "users", target: "database", label: "owned schema", type: "data" },
    { id: "orders-db", source: "orders", target: "database", label: "owned schema", type: "data" },
    { id: "billing-db", source: "billing", target: "database", label: "owned schema", type: "data" },
  ],
};
