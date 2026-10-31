import type { Architecture } from "../model/types";

export const backgroundJobProcessing: Architecture = {
  id: "background-job-processing", title: "Background Job Processing", shortTitle: "Background Jobs", category: "messaging-workflows", level: "system", complexity: "Medium",
  description: "API быстро подтверждает команду и помещает долгую работу в очередь, а независимо масштабируемые workers исполняют её позже.",
  keyIdea: "Queue разрывает временную зависимость между request и тяжёлой работой, давая buffering, retry и backpressure.",
  suitableFor: ["Exports и imports", "Media processing", "Ненадёжные внешние integrations"], notIdealFor: ["Пользователь должен получить результат немедленно", "Операция быстрее и надёжнее обычного request"],
  stack: [{ name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }, { name: "Redis-backed queue" }], alternatives: [{ name: "Scheduled batch" }, { name: "Synchronous request" }],
  tradeoffs: { pros: ["Быстрый API response", "Независимое масштабирование workers", "Сглаживание пиков и retry"], cons: ["Eventual completion", "At-least-once требует идемпотентности", "Нужны status tracking и observability"] },
  interactionStyles: ["request-response", "async"], tags: ["queue", "workers", "jobs"],
  flowScenarios: [{
    id: "submit-background-job",
    title: "Submit background job",
    description: "API принимает job, отвечает client и не ждёт выполнения worker.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Queue подтверждает enqueue до accepted response.", "Worker consumption происходит позже и не удерживает исходный HTTP request."],
    sources: [{ title: "RabbitMQ: Work Queues", url: "https://www.rabbitmq.com/tutorials/tutorial-two-javascript" }],
    steps: [
      { id: "submit", title: "Client отправляет job", description: "Синхронная request доходит до API для validation и authorization.", flow: { type: "transfer", from: "client", to: "api", edgeId: "client-api", kind: "request", label: "submit job" } },
      { id: "enqueue", title: "API помещает job в Queue", description: "Job становится asynchronous message; worker ещё не участвует.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "api", label: "validate job", duration: "short" },
        { type: "transfer", from: "api", to: "queue", edgeId: "api-queue", kind: "message", label: "enqueue job" },
        { type: "outcome", nodeId: "queue", outcome: "accepted", label: "job accepted" },
      ] } },
      { id: "accepted", title: "Upstream request завершается", description: "API возвращает accepted response. Client больше не ждёт worker execution.", flow: { type: "transfer", from: "api", to: "client", edgeId: "client-api", kind: "response", label: "202 Accepted + job id" } },
      { id: "later", title: "Queue хранит работу до consumer", description: "Между enqueue и consumption есть явный temporal break.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "queue", label: "job remains queued", duration: "short" },
        { type: "wait", label: "worker becomes available", duration: "long" },
      ] } },
      { id: "consume", title: "Worker забирает job позже", description: "Queue доставляет message доступному worker независимо от завершённого client request.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "queue", to: "workers", edgeId: "queue-workers", kind: "message", label: "deliver job" },
        { type: "activate", nodeId: "workers", label: "execute job" },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Client", position: { x: 20, y: 170 }, description: "Отправляет команду и получает job identifier вместо готового результата.", reason: "Долгая работа не должна держать HTTP connection открытым.", responsibilities: ["Submit job", "Track status", "Fetch result"], useCases: ["Start export", "Upload import", "Generate report"] },
    { id: "api", kind: "api", label: "API", position: { x: 280, y: 170 }, description: "Проверяет запрос, создаёт job и быстро отвечает accepted status.", reason: "Trust boundary и validation остаются синхронными.", responsibilities: ["Validation", "Authorization", "Job creation"], useCases: ["POST job", "GET job status"] },
    { id: "queue", kind: "infrastructure", label: "Queue", subtitle: "Async buffer", position: { x: 540, y: 170 }, description: "Хранит pending work и выдаёт её доступным workers.", reason: "Producer и consumer работают с разной скоростью и availability.", responsibilities: ["Buffering", "Delivery", "Retry / dead letter"], useCases: ["Pending jobs", "Backpressure"], stack: [{ name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }] },
    { id: "workers", kind: "server", label: "Workers × N", position: { x: 800, y: 170 }, description: "Параллельно исполняют jobs и безопасно повторяют side effects.", reason: "Worker capacity можно масштабировать независимо от API.", responsibilities: ["Job execution", "Idempotency", "Progress updates"], useCases: ["Export", "Processing", "Integration sync"] },
    { id: "result", kind: "database", label: "Job State / Results", position: { x: 1060, y: 170 }, description: "Хранит status, progress и ссылку на результат.", reason: "Client должен узнать outcome после завершения исходного request.", responsibilities: ["Job status", "Progress", "Result metadata"], useCases: ["Queued", "Running", "Completed / failed"], stack: [{ name: "PostgreSQL" }, { name: "Object storage" }] },
  ],
  edges: [
    { id: "client-api", source: "client", target: "api", label: "submit / status", type: "request", bidirectional: true },
    { id: "api-queue", source: "api", target: "queue", label: "enqueue", type: "async" },
    { id: "queue-workers", source: "queue", target: "workers", label: "consume", type: "async" },
    { id: "workers-result", source: "workers", target: "result", label: "progress / result", type: "data" },
    { id: "api-result", source: "api", target: "result", label: "job status", type: "data" },
  ],
};
