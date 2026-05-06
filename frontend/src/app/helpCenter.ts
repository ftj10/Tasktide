// INPUT: translation function for help and onboarding copy
// OUTPUT: shared onboarding and help-center content definitions
// EFFECT: Keeps activation messaging and walkthrough content aligned across the app shell and Help Center
import type { TFunction } from "i18next";

export const ONBOARDING_STORAGE_KEY = "tasktide:onboarding:v1.18.4";

export type OnboardingTooltipStep = {
  id: string;
  targets: string[];
  title: string;
  text: string;
  forceAction?: boolean;
  expectedAction?: string;
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
      id: "add-task",
      targets: ["[data-onboarding='add-task-button']", "#today-add-task-button", "#today-empty-add-task-button"],
      title: t("onboarding.steps.addTask.title"),
      text: t("onboarding.steps.addTask.text"),
    },
    {
      id: "task-list",
      targets: ["[data-onboarding='task-list']", "#today-empty-state", "#today-task-list"],
      title: t("onboarding.steps.taskList.title"),
      text: t("onboarding.steps.taskList.text"),
    },
    {
      id: "language-switch",
      targets: ["[data-onboarding='language-switch-button']", "#language-switch-desktop", "#language-switch-mobile"],
      title: t("onboarding.steps.languageSwitch.title"),
      text: t("onboarding.steps.languageSwitch.text"),
    },
    {
      id: "download-app",
      targets: ["[data-onboarding='download-app-button']", "#install-web-app-desktop", "#install-web-app-mobile"],
      title: t("onboarding.steps.downloadApp.title"),
      text: t("onboarding.steps.downloadApp.text"),
    },
    {
      id: "open-week",
      targets: ["[data-onboarding='week-page-button']", "#nav-week-desktop", "#nav-week-mobile"],
      title: t("onboarding.steps.openWeek.title"),
      text: t("onboarding.steps.openWeek.text"),
      forceAction: true,
      expectedAction: "open-week-page",
    },
    {
      id: "open-help",
      targets: ["[data-onboarding='help-center-button']", "#nav-help-desktop", "#nav-help-mobile"],
      title: t("onboarding.steps.openHelp.title"),
      text: t("onboarding.steps.openHelp.text"),
      forceAction: true,
      expectedAction: "open-help-center",
    },
    {
      id: "notification-toggle",
      targets: ["[data-onboarding='notification-toggle-button']"],
      title: t("onboarding.steps.notificationToggle.title"),
      text: t("onboarding.steps.notificationToggle.text"),
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
      id: "mobile-bottom-navigation",
      audience: "mobile",
      question: t("help.walkthroughs.mobileBottomNavigation.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to use mobile bottom navigation.gif",
          mediaAlt: t("help.walkthroughs.mobileBottomNavigation.title"),
          title: t("help.walkthroughs.mobileBottomNavigation.title"),
          text: t("help.walkthroughs.mobileBottomNavigation.text"),
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
    {
      id: "export-ics",
      audience: "all",
      question: t("help.walkthroughs.exportIcs.question"),
      steps: [
        {
          mediaSrc: "/help-walkthroughs/how to export tasks as ics calendar file.gif",
          mediaAlt: t("help.walkthroughs.exportIcs.title"),
          title: t("help.walkthroughs.exportIcs.title"),
          text: t("help.walkthroughs.exportIcs.text"),
        },
      ],
    },
  ];
}
