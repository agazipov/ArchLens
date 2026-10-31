import type { Architecture } from "../model/types";

export const marketplace: Architecture = {
  id: "marketplace", title: "Marketplace", shortTitle: "Marketplace", category: "application-architecture", level: "system", complexity: "High",
  description: "Frontend обращается к единому backend/BFF, а catalog, orders, users и payments остаются явно разделёнными business modules.",
  keyIdea: "Marketplace нуждается в доменных границах, но может начинаться как modular monolith без преждевременных микросервисов.",
  suitableFor: ["Платформа покупателей и продавцов", "Разные жизненные циклы каталога и заказа", "Растущая domain complexity"], notIdealFor: ["Простой магазин одного продавца", "MVP без marketplace workflows"],
  stack: [{ name: "React / Vue" }, { name: "NestJS / Spring Boot / ASP.NET Core" }, { name: "PostgreSQL" }], alternatives: [{ name: "Modular Monolith" }, { name: "Microservices" }],
  tradeoffs: { pros: ["Явные capability boundaries", "Можно эволюционировать без немедленного network split", "Единая точка входа для frontend"], cons: ["Сложнее cross-module workflows", "Нужно определить владение данными", "Payments и order consistency требуют аккуратной оркестрации"] },
  interactionStyles: ["request-response"], tags: ["commerce", "marketplace", "modules"],
  flowScenarios: [{
    id: "marketplace-checkout",
    title: "Place a marketplace order",
    description: "BFF координирует buyer, listing, order и payment capabilities, сохраняя явное владение состоянием внутри каждого модуля.",
    scope: "example",
    fidelity: "detailed",
    assumptions: ["Один database cluster логически разделён module-owned schemas.", "BFF оркестрирует use case, но не изменяет module data напрямую.", "Показан успешный payment path; отказ оставляет order в неплаченом состоянии."],
    sources: [{ title: "Microsoft: Bounded contexts", url: "https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles#bounded-contexts" }],
    steps: [
      { id: "checkout", title: "Buyer отправляет checkout command", description: "Frontend знает только внешнюю BFF boundary, а не внутреннее размещение модулей.", flow: { type: "transfer", from: "frontend", to: "bff", edgeId: "frontend-bff", kind: "request", label: "checkout" } },
      { id: "validate", title: "Buyer и listing проверяются параллельно", description: "Users подтверждает buyer status, Catalog — актуальность price и listing availability.", flow: { type: "parallel", steps: [
        { type: "sequence", steps: [
          { type: "transfer", from: "bff", to: "users", edgeId: "bff-users", kind: "request", label: "validate buyer" },
          { type: "transfer", from: "users", to: "bff", edgeId: "bff-users", kind: "response", label: "buyer eligible" },
        ] },
        { type: "sequence", steps: [
          { type: "transfer", from: "bff", to: "catalog", edgeId: "bff-catalog", kind: "request", label: "validate listing" },
          { type: "transfer", from: "catalog", to: "bff", edgeId: "bff-catalog", kind: "response", label: "price snapshot" },
        ] },
      ] } },
      { id: "order", title: "Orders создаёт pending order", description: "Order lifecycle начинается в своём bounded context и сохраняется в owned schema.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "bff", to: "orders", edgeId: "bff-orders", kind: "control", label: "create pending order" },
        { type: "transfer", from: "orders", to: "database", edgeId: "orders-db", kind: "data", label: "persist pending order" },
        { type: "transfer", from: "orders", to: "bff", edgeId: "bff-orders", kind: "response", label: "order id" },
      ] } },
      { id: "payment", title: "Payments решает финансовый transition", description: "Payment module сохраняет собственный audit state и возвращает outcome оркестратору.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "bff", to: "payments", edgeId: "bff-payments", kind: "control", label: "authorize payment" },
        { type: "transfer", from: "payments", to: "database", edgeId: "payments-db", kind: "data", label: "record payment attempt" },
        { type: "transfer", from: "payments", to: "bff", edgeId: "bff-payments", kind: "response", label: "payment result" },
      ] } },
      { id: "complete", title: "Order следует за payment outcome", description: "Walkthrough выбирает успешный transition и показывает failure как альтернативу.", flow: { type: "branch", condition: "Payment authorized?", paths: [
        { id: "paid", label: "Authorized", selected: true, steps: [
          { type: "transfer", from: "bff", to: "orders", edgeId: "bff-orders", kind: "control", label: "mark order paid" },
          { type: "transfer", from: "orders", to: "database", edgeId: "orders-db", kind: "data", label: "commit paid status" },
          { type: "transfer", from: "bff", to: "frontend", edgeId: "frontend-bff", kind: "response", label: "order confirmed" },
          { type: "outcome", nodeId: "frontend", outcome: "success", label: "confirmation displayed" },
        ] },
        { id: "declined", label: "Declined", steps: [
          { type: "transfer", from: "bff", to: "orders", edgeId: "bff-orders", kind: "control", label: "mark payment declined" },
          { type: "transfer", from: "orders", to: "database", edgeId: "orders-db", kind: "data", label: "retain unpaid order" },
          { type: "transfer", from: "bff", to: "frontend", edgeId: "frontend-bff", kind: "response", label: "payment declined" },
          { type: "outcome", nodeId: "frontend", outcome: "failure", label: "retry offered" },
        ] },
      ] } },
    ],
  }],
  nodes: [
    { id: "frontend", kind: "client", label: "Frontend", position: { x: 20, y: 260 }, description: "Интерфейс покупателей и продавцов.", reason: "Разные роли используют общий marketplace experience.", responsibilities: ["Buyer UI", "Seller UI", "API calls"], useCases: ["Search", "Listing management", "Checkout"] },
    { id: "bff", kind: "api", label: "Backend / BFF", position: { x: 270, y: 260 }, description: "Единая внешняя граница собирает ответы модулей и применяет access policy.", reason: "Frontend не должен знать внутреннюю модульную топологию.", responsibilities: ["Authentication", "Response composition", "Routing"], useCases: ["Product page", "Seller dashboard", "Checkout"] },
    { id: "catalog", kind: "domain", label: "Catalog", position: { x: 520, y: 20 }, description: "Владеет listings, ценами и доступностью публикаций.", reason: "Catalog lifecycle отличается от order lifecycle.", responsibilities: ["Listings", "Pricing", "Moderation state"], useCases: ["Publish listing", "Search feed"] },
    { id: "orders", kind: "domain", label: "Orders", position: { x: 520, y: 180 }, description: "Владеет заказом от создания до завершения.", reason: "Order state связывает покупателя, продавца и fulfillment rules.", responsibilities: ["Order state", "Order policies", "Status transitions"], useCases: ["Place order", "Cancel", "Complete"] },
    { id: "users", kind: "domain", label: "Users", position: { x: 520, y: 340 }, description: "Владеет профилями, ролями и seller status.", reason: "Marketplace trust model сложнее обычного customer account.", responsibilities: ["Profiles", "Roles", "Seller onboarding"], useCases: ["Buyer account", "Seller verification"] },
    { id: "payments", kind: "domain", label: "Payments", position: { x: 520, y: 500 }, description: "Координирует payment provider, refunds и marketplace payout state.", reason: "Деньги имеют собственные правила, статусы и audit requirements.", responsibilities: ["Payment intent", "Refund", "Payout coordination"], useCases: ["Charge buyer", "Refund", "Pay seller"] },
    { id: "database", kind: "database", label: "Database", subtitle: "Module-owned data", position: { x: 800, y: 260 }, description: "Хранит данные модулей с явным ownership, даже если используется один cluster.", reason: "Модульные границы должны отражаться во владении данными.", responsibilities: ["Persistence", "Transactions", "Schema boundaries"], useCases: ["Catalog schema", "Orders schema", "Users schema"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "frontend-bff", source: "frontend", target: "bff", label: "HTTPS", type: "request", bidirectional: true },
    { id: "bff-catalog", source: "bff", target: "catalog", label: "catalog use case", type: "request", bidirectional: true },
    { id: "bff-orders", source: "bff", target: "orders", label: "order use case", type: "request", bidirectional: true },
    { id: "bff-users", source: "bff", target: "users", label: "user use case", type: "request", bidirectional: true },
    { id: "bff-payments", source: "bff", target: "payments", label: "payment use case", type: "request", bidirectional: true },
    { id: "catalog-db", source: "catalog", target: "database", label: "owned data", type: "data" },
    { id: "orders-db", source: "orders", target: "database", label: "owned data", type: "data" },
    { id: "users-db", source: "users", target: "database", label: "owned data", type: "data" },
    { id: "payments-db", source: "payments", target: "database", label: "owned data", type: "data" },
  ],
};
