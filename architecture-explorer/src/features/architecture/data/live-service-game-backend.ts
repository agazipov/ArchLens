import type { Architecture } from "../model/types";

export const liveServiceGameBackend: Architecture = {
  id: "live-service-game-backend", title: "Live-service Game Backend", shortTitle: "Live-service Backend", category: "games", level: "system", complexity: "High",
  description: "Единая game backend boundary координирует profiles, inventory, matchmaking, leaderboards и analytics вокруг долгоживущего live product.",
  keyIdea: "Live service — это набор persistent capabilities вокруг игры; их границы важнее выбора engine или client framework.",
  suitableFor: ["Долгоживущая online game", "Progression и economy", "Seasons, matchmaking и leaderboards"], notIdealFor: ["Standalone offline game", "Короткий prototype без operations"],
  stack: [{ name: "NestJS / Spring Boot / ASP.NET Core" }, { name: "PostgreSQL" }, { name: "Redis" }, { name: "Event pipeline" }], alternatives: [{ name: "Modular Monolith" }, { name: "Managed game backend" }],
  tradeoffs: { pros: ["Capabilities имеют явное ownership", "Можно масштабировать горячие paths", "Поддерживает live operations"], cons: ["Большая operational surface", "Economy consistency", "Cross-capability observability и deployment complexity"] },
  interactionStyles: ["request-response", "async", "realtime"], tags: ["games", "live-service", "capabilities"],
  flowScenarios: [{
    id: "claim-season-reward",
    title: "Claim a season reward safely",
    description: "Backend проверяет progression, атомарно выдаёт item через inventory capability и отдельно принимает product telemetry.",
    scope: "example",
    fidelity: "detailed",
    assumptions: ["Claim request содержит стабильный idempotency key.", "Profile является authority для season eligibility, Inventory — для item ownership.", "Telemetry не входит в economy transaction и может быть доставлена позже."],
    sources: [
      { title: "PlayFab Economy: Inventory APIs", url: "https://learn.microsoft.com/en-us/gaming/playfab/economy-monetization/economy-v2/inventory/" },
      { title: "PlayFab: Telemetry overview", url: "https://learn.microsoft.com/en-us/gaming/playfab/data-analytics/ingest-data/telemetry-overview" },
    ],
    steps: [
      { id: "request", title: "Client отправляет authenticated claim", description: "Gateway проверяет identity, rate limit и idempotency key, не раскрывая внутреннюю topology.", flow: { type: "transfer", from: "client", to: "gateway", edgeId: "client-gateway", kind: "request", label: "claim season reward" } },
      { id: "eligibility", title: "Profile подтверждает season eligibility", description: "Progression читается через owning capability; gateway получает явное domain decision.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "gateway", to: "profile", edgeId: "gateway-profile", kind: "request", label: "check season progress" },
        { type: "transfer", from: "profile", to: "data", edgeId: "profile-data", kind: "data", label: "read progression" },
        { type: "transfer", from: "profile", to: "gateway", edgeId: "gateway-profile", kind: "response", label: "eligibility decision" },
      ] } },
      { id: "decision", title: "Backend применяет выбранную business ветвь", description: "Eligible claim выдаётся ровно один раз; rejected request не меняет inventory.", flow: { type: "branch", condition: "Season reward eligible?", paths: [
        { id: "eligible", label: "Eligible", selected: true, steps: [
          { type: "transfer", from: "gateway", to: "inventory", edgeId: "gateway-inventory", kind: "control", label: "grant reward once" },
          { type: "transfer", from: "inventory", to: "data", edgeId: "inventory-data", kind: "data", label: "append inventory transaction" },
          { type: "transfer", from: "gateway", to: "client", edgeId: "client-gateway", kind: "response", label: "reward granted" },
          { type: "transfer", from: "client", to: "analytics", edgeId: "client-analytics", kind: "message", label: "reward claimed telemetry" },
          { type: "outcome", nodeId: "client", outcome: "success", label: "inventory updated" },
        ] },
        { id: "ineligible", label: "Not eligible or already claimed", steps: [
          { type: "transfer", from: "gateway", to: "client", edgeId: "client-gateway", kind: "response", label: "claim rejected" },
          { type: "outcome", nodeId: "client", outcome: "failure", label: "inventory unchanged" },
        ] },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Game Client", position: { x: 20, y: 260 }, description: "Использует backend capabilities между и во время sessions.", reason: "Player experience объединяет account, progression и social systems.", responsibilities: ["Commands", "Display state", "Telemetry"], useCases: ["Login", "Inventory", "Find match"] },
    { id: "gateway", kind: "api", label: "Game Backend", subtitle: "Unified boundary", position: { x: 280, y: 260 }, description: "Аутентифицирует requests и маршрутизирует их к capability modules.", reason: "Client не должен знать внутреннюю topology backend.", responsibilities: ["Auth", "Routing", "Rate limits"], useCases: ["Profile API", "Inventory API", "Matchmaking API"] },
    { id: "profile", kind: "domain", label: "Profile", position: { x: 540, y: 20 }, description: "Владеет identity-linked progression и settings.", reason: "Player profile переживает отдельные matches и devices.", responsibilities: ["Progression", "Settings", "Entitlements"], useCases: ["Level", "Season progress"] },
    { id: "inventory", kind: "domain", label: "Inventory", position: { x: 540, y: 140 }, description: "Владеет предметами и economy transactions.", reason: "Virtual goods требуют согласованности и audit trail.", responsibilities: ["Items", "Grants", "Consumption"], useCases: ["Reward", "Purchase", "Equip"] },
    { id: "matchmaking", kind: "domain", label: "Matchmaking", position: { x: 540, y: 260 }, description: "Группирует players и назначает game sessions.", reason: "Queueing и match quality имеют отдельный scaling profile.", responsibilities: ["Queues", "Rating", "Allocation"], useCases: ["Find match", "Party"] },
    { id: "leaderboards", kind: "domain", label: "Leaderboards", position: { x: 540, y: 380 }, description: "Поддерживает ranked views и сезонные standings.", reason: "Ranked reads отличаются от transactional profile writes.", responsibilities: ["Scores", "Ranking", "Seasons"], useCases: ["Global rank", "Friends rank"] },
    { id: "analytics", kind: "infrastructure", label: "Analytics", position: { x: 540, y: 500 }, description: "Принимает telemetry для balancing и live operations.", reason: "High-volume events не должны перегружать profile database.", responsibilities: ["Event collection", "Metrics", "Experiments"], useCases: ["Retention", "Economy health", "Balance"] },
    { id: "data", kind: "database", label: "Owned Data Stores", position: { x: 820, y: 260 }, description: "Хранилища разделены по ownership и workload, даже если физически используют один cluster.", reason: "Profile, economy и analytics имеют разные consistency и query needs.", responsibilities: ["Durable state", "Capability ownership", "Indexes"], useCases: ["Profiles", "Inventory ledger", "Ranking data"] },
  ],
  edges: [
    { id: "client-gateway", source: "client", target: "gateway", label: "authenticated API", type: "request", bidirectional: true },
    { id: "gateway-profile", source: "gateway", target: "profile", label: "profile use case", type: "request", bidirectional: true },
    { id: "gateway-inventory", source: "gateway", target: "inventory", label: "inventory use case", type: "request" },
    { id: "gateway-matchmaking", source: "gateway", target: "matchmaking", label: "queue", type: "request" },
    { id: "gateway-leaderboards", source: "gateway", target: "leaderboards", label: "rank query", type: "request" },
    { id: "client-analytics", source: "client", target: "analytics", label: "telemetry", type: "async" },
    { id: "profile-data", source: "profile", target: "data", label: "owned data", type: "data" },
    { id: "inventory-data", source: "inventory", target: "data", label: "owned data", type: "data" },
    { id: "leaderboards-data", source: "leaderboards", target: "data", label: "ranking data", type: "data" },
  ],
};
