import type { Architecture } from "../model/types";

export const headlessCms: Architecture = {
  id: "headless-cms", title: "Headless CMS", shortTitle: "Headless CMS", category: "content", level: "system", complexity: "Medium",
  description: "Editors управляют структурированным контентом в CMS, а независимо развёрнутый frontend читает его через content API и формирует пользовательский experience.",
  keyIdea: "Content management отделён от presentation: один content source может обслуживать web, mobile и другие channels.",
  suitableFor: ["Omnichannel content", "Отдельная editorial команда", "Несколько frontends"], notIdealFor: ["Простой статический сайт", "Presentation жёстко связана с CMS templates"],
  stack: [{ name: "Headless CMS" }, { name: "Next.js / Nuxt / SvelteKit" }, { name: "CDN" }], alternatives: [{ name: "Static Content Site" }, { name: "Server-rendered Web Application" }],
  tradeoffs: { pros: ["Frontend независим от CMS UI", "Контент переиспользуется между channels", "Editorial workflow отделён от deployment"], cons: ["Preview и cache invalidation", "Две systems для эксплуатации", "Content API latency и vendor dependency"] },
  interactionStyles: ["request-response", "async"], tags: ["content", "cms", "api"],
  nodes: [
    { id: "editors", kind: "client", label: "Editors", position: { x: 20, y: 80 }, description: "Создают и публикуют структурированный content через editorial UI.", reason: "Редакторы не должны изменять frontend code для каждой публикации.", responsibilities: ["Authoring", "Review", "Publish"], useCases: ["Article", "Product copy", "Landing content"] },
    { id: "cms", kind: "server", label: "Headless CMS", position: { x: 300, y: 80 }, description: "Управляет content model, workflow и content API.", reason: "Editorial lifecycle является отдельной capability от presentation.", responsibilities: ["Content model", "Editorial workflow", "Content API"], useCases: ["Draft", "Publish", "Preview"] },
    { id: "content-store", kind: "database", label: "Content Storage", position: { x: 580, y: 80 }, description: "Хранит entries, assets metadata и revisions.", reason: "CMS нужен долговременный source of truth для content.", responsibilities: ["Entries", "Versions", "Localization"], useCases: ["Published content", "Drafts"] },
    { id: "frontend", kind: "client", label: "Frontend", position: { x: 20, y: 360 }, description: "Запрашивает content и решает, как отобразить его пользователю.", reason: "Presentation развивается независимо от editorial system.", responsibilities: ["Rendering", "Routing", "User experience"], useCases: ["Website", "Mobile app", "Kiosk"] },
    { id: "delivery", kind: "infrastructure", label: "Content API / CDN", position: { x: 300, y: 360 }, description: "Кэширует опубликованный content и обслуживает read traffic.", reason: "Большинство content reads повторяемы и географически распределены.", responsibilities: ["API delivery", "Caching", "Invalidation"], useCases: ["Published entry", "Media URL"] },
  ],
  edges: [
    { id: "editors-cms", source: "editors", target: "cms", label: "author / publish", type: "request" },
    { id: "cms-store", source: "cms", target: "content-store", label: "content / revisions", type: "data" },
    { id: "cms-delivery", source: "cms", target: "delivery", label: "publish", type: "event" },
    { id: "frontend-delivery", source: "frontend", target: "delivery", label: "content query", type: "request" },
  ],
};
