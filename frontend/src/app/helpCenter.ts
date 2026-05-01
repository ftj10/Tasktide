// INPUT: translation function for help and onboarding copy
// OUTPUT: shared onboarding and help-center content definitions
// EFFECT: Keeps activation messaging and walkthrough content aligned across the app shell and Help Center
import type { TFunction } from "i18next";

export const ONBOARDING_STORAGE_KEY = "tasktide:onboarding:v1.18.4";

export type OnboardingTooltipStep = {
  id: string;
  targets: string[];
  text: string;
};

export type HelpWalkthroughStep = {
  mediaSrc: string;
  mediaAlt: string;
  title: string;
  text: string;
};

export type HelpAudience = "all" | "desktop" | "mobile";

export type HelpCenterItem = {
  id: string;
  audience: HelpAudience;
  question: string;
  steps: HelpWalkthroughStep[];
};

export function getOnboardingSteps(t: TFunction): OnboardingTooltipStep[] {
  return [
    {
      id: "language-switch",
      targets: ["#language-switch-desktop", "#language-switch-mobile"],
      text: t("onboarding.steps.languageSwitch"),
    },
    {
      id: "help-center",
      targets: ["#nav-help-desktop", "#nav-help-mobile"],
      text: t("onboarding.steps.helpCenter"),
    },
    {
      id: "install-web-app",
      targets: ["#install-web-app-desktop", "#install-web-app-mobile"],
      text: t("onboarding.steps.installWebApp"),
    },
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
      id: "add-task-browser",
      audience: "desktop",
      question: t("help.walkthroughs.addTaskBrowser.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to add task in todaypage in browser.gif",
          mediaAlt: t("help.walkthroughs.addTaskBrowser.title"),
          title: t("help.walkthroughs.addTaskBrowser.title"),
          text: t("help.walkthroughs.addTaskBrowser.text"),
        },
      ],
    },
    {
      id: "quick-add-week-browser",
      audience: "desktop",
      question: t("help.walkthroughs.quickAddWeekBrowser.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to quickly add task in weekpage browser.gif",
          mediaAlt: t("help.walkthroughs.quickAddWeekBrowser.title"),
          title: t("help.walkthroughs.quickAddWeekBrowser.title"),
          text: t("help.walkthroughs.quickAddWeekBrowser.text"),
        },
      ],
    },
    {
      id: "add-task-week-mobile",
      audience: "mobile",
      question: t("help.walkthroughs.addTaskWeekMobile.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to add task in weekpage in mobile.gif",
          mediaAlt: t("help.walkthroughs.addTaskWeekMobile.title"),
          title: t("help.walkthroughs.addTaskWeekMobile.title"),
          text: t("help.walkthroughs.addTaskWeekMobile.text"),
        },
      ],
    },
    {
      id: "task-map",
      audience: "all",
      question: t("help.walkthroughs.taskMap.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to enable map function for each task(both mobile and desktop browser).gif",
          mediaAlt: t("help.walkthroughs.taskMap.title"),
          title: t("help.walkthroughs.taskMap.title"),
          text: t("help.walkthroughs.taskMap.text"),
        },
      ],
    },
    {
      id: "open-web-app-pc",
      audience: "desktop",
      question: t("help.walkthroughs.openWebAppPc.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to open a web app in pc.gif",
          mediaAlt: t("help.walkthroughs.openWebAppPc.title"),
          title: t("help.walkthroughs.openWebAppPc.title"),
          text: t("help.walkthroughs.openWebAppPc.text"),
        },
      ],
    },
    {
      id: "reset-notifications-pc",
      audience: "desktop",
      question: t("help.walkthroughs.resetNotificationsPc.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to reset:enable notification in pc.gif",
          mediaAlt: t("help.walkthroughs.resetNotificationsPc.title"),
          title: t("help.walkthroughs.resetNotificationsPc.title"),
          text: t("help.walkthroughs.resetNotificationsPc.text"),
        },
      ],
    },
  ];
}
