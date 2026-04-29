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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PanToolAltRoundedIcon from "@mui/icons-material/PanToolAltRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ViewWeekRoundedIcon from "@mui/icons-material/ViewWeekRounded";
import { keyframes } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { HelpCenterItem } from "../app/helpCenter";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.88; }
  50% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 0.88; }
`;

const slide = keyframes`
  0% { transform: translateX(-18px); opacity: 0.4; }
  50% { transform: translateX(18px); opacity: 1; }
  100% { transform: translateX(-18px); opacity: 0.4; }
`;

function WalkthroughAnimation(props: { kind: string }) {
  if (props.kind === "add-task") {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          height: 180,
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.12))",
        }}
      >
        <Box
          sx={{
            width: 74,
            height: 74,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            bgcolor: "#4f46e5",
            color: "#fff",
            animation: `${pulse} 1.8s ease-in-out infinite`,
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 42 }} />
        </Box>
      </Stack>
    );
  }

  if (props.kind === "drag-start") {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{
          height: 180,
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(34,197,94,0.12))",
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, width: 176 }}>
          {Array.from({ length: 8 }, (_, index) => (
            <Box
              key={index}
              sx={{
                height: 24,
                borderRadius: 1.5,
                bgcolor: index === 2 ? "rgba(14,165,233,0.85)" : "rgba(148,163,184,0.26)",
              }}
            />
          ))}
        </Box>
        <PanToolAltRoundedIcon sx={{ fontSize: 44, color: "#0369a1", animation: `${pulse} 1.8s ease-in-out infinite` }} />
      </Stack>
    );
  }

  if (props.kind === "drag-end") {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{
          height: 180,
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(79,70,229,0.1))",
        }}
      >
        <Box sx={{ position: "relative", width: 176, height: 58 }}>
          <Box sx={{ position: "absolute", inset: 0, borderRadius: 2, bgcolor: "rgba(148,163,184,0.2)" }} />
          <Box
            sx={{
              position: "absolute",
              top: 8,
              bottom: 8,
              left: 24,
              width: 84,
              borderRadius: 2,
              bgcolor: "rgba(34,197,94,0.82)",
              animation: `${slide} 2s ease-in-out infinite`,
            }}
          />
        </Box>
        <TaskAltRoundedIcon sx={{ fontSize: 42, color: "#15803d" }} />
      </Stack>
    );
  }

  if (props.kind === "task-list") {
    return (
      <Stack
        spacing={1}
        sx={{
          height: 180,
          p: 2.5,
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(14,165,233,0.08))",
        }}
      >
        {["Plan day", "Review tasks", "Mark done"].map((label, index) => (
          <Stack
            key={label}
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              p: 1.25,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.8)",
              animation: `${pulse} 1.8s ease-in-out infinite`,
              animationDelay: `${index * 0.12}s`,
            }}
          >
            <TaskAltRoundedIcon sx={{ color: "#ea580c" }} />
            <Typography fontWeight={700}>{label}</Typography>
          </Stack>
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        height: 180,
        borderRadius: 4,
        background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.08))",
      }}
    >
      <ViewWeekRoundedIcon sx={{ fontSize: 52, color: "#4f46e5", animation: `${pulse} 1.8s ease-in-out infinite` }} />
      <Typography fontWeight={700}>Week</Typography>
    </Stack>
  );
}

export function HelpWalkthroughModal(props: {
  item: HelpCenterItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="sm">
      <DialogTitle>{props.item.question}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {props.item.steps.length > 1 ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t("help.walkthroughStep", {
                current: stepIndex + 1,
                total: props.item.steps.length,
              })}
            </Typography>
          ) : null}
          <WalkthroughAnimation kind={step.gif} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              {step.title}
            </Typography>
            <Typography color="text.secondary">{step.text}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {stepIndex > 0 ? (
          <Button onClick={() => setStepIndex((value) => value - 1)}>
            {t("help.previous")}
          </Button>
        ) : (
          <Button onClick={props.onClose}>{t("common.close")}</Button>
        )}
        <Button
          variant="contained"
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
