import type { Architecture } from "../model/types";

export const marketplace: Architecture = {
  id: "marketplace", title: "Marketplace", shortTitle: "Marketplace", category: "application-architecture", level: "system", complexity: "High",
  description: "Frontend обращается к единому backend/BFF, а catalog, orders, users и payments остаются явно разделёнными business modules.",
  keyIdea: "Marketplace нуждается в доменных границах, но может начинаться как modular monolith без преждевременных микросервисов.",
  suitableFor: ["Платформа покупателей и продавцов", "Разные жизненные циклы каталога и заказа", "Растущая domain complexity"], notIdealFor: ["Простой магазин одного продавца", "MVP без marketplace workflows"],
  stack: [{ name: "React / Vue" }, { name: "NestJS / Spring Boot / ASP.NET Core" }, { name: "PostgreSQL" }], alternatives: [{ name: "Modular Monolith" }, { name: "Microservices" }],
  tradeoffs: { pros: ["Явные capability boundaries", "Можно эволюционировать без немедленного network split", "Единая точка входа для frontend"], cons: ["Сложнее cross-module workflows", "Нужно определить владение данными", "Payments и order consistency требуют аккуратной оркестрации"] },
  interactionStyles: ["request-response"], tags: ["commerce", "marketplace", "modules"],
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
    { id: "frontend-bff", source: "frontend", target: "bff", label: "HTTPS", type: "request" },
    { id: "bff-catalog", source: "bff", target: "catalog", label: "catalog use case", type: "request" },
    { id: "bff-orders", source: "bff", target: "orders", label: "order use case", type: "request" },
    { id: "bff-users", source: "bff", target: "users", label: "user use case", type: "request" },
    { id: "bff-payments", source: "bff", target: "payments", label: "payment use case", type: "request" },
    { id: "catalog-db", source: "catalog", target: "database", label: "owned data", type: "data" },
    { id: "orders-db", source: "orders", target: "database", label: "owned data", type: "data" },
    { id: "users-db", source: "users", target: "database", label: "owned data", type: "data" },
    { id: "payments-db", source: "payments", target: "database", label: "owned data", type: "data" },
  ],
};
