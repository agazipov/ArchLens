import type { Architecture } from "../model/types";

export const simpleSpa: Architecture = {
  id: "simple-spa", title: "Simple SPA / Frontend + Backend", shortTitle: "Simple SPA", category: "fundamentals", level: "system", complexity: "Low",
  description: "Браузерное приложение вызывает отдельный HTTP API, а сервер остаётся единственной доверенной точкой доступа к данным.",
  keyIdea: "Клиент отвечает за интерфейс, backend — за правила, секреты и долговременное состояние.",
  suitableFor: ["MVP и внутренние инструменты", "CRUD-продукты", "Независимый web-клиент"],
  notIdealFor: ["Почти статический контент", "Системы без клиентской интерактивности"],
  stack: [{ name: "React / Angular / Vue / Svelte" }, { name: "Fastify / Spring Boot / ASP.NET Core" }, { name: "PostgreSQL" }],
  alternatives: [{ name: "Server-rendered Web Application" }, { name: "Fullstack Meta-framework" }],
  tradeoffs: { pros: ["Понятная trust boundary", "UI и API можно развивать независимо", "Простой request flow"], cons: ["Нужно поддерживать API-контракт", "Два runtime", "Клиентский JavaScript растёт вместе с UI"] },
  interactionStyles: ["request-response"], tags: ["web", "spa", "crud"],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", subtitle: "Недоверенная среда", position: { x: 20, y: 170 }, description: "Запускает SPA, хранит только UI-состояние и инициирует запросы.", reason: "Пользователю нужен интерактивный интерфейс рядом с устройством.", responsibilities: ["Рендеринг UI", "Локальное состояние", "Вызов API"], useCases: ["Формы", "Кабинеты", "Админ-панели"], avoidWhen: ["Секреты", "Авторитетные бизнес-правила"], stack: [{ name: "React" }, { name: "Angular" }, { name: "Vue" }, { name: "Svelte" }] },
    { id: "api", kind: "api", label: "HTTP API", subtitle: "Trust boundary", position: { x: 280, y: 170 }, description: "Публичный контракт принимает запросы из недоверенного клиента.", reason: "Серверу нужна явная граница для валидации и авторизации.", responsibilities: ["Валидация", "Авторизация", "HTTP-контракт"], useCases: ["REST", "GraphQL", "Мобильный клиент"], stack: [{ name: "OpenAPI" }, { name: "JSON" }] },
    { id: "backend", kind: "server", label: "Backend", subtitle: "Application runtime", position: { x: 540, y: 170 }, description: "Выполняет use cases и контролирует инфраструктуру.", reason: "Правила и секреты нельзя доверять браузеру.", responsibilities: ["Бизнес-правила", "Транзакции", "Интеграции"], useCases: ["Команды", "Запросы", "Проверки доступа"], stack: [{ name: "NestJS" }, { name: "Fastify" }, { name: "Spring Boot" }, { name: "ASP.NET Core" }] },
    { id: "database", kind: "database", label: "Database", subtitle: "System of record", position: { x: 800, y: 170 }, description: "Хранит авторитетное состояние между запросами и перезапусками.", reason: "Бизнес-данным нужны долговечность и согласованность.", responsibilities: ["Персистентность", "Транзакции", "Индексы"], useCases: ["Пользователи", "Заказы", "Настройки"], avoidWhen: ["Большие бинарные файлы", "Эфемерный кэш"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }, { name: "MongoDB" }] },
  ],
  edges: [
    { id: "browser-api", source: "browser", target: "api", label: "HTTPS", type: "request" },
    { id: "api-backend", source: "api", target: "backend", label: "validated call", type: "request" },
    { id: "backend-database", source: "backend", target: "database", label: "read / write", type: "data" },
  ],
};
