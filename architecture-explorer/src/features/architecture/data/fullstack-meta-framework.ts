import type { Architecture } from "../model/types";

export const fullstackMetaFramework: Architecture = {
  id: "fullstack-meta-framework", title: "Fullstack Meta-framework", shortTitle: "Fullstack Framework", category: "fundamentals", level: "system", complexity: "Medium",
  description: "Одна deployment unit объединяет серверный рендеринг, интерактивный клиент и серверные операции.",
  keyIdea: "Client/server boundary проходит внутри одного framework runtime, но секреты и данные всё равно остаются на сервере.",
  suitableFor: ["Продукт одной команды", "Контент с интерактивностью", "Быстрый fullstack delivery"], notIdealFor: ["Много независимых клиентов", "Жёстко разделённые команды frontend и backend"],
  stack: [{ name: "Next.js" }, { name: "Nuxt" }, { name: "SvelteKit" }], alternatives: [{ name: "Django" }, { name: "Laravel" }, { name: "Rails" }],
  tradeoffs: { pros: ["Одна deployment unit", "Server rendering и интерактивность рядом", "Меньше обязательных внутренних HTTP-вызовов"], cons: ["Нужно понимать runtime boundary", "Framework coupling", "Смешанный поток сложнее отлаживать"] },
  interactionStyles: ["request-response"], tags: ["web", "ssr", "fullstack"],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 220 }, description: "Получает HTML и запускает только интерактивные части интерфейса.", reason: "Пользователь взаимодействует с продуктом в недоверенной среде.", responsibilities: ["Отображение", "События UI", "Навигация"], useCases: ["Страницы", "Формы", "Интерактивные islands"], avoidWhen: ["Секреты", "Прямой доступ к данным"] },
    { id: "client-boundary", kind: "client", label: "Client Boundary", subtitle: "Interactive UI", position: { x: 280, y: 360 }, description: "Гидратируемая часть приложения с состоянием и browser APIs.", reason: "Не весь UI должен выполняться на клиенте, только интерактивная часть.", responsibilities: ["Event handlers", "Локальное состояние", "Browser APIs"], useCases: ["Dropdown", "Optimistic UI", "Drag and drop"], stack: [{ name: "React" }, { name: "Vue" }, { name: "Svelte" }] },
    { id: "server-runtime", kind: "server", label: "Fullstack Runtime", subtitle: "Server boundary", position: { x: 280, y: 80 }, description: "Рендерит страницы, исполняет серверные действия и хранит секреты.", reason: "Данные и доверенные операции должны выполняться на сервере.", responsibilities: ["Server rendering", "Use cases", "Авторизация"], useCases: ["Page load", "Form mutation", "Server data access"], stack: [{ name: "Next.js" }, { name: "Nuxt" }, { name: "SvelteKit" }] },
    { id: "application", kind: "domain", label: "Application Logic", position: { x: 540, y: 80 }, description: "Общие правила и use cases, не зависящие от способа вызова.", reason: "Страница и mutation должны применять одинаковые бизнес-инварианты.", responsibilities: ["Правила", "Оркестрация", "Политики доступа"], useCases: ["Queries", "Commands", "Integrations"] },
    { id: "database", kind: "database", label: "Database", position: { x: 800, y: 80 }, description: "Доступное только серверу основное хранилище.", reason: "Состояние продукта должно быть долговечным и недоступным напрямую браузеру.", responsibilities: ["Persistence", "Transactions", "Queries"], useCases: ["Бизнес-сущности", "Связанные данные"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }] },
  ],
  edges: [
    { id: "browser-server", source: "browser", target: "server-runtime", label: "page request", type: "request" },
    { id: "browser-client", source: "browser", target: "client-boundary", label: "hydrate", type: "request" },
    { id: "client-server", source: "client-boundary", target: "server-runtime", label: "mutation", type: "request" },
    { id: "server-application", source: "server-runtime", target: "application", label: "use case", type: "request" },
    { id: "application-database", source: "application", target: "database", label: "read / write", type: "data" },
  ],
};
