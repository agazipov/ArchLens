import type { Architecture } from "../model/types";

export const fullstackMetaFramework: Architecture = {
  id: "fullstack-meta-framework", title: "Fullstack Meta-framework", shortTitle: "Fullstack Framework", category: "web-frontend", level: "system", complexity: "Medium",
  description: "Одна deployment unit объединяет серверный рендеринг, интерактивный клиент и серверные операции.",
  keyIdea: "Client/server boundary проходит внутри одного framework runtime, но секреты и данные всё равно остаются на сервере.",
  suitableFor: ["Продукт одной команды", "Контент с интерактивностью", "Быстрый fullstack delivery"], notIdealFor: ["Много независимых клиентов", "Жёстко разделённые команды frontend и backend"],
  stack: [{ name: "Next.js" }, { name: "Nuxt" }, { name: "SvelteKit" }], alternatives: [{ name: "Django" }, { name: "Laravel" }, { name: "Rails" }],
  tradeoffs: { pros: ["Одна deployment unit", "Server rendering и интерактивность рядом", "Меньше обязательных внутренних HTTP-вызовов"], cons: ["Нужно понимать runtime boundary", "Framework coupling", "Смешанный поток сложнее отлаживать"] },
  interactionStyles: ["request-response"], tags: ["web", "ssr", "fullstack"],
  flowScenarios: [{
    id: "load-and-update-profile",
    title: "Load and update an interactive profile",
    description: "Initial page проходит через server rendering, затем client boundary гидратируется и отправляет trusted mutation обратно в тот же fullstack runtime.",
    scope: "example",
    fidelity: "detailed",
    assumptions: ["Server runtime авторизует как initial read, так и mutation.", "Database credentials и domain rules никогда не переходят в client bundle.", "Показан один framework deployment, хотя runtime может физически масштабироваться."],
    sources: [{ title: "Next.js: Server and Client Components", url: "https://nextjs.org/docs/app/getting-started/server-and-client-components" }],
    steps: [
      { id: "request", title: "Browser запрашивает profile page", description: "Initial navigation входит через server boundary, где доступны secrets и trusted data access.", flow: { type: "transfer", from: "browser", to: "server-runtime", edgeId: "browser-server", kind: "request", label: "GET /profile" } },
      { id: "server-render", title: "Server выполняет use case и рендерит page", description: "Application rules читают database, после чего runtime возвращает initial HTML.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "server-runtime", to: "application", edgeId: "server-application", kind: "control", label: "load profile" },
        { type: "transfer", from: "application", to: "database", edgeId: "application-database", kind: "request", label: "read profile" },
        { type: "transfer", from: "database", to: "application", edgeId: "application-database", kind: "response", label: "profile data" },
        { type: "transfer", from: "application", to: "server-runtime", edgeId: "server-application", kind: "response", label: "view model" },
        { type: "transfer", from: "server-runtime", to: "browser", edgeId: "browser-server", kind: "response", label: "HTML and client payload" },
      ] } },
      { id: "hydrate", title: "Только interactive boundary гидратируется", description: "Browser подключает event handlers и local state к уже показанному server-rendered UI.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "browser", to: "client-boundary", edgeId: "browser-client", kind: "control", label: "hydrate interactive UI" },
        { type: "activate", nodeId: "client-boundary", label: "profile form interactive" },
      ] } },
      { id: "mutation", title: "Client отправляет trusted mutation", description: "Server снова применяет authorization и те же application invariants перед записью.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "client-boundary", to: "server-runtime", edgeId: "client-server", kind: "request", label: "update profile" },
        { type: "transfer", from: "server-runtime", to: "application", edgeId: "server-application", kind: "control", label: "execute update" },
        { type: "transfer", from: "application", to: "database", edgeId: "application-database", kind: "data", label: "commit profile" },
        { type: "transfer", from: "application", to: "server-runtime", edgeId: "server-application", kind: "response", label: "updated profile" },
        { type: "transfer", from: "server-runtime", to: "client-boundary", edgeId: "client-server", kind: "response", label: "mutation result" },
        { type: "outcome", nodeId: "client-boundary", outcome: "success", label: "profile UI updated" },
      ] } },
    ],
  }],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 220 }, description: "Получает HTML и запускает только интерактивные части интерфейса.", reason: "Пользователь взаимодействует с продуктом в недоверенной среде.", responsibilities: ["Отображение", "События UI", "Навигация"], useCases: ["Страницы", "Формы", "Интерактивные islands"], avoidWhen: ["Секреты", "Прямой доступ к данным"] },
    { id: "client-boundary", kind: "client", label: "Client Boundary", subtitle: "Interactive UI", position: { x: 280, y: 360 }, description: "Гидратируемая часть приложения с состоянием и browser APIs.", reason: "Не весь UI должен выполняться на клиенте, только интерактивная часть.", responsibilities: ["Event handlers", "Локальное состояние", "Browser APIs"], useCases: ["Dropdown", "Optimistic UI", "Drag and drop"], stack: [{ name: "React" }, { name: "Vue" }, { name: "Svelte" }] },
    { id: "server-runtime", kind: "server", label: "Fullstack Runtime", subtitle: "Server boundary", position: { x: 280, y: 80 }, description: "Рендерит страницы, исполняет серверные действия и хранит секреты.", reason: "Данные и доверенные операции должны выполняться на сервере.", responsibilities: ["Server rendering", "Use cases", "Авторизация"], useCases: ["Page load", "Form mutation", "Server data access"], stack: [{ name: "Next.js" }, { name: "Nuxt" }, { name: "SvelteKit" }] },
    { id: "application", kind: "domain", label: "Application Logic", position: { x: 540, y: 80 }, description: "Общие правила и use cases, не зависящие от способа вызова.", reason: "Страница и mutation должны применять одинаковые бизнес-инварианты.", responsibilities: ["Правила", "Оркестрация", "Политики доступа"], useCases: ["Queries", "Commands", "Integrations"] },
    { id: "database", kind: "database", label: "Database", position: { x: 800, y: 80 }, description: "Доступное только серверу основное хранилище.", reason: "Состояние продукта должно быть долговечным и недоступным напрямую браузеру.", responsibilities: ["Persistence", "Transactions", "Queries"], useCases: ["Бизнес-сущности", "Связанные данные"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }] },
  ],
  edges: [
    { id: "browser-server", source: "browser", target: "server-runtime", label: "page request", type: "request", bidirectional: true },
    { id: "browser-client", source: "browser", target: "client-boundary", label: "hydrate", type: "request" },
    { id: "client-server", source: "client-boundary", target: "server-runtime", label: "mutation", type: "request", bidirectional: true },
    { id: "server-application", source: "server-runtime", target: "application", label: "use case", type: "request", bidirectional: true },
    { id: "application-database", source: "application", target: "database", label: "read / write", type: "data", bidirectional: true },
  ],
};
