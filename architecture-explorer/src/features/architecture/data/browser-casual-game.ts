import type { Architecture } from "../model/types";

export const browserCasualGame: Architecture = {
  id: "browser-casual-game", title: "Browser / Casual Game", shortTitle: "Browser Game", category: "games", level: "system", complexity: "Low",
  description: "Game client выполняет presentation и локальный gameplay, а Game API хранит профиль, прогресс и результаты в database.",
  keyIdea: "Не каждой игре нужен realtime server: для casual gameplay достаточно trusted backend вокруг долговременного прогресса.",
  suitableFor: ["Single-player browser game", "Asynchronous challenges", "Casual progression"], notIdealFor: ["Authoritative realtime multiplayer", "Shared low-latency world"],
  stack: [{ name: "Web game client" }, { name: "Fastify / ASP.NET Core / Spring Boot" }, { name: "PostgreSQL" }], alternatives: [{ name: "Authoritative Multiplayer" }, { name: "Static offline game" }],
  tradeoffs: { pros: ["Простая backend architecture", "Gameplay отзывчив локально", "Progress доступен между devices"], cons: ["Client results требуют anti-tamper checks", "Нет server-authoritative simulation", "Offline sync conflicts"] },
  interactionStyles: ["request-response"], tags: ["games", "casual", "progress"],
  nodes: [
    { id: "client", kind: "client", label: "Game Client", position: { x: 20, y: 170 }, description: "Запускает rendering и локальный gameplay loop.", reason: "Casual mechanics не требуют network round trip на каждый action.", responsibilities: ["Rendering", "Input", "Local simulation"], useCases: ["Puzzle", "Idle game", "Turn-based play"] },
    { id: "api", kind: "api", label: "Game API", position: { x: 300, y: 170 }, description: "Аутентифицирует player и принимает допустимые progress updates.", reason: "Account и persistent progress нельзя хранить только в browser.", responsibilities: ["Authentication", "Progress rules", "Result validation"], useCases: ["Save progress", "Claim reward", "Leaderboard submit"] },
    { id: "database", kind: "database", label: "Game Database", position: { x: 580, y: 170 }, description: "Хранит profiles, inventory и durable progression.", reason: "Progress должен переживать cache clear и смену устройства.", responsibilities: ["Profiles", "Progress", "Inventory"], useCases: ["Levels", "Rewards", "Settings"], stack: [{ name: "PostgreSQL" }] },
    { id: "assets", kind: "infrastructure", label: "Asset CDN", position: { x: 300, y: 360 }, description: "Раздаёт game bundles, textures и audio отдельно от API.", reason: "Большие immutable assets лучше кэшировать на edge.", responsibilities: ["Static assets", "Versioned bundles", "Edge cache"], useCases: ["Textures", "Audio", "Game build"] },
  ],
  edges: [
    { id: "client-api", source: "client", target: "api", label: "progress / profile", type: "request" },
    { id: "api-db", source: "api", target: "database", label: "persistent state", type: "data" },
    { id: "client-assets", source: "client", target: "assets", label: "download assets", type: "request" },
  ],
};
