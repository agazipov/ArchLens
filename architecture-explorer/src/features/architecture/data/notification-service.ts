import type { Architecture } from "../model/types";

export const notificationService: Architecture = {
  id: "notification-service", title: "Notification Service", shortTitle: "Notification Service", category: "notifications", level: "system", complexity: "Medium",
  description: "Application публикует notification job в очередь, worker применяет preferences и доставляет сообщение через внешние email, push или SMS providers.",
  keyIdea: "Пользовательский request не должен ждать ненадёжную внешнюю доставку; очередь даёт buffering, retry и backpressure.",
  suitableFor: ["Transactional email", "Push и SMS", "Пиковая или ненадёжная доставка"], notIdealFor: ["Единственное редкое письмо", "Операция, где delivery result нужен синхронно"],
  stack: [{ name: "RabbitMQ / Kafka / NATS" }, { name: "Background workers" }, { name: "Email / Push / SMS providers" }], alternatives: [{ name: "Direct provider integration", note: "для очень простого старта" }],
  tradeoffs: { pros: ["API latency не зависит от provider", "Retry и rate limiting", "Каналы изолированы от application"], cons: ["Eventual delivery", "Нужна идемпотентность", "Наблюдаемость проходит через несколько систем"] },
  interactionStyles: ["async"], tags: ["notifications", "queue", "delivery"],
  nodes: [
    { id: "application", kind: "server", label: "Application", position: { x: 20, y: 220 }, description: "Решает, что пользователю нужно отправить уведомление.", reason: "Domain event или use case определяет смысл сообщения.", responsibilities: ["Notification intent", "Recipient", "Template data"], useCases: ["Order confirmed", "Password reset", "Mention"] },
    { id: "queue", kind: "infrastructure", label: "Queue", position: { x: 280, y: 220 }, description: "Буферизует jobs и отделяет application availability от providers.", reason: "Доставка может быть медленной, rate-limited или временно недоступной.", responsibilities: ["Buffering", "Retry scheduling", "Backpressure"], useCases: ["Delivery jobs", "Peak smoothing"], stack: [{ name: "RabbitMQ" }, { name: "Kafka" }, { name: "NATS" }] },
    { id: "worker", kind: "server", label: "Notification Worker", position: { x: 540, y: 220 }, description: "Выбирает канал, рендерит сообщение и безопасно повторяет доставку.", reason: "Provider side effects требуют независимого lifecycle и retry policy.", responsibilities: ["Preferences", "Templates", "Idempotent delivery"], useCases: ["Email", "Push", "SMS"] },
    { id: "email", kind: "external", label: "Email Provider", position: { x: 820, y: 20 }, description: "Принимает email и управляет фактической доставкой.", reason: "Email transport и reputation удобнее делегировать провайдеру.", responsibilities: ["SMTP delivery", "Bounce events"], useCases: ["Transactional email"] },
    { id: "push", kind: "external", label: "Push Provider", position: { x: 820, y: 220 }, description: "Доставляет push notification зарегистрированным устройствам.", reason: "Mobile platforms используют собственные provider gateways.", responsibilities: ["Device delivery", "Provider response"], useCases: ["Mobile push", "Web push"] },
    { id: "sms", kind: "external", label: "SMS Provider", position: { x: 820, y: 420 }, description: "Доставляет короткие сообщения через telecom network.", reason: "Приложение не управляет операторской инфраструктурой.", responsibilities: ["SMS delivery", "Status callbacks"], useCases: ["OTP", "Critical alert"] },
  ],
  edges: [
    { id: "application-queue", source: "application", target: "queue", label: "enqueue", type: "async" },
    { id: "queue-worker", source: "queue", target: "worker", label: "consume", type: "async" },
    { id: "worker-email", source: "worker", target: "email", label: "email API", type: "request" },
    { id: "worker-push", source: "worker", target: "push", label: "push API", type: "request" },
    { id: "worker-sms", source: "worker", target: "sms", label: "SMS API", type: "request" },
  ],
};
