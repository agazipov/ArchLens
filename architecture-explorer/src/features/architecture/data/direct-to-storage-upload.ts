import type { Architecture } from "../model/types";

export const directToStorageUpload: Architecture = {
  id: "direct-to-storage-upload", title: "Direct-to-storage Upload", shortTitle: "Direct Upload", category: "data-content-media", level: "system", complexity: "Medium",
  description: "Backend авторизует upload и выдаёт signed URL, после чего browser отправляет большой файл напрямую в object storage.",
  keyIdea: "Application server контролирует право загрузки, но не обязан проксировать каждый байт большого файла.",
  suitableFor: ["Большие изображения и видео", "User-generated files", "Высокий upload traffic"], notIdealFor: ["Очень маленькие payloads", "Файл необходимо синхронно проверять до сохранения"],
  stack: [{ name: "S3-compatible storage" }, { name: "Signed URLs" }], alternatives: [{ name: "Application-mediated upload", note: "проще для маленьких файлов" }],
  tradeoffs: { pros: ["Меньше application bandwidth", "Storage масштабирует upload path", "Backend сохраняет access control"], cons: ["Нужен finalize/verification flow", "Signed URL имеет ограниченный lifetime", "Untrusted files требуют последующей проверки"] },
  interactionStyles: ["request-response"], tags: ["upload", "object-storage", "signed-url"],
  flowScenarios: [{
    id: "presigned-upload",
    title: "Upload with a presigned URL",
    description: "Backend выдаёт ограниченную upload capability, после чего file bytes идут из browser прямо в object storage.",
    scope: "reference",
    fidelity: "detailed",
    assumptions: ["Backend уже authenticated пользователя и выбрал допустимый object key.", "Signed URL ограничен конкретной операцией и имеет короткий срок жизни.", "Post-upload validation и malware scanning остаются последующими шагами за границей этой схемы."],
    sources: [{ title: "Amazon S3: Uploading objects with presigned URLs", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html" }],
    steps: [
      { id: "authorize", title: "Browser запрашивает право на upload", description: "Backend проверяет identity, policy, object name и ожидаемый content type.", flow: { type: "transfer", from: "browser", to: "backend", edgeId: "browser-backend", kind: "request", label: "request upload" } },
      { id: "issue", title: "Backend выпускает временную capability", description: "Signed URL связывает разрешённую storage operation с ограниченным lifetime.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "backend", to: "signed-url", edgeId: "backend-url", kind: "control", label: "sign PUT capability" },
        { type: "transfer", from: "signed-url", to: "browser", edgeId: "url-browser", kind: "data", label: "temporary URL" },
      ] } },
      { id: "transfer", title: "Файл минует application server", description: "Browser использует capability и передаёт большой payload непосредственно storage service.", flow: { type: "transfer", from: "browser", to: "storage", edgeId: "browser-storage", kind: "data", label: "PUT object", duration: "long" } },
      { id: "stored", title: "Object Storage принимает объект", description: "Application bandwidth не участвует в передаче file bytes.", flow: { type: "outcome", nodeId: "storage", outcome: "accepted", label: "object stored" } },
    ],
  }],
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
