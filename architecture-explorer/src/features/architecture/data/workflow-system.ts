import type { Architecture } from "../model/types";

export const workflowSystem: Architecture = {
  id: "workflow-system", title: "Workflow System", shortTitle: "Workflow System", category: "business", level: "system", complexity: "High",
  description: "Workflow engine хранит состояние долгого процесса, планирует следующие шаги через queue и возобновляет выполнение после ожиданий или ошибок.",
  keyIdea: "Долгий business process — это durable state machine, а не один HTTP request или цепочка вложенных callbacks.",
  suitableFor: ["Approval flows", "Onboarding", "Многошаговые процессы с ожиданием"], notIdealFor: ["Простой CRUD", "Короткая атомарная операция"],
  stack: [{ name: "Temporal" }, { name: "Camunda" }, { name: "RabbitMQ / Kafka" }, { name: "PostgreSQL" }], alternatives: [{ name: "Application state machine" }, { name: "Background Job Processing" }],
  tradeoffs: { pros: ["Durable progress", "Retry и compensation", "Наблюдаемое состояние процесса"], cons: ["Новая operational subsystem", "Версионирование workflow", "Нужно проектировать идемпотентные activities"] },
  interactionStyles: ["request-response", "async"], tags: ["workflow", "state-machine", "workers"],
  nodes: [
    { id: "ui", kind: "client", label: "Workflow UI", position: { x: 20, y: 220 }, description: "Запускает процесс и показывает его текущее состояние.", reason: "Пользователь взаимодействует с процессом в разные моменты времени.", responsibilities: ["Start workflow", "Human tasks", "Progress UI"], useCases: ["Approval", "Onboarding", "Case handling"] },
    { id: "api", kind: "api", label: "Workflow API", position: { x: 280, y: 220 }, description: "Авторизует команды и переводит UI actions в workflow signals.", reason: "Внешние callers не должны напрямую менять engine state.", responsibilities: ["Authorization", "Commands", "Signals"], useCases: ["Start", "Approve", "Cancel"] },
    { id: "engine", kind: "server", label: "Workflow Engine", position: { x: 540, y: 220 }, description: "Определяет следующий шаг и сохраняет durable execution state.", reason: "Процесс должен переживать restart, timeout и временную недоступность dependencies.", responsibilities: ["State transitions", "Timers", "Retry policy"], useCases: ["Long-running process", "Compensation"], stack: [{ name: "Temporal" }, { name: "Camunda" }] },
    { id: "database", kind: "database", label: "Workflow State", position: { x: 800, y: 40 }, description: "Хранит execution history и текущие состояния instances.", reason: "In-memory state недостаточно для процессов продолжительностью часы или дни.", responsibilities: ["Durability", "History", "Timers"], useCases: ["Workflow instance", "Audit trail"] },
    { id: "queue", kind: "infrastructure", label: "Task Queue", position: { x: 800, y: 220 }, description: "Распределяет готовые activities между workers.", reason: "Engine планирует работу, но исполнители масштабируются отдельно.", responsibilities: ["Task delivery", "Backpressure", "Worker routing"], useCases: ["Activities", "Human-task notifications"] },
    { id: "workers", kind: "server", label: "Workers × N", position: { x: 1060, y: 220 }, description: "Выполняют integrations и business activities, затем возвращают результат engine.", reason: "Side effects должны быть изолированы от durable orchestration.", responsibilities: ["Activities", "Idempotency", "External calls"], useCases: ["Provision account", "Send contract", "Charge"] },
  ],
  edges: [
    { id: "ui-api", source: "ui", target: "api", label: "command / status", type: "request" },
    { id: "api-engine", source: "api", target: "engine", label: "start / signal", type: "request" },
    { id: "engine-db", source: "engine", target: "database", label: "execution state", type: "data" },
    { id: "engine-queue", source: "engine", target: "queue", label: "schedule activity", type: "async" },
    { id: "queue-workers", source: "queue", target: "workers", label: "consume", type: "async" },
    { id: "workers-engine", source: "workers", target: "engine", label: "activity result", type: "event" },
  ],
};
