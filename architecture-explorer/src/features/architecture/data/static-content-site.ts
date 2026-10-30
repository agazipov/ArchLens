import type { Architecture } from "../model/types";

export const staticContentSite: Architecture = {
  id: "static-content-site", title: "Static Content Site", shortTitle: "Static Content Site", category: "content", level: "system", complexity: "Low",
  description: "CMS или Markdown становится входом для build process, который заранее генерирует assets и публикует их в CDN.",
  keyIdea: "Если контент меняется реже, чем читается, страницы выгодно построить заранее и обслуживать без application server на каждом request.",
  suitableFor: ["Документация", "Marketing site", "Блог и reference content"], notIdealFor: ["Персонализированные данные на каждый request", "Частые server-side mutations"],
  stack: [{ name: "Markdown / Headless CMS" }, { name: "Static site generator" }, { name: "CDN" }], alternatives: [{ name: "Server-rendered Web Application" }, { name: "Headless CMS" }],
  tradeoffs: { pros: ["Низкая latency", "Малая attack surface", "Дешёвое глобальное масштабирование"], cons: ["Контент появляется после build", "Длинный build при большом каталоге", "Dynamic features требуют отдельного runtime"] },
  interactionStyles: ["batch", "request-response"], tags: ["static", "cdn", "content"],
  nodes: [
    { id: "content", kind: "external", label: "CMS / Markdown", position: { x: 20, y: 80 }, description: "Хранит исходный контент и metadata для страниц.", reason: "Редакторам и developers нужен управляемый source content.", responsibilities: ["Content source", "Metadata", "Versioning"], useCases: ["Docs", "Articles", "Landing pages"] },
    { id: "build", kind: "infrastructure", label: "Build", position: { x: 300, y: 80 }, description: "Преобразует контент и templates в готовые HTML, CSS и assets.", reason: "Работа выполняется при публикации, а не для каждого читателя.", responsibilities: ["Generate pages", "Optimize assets", "Publish artifact"], useCases: ["CI build", "Content webhook"] },
    { id: "cdn", kind: "infrastructure", label: "CDN", position: { x: 580, y: 220 }, description: "Хранит и раздаёт готовые assets из edge locations.", reason: "Одинаковый immutable content можно кэшировать близко к пользователям.", responsibilities: ["Edge caching", "TLS", "Asset delivery"], useCases: ["HTML", "Images", "JavaScript"] },
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 360 }, description: "Запрашивает уже построенную страницу у ближайшего CDN edge.", reason: "Runtime rendering для базового content path не требуется.", responsibilities: ["HTTP request", "Render page"], useCases: ["Read docs", "Browse site"] },
  ],
  edges: [
    { id: "content-build", source: "content", target: "build", label: "source content", type: "data" },
    { id: "build-cdn", source: "build", target: "cdn", label: "publish assets", type: "data" },
    { id: "browser-cdn", source: "browser", target: "cdn", label: "GET page", type: "request" },
  ],
};
