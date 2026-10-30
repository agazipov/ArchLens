import type { Architecture } from "../model/types";

export const knowledgeBase: Architecture = {
  id: "knowledge-base", title: "Search-heavy Knowledge Base", shortTitle: "Knowledge Base", category: "content", level: "system", complexity: "Medium",
  description: "Backend хранит авторитетный контент в database, а индексатор поддерживает производный search index для быстрых полнотекстовых запросов.",
  keyIdea: "Search engine — оптимизированная read model, а не source of truth; индекс всегда можно восстановить из основного хранилища.",
  suitableFor: ["Документация", "Help center", "Внутренняя knowledge base"], notIdealFor: ["Маленький набор статических страниц", "Система без полнотекстового поиска"],
  stack: [{ name: "PostgreSQL" }, { name: "Elasticsearch" }, { name: "OpenSearch" }], alternatives: [{ name: "PostgreSQL full-text search", note: "для меньшего масштаба" }],
  tradeoffs: { pros: ["Быстрый релевантный поиск", "Database остаётся source of truth", "Read model можно масштабировать отдельно"], cons: ["Индекс обновляется не мгновенно", "Нужны reindex и monitoring", "Дублирование данных"] },
  interactionStyles: ["request-response", "async"], tags: ["content", "search", "read-model"],
  nodes: [
    { id: "frontend", kind: "client", label: "Frontend", position: { x: 20, y: 220 }, description: "Показывает статьи и отправляет поисковые запросы.", reason: "Читателю нужен единый интерфейс навигации и поиска.", responsibilities: ["Search UI", "Article view", "Navigation"], useCases: ["Search", "Browse", "Read"] },
    { id: "backend", kind: "server", label: "Knowledge Backend", position: { x: 280, y: 220 }, description: "Управляет публикацией, доступом и article reads.", reason: "Контент и permissions требуют доверенного application layer.", responsibilities: ["Content API", "Authorization", "Publishing"], useCases: ["Create article", "Publish", "Read article"] },
    { id: "database", kind: "database", label: "Content Database", subtitle: "Source of truth", position: { x: 560, y: 40 }, description: "Хранит канонические статьи, версии и permissions.", reason: "Контент должен сохраняться независимо от состояния индекса.", responsibilities: ["Canonical content", "Versions", "Permissions"], useCases: ["Articles", "Authors", "Revisions"], stack: [{ name: "PostgreSQL" }] },
    { id: "indexer", kind: "server", label: "Indexer", position: { x: 560, y: 400 }, description: "Преобразует опубликованный контент в поисковые документы.", reason: "Поисковая схема и обновление индекса не должны усложнять пользовательский request path.", responsibilities: ["Document mapping", "Incremental updates", "Reindex"], useCases: ["Publish event", "Full rebuild"] },
    { id: "search", kind: "infrastructure", label: "Search Index", subtitle: "Derived read model", position: { x: 840, y: 220 }, description: "Отвечает на полнотекстовые запросы и ranking.", reason: "Специализированный индекс быстрее и выразительнее transactional database для search workload.", responsibilities: ["Full-text search", "Ranking", "Facets"], useCases: ["Keyword search", "Filters", "Suggestions"], avoidWhen: ["Каноническое хранение контента"], stack: [{ name: "Elasticsearch" }, { name: "OpenSearch" }] },
  ],
  edges: [
    { id: "frontend-backend", source: "frontend", target: "backend", label: "read / search", type: "request" },
    { id: "backend-database", source: "backend", target: "database", label: "content", type: "data" },
    { id: "database-indexer", source: "database", target: "indexer", label: "published content", type: "async" },
    { id: "indexer-search", source: "indexer", target: "search", label: "index document", type: "data" },
    { id: "backend-search", source: "backend", target: "search", label: "query", type: "request" },
  ],
};
