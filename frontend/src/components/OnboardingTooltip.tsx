// INPUT: route-visible target selectors and onboarding step content
// OUTPUT: one-time contextual coach mark overlay
// EFFECT: Guides first-time users through app basics and stores completion per browser
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { OnboardingTooltipStep } from "../app/helpCenter";

export function OnboardingTooltip(props: {
  steps: OnboardingTooltipStep[];
  storageKey: string;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setEnabled(localStorage.getItem(props.storageKey) !== "done");
  }, [props.storageKey]);

  useLayoutEffect(() => {
    if (!enabled) return;

    const step = props.steps[currentIndex];
    if (!step) return;

    const syncTarget = () => {
      const target = step.targets
        .map((selector) => document.querySelector(selector))
        .find((node): node is HTMLElement => {
          if (!(node instanceof HTMLElement)) return false;
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

      setTargetRect(target?.getBoundingClientRect() ?? null);
    };

    syncTarget();
    window.addEventListener("resize", syncTarget);
    window.addEventListener("scroll", syncTarget, true);

    return () => {
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("scroll", syncTarget, true);
    };
  }, [currentIndex, enabled, props.steps]);

  function completeOnboarding() {
    localStorage.setItem(props.storageKey, "done");
    setEnabled(false);
  }

  if (!enabled || !props.steps[currentIndex] || !targetRect) {
    return null;
  }

  const step = props.steps[currentIndex];
  const isLastStep = currentIndex === props.steps.length - 1;
  const tooltipTop = Math.min(targetRect.bottom + 16, window.innerHeight - 140);
  const tooltipLeft = Math.max(
    16,
    Math.min(targetRect.left, window.innerWidth - 280)
  );

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
          width: Math.min(targetRect.width + 16, window.innerWidth - 16),
          height: Math.min(targetRect.height + 16, window.innerHeight - 16),
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
          width: 264,
          p: 2,
          borderRadius: 3,
          zIndex: 2102,
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.2 }}>
            {t("onboarding.title")}
          </Typography>
          <Typography variant="body1" fontWeight={700}>
            {step.text}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {currentIndex + 1} / {props.steps.length}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={completeOnboarding}>
                {t("onboarding.skip")}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  if (isLastStep) {
                    completeOnboarding();
                    return;
                  }
                  setCurrentIndex((value) => value + 1);
                }}
              >
                {isLastStep ? t("onboarding.done") : t("common.next")}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
