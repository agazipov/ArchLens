import type { Architecture } from "../model/types";

export const smallEcommerce: Architecture = {
  id: "small-ecommerce", title: "Small E-commerce", shortTitle: "Small E-commerce", category: "commerce", level: "system", complexity: "Medium",
  description: "Одна fullstack application управляет каталогом и заказами, хранит бизнес-данные, изображения и вызывает внешний payment provider.",
  keyIdea: "Начать с одной application boundary, но хранить бинарные файлы отдельно и не реализовывать платежную инфраструктуру самостоятельно.",
  suitableFor: ["Небольшой интернет-магазин", "Одна продуктовая команда", "Предсказуемый объём заказов"], notIdealFor: ["Marketplace с независимыми продавцами", "Сложный fulfillment", "Очень высокий независимый scale отдельных capabilities"],
  stack: [{ name: "Next.js / Django / Laravel / Rails" }, { name: "PostgreSQL" }, { name: "S3-compatible storage" }], alternatives: [{ name: "Modular Monolith" }],
  tradeoffs: { pros: ["Быстрый запуск", "Простые транзакции", "Мало operational moving parts"], cons: ["Всё приложение масштабируется вместе", "Payment integration требует webhook handling", "Рост домена потребует модульных границ"] },
  interactionStyles: ["request-response", "async"], tags: ["commerce", "payments", "object-storage"],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 220 }, description: "Показывает каталог, корзину и checkout.", reason: "Покупателю нужен интерактивный storefront.", responsibilities: ["Catalog UI", "Cart UI", "Checkout form"], useCases: ["Browse", "Add to cart", "Place order"] },
    { id: "application", kind: "server", label: "Fullstack Application", position: { x: 280, y: 220 }, description: "Выполняет catalog, checkout и order use cases в одной deployment unit.", reason: "На раннем этапе разделение на сервисы не окупает сложность.", responsibilities: ["Business rules", "Authorization", "Provider integrations"], useCases: ["Catalog", "Orders", "Checkout"], stack: [{ name: "Next.js" }, { name: "Django" }, { name: "Laravel" }, { name: "Rails" }] },
    { id: "database", kind: "database", label: "PostgreSQL", subtitle: "System of record", position: { x: 560, y: 20 }, description: "Хранит товары, остатки, покупателей и заказы.", reason: "Commerce state требует транзакций и связанных данных.", responsibilities: ["Catalog data", "Orders", "Inventory state"], useCases: ["Products", "Customers", "Order lifecycle"], stack: [{ name: "PostgreSQL" }] },
    { id: "storage", kind: "infrastructure", label: "Object Storage", position: { x: 560, y: 220 }, description: "Хранит изображения товаров и другие большие объекты.", reason: "Бинарные файлы не должны увеличивать database и application traffic.", responsibilities: ["Durable blobs", "Asset URLs", "Lifecycle policies"], useCases: ["Product images", "Documents"], stack: [{ name: "S3-compatible storage" }] },
    { id: "payments", kind: "external", label: "Payment Provider", position: { x: 560, y: 420 }, description: "Обрабатывает платёжные инструменты и сообщает результат через API или webhook.", reason: "Платёжная инфраструктура и compliance выгоднее делегировать специализированному провайдеру.", responsibilities: ["Payment processing", "Payment status", "Webhooks"], useCases: ["Charge", "Refund"], avoidWhen: ["Хранение order state продукта"] },
  ],
  edges: [
    { id: "browser-app", source: "browser", target: "application", label: "browse / checkout", type: "request" },
    { id: "app-db", source: "application", target: "database", label: "catalog / orders", type: "data" },
    { id: "app-storage", source: "application", target: "storage", label: "assets", type: "data" },
    { id: "app-payments", source: "application", target: "payments", label: "payment API", type: "request", bidirectional: true },
  ],
};
