import type { Architecture } from "../model/types";

export const directToStorageUpload: Architecture = {
  id: "direct-to-storage-upload", title: "Direct-to-storage Upload", shortTitle: "Direct Upload", category: "media", level: "system", complexity: "Medium",
  description: "Backend авторизует upload и выдаёт signed URL, после чего browser отправляет большой файл напрямую в object storage.",
  keyIdea: "Application server контролирует право загрузки, но не обязан проксировать каждый байт большого файла.",
  suitableFor: ["Большие изображения и видео", "User-generated files", "Высокий upload traffic"], notIdealFor: ["Очень маленькие payloads", "Файл необходимо синхронно проверять до сохранения"],
  stack: [{ name: "S3-compatible storage" }, { name: "Signed URLs" }], alternatives: [{ name: "Application-mediated upload", note: "проще для маленьких файлов" }],
  tradeoffs: { pros: ["Меньше application bandwidth", "Storage масштабирует upload path", "Backend сохраняет access control"], cons: ["Нужен finalize/verification flow", "Signed URL имеет ограниченный lifetime", "Untrusted files требуют последующей проверки"] },
  interactionStyles: ["request-response"], tags: ["upload", "object-storage", "signed-url"],
  nodes: [
    { id: "browser", kind: "client", label: "Browser", position: { x: 20, y: 220 }, description: "Запрашивает разрешение, затем загружает файл напрямую в storage.", reason: "Источник файла уже находится на клиентском устройстве.", responsibilities: ["Upload request", "Direct transfer", "Progress UI"], useCases: ["Image upload", "Video upload", "Documents"] },
    { id: "backend", kind: "server", label: "Backend", subtitle: "Authorization boundary", position: { x: 300, y: 80 }, description: "Проверяет пользователя и создаёт короткоживущую upload capability.", reason: "Storage не должен принимать произвольные публичные записи.", responsibilities: ["Authorization", "Object key policy", "Signed URL creation"], useCases: ["Start upload", "Finalize metadata"] },
    { id: "signed-url", kind: "api", label: "Signed URL", subtitle: "Temporary capability", position: { x: 580, y: 80 }, description: "Ограниченное по времени разрешение на конкретную storage operation.", reason: "Клиенту нужен прямой доступ без передачи постоянных storage credentials.", responsibilities: ["Scoped permission", "Expiration", "Upload constraints"], useCases: ["PUT object", "Multipart upload"] },
    { id: "storage", kind: "infrastructure", label: "Object Storage", position: { x: 580, y: 360 }, description: "Принимает и долговременно хранит бинарный объект.", reason: "Object storage оптимизирован для больших файлов и высокого throughput.", responsibilities: ["Blob persistence", "Multipart transfer", "Lifecycle"], useCases: ["Images", "Videos", "Documents"], stack: [{ name: "S3-compatible storage" }] },
  ],
  edges: [
    { id: "browser-backend", source: "browser", target: "backend", label: "request upload", type: "request" },
    { id: "backend-url", source: "backend", target: "signed-url", label: "issue capability", type: "request" },
    { id: "url-browser", source: "signed-url", target: "browser", label: "temporary URL", type: "data" },
    { id: "browser-storage", source: "browser", target: "storage", label: "direct file upload", type: "data" },
  ],
};
