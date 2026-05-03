// INPUT: a React subtree and a route key
// OUTPUT: the subtree, or an offline fallback when a chunk fails to load
// EFFECT: Catches ChunkLoadErrors caused by offline chunk fetches and resets on route change
import { Component } from "react";
import type { ReactNode } from "react";
import { Avatar, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";

function OfflineFallback() {
  const { t } = useTranslation();
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
      <Avatar
        sx={{
          width: 44,
          height: 44,
          background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
          boxShadow: "0 10px 24px rgba(79, 70, 229, 0.24)",
        }}
      >
        <TaskAltRoundedIcon fontSize="small" />
      </Avatar>
      <Typography variant="body1" color="text.secondary">
        {t("app.offlinePageUnavailable")}
      </Typography>
    </Stack>
  );
}

export class ChunkErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <OfflineFallback />;
    }
    return this.props.children;
  }
}
