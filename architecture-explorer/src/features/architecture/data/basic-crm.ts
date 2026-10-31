import type { Architecture } from "../model/types";

export const basicCrm: Architecture = {
  id: "basic-crm", title: "Basic CRM", shortTitle: "Basic CRM", category: "application-architecture", level: "system", complexity: "Low",
  description: "Browser работает с единым backend, который хранит customer records и применяет business rules в реляционной базе.",
  keyIdea: "Большинство ранних business applications не требуют распределённой системы: важнее понятная trust boundary и надёжные данные.",
  suitableFor: ["Внутренняя CRM", "Небольшая sales-команда", "CRUD и отчёты умеренной сложности"], notIdealFor: ["Сложные долгие workflows", "Десятки внешних интеграций", "Realtime collaboration"],
  stack: [{ name: "React / Angular / Vue" }, { name: "Django / Laravel / Rails / ASP.NET Core" }, { name: "PostgreSQL" }], alternatives: [{ name: "Server-rendered Web Application" }, { name: "Modular Monolith" }],
  tradeoffs: { pros: ["Простой mental model", "Транзакционная согласованность", "Низкая operational complexity"], cons: ["Backend может стать большим", "Тяжёлые отчёты могут мешать transactional workload", "Интеграции требуют отдельной границы по мере роста"] },
  interactionStyles: ["request-response"], tags: ["crm", "business", "crud"],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 170 }, description: "Показывает leads, customers, tasks и reports авторизованному сотруднику.", reason: "Business users нужен единый рабочий интерфейс.", responsibilities: ["UI", "Forms", "Filtering"], useCases: ["Lead list", "Customer card", "Task board"] },
    { id: "backend", kind: "server", label: "CRM Backend", position: { x: 300, y: 170 }, description: "Авторизует сотрудников и выполняет CRM use cases.", reason: "Customer data и business policies должны оставаться в доверенной среде.", responsibilities: ["Access control", "Business rules", "Queries"], useCases: ["Create lead", "Assign task", "Update customer"], stack: [{ name: "Django" }, { name: "Laravel" }, { name: "Rails" }, { name: "ASP.NET Core" }] },
    { id: "database", kind: "database", label: "PostgreSQL", subtitle: "System of record", position: { x: 580, y: 170 }, description: "Хранит связанные records, ownership и историю изменений.", reason: "CRM data требует связей, фильтрации и транзакционной целостности.", responsibilities: ["Persistence", "Relations", "Indexes"], useCases: ["Leads", "Customers", "Tasks"], stack: [{ name: "PostgreSQL" }] },
  ],
  edges: [
    { id: "browser-backend", source: "browser", target: "backend", label: "HTTPS", type: "request" },
    { id: "backend-db", source: "backend", target: "database", label: "CRUD / queries", type: "data" },
  ],
};
