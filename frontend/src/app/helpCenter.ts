// INPUT: translation function for help and onboarding copy
// OUTPUT: shared onboarding and help-center content definitions
// EFFECT: Keeps activation messaging and walkthrough content aligned across the app shell and Help Center
import type { TFunction } from "i18next";

export const ONBOARDING_STORAGE_KEY = "weekly-todo:onboarding:v1.16.0";

export type OnboardingTooltipStep = {
  id: string;
  targets: string[];
  text: string;
};

export type HelpWalkthroughStep = {
  gif: string;
  title: string;
  text: string;
};

export type HelpCenterItem = {
  id: string;
  question: string;
  steps: HelpWalkthroughStep[];
};

export function getOnboardingSteps(t: TFunction): OnboardingTooltipStep[] {
  return [
    {
      id: "add-task",
      targets: ["#today-add-task-button", "#today-empty-add-task-button"],
      text: t("onboarding.steps.addTask"),
    },
    {
      id: "task-list",
      targets: ["#today-empty-state", "#today-task-list"],
      text: t("onboarding.steps.taskList"),
    },
    {
      id: "week-view",
      targets: ["#nav-week-desktop", "#nav-week-mobile", "#week-help-button"],
      text: t("onboarding.steps.weekView"),
    },
  ];
}

export function getHelpCenterData(t: TFunction): HelpCenterItem[] {
  return [
    {
      id: "add-task",
      question: t("help.walkthroughs.addTask.question"),
      steps: [
        {
          gif: "add-task",
          title: t("help.walkthroughs.addTask.title"),
          text: t("help.walkthroughs.addTask.text"),
        },
      ],
    },
    {
      id: "drag-to-add",
      question: t("help.walkthroughs.dragToAdd.question"),
      steps: [
        {
          gif: "drag-start",
          title: t("help.walkthroughs.dragToAdd.step1Title"),
          text: t("help.walkthroughs.dragToAdd.step1Text"),
        },
        {
          gif: "drag-end",
          title: t("help.walkthroughs.dragToAdd.step2Title"),
          text: t("help.walkthroughs.dragToAdd.step2Text"),
        },
      ],
    },
    {
      id: "find-tasks",
      question: t("help.walkthroughs.findTasks.question"),
      steps: [
        {
          gif: "task-list",
          title: t("help.walkthroughs.findTasks.title"),
          text: t("help.walkthroughs.findTasks.text"),
        },
      ],
    },
    {
      id: "open-week",
      question: t("help.walkthroughs.openWeek.question"),
      steps: [
        {
          gif: "week-view",
          title: t("help.walkthroughs.openWeek.title"),
          text: t("help.walkthroughs.openWeek.text"),
        },
      ],
    },
  ];
}
