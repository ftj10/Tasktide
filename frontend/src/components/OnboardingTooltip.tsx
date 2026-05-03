// INPUT: route-visible target selectors, onboarding step content, and force-advance signal
// OUTPUT: one-time contextual coach mark overlay with mobile-responsive positioning
// EFFECT: Guides first-time users through app basics, supports forced navigation steps, and stores completion per browser
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { OnboardingTooltipStep } from "../app/helpCenter";

export function OnboardingTooltip(props: {
  steps: OnboardingTooltipStep[];
  storageKey: string;
  forceAdvanceSignal?: string | null;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setEnabled(localStorage.getItem(props.storageKey) !== "done");
  }, [props.storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const step = props.steps[currentIndex];
    if (!step) return;

    function findTarget(): HTMLElement | null {
      const candidates = step.targets
        .map((s) => document.querySelector<HTMLElement>(s))
        .filter((n): n is HTMLElement => n !== null);
      return (
        candidates.find((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }) ??
        candidates[0] ??
        null
      );
    }

    function syncRect() {
      const target = findTarget();
      setTargetRect(target?.getBoundingClientRect() ?? null);
    }

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;
    let retries = 0;

    function tryScrollAndSync() {
      const target = findTarget();
      if (target) {
        if (typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
        timeoutId = setTimeout(syncRect, 350);
        return;
      }
      retries++;
      if (retries < 30) {
        rafId = requestAnimationFrame(tryScrollAndSync);
      }
    }

    syncRect();
    rafId = requestAnimationFrame(tryScrollAndSync);

    window.addEventListener("resize", syncRect);
    window.addEventListener("scroll", syncRect, true);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("resize", syncRect);
      window.removeEventListener("scroll", syncRect, true);
    };
  }, [currentIndex, enabled, props.steps]);

  useEffect(() => {
    if (!enabled || !props.forceAdvanceSignal) return;
    const step = props.steps[currentIndex];
    if (!step?.forceAction || step.expectedAction !== props.forceAdvanceSignal) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= props.steps.length) {
      localStorage.setItem(props.storageKey, "done");
      setEnabled(false);
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [props.forceAdvanceSignal, enabled, currentIndex, props.steps, props.storageKey]);

  function completeOnboarding() {
    localStorage.setItem(props.storageKey, "done");
    setEnabled(false);
  }

  function advance() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= props.steps.length) {
      completeOnboarding();
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  if (!enabled || !props.steps[currentIndex] || !targetRect) {
    return null;
  }

  const step = props.steps[currentIndex];
  const isLastStep = currentIndex === props.steps.length - 1;
  const isForceAction = step.forceAction === true;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const PADDING = 12;
  const TOOLTIP_H_APPROX = 148;
  const tooltipWidth = Math.min(320, vw - PADDING * 2);

  const spaceBelow = vh - targetRect.bottom;
  const spaceAbove = targetRect.top;
  let tooltipTop: number;
  if (spaceBelow >= TOOLTIP_H_APPROX + 16 + PADDING) {
    tooltipTop = targetRect.bottom + 16;
  } else if (spaceAbove >= TOOLTIP_H_APPROX + 16 + PADDING) {
    tooltipTop = targetRect.top - TOOLTIP_H_APPROX - 16;
  } else {
    tooltipTop = Math.max(PADDING, Math.min(targetRect.bottom + 16, vh - TOOLTIP_H_APPROX - PADDING));
  }

  const targetCenterX = targetRect.left + targetRect.width / 2;
  let tooltipLeft = targetCenterX - tooltipWidth / 2;
  tooltipLeft = Math.max(PADDING, Math.min(tooltipLeft, vw - tooltipWidth - PADDING));

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(15, 23, 42, 0.42)",
          zIndex: 2100,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          top: Math.max(targetRect.top - 8, 8),
          left: Math.max(targetRect.left - 8, 8),
          width: Math.min(targetRect.width + 16, vw - 16),
          height: Math.min(targetRect.height + 16, vh - 16),
          borderRadius: 3,
          boxShadow: "0 0 0 3px rgba(255,255,255,0.92)",
          zIndex: 2101,
          pointerEvents: "none",
        }}
      />
      <Paper
        elevation={8}
        role="dialog"
        aria-label={t("onboarding.title")}
        sx={{
          position: "fixed",
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
          p: 2,
          borderRadius: 3,
          zIndex: 2102,
        }}
      >
        <Stack spacing={1}>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.2 }}>
            {t("onboarding.title")}
          </Typography>
          <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.3 }}>
            {step.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {step.text}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {currentIndex + 1} / {props.steps.length}
            </Typography>
            <Stack direction="row" spacing={1}>
              {!isForceAction && (
                <Button size="small" onClick={completeOnboarding}>
                  {t("onboarding.skip")}
                </Button>
              )}
              {!isForceAction && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    if (isLastStep) {
                      completeOnboarding();
                      return;
                    }
                    advance();
                  }}
                >
                  {isLastStep ? t("onboarding.done") : t("common.next")}
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
