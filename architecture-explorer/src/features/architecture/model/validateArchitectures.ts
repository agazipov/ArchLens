import type { Architecture, ArchitectureCategory, ArchitectureLevel, EdgeKind, InteractionStyle, NodeKind } from "./types";

const categories = new Set<ArchitectureCategory>(["fundamentals", "commerce", "business", "realtime", "collaboration", "games", "content", "media", "notifications", "data", "distributed"]);
const levels = new Set<ArchitectureLevel>(["system", "computer"]);
const nodeKinds = new Set<NodeKind>(["client", "server", "api", "domain", "database", "infrastructure", "external", "compute", "memory"]);
const edgeKinds = new Set<EdgeKind>(["request", "data", "event", "async", "realtime", "control"]);
const interactionStyles = new Set<InteractionStyle>(["request-response", "realtime", "async", "batch"]);

function isBlank(value: unknown): value is undefined | null | "" { return typeof value !== "string" || value.trim().length === 0; }
function validateTextList(items: unknown, path: string, errors: string[], optional = false) {
  if (optional && items === undefined) return;
  if (!Array.isArray(items) || items.length === 0) { errors.push(`${path}: ожидается непустой список.`); return; }
  items.forEach((item, index) => { if (isBlank(item)) errors.push(`${path}[${index}]: ожидается непустая строка.`); });
}
function validateTechnologies(items: unknown, path: string, errors: string[]) {
  if (items === undefined) return;
  if (!Array.isArray(items) || items.length === 0) errors.push(`${path}: ожидается непустой список.`);
  else items.forEach((item, index) => { if (isBlank(item?.name)) errors.push(`${path}[${index}].name: ожидается непустое название.`); });
}

function validateArchitecture(architecture: Architecture, index: number, errors: string[]) {
  const path = `architectures[${index}]`;
  const prefix = `Architecture "${architecture.id || "<без id>"}" — `;
  const local: string[] = [];
  for (const [key, value] of [["id", architecture.id], ["title", architecture.title], ["shortTitle", architecture.shortTitle], ["description", architecture.description], ["keyIdea", architecture.keyIdea]] as const) {
    if (isBlank(value)) local.push(`${path}.${key}: ожидается непустая строка.`);
  }
  if (!levels.has(architecture.level)) local.push(`${path}.level: недопустимый уровень архитектуры.`);
  if (!categories.has(architecture.category)) local.push(`${path}.category: недопустимая категория.`);
  validateTextList(architecture.suitableFor, `${path}.suitableFor`, local);
  validateTextList(architecture.notIdealFor, `${path}.notIdealFor`, local, true);
  validateTextList(architecture.tradeoffs?.pros, `${path}.tradeoffs.pros`, local);
  validateTextList(architecture.tradeoffs?.cons, `${path}.tradeoffs.cons`, local);
  validateTextList(architecture.tags, `${path}.tags`, local, true);
  validateTechnologies(architecture.stack, `${path}.stack`, local);
  validateTechnologies(architecture.alternatives, `${path}.alternatives`, local);
  architecture.interactionStyles?.forEach((style, styleIndex) => { if (!interactionStyles.has(style)) local.push(`${path}.interactionStyles[${styleIndex}]: недопустимое значение.`); });
  architecture.examples?.forEach((example, exampleIndex) => {
    const examplePath = `${path}.examples[${exampleIndex}]`;
    if (isBlank(example.name) || isBlank(example.note)) local.push(`${examplePath}: name и note обязательны.`);
    try { new URL(example.sourceUrl); } catch { local.push(`${examplePath}.sourceUrl: ожидается абсолютный URL.`); }
  });
  if (!Array.isArray(architecture.nodes) || architecture.nodes.length < 3 || architecture.nodes.length > 12) local.push(`${path}.nodes: ожидается от 3 до 12 узлов.`);
  if (!Array.isArray(architecture.edges) || architecture.edges.length === 0) local.push(`${path}.edges: ожидается хотя бы одна связь.`);
  const nodeIds = new Set<string>();
  architecture.nodes.forEach((node, nodeIndex) => {
    const nodePath = `${path}.nodes[${nodeIndex}]`;
    if (isBlank(node.id) || isBlank(node.label) || isBlank(node.description) || isBlank(node.reason)) local.push(`${nodePath}: id, label, description и reason обязательны.`);
    if (!nodeKinds.has(node.kind)) local.push(`${nodePath}.kind: недопустимое значение.`);
    validateTextList(node.responsibilities, `${nodePath}.responsibilities`, local);
    validateTextList(node.useCases, `${nodePath}.useCases`, local);
    if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y)) local.push(`${nodePath}.position: ожидаются конечные координаты.`);
    if (nodeIds.has(node.id)) local.push(`${nodePath}.id: дублирующийся node.id.`);
    nodeIds.add(node.id);
  });
  const edgeIds = new Set<string>();
  architecture.edges.forEach((edge, edgeIndex) => {
    const edgePath = `${path}.edges[${edgeIndex}]`;
    if (isBlank(edge.id) || !edgeKinds.has(edge.type)) local.push(`${edgePath}: id и допустимый type обязательны.`);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) local.push(`${edgePath}: source и target должны ссылаться на существующие узлы.`);
    if (edge.source === edge.target) local.push(`${edgePath}: self-reference не поддерживается.`);
    if (edgeIds.has(edge.id)) local.push(`${edgePath}.id: дублирующийся edge.id.`);
    edgeIds.add(edge.id);
  });
  architecture.nodes.forEach((node, nodeIndex) => architecture.nodes.slice(nodeIndex + 1).forEach((otherNode, offset) => {
    if (Math.abs(node.position.x - otherNode.position.x) < 208 && Math.abs(node.position.y - otherNode.position.y) < 114) local.push(`${path}.nodes[${nodeIndex + offset + 1}].position: потенциально пересекается с узлом "${node.id}".`);
  }));
  errors.push(...local.map((error) => prefix + error));
}

export function validateArchitectures(architectures: readonly Architecture[]): void {
  const errors: string[] = [];
  const ids = new Set<string>();
  architectures.forEach((architecture, index) => {
    if (ids.has(architecture.id)) errors.push(`Architecture "${architecture.id}" — дублирующийся architecture.id.`);
    ids.add(architecture.id);
    validateArchitecture(architecture, index, errors);
  });
  if (errors.length) throw new Error(`Architecture definitions validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
}
