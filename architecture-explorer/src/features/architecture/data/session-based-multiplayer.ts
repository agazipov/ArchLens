import type { Architecture } from "../model/types";

export const sessionBasedMultiplayer: Architecture = {
  id: "session-based-multiplayer", title: "Session-based Multiplayer", shortTitle: "Session Multiplayer", category: "games", level: "system", complexity: "High",
  description: "После authentication matchmaking собирает игроков, назначает session на game server из pool, а результаты сохраняются отдельным service.",
  keyIdea: "Match lifecycle отделяет долгоживущие account data от короткоживущего авторитетного game server process.",
  suitableFor: ["Матчи и лобби", "Короткоживущие dedicated sessions", "Горизонтальный game server pool"], notIdealFor: ["Single-player", "Один постоянный shared world"],
  stack: [{ name: "Matchmaking service" }, { name: "Container orchestration" }, { name: "PostgreSQL" }, { name: "Redis" }], alternatives: [{ name: "Peer-to-peer sessions" }, { name: "Persistent world server" }],
  tradeoffs: { pros: ["Game servers изолированы по sessions", "Capacity масштабируется pool-ом", "Account state отделён от match state"], cons: ["Нужно capacity management", "Session handoff и failures", "Matchmaking quality против wait time"] },
  interactionStyles: ["request-response", "realtime", "async"], tags: ["games", "matchmaking", "sessions"],
  flowScenarios: [{
    id: "match-play-and-persist-results",
    title: "Match players, run a session, persist results",
    description: "Authenticated player проходит matchmaking, получает dedicated session, играет через realtime channel, а authoritative result переживает завершение server process.",
    scope: "typical",
    fidelity: "detailed",
    assumptions: ["Matchmaking attributes уже включают region, rating и party constraints.", "Game server является authority для simulation и финального результата.", "Session endpoint и short-lived connection token возвращаются только matched players."],
    sources: [{ title: "Amazon GameLift Servers: How hosting works", url: "https://docs.aws.amazon.com/gameliftservers/latest/developerguide/gamelift-howitworks.html" }],
    steps: [
      { id: "enter-queue", title: "Player входит в matchmaking queue", description: "Auth boundary подтверждает identity и передаёт только eligible player attributes.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "client", to: "auth", edgeId: "client-auth", kind: "request", label: "login and find match" },
        { type: "transfer", from: "auth", to: "matchmaking", edgeId: "auth-matchmaking", kind: "control", label: "eligible player" },
      ] } },
      { id: "allocate", title: "Matchmaker назначает свободную session", description: "После формирования группы allocator выбирает healthy server process и возвращает connection information.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "matchmaking", to: "pool", edgeId: "matchmaking-pool", kind: "control", label: "allocate session" },
        { type: "transfer", from: "pool", to: "client", edgeId: "client-pool", kind: "response", label: "endpoint and session token" },
      ] } },
      { id: "play", title: "Authoritative session обрабатывает матч", description: "Inputs идут на выделенный server, а snapshots и game events возвращаются players до завершения session.", flow: { type: "sequence", steps: [
        { type: "parallel", steps: [
          { type: "transfer", from: "client", to: "pool", edgeId: "client-pool", kind: "message", label: "player inputs" },
          { type: "transfer", from: "pool", to: "client", edgeId: "client-pool", kind: "response", label: "authoritative snapshots" },
        ] },
        { type: "wait", label: "match in progress", duration: "long" },
      ] } },
      { id: "complete", title: "Result сохраняется вне ephemeral session", description: "Game server подписывает outcome, results service применяет rewards и rating к durable player record.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "pool", to: "results", edgeId: "pool-results", kind: "message", label: "MatchCompleted" },
        { type: "transfer", from: "results", to: "database", edgeId: "results-database", kind: "data", label: "rating, rewards, history" },
        { type: "outcome", nodeId: "database", outcome: "success", label: "match result durable" },
      ] } },
    ],
  }],
  nodes: [
    { id: "client", kind: "client", label: "Game Client", position: { x: 20, y: 220 }, description: "Авторизуется, входит в queue и подключается к назначенной session.", reason: "Игроку нужен один управляемый путь от account до матча.", responsibilities: ["Login", "Queue request", "Join session"], useCases: ["Find match", "Join lobby", "Play"] },
    { id: "auth", kind: "api", label: "Auth / Profile", position: { x: 280, y: 220 }, description: "Проверяет identity и предоставляет matchmaking attributes.", reason: "Game server не должен самостоятельно владеть account lifecycle.", responsibilities: ["Identity", "Entitlements", "Player attributes"], useCases: ["Login", "Region", "Rating"] },
    { id: "matchmaking", kind: "server", label: "Matchmaking", position: { x: 540, y: 220 }, description: "Группирует совместимых игроков и запрашивает свободную session.", reason: "Match quality и wait time требуют отдельного coordination component.", responsibilities: ["Queues", "Grouping", "Server allocation"], useCases: ["Skill match", "Region match", "Party match"] },
    { id: "pool", kind: "infrastructure", label: "Game Server Pool", position: { x: 800, y: 220 }, description: "Запускает изолированные authoritative sessions по demand.", reason: "Матчи имеют короткий lifecycle и переменную capacity.", responsibilities: ["Session allocation", "Health", "Scale out"], useCases: ["Dedicated match", "Lobby session"] },
    { id: "results", kind: "server", label: "Results Service", position: { x: 1060, y: 80 }, description: "Проверяет и сохраняет финальный outcome матча.", reason: "Ephemeral game server не должен напрямую менять долговременные profiles без boundary.", responsibilities: ["Result validation", "Rewards", "Rating update"], useCases: ["Match complete", "Leaderboard update"] },
    { id: "database", kind: "database", label: "Player Database", position: { x: 1320, y: 80 }, description: "Хранит profiles, rating и durable match history.", reason: "Account state переживает отдельные sessions и server restarts.", responsibilities: ["Profiles", "Ratings", "History"], useCases: ["Career", "Rewards", "Match history"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "client-auth", source: "client", target: "auth", label: "login / profile", type: "request" },
    { id: "auth-matchmaking", source: "auth", target: "matchmaking", label: "eligible player", type: "request" },
    { id: "matchmaking-pool", source: "matchmaking", target: "pool", label: "allocate session", type: "request" },
    { id: "client-pool", source: "client", target: "pool", label: "game session", type: "realtime", bidirectional: true },
    { id: "pool-results", source: "pool", target: "results", label: "match completed", type: "event" },
    { id: "results-database", source: "results", target: "database", label: "rating / history", type: "data" },
  ],
};
