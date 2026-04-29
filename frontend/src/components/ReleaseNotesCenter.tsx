import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RELEASE_NOTES, LATEST_RELEASE_ID, getReleaseNotesSeenKey } from "../app/releaseNotes";

type Props = {
  username: string;
};

type ReleaseSectionKey = "features" | "improvements" | "fixes";

const RELEASE_SECTION_ORDER: ReleaseSectionKey[] = ["features", "improvements", "fixes"];

function classifyReleaseChange(item: string): ReleaseSectionKey {
  if (/^(Added|Expanded)\b/.test(item)) {
    return "features";
  }

  if (/^(Fixed|Prevented)\b/.test(item)) {
    return "fixes";
  }

  return "improvements";
}

function groupReleaseChanges(items: string[]) {
  const grouped: Record<ReleaseSectionKey, string[]> = {
    features: [],
    improvements: [],
    fixes: [],
  };

  items.forEach((item) => {
    grouped[classifyReleaseChange(item)].push(item);
  });

  return RELEASE_SECTION_ORDER.map((key) => ({ key, items: grouped[key] })).filter((section) => section.items.length > 0);
}

export function ReleaseNotesCenter(props: Props) {
  const { t, i18n } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentLanguage = i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";
  const latestRelease = RELEASE_NOTES[0];
  const seenKey = useMemo(() => getReleaseNotesSeenKey(props.username), [props.username]);
  const groupedLatestChanges = latestRelease ? groupReleaseChanges(latestRelease.changes[currentLanguage]) : [];
  const sectionLabels: Record<ReleaseSectionKey, string> = {
    features: t("release.sections.features"),
    improvements: t("release.sections.improvements"),
    fixes: t("release.sections.fixes"),
  };

  // 1. Extract the check into a reusable function
  const checkSeenState = () => {
    if (!props.username || !LATEST_RELEASE_ID) return;
    const seenReleaseId = localStorage.getItem(seenKey);
    setDialogOpen(seenReleaseId !== LATEST_RELEASE_ID);
  };

  useEffect(() => {
    // 2. Check immediately on mount
    checkSeenState();

    // 3. Listen for custom event from other instances
    window.addEventListener("releaseNotesAck", checkSeenState);
    return () => window.removeEventListener("releaseNotesAck", checkSeenState);
  }, [props.username, seenKey]);

  function markLatestSeen() {
    if (!LATEST_RELEASE_ID) return;
    localStorage.setItem(seenKey, LATEST_RELEASE_ID);
    
    // 4. Dispatch an event to tell all other instances to close their dialogs
    window.dispatchEvent(new Event("releaseNotesAck"));
  }

  function handleCloseDialog() {
    markLatestSeen();
    setDialogOpen(false);
  }

  function handleOpenHistory() {
    markLatestSeen();
    setDialogOpen(false);
    setDrawerOpen(true);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  return (
    <>
      <Button color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
        {t("release.toolbar")}
      </Button>

      {latestRelease ? (
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{t("release.dialogTitle")}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h6">{latestRelease.title[currentLanguage]}</Typography>
                  <Chip size="small" label={latestRelease.version} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {t("release.releasedOn", { date: formatDate(latestRelease.releasedAt) })}
                </Typography>
              </Box>

              <Typography variant="body1">{latestRelease.summary[currentLanguage]}</Typography>

              <Stack spacing={1.5}>
                {groupedLatestChanges.map((section) => (
                  <Stack key={section.key} spacing={0.75}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {sectionLabels[section.key]}
                    </Typography>
                    {section.items.map((item) => (
                      <Typography key={item} variant="body2">
                        • {item}
                      </Typography>
                    ))}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t("common.close")}</Button>
            <Button variant="contained" onClick={handleOpenHistory}>{t("release.viewHistory")}</Button>
          </DialogActions>
        </Dialog>
      ) : null}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{t("release.historyTitle")}</Typography>
              <Button onClick={() => setDrawerOpen(false)}>{t("common.close")}</Button>
            </Stack>

            {RELEASE_NOTES.map((note, index) => (
              <Box key={note.id} sx={{ pb: 2, borderBottom: index === RELEASE_NOTES.length - 1 ? "none" : "1px solid", borderColor: "divider" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">{note.title[currentLanguage]}</Typography>
                  <Chip size="small" label={note.version} />
                  {index === 0 ? <Chip size="small" color="primary" label={t("release.latestBadge")} /> : null}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {t("release.releasedOn", { date: formatDate(note.releasedAt) })}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1.5 }}>{note.summary[currentLanguage]}</Typography>
                <Stack spacing={1.25}>
                  {groupReleaseChanges(note.changes[currentLanguage]).map((section) => (
                    <Stack key={`${note.id}-${section.key}`} spacing={0.75}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {sectionLabels[section.key]}
                      </Typography>
                      {section.items.map((item) => (
                        <Typography key={item} variant="body2">
                          • {item}
                        </Typography>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
