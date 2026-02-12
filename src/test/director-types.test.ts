import { describe, it, expect } from "vitest";
import { VIDEO_MODELS, IMAGE_MODELS, ENGINE_LABELS, ENGINE_COLORS } from "@/lib/director-types";

describe("director-types", () => {
  it("all VIDEO_MODELS have required fields", () => {
    for (const m of VIDEO_MODELS) {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(m.color).toBeTruthy();
      expect(Array.isArray(m.durations)).toBe(true);
      expect(Array.isArray(m.resolutions)).toBe(true);
      expect(typeof m.features).toBe("object");
      expect(typeof m.costs).toBe("object");
    }
  });

  it("all VIDEO_MODELS have valid costs for each duration", () => {
    for (const m of VIDEO_MODELS) {
      for (const d of m.durations) {
        expect(m.costs[d]).toBeGreaterThan(0);
      }
    }
  });

  it("all VIDEO_MODELS have ENGINE_LABELS and ENGINE_COLORS", () => {
    for (const m of VIDEO_MODELS) {
      expect(ENGINE_LABELS[m.id]).toBeTruthy();
      expect(ENGINE_COLORS[m.id]).toBeTruthy();
    }
  });

  it("IMAGE_MODELS have required fields", () => {
    for (const m of IMAGE_MODELS) {
      expect(m.id).toBeTruthy();
      expect(m.label).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(m.color).toBeTruthy();
    }
  });

  it("Kling O3 Omni supports imageRef and videoRef", () => {
    const o3 = VIDEO_MODELS.find(m => m.id === "KLING_O3_OMNI");
    expect(o3).toBeDefined();
    expect(o3!.features.imageRef).toBe(true);
    expect(o3!.features.videoRef).toBe(true);
    expect(o3!.features.endFrame).toBe(true);
    expect(o3!.features.audio).toBe(true);
  });

  it("Kling O1 supports imageRef and endFrame but not videoRef", () => {
    const o1 = VIDEO_MODELS.find(m => m.id === "KLING_O1");
    expect(o1).toBeDefined();
    expect(o1!.features.imageRef).toBe(true);
    expect(o1!.features.endFrame).toBe(true);
    expect(o1!.features.videoRef).toBeFalsy();
  });

  it("Kling 2.1 Pro supports startFrame and endFrame", () => {
    const k21 = VIDEO_MODELS.find(m => m.id === "KLING2_1");
    expect(k21).toBeDefined();
    expect(k21!.features.startFrame).toBe(true);
    expect(k21!.features.endFrame).toBe(true);
  });

  it("Veo 3.1 supports audio and endFrame", () => {
    const veo = VIDEO_MODELS.find(m => m.id === "VEO3_1");
    expect(veo).toBeDefined();
    expect(veo!.features.audio).toBe(true);
    expect(veo!.features.endFrame).toBe(true);
  });

  it("Motion 2.0 has no special features", () => {
    const motion = VIDEO_MODELS.find(m => m.id === "MOTION2");
    expect(motion).toBeDefined();
    expect(Object.values(motion!.features).filter(Boolean).length).toBe(0);
  });

  it("all 13 video models are present", () => {
    expect(VIDEO_MODELS.length).toBe(13);
  });

  it("all 4 categories are present", () => {
    const cats = new Set(VIDEO_MODELS.map(m => m.category));
    expect(cats.size).toBe(4);
    expect(cats.has("Veo")).toBe(true);
    expect(cats.has("Kling")).toBe(true);
    expect(cats.has("Hailuo")).toBe(true);
    expect(cats.has("Motion")).toBe(true);
  });
});
