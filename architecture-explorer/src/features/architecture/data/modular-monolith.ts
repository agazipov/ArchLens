import type { Architecture } from "../model/types";

export const modularMonolith: Architecture = {
  id: "modular-monolith", title: "Modular Monolith", shortTitle: "Modular Monolith", category: "application-architecture", level: "system", complexity: "Medium",
  description: "Логически изолированные бизнес-модули работают в одном приложении и разворачиваются вместе.",
  keyIdea: "Границы модулей дают управляемую сложность без сетевой и операционной цены микросервисов.",
  suitableFor: ["Растущий продукт", "Несколько бизнес-направлений", "Команда, которой рано нужны микросервисы"], notIdealFor: ["Модули требуют полностью независимого масштабирования", "Разные модули обязаны иметь разные release cycles"],
  stack: [{ name: "NestJS" }, { name: "Spring Boot" }, { name: "ASP.NET Core" }, { name: "Django" }, { name: "Rails" }], alternatives: [{ name: "Microservices" }],
  tradeoffs: { pros: ["Простой deployment", "Локальные транзакции", "Явные domain boundaries"], cons: ["Нужна дисциплина зависимостей", "Модули масштабируются вместе", "Неосторожные shared tables размывают границы"] },
  interactionStyles: ["request-response"], tags: ["modules", "monolith", "domain-boundaries"],
  flowScenarios: [{
    id: "place-order",
    title: "Place order",
    description: "Один application host координирует несколько модулей без сетевых вызовов между сервисами.",
    scope: "example",
    fidelity: "simplified",
    assumptions: ["Все module calls выполняются внутри одного deployment unit.", "Shared Database разделён на module-owned schemas.", "Внешний payment provider и failure compensation не показаны."],
    sources: [{ title: "Microsoft: Common web application architectures", url: "https://learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures" }],
    steps: [
      { id: "submit", title: "UI отправляет команду", description: "Внешний request входит через стабильную API boundary.", flow: { type: "transfer", from: "ui-api", to: "application", edgeId: "entry-host", kind: "request", label: "place order" } },
      { id: "start-order", title: "Host запускает Orders use case", description: "Application Host передаёт команду модулю Orders внутри процесса.", flow: { type: "transfer", from: "application", to: "orders", edgeId: "host-orders", kind: "control", label: "create order" } },
      { id: "checks", title: "Независимые проверки идут параллельно", description: "Users и Billing возвращают результаты в тот же application host без network boundary.", flow: { type: "parallel", steps: [
        { type: "sequence", steps: [
          { type: "transfer", from: "application", to: "users", edgeId: "host-users", kind: "request", label: "check customer" },
          { type: "transfer", from: "users", to: "application", edgeId: "host-users", kind: "response", label: "customer eligible" },
        ] },
        { type: "sequence", steps: [
          { type: "transfer", from: "application", to: "billing", edgeId: "host-billing", kind: "request", label: "authorize payment" },
          { type: "transfer", from: "billing", to: "application", edgeId: "host-billing", kind: "response", label: "authorized" },
        ] },
      ] } },
      { id: "persist", title: "Orders сохраняет своё состояние", description: "Запись остаётся в schema, которой владеет Orders Module.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "application", to: "orders", edgeId: "host-orders", kind: "control", label: "confirm order" },
        { type: "transfer", from: "orders", to: "database", edgeId: "orders-db", kind: "data", label: "order transaction" },
      ] } },
      { id: "reply", title: "API возвращает результат", description: "После локальной транзакции response возвращается вызывающему UI.", flow: { type: "transfer", from: "application", to: "ui-api", edgeId: "entry-host", kind: "response", label: "order created" } },
    ],
  }],
  nodes: [
    { id: "ui-api", kind: "api", label: "UI / API", position: { x: 20, y: 220 }, description: "Единая внешняя точка входа в приложение.", reason: "Потребителям нужен стабильный контракт, не раскрывающий внутренние модули.", responsibilities: ["Transport", "Auth boundary", "Routing"], useCases: ["Web UI", "REST API", "Mobile API"] },
    { id: "application", kind: "server", label: "Application Host", subtitle: "One deployment unit", position: { x: 280, y: 220 }, description: "Запускает все модули в одном процессе или tightly coupled runtime.", reason: "Модули можно изолировать логически до появления причины разделять deployment.", responsibilities: ["Composition", "Transactions", "Cross-cutting concerns"], useCases: ["Product backend", "Business application"] },
    { id: "users", kind: "domain", label: "Users Module", position: { x: 540, y: 20 }, description: "Владеет идентичностью и профилями пользователей.", reason: "User lifecycle образует самостоятельную business capability.", responsibilities: ["Profiles", "Permissions", "User policies"], useCases: ["Registration", "Account management"] },
    { id: "orders", kind: "domain", label: "Orders Module", position: { x: 540, y: 220 }, description: "Владеет жизненным циклом заказа.", reason: "Order rules должны быть изолированы от UI и других capabilities.", responsibilities: ["Order state", "Order policies", "Coordination"], useCases: ["Create order", "Cancel order"] },
    { id: "billing", kind: "domain", label: "Billing Module", position: { x: 540, y: 420 }, description: "Владеет платежными решениями и финансовым состоянием.", reason: "Денежные правила требуют отдельной модели и ответственности.", responsibilities: ["Payment intent", "Refund policy", "Ledger coordination"], useCases: ["Charge", "Refund"] },
    { id: "database", kind: "database", label: "Shared Database", subtitle: "Separated schemas", position: { x: 820, y: 220 }, description: "Один database cluster хранит данные модулей с явным владением таблицами или схемами.", reason: "Локальные транзакции и простая эксплуатация важнее физической изоляции.", responsibilities: ["Persistence", "Transactions", "Module-owned schemas"], useCases: ["Users schema", "Orders schema", "Billing schema"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "entry-host", source: "ui-api", target: "application", label: "request", type: "request", bidirectional: true },
    { id: "host-users", source: "application", target: "users", label: "use case", type: "request", bidirectional: true },
    { id: "host-orders", source: "application", target: "orders", label: "use case", type: "request", bidirectional: true },
    { id: "host-billing", source: "application", target: "billing", label: "use case", type: "request", bidirectional: true },
    { id: "users-db", source: "users", target: "database", label: "owned schema", type: "data" },
    { id: "orders-db", source: "orders", target: "database", label: "owned schema", type: "data" },
    { id: "billing-db", source: "billing", target: "database", label: "owned schema", type: "data" },
  ],
};
