import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { backgroundJobProcessing } from "../src/features/architecture/data/background-job-processing.ts";
import { cachedApplication } from "../src/features/architecture/data/cached-application.ts";
import { eventDrivenOrderProcessing } from "../src/features/architecture/data/event-driven-order-processing.ts";
import { architectures } from "../src/features/architecture/data/index.ts";
import { processorArchitecture } from "../src/features/architecture/data/processor-architecture.ts";
import { buildRuntimeFrame } from "../src/features/architecture/model/flowRuntime.ts";
import { architectureCategoryOrder } from "../src/features/architecture/model/types.ts";

function scene(architecture: typeof processorArchitecture, id: string) {
  const result = architecture.flowScenarios?.[0]?.steps.find((step) => step.id === id);
  assert.ok(result, `Missing scene: ${id}`);
  return result;
}

describe("flow runtime", () => {
  test("has at least one walkthrough scenario in every taxonomy group", () => {
    const coveredCategories = new Set(architectures.filter((architecture) => architecture.flowScenarios?.length).map((architecture) => architecture.category));
    assert.deepEqual(coveredCategories, new Set(architectureCategoryOrder));
  });

  test("produces no active flow without an explicit scene", () => {
    const frame = buildRuntimeFrame(processorArchitecture);
    assert.equal(frame.particlesByEdge.size, 0);
    assert.equal(frame.activeNodeIds.size, 0);
    assert.equal(frame.activeEdgeIds.size, 0);
  });

  test("starts parallel transfers simultaneously", () => {
    const frame = buildRuntimeFrame(processorArchitecture, scene(processorArchitecture, "execute"));
    const control = frame.particlesByEdge.get("decode-execution")?.[0];
    const data = frame.particlesByEdge.get("registers-execution")?.[0];

    assert.ok(control);
    assert.ok(data);
    assert.equal(control.start, 0);
    assert.equal(data.start, 0);
    assert.equal(control.end, data.end);
    assert.equal(frame.phaseCount, 1);
    assert.deepEqual(new Set(frame.kinds), new Set(["control", "data"]));
  });

  test("fans one event out to all subscribers in the same phase", () => {
    const frame = buildRuntimeFrame(eventDrivenOrderProcessing, scene(eventDrivenOrderProcessing, "fanout"));
    const particles = ["bus-payment", "bus-notification", "bus-fulfillment"].map((edgeId) => frame.particlesByEdge.get(edgeId)?.[0]);

    particles.forEach((particle) => assert.ok(particle));
    assert.deepEqual(particles.map((particle) => particle?.start), [0, 0, 0]);
    assert.deepEqual(particles.map((particle) => particle?.end), [1, 1, 1]);
    assert.equal(frame.phaseCount, 1);
  });

  test("preserves reverse runtime direction on a bidirectional topology edge", () => {
    const frame = buildRuntimeFrame(processorArchitecture, scene(processorArchitecture, "write-result"));
    const particle = frame.particlesByEdge.get("registers-execution")?.[0];

    assert.ok(particle);
    assert.equal(particle.direction, "reverse");
    assert.equal(particle.kind, "data");
  });

  test("runs only the selected branch and records alternatives", () => {
    const frame = buildRuntimeFrame(cachedApplication, scene(cachedApplication, "cache-check"));

    assert.equal(frame.branches[0]?.paths.find((path) => path.selected)?.id, "miss");
    assert.equal(frame.particlesByEdge.has("backend-postgres"), false);
    assert.equal(frame.activeEdgeIds.has("backend-redis"), true);
    assert.equal(frame.alternativeEdgeIds.has("client-backend"), true);
  });

  test("models wait as elapsed time without inventing a transfer", () => {
    const frame = buildRuntimeFrame(backgroundJobProcessing, scene(backgroundJobProcessing, "later"));

    assert.deepEqual([...frame.activeNodeIds], ["queue"]);
    assert.equal(frame.activeEdgeIds.size, 0);
    assert.equal(frame.particlesByEdge.size, 0);
    assert.equal(frame.phaseCount, 2.25);
  });
});
