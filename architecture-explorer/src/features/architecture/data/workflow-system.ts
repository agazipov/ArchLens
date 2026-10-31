import type { Architecture } from "../model/types";

export const workflowSystem: Architecture = {
  id: "workflow-system", title: "Workflow System", shortTitle: "Workflow System", category: "messaging-workflows", level: "system", complexity: "High",
  description: "Workflow engine хранит состояние долгого процесса, планирует следующие шаги через queue и возобновляет выполнение после ожиданий или ошибок.",
  keyIdea: "Долгий business process — это durable state machine, а не один HTTP request или цепочка вложенных callbacks.",
  suitableFor: ["Approval flows", "Onboarding", "Многошаговые процессы с ожиданием"], notIdealFor: ["Простой CRUD", "Короткая атомарная операция"],
  stack: [{ name: "Temporal" }, { name: "Camunda" }, { name: "RabbitMQ / Kafka" }, { name: "PostgreSQL" }], alternatives: [{ name: "Application state machine" }, { name: "Background Job Processing" }],
  tradeoffs: { pros: ["Durable progress", "Retry и compensation", "Наблюдаемое состояние процесса"], cons: ["Новая operational subsystem", "Версионирование workflow", "Нужно проектировать идемпотентные activities"] },
  interactionStyles: ["request-response", "async"], tags: ["workflow", "state-machine", "workers"],
  flowScenarios: [{
    id: "human-approval",
    title: "Onboarding with human approval",
    description: "Durable workflow запускает activity, переживает ожидание решения и продолжает только после approval signal.",
    scope: "example",
    fidelity: "detailed",
    assumptions: ["Workflow state и timers сохраняются durable engine-ом.", "Worker activities идемпотентны относительно retries.", "Показана approved ветвь; rejected path завершает процесс без provisioning."],
    sources: [{ title: "Temporal: Workflow message passing", url: "https://docs.temporal.io/encyclopedia/workflow-message-passing" }],
    steps: [
      { id: "start", title: "UI запускает onboarding", description: "API авторизует command, engine создаёт instance и сохраняет начальное execution state.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "ui", to: "api", edgeId: "ui-api", kind: "request", label: "start onboarding" },
        { type: "transfer", from: "api", to: "engine", edgeId: "api-engine", kind: "control", label: "start workflow" },
        { type: "transfer", from: "engine", to: "database", edgeId: "engine-db", kind: "data", label: "persist instance" },
      ] } },
      { id: "notify", title: "Approval task доставляется worker-у", description: "Engine планирует activity отдельно от orchestration state; worker отправляет уведомление и возвращает result.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "engine", to: "queue", edgeId: "engine-queue", kind: "message", label: "schedule notification" },
        { type: "transfer", from: "queue", to: "workers", edgeId: "queue-workers", kind: "message", label: "deliver task" },
        { type: "transfer", from: "workers", to: "engine", edgeId: "workers-engine", kind: "message", label: "notification sent" },
      ] } },
      { id: "wait", title: "Workflow ожидает человеческое решение", description: "HTTP request уже не открыт: durable instance пассивно ждёт external signal часы или дни.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "engine", label: "approval pending" },
        { type: "wait", label: "wait for approval signal", duration: "long" },
      ] } },
      { id: "signal", title: "Approver отправляет решение", description: "UI action проходит через API как signal/update, затем decision фиксируется в workflow history.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "ui", to: "api", edgeId: "ui-api", kind: "request", label: "approve" },
        { type: "transfer", from: "api", to: "engine", edgeId: "api-engine", kind: "control", label: "approval signal" },
        { type: "transfer", from: "engine", to: "database", edgeId: "engine-db", kind: "data", label: "record decision" },
      ] } },
      { id: "continue", title: "Engine выбирает следующий transition", description: "Approved path планирует provisioning; rejected path остаётся видимой альтернативой.", flow: { type: "branch", condition: "Approval decision", paths: [
        { id: "approved", label: "Approved", selected: true, steps: [
          { type: "transfer", from: "engine", to: "queue", edgeId: "engine-queue", kind: "message", label: "schedule provisioning" },
          { type: "transfer", from: "queue", to: "workers", edgeId: "queue-workers", kind: "message", label: "deliver activity" },
          { type: "transfer", from: "workers", to: "engine", edgeId: "workers-engine", kind: "message", label: "account provisioned" },
          { type: "transfer", from: "engine", to: "database", edgeId: "engine-db", kind: "data", label: "complete workflow" },
          { type: "outcome", nodeId: "engine", outcome: "success", label: "onboarding completed" },
        ] },
        { id: "rejected", label: "Rejected", steps: [
          { type: "transfer", from: "engine", to: "database", edgeId: "engine-db", kind: "data", label: "close as rejected" },
          { type: "outcome", nodeId: "engine", outcome: "failure", label: "onboarding stopped" },
        ] },
      ] } },
    ],
  }],
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
