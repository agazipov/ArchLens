import type { Architecture } from "../model/types";

export const serverRenderedWebApp: Architecture = {
  id: "server-rendered-web-app", title: "Server-rendered Web Application", shortTitle: "Server-rendered Web", category: "web-frontend", level: "system", complexity: "Low",
  description: "Web application формирует HTML на сервере, обрабатывает формы и напрямую работает с базой данных.",
  keyIdea: "Один серверный runtime владеет UI, правилами и доступом к данным; браузер получает готовые страницы.",
  suitableFor: ["Контентные сайты", "Business applications", "Формы и CRUD"], notIdealFor: ["Очень насыщенный offline UI", "Много независимых API-клиентов"],
  stack: [{ name: "Django" }, { name: "Laravel" }, { name: "Rails" }, { name: "ASP.NET MVC" }], alternatives: [{ name: "Fullstack Meta-framework" }, { name: "Simple SPA" }],
  tradeoffs: { pros: ["Простой deployment", "Мало клиентского JavaScript", "Прямой server-side data access"], cons: ["UI и backend масштабируются вместе", "Полные navigation round trips", "API для других клиентов нужно добавлять отдельно"] },
  interactionStyles: ["request-response"], tags: ["web", "ssr", "forms"],
  flowScenarios: [{
    id: "render-account-page",
    title: "Render an account page on request",
    description: "Web application обрабатывает navigation, читает trusted data и возвращает полностью сформированный HTML.",
    scope: "canonical",
    fidelity: "simplified",
    assumptions: ["Browser уже имеет session cookie.", "Web application выполняет authorization до чтения account data.", "HTML генерируется заново для этого request."],
    sources: [{ title: "Next.js: Server-side Rendering", url: "https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering" }],
    steps: [
      { id: "navigate", title: "Browser запрашивает account page", description: "Navigation создаёт обычный HTTP request в единый server runtime.", flow: { type: "transfer", from: "browser", to: "web-app", edgeId: "browser-app", kind: "request", label: "GET /account" } },
      { id: "load-data", title: "Server загружает account state", description: "Business rules и database query исполняются в доверенной server-side среде.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "web-app", label: "authorize request" },
        { type: "transfer", from: "web-app", to: "database", edgeId: "app-database", kind: "request", label: "load account" },
        { type: "transfer", from: "database", to: "web-app", edgeId: "app-database", kind: "response", label: "account data" },
      ] } },
      { id: "render", title: "Server возвращает готовый HTML", description: "Template получает trusted data, а browser отображает страницу без отдельной API assembly phase.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "web-app", label: "render HTML" },
        { type: "transfer", from: "web-app", to: "browser", edgeId: "browser-app", kind: "response", label: "200 HTML" },
        { type: "outcome", nodeId: "browser", outcome: "success", label: "account page displayed" },
      ] } },
    ],
  }],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 170 }, description: "Отправляет page requests и формы, затем отображает готовый HTML.", reason: "Браузеру не нужно повторять серверные правила или собирать страницу из API-ответов.", responsibilities: ["Navigation", "Form submit", "HTML rendering"], useCases: ["Каталог", "CRM UI", "Админка"] },
    { id: "web-app", kind: "server", label: "Web Application", subtitle: "One server runtime", position: { x: 300, y: 170 }, description: "Маршрутизирует запрос, выполняет правила и формирует HTML.", reason: "Одна deployment unit достаточна для связанного UI и backend.", responsibilities: ["Routing", "Server rendering", "Business rules"], useCases: ["Pages", "Forms", "Sessions"], stack: [{ name: "Django" }, { name: "Laravel" }, { name: "Rails" }, { name: "ASP.NET MVC" }] },
    { id: "database", kind: "database", label: "Database", position: { x: 580, y: 170 }, description: "Хранит пользователей, контент и бизнес-состояние.", reason: "Серверным запросам нужен единый долговременный source of truth.", responsibilities: ["Persistence", "Transactions", "Queries"], useCases: ["Accounts", "Content", "Orders"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }] },
  ],
  edges: [
    { id: "browser-app", source: "browser", target: "web-app", label: "page / form", type: "request", bidirectional: true },
    { id: "app-database", source: "web-app", target: "database", label: "SQL", type: "data", bidirectional: true },
  ],
};
