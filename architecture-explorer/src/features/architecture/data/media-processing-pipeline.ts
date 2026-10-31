import type { Architecture } from "../model/types";

export const mediaProcessingPipeline: Architecture = {
  id: "media-processing-pipeline", title: "Media Processing Pipeline", shortTitle: "Media Pipeline", category: "data-content-media", level: "system", complexity: "High",
  description: "Upload сохраняется как original object, storage event ставит job в queue, workers создают производные изображения или видео, а CDN доставляет результат.",
  keyIdea: "CPU-intensive processing выполняется асинхронно и масштабируется независимо от upload/API path.",
  suitableFor: ["Image resizing", "Video transcoding", "Пользовательский media content"], notIdealFor: ["Файлы уже готовы к публикации", "Мгновенная синхронная обработка маленького объекта"],
  stack: [{ name: "S3-compatible storage" }, { name: "RabbitMQ / Kafka" }, { name: "FFmpeg / image processor" }, { name: "CDN" }], alternatives: [{ name: "Managed media service" }],
  tradeoffs: { pros: ["Upload path остаётся быстрым", "Workers масштабируются по backlog", "Original сохраняется для reprocessing"], cons: ["Результат появляется позже", "Нужны status и failure handling", "Storage cost для originals и variants"] },
  interactionStyles: ["async"], tags: ["media", "pipeline", "workers"],
  flowScenarios: [{
    id: "upload-to-publish",
    title: "Upload to published variant",
    description: "Original вызывает асинхронную processing job, после которой готовый variant становится доступен через CDN.",
    scope: "typical",
    fidelity: "simplified",
    assumptions: ["Object-created notification доставляется at least once, поэтому worker должен быть идемпотентным.", "Queue может удерживать job дольше показанного presentation timing.", "Показан один variant; реальные pipelines часто создают несколько renditions."],
    sources: [{ title: "Amazon S3 Event Notifications", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html" }],
    steps: [
      { id: "upload-original", title: "Original сохраняется первым", description: "Неизменённый source object остаётся доступным для повторной обработки.", flow: { type: "transfer", from: "upload", to: "originals", edgeId: "upload-originals", kind: "data", label: "original media" } },
      { id: "enqueue", title: "Storage создаёт processing event", description: "Object-created notification превращается в durable queue message.", flow: { type: "transfer", from: "originals", to: "queue", edgeId: "originals-queue", kind: "message", label: "object created" } },
      { id: "backlog", title: "Job ожидает свободный worker", description: "Upload path уже завершён; queue сглаживает разницу между ingest rate и compute capacity.", flow: { type: "sequence", steps: [
        { type: "activate", nodeId: "queue", label: "job queued", duration: "short" },
        { type: "wait", label: "processing capacity available", duration: "long" },
      ] } },
      { id: "process", title: "Worker получает job и original", description: "Consumer забирает message, читает source object и выполняет transform.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "queue", to: "workers", edgeId: "queue-workers", kind: "message", label: "processing job" },
        { type: "transfer", from: "originals", to: "workers", edgeId: "workers-originals", kind: "data", label: "read original" },
        { type: "activate", nodeId: "workers", label: "decode / transform / encode", duration: "long" },
      ] } },
      { id: "publish", title: "Variant публикуется через CDN", description: "Worker пишет производный asset, после чего CDN может получить его из origin storage.", flow: { type: "sequence", steps: [
        { type: "transfer", from: "workers", to: "processed", edgeId: "workers-processed", kind: "data", label: "write variant" },
        { type: "transfer", from: "processed", to: "cdn", edgeId: "processed-cdn", kind: "data", label: "origin asset" },
        { type: "outcome", nodeId: "cdn", outcome: "success", label: "variant available" },
      ] } },
    ],
  }],
  nodes: [
    { id: "upload", kind: "client", label: "Upload", position: { x: 20, y: 170 }, description: "Передаёт original media и получает processing identifier.", reason: "Источник media находится у пользователя или upstream system.", responsibilities: ["Transfer original", "Track processing"], useCases: ["Image", "Video", "Audio"] },
    { id: "originals", kind: "infrastructure", label: "Original Storage", position: { x: 280, y: 170 }, description: "Долговременно хранит неизменённый исходный объект.", reason: "Original позволяет повторить processing с новыми settings.", responsibilities: ["Original blobs", "Object-created event", "Retention"], useCases: ["Source image", "Source video"], stack: [{ name: "S3-compatible storage" }] },
    { id: "queue", kind: "infrastructure", label: "Processing Queue", position: { x: 540, y: 170 }, description: "Буферизует processing jobs и сглаживает upload spikes.", reason: "CPU capacity и upload rate меняются независимо.", responsibilities: ["Job delivery", "Retry", "Backpressure"], useCases: ["Resize job", "Transcode job"] },
    { id: "workers", kind: "server", label: "Processing Workers × N", position: { x: 800, y: 170 }, description: "Читают original и создают оптимизированные variants.", reason: "Тяжёлая обработка должна масштабироваться отдельно от web API.", responsibilities: ["Decode", "Transform", "Encode"], useCases: ["Thumbnails", "Video renditions", "Compression"], stack: [{ name: "FFmpeg" }, { name: "ImageMagick / Sharp" }] },
    { id: "processed", kind: "infrastructure", label: "Processed Storage", position: { x: 1060, y: 170 }, description: "Хранит готовые variants, доступные для delivery.", reason: "Производные assets имеют другой lifecycle и cache policy.", responsibilities: ["Variants", "Metadata", "Public object keys"], useCases: ["Thumbnail", "720p stream", "WebP"] },
    { id: "cdn", kind: "infrastructure", label: "CDN", position: { x: 1320, y: 170 }, description: "Раздаёт готовые media assets близко к viewers.", reason: "Media traffic не должен проходить через application workers.", responsibilities: ["Edge cache", "Range requests", "Delivery"], useCases: ["Images", "Streaming segments"] },
  ],
  edges: [
    { id: "upload-originals", source: "upload", target: "originals", label: "original file", type: "data" },
    { id: "originals-queue", source: "originals", target: "queue", label: "object created", type: "event" },
    { id: "queue-workers", source: "queue", target: "workers", label: "consume", type: "async" },
    { id: "workers-originals", source: "workers", target: "originals", label: "read original", type: "data", bidirectional: true },
    { id: "workers-processed", source: "workers", target: "processed", label: "write variants", type: "data" },
    { id: "processed-cdn", source: "processed", target: "cdn", label: "origin assets", type: "data" },
  ],
};
