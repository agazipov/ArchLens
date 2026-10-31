import type { Architecture } from "../model/types";

export const howTheWebWorks: Architecture = {
  id: "how-the-web-works", title: "Как работает Web: путь запроса", shortTitle: "Как работает Web", category: "web-frontend", level: "system", complexity: "Low",
  description: "Показывает путь от введённого URL до ответа на экране: разрешение имени, защищённое соединение, HTTP-запрос, выполнение приложения и чтение данных.",
  keyIdea: "Браузер не обращается к сайту «напрямую»: он находит IP через DNS, устанавливает сетевое и TLS-соединение, отправляет HTTP-запрос и получает ответ по тому же каналу.",
  suitableFor: ["Первое знакомство с Web", "Диагностика медленной загрузки", "Понимание границ браузера, сети и сервера"],
  notIdealFor: ["Детали маршрутизации пакетов", "Внутреннее устройство браузерного движка", "Глубокий разбор HTTP/2 и HTTP/3"],
  stack: [{ name: "DNS" }, { name: "TCP / QUIC" }, { name: "TLS" }, { name: "HTTP" }],
  alternatives: [{ name: "Simple SPA", note: "Следующий уровень: устройство web-приложения" }, { name: "Server-rendered Web Application", note: "Рендеринг HTML на сервере" }],
  tradeoffs: { pros: ["Даёт цельную mental model web-запроса", "Разделяет поиск адреса, транспорт и приложение", "Помогает локализовать ошибки по этапам"], cons: ["Упрощает DNS-кэши и сетевую маршрутизацию", "Не показывает CDN и балансировку отдельными слоями", "Не раскрывает внутренности протоколов"] },
  interactionStyles: ["request-response"], tags: ["web", "http", "dns", "tls", "browser", "fundamentals"],
  flowScenarios: [{
    id: "dynamic-request",
    title: "Dynamic web request",
    description: "Типовой запрос динамической страницы после разрешения DNS.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["DNS address уже получен или найден в cache.", "Показан dynamic origin без CDN и load balancer.", "Application читает database для этого запроса."],
    sources: [
      { title: "MDN: How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works" },
      { title: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html" },
    ],
    steps: [
      { id: "secure-channel", title: "Browser открывает защищённый канал", description: "Network + TLS устанавливает канал к web server. Timing здесь только презентационный.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "browser", to: "connection", edgeId: "browser-connection", kind: "request", label: "connect" },
        { type: "activate", nodeId: "connection", label: "secure channel ready", duration: "short" },
      ] } },
      { id: "request-to-app", title: "HTTP request доходит до application", description: "Request проходит через network boundary и web server к выбранному application handler.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "connection", to: "web-server", edgeId: "connection-web-server", kind: "request", label: "HTTP request" },
        { type: "transfer", from: "web-server", to: "application", edgeId: "web-server-application", kind: "request", label: "route request" },
      ] } },
      { id: "database", title: "Application читает данные", description: "Database получает query и возвращает result как отдельный response action.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "application", to: "data-store", edgeId: "application-data-store", kind: "request", label: "query" },
        { type: "transfer", from: "data-store", to: "application", edgeId: "application-data-store", kind: "response", label: "query result" },
      ] } },
      { id: "response", title: "HTTP response возвращается в Browser", description: "Application формирует response; каждый обратный hop явно отделён от request.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "application", to: "web-server", edgeId: "web-server-application", kind: "response", label: "application response" },
        { type: "transfer", from: "web-server", to: "connection", edgeId: "connection-web-server", kind: "response", label: "HTTP response" },
        { type: "transfer", from: "connection", to: "browser", edgeId: "browser-connection", kind: "response", label: "HTML / JSON" },
      ] } },
      { id: "render", title: "Browser обрабатывает representation", description: "Browser получает response и отображает результат; subresource requests не показаны.", flow: { type: "outcome", nodeId: "browser", outcome: "success", label: "response displayed" } },
    ],
  }],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", subtitle: "URL и интерфейс", position: { x: 20, y: 210 }, description: "Разбирает URL, инициирует загрузку ресурсов и отображает полученный HTML, CSS и JavaScript.", reason: "Именно браузер превращает действие пользователя в сетевой запрос и ответ — в видимую страницу.", responsibilities: ["Разбор URL", "Запуск DNS и HTTPS-запроса", "Рендеринг ответа"], useCases: ["Переход по ссылке", "Отправка формы", "Загрузка API-данных"], avoidWhen: ["Хранение серверных секретов", "Авторитетные бизнес-правила"], stack: [{ name: "Chrome" }, { name: "Firefox" }, { name: "Safari" }] },
    { id: "dns", kind: "infrastructure", label: "DNS Resolver", subtitle: "Имя → IP-адрес", position: { x: 280, y: 20 }, description: "Находит IP-адрес для доменного имени, проверяя кэши и при необходимости цепочку DNS-серверов.", reason: "Сетевому соединению нужен IP-адрес, а человеку удобнее запоминать доменное имя.", responsibilities: ["Разрешение доменного имени", "Кэширование DNS-ответов", "Возврат IP и времени жизни записи"], useCases: ["A и AAAA записи", "CNAME", "Service discovery"], avoidWhen: ["Передача содержимого HTTP-запроса"], stack: [{ name: "Recursive DNS" }, { name: "Authoritative DNS" }] },
    { id: "connection", kind: "infrastructure", label: "Network + TLS", subtitle: "Надёжный защищённый канал", position: { x: 280, y: 300 }, description: "Доставляет данные к найденному адресу и защищает их от чтения и подмены между браузером и сервером.", reason: "HTTP нужны транспорт, проверка подлинности сервера и шифрование публичной сети.", responsibilities: ["Маршрутизация пакетов", "TCP или QUIC соединение", "TLS handshake и шифрование"], useCases: ["HTTPS", "HTTP/2", "HTTP/3"], avoidWhen: ["Бизнес-логика приложения"], stack: [{ name: "IP" }, { name: "TCP / QUIC" }, { name: "TLS" }] },
    { id: "web-server", kind: "server", label: "Web Server", subtitle: "HTTP boundary", position: { x: 560, y: 210 }, description: "Принимает HTTP-запрос, завершает TLS или получает уже расшифрованный трафик и выбирает обработчик.", reason: "Публичному трафику нужна единая точка входа, которая понимает HTTP и маршруты.", responsibilities: ["HTTP parsing", "Маршрутизация", "Статические файлы и reverse proxy"], useCases: ["Nginx", "Caddy", "CDN edge"], stack: [{ name: "Nginx" }, { name: "Caddy" }, { name: "Cloud CDN" }] },
    { id: "application", kind: "server", label: "Application", subtitle: "Правила и ответ", position: { x: 840, y: 210 }, description: "Проверяет входные данные, выполняет сценарий и формирует HTML, JSON или другой HTTP-ответ.", reason: "Смысл запроса определяется правилами продукта, а не сетевыми протоколами.", responsibilities: ["Валидация и авторизация", "Бизнес-логика", "Формирование ответа"], useCases: ["Страница товара", "Вход в аккаунт", "API endpoint"], stack: [{ name: "Node.js" }, { name: "Java" }, { name: ".NET" }, { name: "Go" }] },
    { id: "data-store", kind: "database", label: "Data Store", subtitle: "Долговременное состояние", position: { x: 1120, y: 210 }, description: "Хранит данные, которые приложение читает или изменяет при обработке запроса.", reason: "Состояние должно переживать отдельный запрос и перезапуск application runtime.", responsibilities: ["Персистентность", "Поиск и индексы", "Транзакции"], useCases: ["Пользователи", "Товары", "Публикации"], stack: [{ name: "PostgreSQL" }, { name: "MySQL" }, { name: "Object Storage" }] },
  ],
  edges: [
    { id: "browser-dns", source: "browser", target: "dns", label: "домен ↔ IP", type: "request", bidirectional: true },
    { id: "browser-connection", source: "browser", target: "connection", label: "connect + TLS", type: "request", bidirectional: true },
    { id: "connection-web-server", source: "connection", target: "web-server", label: "HTTP request / response", type: "request", bidirectional: true },
    { id: "web-server-application", source: "web-server", target: "application", label: "route", type: "request", bidirectional: true },
    { id: "application-data-store", source: "application", target: "data-store", label: "read / write", type: "data", bidirectional: true },
  ],
};
