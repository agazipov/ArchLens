import type { Architecture } from "../model/types";

export const analyticsDashboard: Architecture = {
  id: "analytics-dashboard", title: "Analytics Dashboard / Reporting", shortTitle: "Analytics Dashboard", category: "data-content-media", level: "system", complexity: "Medium",
  description: "ETL или sync копирует данные из production database в analytics storage, откуда reporting backend обслуживает тяжёлые dashboard queries.",
  keyIdea: "Аналитические reads изолируются от transactional workload, чтобы отчёты не замедляли production application.",
  suitableFor: ["BI dashboards", "Тяжёлые aggregations", "Историческая отчётность"], notIdealFor: ["Простой operational counter", "Строго realtime transactional decision"],
  stack: [{ name: "ETL / CDC" }, { name: "Analytics database / warehouse" }, { name: "Reporting backend" }], alternatives: [{ name: "Read replica" }, { name: "Materialized views" }],
  tradeoffs: { pros: ["Production DB защищена от тяжёлых queries", "Analytics schema оптимизирована для reads", "Можно хранить историю"], cons: ["Данные запаздывают", "ETL требует monitoring", "Дублирование и data governance"] },
  interactionStyles: ["batch", "request-response"], tags: ["analytics", "etl", "reporting"],
  nodes: [
    { id: "production", kind: "database", label: "Production Database", subtitle: "Transactional source", position: { x: 20, y: 20 }, description: "Обслуживает application transactions и остаётся source of operational truth.", reason: "Transactional workload требует низкой latency и предсказуемой нагрузки.", responsibilities: ["Application writes", "Operational reads", "Transactions"], useCases: ["Orders", "Users", "Payments"] },
    { id: "etl", kind: "infrastructure", label: "ETL / Sync", position: { x: 300, y: 20 }, description: "Копирует и преобразует production data по schedule или change stream.", reason: "Analytics model отличается от transactional schema.", responsibilities: ["Extract", "Transform", "Load", "Checkpoint"], useCases: ["Batch sync", "CDC"] },
    { id: "warehouse", kind: "database", label: "Analytics Storage", position: { x: 580, y: 170 }, description: "Хранит историю и структуры, оптимизированные для aggregations.", reason: "Columnar или warehouse engine эффективнее для широких scans.", responsibilities: ["Historical data", "Aggregations", "Analytical schema"], useCases: ["Cohorts", "Revenue", "Trends"] },
    { id: "reporting", kind: "server", label: "Reporting Backend", position: { x: 300, y: 320 }, description: "Авторизует users и выполняет управляемые analytical queries.", reason: "Dashboard не должен напрямую получать unrestricted warehouse access.", responsibilities: ["Access control", "Query API", "Caching"], useCases: ["Report query", "Export"] },
    { id: "dashboard", kind: "client", label: "Dashboard", position: { x: 20, y: 320 }, description: "Показывает metrics, filters и reports.", reason: "Business users нужен интерактивный analytical interface.", responsibilities: ["Charts", "Filters", "Drill-down"], useCases: ["Executive dashboard", "Sales report"] },
  ],
  edges: [
    { id: "production-etl", source: "production", target: "etl", label: "snapshot / changes", type: "data" },
    { id: "etl-warehouse", source: "etl", target: "warehouse", label: "batch load", type: "async" },
    { id: "dashboard-reporting", source: "dashboard", target: "reporting", label: "report query", type: "request" },
    { id: "reporting-warehouse", source: "reporting", target: "warehouse", label: "analytics query", type: "data" },
  ],
};
