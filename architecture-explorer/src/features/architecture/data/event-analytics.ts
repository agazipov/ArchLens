import type { Architecture } from "../model/types";

export const eventAnalytics: Architecture = {
  id: "event-analytics", title: "Event Analytics", shortTitle: "Event Analytics", category: "data", level: "system", complexity: "High",
  description: "Clients отправляют telemetry в event collector, queue поглощает пики, processing очищает и агрегирует события, а analytics storage обслуживает исследования и dashboards.",
  keyIdea: "Высокообъёмные telemetry events проходят отдельный append-oriented pipeline и не должны записываться синхронно в production database.",
  suitableFor: ["Product analytics", "Telemetry", "Clickstream и game events"], notIdealFor: ["Небольшое число business records", "Транзакционное состояние продукта"],
  stack: [{ name: "Kafka / NATS" }, { name: "Stream or batch processing" }, { name: "Analytics storage" }], alternatives: [{ name: "Managed analytics platform" }, { name: "Analytics Dashboard / Reporting" }],
  tradeoffs: { pros: ["Высокий ingestion throughput", "Production DB не перегружена", "Raw events можно переобработать"], cons: ["Late и duplicate events", "Schema governance", "Pipeline lag и storage cost"] },
  interactionStyles: ["async", "batch"], tags: ["analytics", "events", "telemetry"],
  nodes: [
    { id: "clients", kind: "client", label: "Clients", position: { x: 20, y: 170 }, description: "Генерируют product и technical events без ожидания аналитического результата.", reason: "Telemetry не должна замедлять основной user flow.", responsibilities: ["Event creation", "Batching", "Client context"], useCases: ["Page viewed", "Button clicked", "Match finished"] },
    { id: "collector", kind: "api", label: "Event Collector", position: { x: 300, y: 170 }, description: "Принимает большой поток событий, проверяет envelope и быстро подтверждает ingestion.", reason: "Public ingestion boundary защищает внутренний pipeline.", responsibilities: ["Authentication", "Schema envelope", "Rate limiting"], useCases: ["Batch ingest", "SDK endpoint"] },
    { id: "queue", kind: "infrastructure", label: "Event Queue", position: { x: 580, y: 170 }, description: "Буферизует append-only events и разделяет producers от processing capacity.", reason: "Traffic burst и processor downtime не должны терять telemetry.", responsibilities: ["Durable log", "Partitions", "Retention"], useCases: ["Event stream", "Replay"], stack: [{ name: "Kafka" }, { name: "NATS" }] },
    { id: "processing", kind: "server", label: "Processing", position: { x: 860, y: 170 }, description: "Очищает, обогащает, дедуплицирует и агрегирует события.", reason: "Raw client data требует нормализации перед аналитическим использованием.", responsibilities: ["Validation", "Enrichment", "Aggregation"], useCases: ["Sessions", "Funnels", "Daily metrics"] },
    { id: "storage", kind: "database", label: "Analytics Storage", position: { x: 1140, y: 170 }, description: "Хранит raw или processed events для queries и models.", reason: "Event workload требует scan-oriented storage, а не OLTP tables.", responsibilities: ["Event history", "Aggregates", "Analytical queries"], useCases: ["Funnels", "Retention", "Cohorts"] },
  ],
  edges: [
    { id: "clients-collector", source: "clients", target: "collector", label: "event batch", type: "async" },
    { id: "collector-queue", source: "collector", target: "queue", label: "append", type: "async" },
    { id: "queue-processing", source: "queue", target: "processing", label: "consume / replay", type: "async" },
    { id: "processing-storage", source: "processing", target: "storage", label: "events / aggregates", type: "data" },
  ],
};
