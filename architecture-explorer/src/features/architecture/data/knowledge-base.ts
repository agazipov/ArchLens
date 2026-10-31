import type { Architecture } from "../model/types";

export const knowledgeBase: Architecture = {
  id: "knowledge-base", title: "Search-heavy Knowledge Base", shortTitle: "Knowledge Base", category: "data-content-media", level: "system", complexity: "Medium",
  description: "Backend хранит авторитетный контент в database, а индексатор поддерживает производный search index для быстрых полнотекстовых запросов.",
  keyIdea: "Search engine — оптимизированная read model, а не source of truth; индекс всегда можно восстановить из основного хранилища.",
  suitableFor: ["Документация", "Help center", "Внутренняя knowledge base"], notIdealFor: ["Маленький набор статических страниц", "Система без полнотекстового поиска"],
  stack: [{ name: "PostgreSQL" }, { name: "Elasticsearch" }, { name: "OpenSearch" }], alternatives: [{ name: "PostgreSQL full-text search", note: "для меньшего масштаба" }],
  tradeoffs: { pros: ["Быстрый релевантный поиск", "Database остаётся source of truth", "Read model можно масштабировать отдельно"], cons: ["Индекс обновляется не мгновенно", "Нужны reindex и monitoring", "Дублирование данных"] },
  interactionStyles: ["request-response", "async"], tags: ["content", "search", "read-model"],
  flowScenarios: [{
    id: "publish-and-search",
    title: "Publish and find a knowledge article",
    description: "Canonical article сначала сохраняется в database, затем асинхронно появляется в derived search index и становится доступна поиску.",
    scope: "typical",
    fidelity: "detailed",
    assumptions: ["Публикация уже прошла authorization и content validation.", "Database остаётся source of truth; search document можно перестроить.", "Между commit и refresh индекса допустимо короткое окно eventual consistency."],
    sources: [{ title: "Elastic: Near real-time search", url: "https://www.elastic.co/docs/manage-data/data-store/near-real-time-search" }],
    steps: [
      { id: "publish", title: "Backend сохраняет canonical article", description: "Версия, permissions и publication state записываются в authoritative content database.", flow: { type: "transfer", from: "backend", to: "database", edgeId: "backend-database", kind: "data", label: "publish article" } },
      { id: "index", title: "Published content обновляет read model", description: "Indexer получает committed content и преобразует его в search document.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "database", to: "indexer", edgeId: "database-indexer", kind: "message", label: "published content" },
        { type: "transfer", from: "indexer", to: "search", edgeId: "indexer-search", kind: "data", label: "index document" },
        { type: "wait", label: "wait for index refresh", duration: "short" },
      ] } },
      { id: "query", title: "Reader выполняет полнотекстовый поиск", description: "Frontend обращается к trusted backend, который запрашивает специализированный index.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "frontend", to: "backend", edgeId: "frontend-backend", kind: "request", label: "search phrase" },
        { type: "transfer", from: "backend", to: "search", edgeId: "backend-search", kind: "request", label: "ranked query" },
        { type: "transfer", from: "search", to: "backend", edgeId: "backend-search", kind: "response", label: "ranked hits" },
        { type: "transfer", from: "backend", to: "frontend", edgeId: "frontend-backend", kind: "response", label: "search results" },
      ] } },
      { id: "found", title: "Новая статья появляется в results", description: "Search index обслуживает быстрый read path, не становясь каноническим хранилищем статьи.", flow: { type: "outcome", nodeId: "frontend", outcome: "success", label: "article found" } },
    ],
  }],
  nodes: [
    { id: "frontend", kind: "client", label: "Frontend", position: { x: 20, y: 220 }, description: "Показывает статьи и отправляет поисковые запросы.", reason: "Читателю нужен единый интерфейс навигации и поиска.", responsibilities: ["Search UI", "Article view", "Navigation"], useCases: ["Search", "Browse", "Read"] },
    { id: "backend", kind: "server", label: "Knowledge Backend", position: { x: 280, y: 220 }, description: "Управляет публикацией, доступом и article reads.", reason: "Контент и permissions требуют доверенного application layer.", responsibilities: ["Content API", "Authorization", "Publishing"], useCases: ["Create article", "Publish", "Read article"] },
    { id: "database", kind: "database", label: "Content Database", subtitle: "Source of truth", position: { x: 560, y: 40 }, description: "Хранит канонические статьи, версии и permissions.", reason: "Контент должен сохраняться независимо от состояния индекса.", responsibilities: ["Canonical content", "Versions", "Permissions"], useCases: ["Articles", "Authors", "Revisions"], stack: [{ name: "PostgreSQL" }] },
    { id: "indexer", kind: "server", label: "Indexer", position: { x: 560, y: 400 }, description: "Преобразует опубликованный контент в поисковые документы.", reason: "Поисковая схема и обновление индекса не должны усложнять пользовательский request path.", responsibilities: ["Document mapping", "Incremental updates", "Reindex"], useCases: ["Publish event", "Full rebuild"] },
    { id: "search", kind: "infrastructure", label: "Search Index", subtitle: "Derived read model", position: { x: 840, y: 220 }, description: "Отвечает на полнотекстовые запросы и ranking.", reason: "Специализированный индекс быстрее и выразительнее transactional database для search workload.", responsibilities: ["Full-text search", "Ranking", "Facets"], useCases: ["Keyword search", "Filters", "Suggestions"], avoidWhen: ["Каноническое хранение контента"], stack: [{ name: "Elasticsearch" }, { name: "OpenSearch" }] },
  ],
  edges: [
    { id: "frontend-backend", source: "frontend", target: "backend", label: "read / search", type: "request", bidirectional: true },
    { id: "backend-database", source: "backend", target: "database", label: "content", type: "data" },
    { id: "database-indexer", source: "database", target: "indexer", label: "published content", type: "async" },
    { id: "indexer-search", source: "indexer", target: "search", label: "index document", type: "data" },
    { id: "backend-search", source: "backend", target: "search", label: "query", type: "request", bidirectional: true },
  ],
};
