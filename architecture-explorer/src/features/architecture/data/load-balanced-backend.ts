import type { Architecture } from "../model/types";

export const loadBalancedBackend: Architecture = {
  id: "load-balanced-backend", title: "Load-balanced Backend", shortTitle: "Load-balanced Backend", category: "distributed-scale", level: "system", complexity: "Medium",
  description: "Load balancer распределяет requests между несколькими stateless backend instances, которые используют общее долговременное хранилище.",
  keyIdea: "Горизонтальное масштабирование backend требует, чтобы любой instance мог обработать следующий request без локального пользовательского состояния.",
  suitableFor: ["Рост request traffic", "High availability", "Rolling deployments"], notIdealFor: ["Нагрузка помещается в один instance", "Stateful sessions невозможно вынести из process memory"],
  stack: [{ name: "Managed load balancer" }, { name: "Nginx / HAProxy" }, { name: "Containers" }, { name: "PostgreSQL" }], alternatives: [{ name: "Vertical scaling" }, { name: "Serverless runtime" }],
  tradeoffs: { pros: ["Горизонтальная capacity", "Instance failure не останавливает весь backend", "Rolling deploy"], cons: ["Shared database может стать bottleneck", "Нужны health checks", "Sessions и files нельзя бездумно хранить локально"] },
  interactionStyles: ["request-response"], tags: ["load-balancing", "scaling", "availability"],
  flowScenarios: [{
    id: "route-read-request",
    title: "Route request to a healthy instance",
    description: "Load balancer выбирает healthy target, stateless instance читает shared state и возвращает response тем же ingress path.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Health checks уже обновили target status до прихода request.", "Backend instances эквивалентны и не требуют sticky session.", "Database connection pooling и cache layers не показаны."],
    sources: [{ title: "AWS: How Elastic Load Balancing works", url: "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html" }],
    steps: [
      { id: "ingress", title: "Client обращается к одному endpoint", description: "Public contract не раскрывает число и адреса backend instances.", flow: { type: "transfer", from: "clients", to: "balancer", edgeId: "clients-balancer", kind: "request", label: "HTTPS request" } },
      { id: "route", title: "Balancer выбирает healthy target", description: "Сценарий продолжает normal path; unhealthy targets исключены из routing set.", flow: { type: "branch", condition: "Selected target health", paths: [
        { id: "unhealthy", label: "Unhealthy", steps: [
          { type: "outcome", nodeId: "balancer", outcome: "failure", label: "target skipped" },
        ] },
        { id: "healthy", label: "Healthy", selected: true, steps: [
          { type: "transfer", from: "balancer", to: "instances", edgeId: "balancer-instances", kind: "request", label: "route request" },
        ] },
      ] } },
      { id: "shared-state", title: "Instance читает shared state", description: "Любой replica получает одинаковое authoritative state из общей database.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "instances", to: "database", edgeId: "instances-database", kind: "request", label: "query" },
        { type: "transfer", from: "database", to: "instances", edgeId: "instances-database", kind: "response", label: "result" },
      ] } },
      { id: "egress", title: "Response возвращается через balancer", description: "Client видит один logical backend независимо от выбранного replica.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "instances", to: "balancer", edgeId: "balancer-instances", kind: "response", label: "backend response" },
        { type: "transfer", from: "balancer", to: "clients", edgeId: "clients-balancer", kind: "response", label: "HTTPS response" },
      ] } },
    ],
  }],
  nodes: [
    { id: "clients", kind: "client", label: "Clients", position: { x: 20, y: 170 }, description: "Обращаются к одному публичному endpoint независимо от числа backend instances.", reason: "Topology backend не должна быть частью client contract.", responsibilities: ["HTTPS requests", "Retry policy"], useCases: ["Web", "Mobile", "Integrations"] },
    { id: "balancer", kind: "infrastructure", label: "Load Balancer", position: { x: 300, y: 170 }, description: "Проверяет health и направляет каждый request на доступный instance.", reason: "Traffic нужно распределять без знания topology на client side.", responsibilities: ["Routing", "Health checks", "TLS termination"], useCases: ["Round robin", "Least connections"], stack: [{ name: "Managed LB" }, { name: "Nginx" }, { name: "HAProxy" }] },
    { id: "instances", kind: "server", label: "Backend Instances × N", subtitle: "Stateless request handlers", position: { x: 580, y: 170 }, description: "Одинаковые instances обрабатывают requests и не полагаются на локальную session memory.", reason: "Любой instance должен быть заменяемым и независимо deployable.", responsibilities: ["API", "Business rules", "Shared infrastructure access"], useCases: ["Scale out", "Rolling deploy", "Failover"] },
    { id: "database", kind: "database", label: "Shared Database", position: { x: 860, y: 170 }, description: "Хранит долговременное состояние, доступное всем backend instances.", reason: "Process memory исчезает вместе с instance и не обеспечивает shared truth.", responsibilities: ["Persistence", "Transactions", "Connections"], useCases: ["Users", "Orders", "Sessions"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "clients-balancer", source: "clients", target: "balancer", label: "HTTPS", type: "request", bidirectional: true },
    { id: "balancer-instances", source: "balancer", target: "instances", label: "route to healthy instance", type: "request", bidirectional: true },
    { id: "instances-database", source: "instances", target: "database", label: "shared state", type: "data", bidirectional: true },
  ],
};
