// INPUT: selected help topic and step-by-step walkthrough content
// OUTPUT: modal walkthrough with animated visual cards and concise action text
// EFFECT: Explains feature actions in a focused visual flow without forcing users through long documentation
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { HelpCenterItem } from "../app/helpCenter";

function WalkthroughMedia(props: { src: string; alt: string }) {
  const { t } = useTranslation();
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [props.src]);

  return (
    <Box
      sx={{
        height: { xs: 320, sm: 420, md: 520 },
        borderRadius: 4,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "rgba(15, 23, 42, 0.02)",
        overflow: "hidden",
      }}
    >
      {!hasLoadError ? (
        <Box
          component="img"
          src={props.src}
          alt={props.alt}
          onError={() => setHasLoadError(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            bgcolor: "#fff",
          }}
        />
      ) : (
        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: "100%", px: 2.5, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={800}>
            {t("help.walkthroughs.mediaPlaceholderTitle")}
          </Typography>
          <Typography color="text.secondary">
            {t("help.walkthroughs.mediaPlaceholderBody")}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: "rgba(79, 70, 229, 0.08)",
              wordBreak: "break-all",
            }}
          >
            {props.src}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

export function HelpWalkthroughModal(props: {
  item: HelpCenterItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [props.item?.id, props.open]);

  if (!props.item) {
    return null;
  }

  const step = props.item.steps[stepIndex];
  const isLastStep = stepIndex === props.item.steps.length - 1;

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="lg" fullScreen={isMobile}>
      <DialogTitle>{props.item.question}</DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          {props.item.steps.length > 1 ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t("help.walkthroughStep", {
                current: stepIndex + 1,
                total: props.item.steps.length,
              })}
            </Typography>
          ) : null}
          <WalkthroughMedia src={step.mediaSrc} alt={step.mediaAlt} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.75 }}>
              {step.title}
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
              {step.text}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 } }}>
        {stepIndex > 0 ? (
          <Button fullWidth={isMobile} onClick={() => setStepIndex((value) => value - 1)}>
            {t("help.previous")}
          </Button>
        ) : (
          <Button fullWidth={isMobile} onClick={props.onClose}>{t("common.close")}</Button>
        )}
        <Button
          variant="contained"
          fullWidth={isMobile}
          onClick={() => {
            if (isLastStep) {
              props.onClose();
              return;
            }
            setStepIndex((value) => value + 1);
          }}
        >
          {isLastStep ? t("onboarding.done") : t("common.next")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
