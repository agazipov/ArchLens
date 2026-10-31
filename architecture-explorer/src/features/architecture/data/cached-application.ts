import type { Architecture } from "../model/types";

export const cachedApplication: Architecture = {
  id: "cached-application", title: "Cached Application", shortTitle: "Cached Application", category: "distributed-scale", level: "system", complexity: "Medium",
  description: "Backend читает часто запрашиваемые данные из Redis и обращается к PostgreSQL при cache miss или записи.",
  keyIdea: "Кэш уменьшает latency и database load, но создаёт вторую копию данных, которую необходимо корректно инвалидировать.",
  suitableFor: ["Read-heavy workload", "Дорогие повторяющиеся queries", "Данные с допустимой краткой stale window"], notIdealFor: ["Редко повторяющиеся reads", "Строгая актуальность каждого чтения", "Database ещё не является bottleneck"],
  stack: [{ name: "Redis" }, { name: "PostgreSQL" }], alternatives: [{ name: "HTTP/CDN cache" }, { name: "Database tuning" }],
  tradeoffs: { pros: ["Ниже read latency", "Меньше database load", "Можно переживать read spikes"], cons: ["Cache invalidation", "Stale data", "Cold starts и cache stampede"] },
  interactionStyles: ["request-response"], tags: ["cache", "redis", "scaling"],
  flowScenarios: [{
    id: "cache-miss",
    title: "Cache miss",
    description: "Cache-aside read: Redis miss, database fallback, cache fill, response.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Cache fill завершается до client response — это выбранный educational order, а не универсальное требование.", "Redis содержит производную копию; PostgreSQL остаётся system of record."],
    sources: [{ title: "Azure Architecture Center: Cache-Aside", url: "https://learn.microsoft.com/en-gb/azure/architecture/patterns/cache-aside" }],
    steps: [
      { id: "client-request", title: "Client запрашивает данные", description: "Client отправляет обычный request и не знает о внутреннем cache policy.", flow: { type: "transfer", from: "client", to: "backend", edgeId: "client-backend", kind: "request", label: "read request" } },
      { id: "cache-check", title: "Backend проверяет Redis", description: "Branch выбран заранее: ключ отсутствует, поэтому выполнение продолжится в PostgreSQL.", flow: { type: "branch", condition: "Cache lookup result", paths: [
        { id: "hit", label: "Cache hit", steps: [
          { type: "transfer", from: "backend", to: "redis", edgeId: "backend-redis", kind: "request", label: "GET key" },
          { type: "transfer", from: "redis", to: "backend", edgeId: "backend-redis", kind: "response", label: "cached value" },
          { type: "transfer", from: "backend", to: "client", edgeId: "client-backend", kind: "response", label: "cached response" },
        ] },
        { id: "miss", label: "Cache miss", selected: true, steps: [
          { type: "transfer", from: "backend", to: "redis", edgeId: "backend-redis", kind: "request", label: "GET key" },
          { type: "transfer", from: "redis", to: "backend", edgeId: "backend-redis", kind: "response", label: "not found" },
          { type: "outcome", nodeId: "backend", outcome: "miss", label: "continue to database" },
        ] },
      ] } },
      { id: "database-read", title: "Backend читает PostgreSQL", description: "Source of truth возвращает canonical value.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "backend", to: "postgres", edgeId: "backend-postgres", kind: "request", label: "SELECT" },
        { type: "transfer", from: "postgres", to: "backend", edgeId: "backend-postgres", kind: "response", label: "row" },
      ] } },
      { id: "fill-and-return", title: "Backend заполняет cache и отвечает", description: "Value сначала записывается в Redis, затем response возвращается client.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "backend", to: "redis", edgeId: "backend-redis", kind: "data", label: "SET value" },
        { type: "transfer", from: "backend", to: "client", edgeId: "client-backend", kind: "response", label: "response" },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Client", position: { x: 20, y: 220 }, description: "Отправляет обычный запрос и не знает, откуда backend получил данные.", reason: "Caching остаётся внутренней optimization detail.", responsibilities: ["Request", "Display response"], useCases: ["Product page", "Profile", "Feed"] },
    { id: "backend", kind: "server", label: "Backend", position: { x: 300, y: 220 }, description: "Применяет cache policy и остаётся владельцем согласованности.", reason: "Только application понимает ключи, TTL и момент invalidation.", responsibilities: ["Cache-aside flow", "Invalidation", "Fallback to database"], useCases: ["Read-through", "Write + invalidate"] },
    { id: "redis", kind: "infrastructure", label: "Redis", subtitle: "Disposable cache", position: { x: 580, y: 80 }, description: "Хранит быстро доступную производную копию популярных данных.", reason: "Memory access снижает latency повторных reads.", responsibilities: ["Cached values", "TTL", "Atomic cache operations"], useCases: ["Hot records", "Computed responses"], avoidWhen: ["Единственный source of truth"], stack: [{ name: "Redis" }] },
    { id: "postgres", kind: "database", label: "PostgreSQL", subtitle: "System of record", position: { x: 580, y: 360 }, description: "Остаётся авторитетным долговременным хранилищем.", reason: "Cache может быть очищен или содержать устаревшие данные.", responsibilities: ["Canonical state", "Transactions", "Durability"], useCases: ["Cache miss", "Writes", "Recovery"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "client-backend", source: "client", target: "backend", label: "request", type: "request", bidirectional: true },
    { id: "backend-redis", source: "backend", target: "redis", label: "get / set / invalidate", type: "data", bidirectional: true },
    { id: "backend-postgres", source: "backend", target: "postgres", label: "miss / write", type: "data", bidirectional: true },
  ],
};
