import type { Architecture, ArchitectureCategory, ArchitectureLevel, EdgeKind, FlowDuration, FlowFidelity, FlowKind, FlowScope, FlowStep, InteractionStyle, NodeKind } from "./types";

const categories = new Set<ArchitectureCategory>(["computer-systems", "web-frontend", "application-architecture", "messaging-workflows", "realtime-collaboration", "data-content-media", "distributed-scale", "games"]);
const levels = new Set<ArchitectureLevel>(["system", "computer"]);
const nodeKinds = new Set<NodeKind>(["client", "server", "api", "domain", "database", "infrastructure", "external", "compute", "memory"]);
const edgeKinds = new Set<EdgeKind>(["request", "data", "event", "async", "realtime", "control"]);
const interactionStyles = new Set<InteractionStyle>(["request-response", "realtime", "async", "batch"]);
const flowKinds = new Set<FlowKind>(["request", "response", "message", "data", "control"]);
const flowDurations = new Set<FlowDuration>(["short", "normal", "long"]);
const flowScopes = new Set<FlowScope>(["canonical", "reference", "typical", "example", "implementation-specific"]);
const flowFidelities = new Set<FlowFidelity>(["simplified", "detailed"]);

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

function validateFlowStep(step: FlowStep, path: string, nodeIds: Set<string>, edges: Architecture["edges"], errors: string[]): void {
  if ("duration" in step && step.duration !== undefined && !flowDurations.has(step.duration)) errors.push(`${path}.duration: недопустимая длительность.`);
  if (step.type === "transfer") {
    if (!nodeIds.has(step.from) || !nodeIds.has(step.to) || step.from === step.to) errors.push(`${path}: from и to должны ссылаться на разные существующие узлы.`);
    if (!flowKinds.has(step.kind)) errors.push(`${path}.kind: недопустимая runtime-семантика.`);
    const matchingEdge = step.edgeId
      ? edges.find((edge) => edge.id === step.edgeId)
      : edges.find((edge) => (edge.source === step.from && edge.target === step.to) || (edge.source === step.to && edge.target === step.from));
    if (!matchingEdge) errors.push(`${path}: transfer должен проходить по существующей topology edge.`);
    else if (!((matchingEdge.source === step.from && matchingEdge.target === step.to) || (matchingEdge.source === step.to && matchingEdge.target === step.from))) errors.push(`${path}.edgeId: edge не соединяет from и to.`);
    else if (matchingEdge.source === step.to && matchingEdge.target === step.from && !matchingEdge.bidirectional) errors.push(`${path}: reverse transfer требует bidirectional topology edge.`);
    return;
  }
  if (step.type === "activate") {
    if (!nodeIds.has(step.nodeId)) errors.push(`${path}.nodeId: ожидается существующий узел.`);
    return;
  }
  if (step.type === "wait") {
    if (isBlank(step.label)) errors.push(`${path}.label: ожидается объяснение ожидания.`);
    return;
  }
  if (step.type === "outcome") {
    if (step.nodeId !== undefined && !nodeIds.has(step.nodeId)) errors.push(`${path}.nodeId: ожидается существующий узел.`);
    if (isBlank(step.label)) errors.push(`${path}.label: ожидается описание результата.`);
    return;
  }
  if (step.type === "sequence" || step.type === "parallel") {
    if (!Array.isArray(step.steps) || step.steps.length === 0) errors.push(`${path}.steps: ожидается непустая группа.`);
    else step.steps.forEach((child, index) => validateFlowStep(child, `${path}.steps[${index}]`, nodeIds, edges, errors));
    return;
  }
  if (isBlank(step.condition)) errors.push(`${path}.condition: ожидается условие ветвления.`);
  if (!Array.isArray(step.paths) || step.paths.length < 2) { errors.push(`${path}.paths: ожидается минимум две ветви.`); return; }
  const pathIds = new Set<string>();
  const selectedCount = step.paths.filter((branch) => branch.selected).length;
  if (selectedCount !== 1) errors.push(`${path}.paths: ровно одна ветвь должна быть выбрана для walkthrough.`);
  step.paths.forEach((branch, index) => {
    const branchPath = `${path}.paths[${index}]`;
    if (isBlank(branch.id) || isBlank(branch.label)) errors.push(`${branchPath}: id и label обязательны.`);
    if (pathIds.has(branch.id)) errors.push(`${branchPath}.id: дублирующаяся ветвь.`);
    pathIds.add(branch.id);
    if (!Array.isArray(branch.steps) || branch.steps.length === 0) errors.push(`${branchPath}.steps: ожидается непустая ветвь.`);
    else branch.steps.forEach((child, childIndex) => validateFlowStep(child, `${branchPath}.steps[${childIndex}]`, nodeIds, edges, errors));
  });
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
  const scenarioIds = new Set<string>();
  architecture.flowScenarios?.forEach((scenario, scenarioIndex) => {
    const scenarioPath = `${path}.flowScenarios[${scenarioIndex}]`;
    if (isBlank(scenario.id) || isBlank(scenario.title)) local.push(`${scenarioPath}: id и title обязательны.`);
    if (scenarioIds.has(scenario.id)) local.push(`${scenarioPath}.id: дублирующийся scenario.id.`);
    scenarioIds.add(scenario.id);
    if (scenario.scope !== undefined && !flowScopes.has(scenario.scope)) local.push(`${scenarioPath}.scope: недопустимое значение.`);
    if (scenario.fidelity !== undefined && !flowFidelities.has(scenario.fidelity)) local.push(`${scenarioPath}.fidelity: недопустимое значение.`);
    validateTextList(scenario.assumptions, `${scenarioPath}.assumptions`, local, true);
    scenario.sources?.forEach((source, sourceIndex) => {
      const sourcePath = `${scenarioPath}.sources[${sourceIndex}]`;
      if (isBlank(source.title)) local.push(`${sourcePath}.title: ожидается название источника.`);
      try { new URL(source.url); } catch { local.push(`${sourcePath}.url: ожидается абсолютный URL.`); }
    });
    if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) local.push(`${scenarioPath}.steps: ожидается непустой walkthrough.`);
    else {
      const sceneIds = new Set<string>();
      scenario.steps.forEach((scene, sceneIndex) => {
        const scenePath = `${scenarioPath}.steps[${sceneIndex}]`;
        if (isBlank(scene.id) || isBlank(scene.title) || isBlank(scene.description)) local.push(`${scenePath}: id, title и description обязательны.`);
        if (sceneIds.has(scene.id)) local.push(`${scenePath}.id: дублирующийся scene.id.`);
        sceneIds.add(scene.id);
        validateFlowStep(scene.flow, `${scenePath}.flow`, nodeIds, architecture.edges, local);
      });
    }
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
