import type { Architecture } from "../model/types";

export const simpleSpa: Architecture = {
  id: "simple-spa", title: "Simple SPA / Frontend + Backend", shortTitle: "Simple SPA", category: "web-frontend", level: "system", complexity: "Low",
  description: "Браузерное приложение вызывает отдельный HTTP API, а сервер остаётся единственной доверенной точкой доступа к данным.",
  keyIdea: "Клиент отвечает за интерфейс, backend — за правила, секреты и долговременное состояние.",
  suitableFor: ["MVP и внутренние инструменты", "CRUD-продукты", "Независимый web-клиент"],
  notIdealFor: ["Почти статический контент", "Системы без клиентской интерактивности"],
  stack: [{ name: "React / Angular / Vue / Svelte" }, { name: "Fastify / Spring Boot / ASP.NET Core" }, { name: "PostgreSQL" }],
  alternatives: [{ name: "Server-rendered Web Application" }, { name: "Fullstack Meta-framework" }],
  tradeoffs: { pros: ["Понятная trust boundary", "UI и API можно развивать независимо", "Простой request flow"], cons: ["Нужно поддерживать API-контракт", "Два runtime", "Клиентский JavaScript растёт вместе с UI"] },
  interactionStyles: ["request-response"], tags: ["web", "spa", "crud"],
  flowScenarios: [{
    id: "update-profile",
    title: "Update profile",
    description: "SPA отправляет команду через HTTP boundary, backend сохраняет authoritative state и возвращает representation.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Browser уже загрузил SPA и имеет действующую authenticated session.", "API и Backend показаны как разные logical responsibilities; они могут работать в одном deployment.", "Ошибки validation и concurrent update не показаны."],
    sources: [{ title: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" }],
    steps: [
      { id: "request", title: "SPA отправляет HTTP request", description: "Недоверенный browser передаёт user input через публичный API contract.", flow: { type: "transfer", from: "browser", to: "api", edgeId: "browser-api", kind: "request", label: "PATCH profile" } },
      { id: "validate", title: "API проверяет boundary concerns", description: "Authentication, authorization и shape validation выполняются до business use case.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "api", label: "validate request", duration: "short" },
        { type: "transfer", from: "api", to: "backend", edgeId: "api-backend", kind: "control", label: "validated command" },
      ] } },
      { id: "persist", title: "Backend обновляет system of record", description: "Application rules формируют transaction, а database возвращает сохранённое состояние.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "backend", to: "database", edgeId: "backend-database", kind: "data", label: "update profile" },
        { type: "transfer", from: "database", to: "backend", edgeId: "backend-database", kind: "response", label: "committed row" },
      ] } },
      { id: "response", title: "Response возвращается в SPA", description: "Backend и API последовательно возвращают representation через trust boundary.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "backend", to: "api", edgeId: "api-backend", kind: "response", label: "profile result" },
        { type: "transfer", from: "api", to: "browser", edgeId: "browser-api", kind: "response", label: "200 + JSON" },
        { type: "outcome", nodeId: "browser", outcome: "success", label: "UI updated" },
      ] } },
    ],
  }],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", subtitle: "Недоверенная среда", position: { x: 20, y: 170 }, description: "Запускает SPA, хранит только UI-состояние и инициирует запросы.", reason: "Пользователю нужен интерактивный интерфейс рядом с устройством.", responsibilities: ["Рендеринг UI", "Локальное состояние", "Вызов API"], useCases: ["Формы", "Кабинеты", "Админ-панели"], avoidWhen: ["Секреты", "Авторитетные бизнес-правила"], stack: [{ name: "React" }, { name: "Angular" }, { name: "Vue" }, { name: "Svelte" }] },
    { id: "api", kind: "api", label: "HTTP API", subtitle: "Trust boundary", position: { x: 280, y: 170 }, description: "Публичный контракт принимает запросы из недоверенного клиента.", reason: "Серверу нужна явная граница для валидации и авторизации.", responsibilities: ["Валидация", "Авторизация", "HTTP-контракт"], useCases: ["REST", "GraphQL", "Мобильный клиент"], stack: [{ name: "OpenAPI" }, { name: "JSON" }] },
    { id: "backend", kind: "server", label: "Backend", subtitle: "Application runtime", position: { x: 540, y: 170 }, description: "Выполняет use cases и контролирует инфраструктуру.", reason: "Правила и секреты нельзя доверять браузеру.", responsibilities: ["Бизнес-правила", "Транзакции", "Интеграции"], useCases: ["Команды", "Запросы", "Проверки доступа"], stack: [{ name: "NestJS" }, { name: "Fastify" }, { name: "Spring Boot" }, { name: "ASP.NET Core" }] },
    { id: "database", kind: "database", label: "Database", subtitle: "System of record", position: { x: 800, y: 170 }, description: "Хранит авторитетное состояние между запросами и перезапусками.", reason: "Бизнес-данным нужны долговечность и согласованность.", responsibilities: ["Персистентность", "Транзакции", "Индексы"], useCases: ["Пользователи", "Заказы", "Настройки"], avoidWhen: ["Большие бинарные файлы", "Эфемерный кэш"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }, { name: "MongoDB" }] },
  ],
  edges: [
    { id: "browser-api", source: "browser", target: "api", label: "HTTPS", type: "request", bidirectional: true },
    { id: "api-backend", source: "api", target: "backend", label: "validated call", type: "request", bidirectional: true },
    { id: "backend-database", source: "backend", target: "database", label: "read / write", type: "data", bidirectional: true },
  ],
};
