// INPUT: help-center translation function
// OUTPUT: behavior coverage for onboarding and walkthrough definitions
// EFFECT: Verifies shared Help Center content exposes the expected tour and support entries
import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import { getHelpCenterData, getOnboardingSteps, ONBOARDING_STORAGE_KEY } from "../src/app/helpCenter";

const t = ((key: string) => key) as TFunction;

describe("help center data behavior", () => {
  it("returns seven onboarding steps with required content fields", () => {
    const steps = getOnboardingSteps(t);

    expect(steps).toHaveLength(7);
    for (const step of steps) {
      expect(step.id).toEqual(expect.any(String));
      expect(step.targets.length).toBeGreaterThan(0);
      expect(step.title).toEqual(expect.any(String));
      expect(step.text).toEqual(expect.any(String));
    }
  });

  it("requires the Week page and Help Center actions during onboarding", () => {
    const steps = getOnboardingSteps(t);

    expect(steps.find((step) => step.id === "open-week")).toMatchObject({
      forceAction: true,
      expectedAction: "open-week-page",
    });
    expect(steps.find((step) => step.id === "open-help")).toMatchObject({
      forceAction: true,
      expectedAction: "open-help-center",
    });
  });

  it("returns fourteen help-center items with required fields", () => {
    const items = getHelpCenterData(t);

    expect(items).toHaveLength(14);
    for (const item of items) {
      expect(item.id).toEqual(expect.any(String));
      expect(["all", "desktop", "mobile"]).toContain(item.audience);
      expect(item.question).toEqual(expect.any(String));
      expect(item.steps.length).toBeGreaterThan(0);
    }
  });

  it("includes the syllabus auto-clarify walkthrough for every audience", () => {
    expect(getHelpCenterData(t).find((item) => item.id === "syllabus-auto-clarify")).toMatchObject({
      audience: "all",
    });
  });

  it("exports a non-empty onboarding storage key", () => {
    expect(ONBOARDING_STORAGE_KEY).toEqual(expect.any(String));
    expect(ONBOARDING_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});
