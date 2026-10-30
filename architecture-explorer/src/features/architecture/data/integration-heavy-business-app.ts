import type { Architecture } from "../model/types";

export const integrationHeavyBusinessApp: Architecture = {
  id: "integration-heavy-business-app", title: "Integration-heavy Business Application", shortTitle: "Integration-heavy App", category: "business", level: "system", complexity: "High",
  description: "Business application обращается к внешним systems через единый integration layer, который изолирует vendor contracts, credentials, retries и webhooks.",
  keyIdea: "Integration layer защищает business core от различий и нестабильности внешних API.",
  suitableFor: ["CRM/ERP ecosystems", "Несколько внешних providers", "Разные auth и failure models"], notIdealFor: ["Одна простая стабильная integration", "Proxy без собственного mapping или policy"],
  stack: [{ name: "Provider SDKs" }, { name: "HTTP clients" }, { name: "RabbitMQ / NATS", note: "для async integrations" }], alternatives: [{ name: "Direct integration" }, { name: "iPaaS" }],
  tradeoffs: { pros: ["Vendor isolation", "Единые retry/timeout policies", "Business core не знает внешние contracts"], cons: ["Дополнительный mapping layer", "Integration bottleneck", "Нужно обрабатывать partial failures"] },
  interactionStyles: ["request-response", "async"], tags: ["integrations", "adapters", "webhooks"],
  nodes: [
    { id: "app", kind: "server", label: "Business Application", position: { x: 20, y: 260 }, description: "Выполняет продуктовые use cases в терминах внутренней domain model.", reason: "Business rules не должны зависеть от форматов конкретных vendors.", responsibilities: ["Use cases", "Domain state", "Integration intents"], useCases: ["Schedule meeting", "Sync customer", "Create invoice"] },
    { id: "layer", kind: "infrastructure", label: "Integration Layer", position: { x: 300, y: 260 }, description: "Преобразует внутренние commands в vendor contracts и нормализует ответы.", reason: "Каждая внешняя system имеет собственные auth, rate limits и error semantics.", responsibilities: ["Contract mapping", "Credentials", "Timeout / retry", "Webhook validation"], useCases: ["Outbound API", "Inbound webhook", "Data sync"] },
    { id: "email", kind: "external", label: "Email", position: { x: 580, y: 20 }, description: "Внешняя система отправки и получения email.", reason: "Email transport находится за пределами контроля приложения.", responsibilities: ["Delivery", "Provider events"], useCases: ["Transactional email", "Inbound mail"] },
    { id: "calendar", kind: "external", label: "Calendar", position: { x: 580, y: 140 }, description: "Внешний календарь хранит встречи и availability.", reason: "Пользователь уже управляет расписанием во внешней системе.", responsibilities: ["Events", "Availability", "Webhooks"], useCases: ["Create meeting", "Sync changes"] },
    { id: "erp", kind: "external", label: "ERP", position: { x: 580, y: 260 }, description: "Корпоративная система учёта заказов, товаров или финансов.", reason: "Business application должна согласовывать состояние с существующим system of record.", responsibilities: ["Master data", "Transactions", "Exports"], useCases: ["Customer sync", "Invoice sync"] },
    { id: "payments", kind: "external", label: "Payment Provider", position: { x: 580, y: 380 }, description: "Обрабатывает платежи и присылает status webhooks.", reason: "Payment capability выгоднее делегировать специализированному provider.", responsibilities: ["Charge", "Refund", "Webhook"], useCases: ["Payment", "Payout"] },
    { id: "webhooks", kind: "api", label: "Webhook Boundary", position: { x: 580, y: 500 }, description: "Принимает подписанные callbacks от внешних providers.", reason: "Асинхронные изменения приходят по недоверенному публичному HTTP endpoint.", responsibilities: ["Signature validation", "Deduplication", "Event mapping"], useCases: ["Payment status", "Calendar changed"] },
  ],
  edges: [
    { id: "app-layer", source: "app", target: "layer", label: "integration port", type: "request" },
    { id: "layer-email", source: "layer", target: "email", label: "provider API", type: "request" },
    { id: "layer-calendar", source: "layer", target: "calendar", label: "provider API", type: "request" },
    { id: "layer-erp", source: "layer", target: "erp", label: "sync", type: "request" },
    { id: "layer-payments", source: "layer", target: "payments", label: "payment API", type: "request" },
    { id: "webhooks-layer", source: "webhooks", target: "layer", label: "normalized event", type: "event" },
  ],
};
