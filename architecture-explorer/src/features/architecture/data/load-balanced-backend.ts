import type { Architecture } from "../model/types";

export const loadBalancedBackend: Architecture = {
  id: "load-balanced-backend", title: "Load-balanced Backend", shortTitle: "Load-balanced Backend", category: "distributed", level: "system", complexity: "Medium",
  description: "Load balancer распределяет requests между несколькими stateless backend instances, которые используют общее долговременное хранилище.",
  keyIdea: "Горизонтальное масштабирование backend требует, чтобы любой instance мог обработать следующий request без локального пользовательского состояния.",
  suitableFor: ["Рост request traffic", "High availability", "Rolling deployments"], notIdealFor: ["Нагрузка помещается в один instance", "Stateful sessions невозможно вынести из process memory"],
  stack: [{ name: "Managed load balancer" }, { name: "Nginx / HAProxy" }, { name: "Containers" }, { name: "PostgreSQL" }], alternatives: [{ name: "Vertical scaling" }, { name: "Serverless runtime" }],
  tradeoffs: { pros: ["Горизонтальная capacity", "Instance failure не останавливает весь backend", "Rolling deploy"], cons: ["Shared database может стать bottleneck", "Нужны health checks", "Sessions и files нельзя бездумно хранить локально"] },
  interactionStyles: ["request-response"], tags: ["load-balancing", "scaling", "availability"],
  nodes: [
    { id: "clients", kind: "client", label: "Clients", position: { x: 20, y: 170 }, description: "Обращаются к одному публичному endpoint независимо от числа backend instances.", reason: "Topology backend не должна быть частью client contract.", responsibilities: ["HTTPS requests", "Retry policy"], useCases: ["Web", "Mobile", "Integrations"] },
    { id: "balancer", kind: "infrastructure", label: "Load Balancer", position: { x: 300, y: 170 }, description: "Проверяет health и направляет каждый request на доступный instance.", reason: "Traffic нужно распределять без знания topology на client side.", responsibilities: ["Routing", "Health checks", "TLS termination"], useCases: ["Round robin", "Least connections"], stack: [{ name: "Managed LB" }, { name: "Nginx" }, { name: "HAProxy" }] },
    { id: "instances", kind: "server", label: "Backend Instances × N", subtitle: "Stateless request handlers", position: { x: 580, y: 170 }, description: "Одинаковые instances обрабатывают requests и не полагаются на локальную session memory.", reason: "Любой instance должен быть заменяемым и независимо deployable.", responsibilities: ["API", "Business rules", "Shared infrastructure access"], useCases: ["Scale out", "Rolling deploy", "Failover"] },
    { id: "database", kind: "database", label: "Shared Database", position: { x: 860, y: 170 }, description: "Хранит долговременное состояние, доступное всем backend instances.", reason: "Process memory исчезает вместе с instance и не обеспечивает shared truth.", responsibilities: ["Persistence", "Transactions", "Connections"], useCases: ["Users", "Orders", "Sessions"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "clients-balancer", source: "clients", target: "balancer", label: "HTTPS", type: "request" },
    { id: "balancer-instances", source: "balancer", target: "instances", label: "route to healthy instance", type: "request" },
    { id: "instances-database", source: "instances", target: "database", label: "shared state", type: "data" },
  ],
};
