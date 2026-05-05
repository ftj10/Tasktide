// INPUT: translation resources and browser language detection
// OUTPUT: initialized i18n instance
// EFFECT: Supplies bilingual copy across the planner shell, dialogs, release notes, and help flows
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app: {
        loading: "Loading your data...",
        offlinePageUnavailable: "This page isn't available offline. Go back online to load it."
      },
      common: {
        confirm: "Confirm",
        cancel: "Cancel",
        close: "Close",
        delete: "Delete",
        done: "Done",
        next: "Next",
        undo: "Undo",
        save: "Save",
        add: "Add",
        edit: "Edit",
        moveToToday: "Move to Today",
        moveOccurrenceToToday: "Move occurrence to Today",
        repeat: "Repeat",
        beginDate: "Begin date",
        endDate: "End date",
        date: "Date",
        weekday: "Weekday",
        emergency: "Emergency",
        startTimeOptional: "Start Time (Optional)",
        endTimeOptional: "End Time (Optional)",
        descriptionOptional: "Description (Optional)",
        locationOptional: "Location (Optional)",
        mapProvider: "Map Provider"
      },
      nav: {
        reminders: "Reminders",
        today: "Today",
        week: "Week",
        month: "Month",
        stats: "Stats",
        help: "Help",
        mobileNavigation: "Mobile navigation",
        logout: "Logout",
        switchLanguage: "Switch language",
        installApp: "Install app",
        greeting: "Hi, {{name}}!"
      },
      login: {
        title: {
          login: "Welcome Back",
          register: "Create an Account"
        },
        fields: {
          username: "Username",
          password: "Password"
        },
        actions: {
          login: "Login",
          register: "Register",
          waiting: "Please wait...",
          switchToLogin: "Already have an account? Log in",
          switchToRegister: "Don't have an account? Register"
        },
        status: {
          registrationSuccess: "Registration successful! Please log in."
        },
        errors: {
          usernameTaken: "Username taken",
          invalidCredentials: "Invalid credentials",
          requiredFields: "Username and password are required",
          usernameTooShort: "Username must be at least 3 characters",
          passwordTooShort: "Password must be at least 8 characters",
          failedToRegister: "Failed to register",
          failedToLogin: "Failed to log in",
          generic: "Something went wrong"
        }
      },
      notifications: {
        dailyReminderTitle: "Daily Reminder",
        dailyReminderBody: "Don't forget your tasks for today.",
        taskStartingSoonTitle: "Task Starting Soon: {{title}}",
        taskStartingSoonBody: "Starts at {{time}}"
      },
      today: {
        allDay: "All-Day Tasks",
        scheduled: "Scheduled Tasks",
        noTasks: "No tasks scheduled for this date.",
        addTask: "Add Task",
        goToToday: "Go to Today",
        importIcs: "Import ICS",
        importIcsInput: "Import ICS file",
        importSuccess: "Imported {{count}} tasks from {{name}}.",
        importSuccessWithSkipped: "Imported {{count}} tasks from {{name}} and skipped {{skipped}} unsupported entries.",
        importEmpty: "No importable events were found in {{name}}.",
        importError: "We couldn't import {{name}}.",
        markAllDone: "Mark All Done",
        activeCount: "Active {{count}}",
        completedCount: "Completed {{count}}",
        productivityTitle: "Productivity Stats",
        productivityPitch: "See your recent completion pattern at a glance. Last 7 days: {{completed}} / {{total}} completed ({{percent}}%).",
        productivityToday: "Selected Day",
        productivityLast7Days: "Last 7 Days",
        productivityLast30Days: "Last 30 Days",
        viewProductivityDetails: "View Stats and Visualization",
        hideProductivityDetails: "Hide Stats and Visualization",
        statsValue: "{{completed}} / {{total}} completed ({{percent}}%)",
        productivityTrendTitle: "7-Day Completion Trend",
        productivityTrendHint: "Bar height shows workload. Green shows completed tasks and gray shows what stayed open.",
        productivityLegendCompleted: "Completed",
        productivityLegendRemaining: "Remaining",
        taskMeta: "{{type}} • Priority {{priority}}",
        locationLabel: "Location: {{location}}",
        modify: "Modify",
        toToday: "To Today",
        toTomorrow: "To Tomorrow",
        map: "Map",
        previousDay: "Previous day",
        nextDay: "Next day",
        exportIcs: "Export ICS",
        exportDialogTitle: "Export to Calendar",
        exportFilterLabel: "Include",
        exportAll: "All tasks",
        exportIncomplete: "Incomplete tasks only",
        exportDateRange: "Tasks in date range",
        exportStartDate: "Start date",
        exportEndDate: "End date",
        exportDownload: "Download .ics",
        exportDateRangeError: "Start date must be on or before end date.",
        taskTypes: {
          once: "Once",
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
          yearly: "Yearly"
        }
      },
      week: {
        title: "Week View",
        listView: "List View",
        timeGridView: "Time Grid",
        todayButton: "Today",
        mobileCreateHint: "On phones, press-hold a time range in Time Grid to create a task there, including ranges that cross into the next day."
      },
      month: {
        jumpToCurrentMonth: "Jump to Current Month",
        moreTasks: "+{{count}} more",
        mobileSwipeHint: "Swipe up or down to change month",
        mobileGestureDescription: "Swipe up for previous month or down for next month.",
        desktopHint: "Arrow navigation on desktop",
        scanHint: "Scan workload by day",
        weekdays: {
          sun: "Sun",
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat"
        }
      },
      reminder: {
        title: "Active Reminders",
        addReminder: "Add Reminder",
        empty: "You have no active reminders!",
        priority: "Priority: {{value}}",
        modify: "Modify",
        createTitle: "Create Reminder",
        editTitle: "Edit Reminder",
        reminderTitle: "Title",
        notesOptional: "Notes (Optional)",
        emergencyField: "Emergency (1=Highest, 5=Lowest)"
      },
      toast: {
        taskCreated: "Task created",
        taskUpdated: "Task updated",
        taskDeleted: "Task deleted",
        taskDone: "Task marked as done",
        allTasksDone: "All tasks marked as done",
        reminderCreated: "Reminder created",
        reminderUpdated: "Reminder updated",
        syllabusDeleted: "All syllabus tasks deleted",
        syllabusDeleteFailed: "Failed to delete syllabus tasks"
      },
      release: {
        toolbar: "Updates",
        dialogTitle: "What's New",
        historyTitle: "Release History",
        viewHistory: "View History",
        latestBadge: "Latest",
        releasedOn: "Released {{date}}",
        sections: {
          features: "New Features",
          improvements: "Improvements",
          fixes: "Bug Fixes"
        }
      },
      help: {
        title: "Help Center",
        subtitleUser: "Learn how to use the planner, check common answers, and send a question to the admin review board.",
        subtitleAdmin: "Learn how to use the planner, check common answers, and review every submitted help question.",
        previous: "Back",
        walkthroughStep: "Step {{current}} / {{total}}",
        submitSuccess: "Your question has been saved.",
        submitError: "We couldn't post your question. Your draft is still here.",
        walkthroughs: {
          title: "Quick Walkthroughs",
          open: "Open",
          mediaPlaceholderTitle: "GIF placeholder",
          mediaPlaceholderBody: "Add your walkthrough GIF at this path to replace the placeholder.",
          addTaskBrowser: {
            question: "Add a task from Today on desktop",
            title: "how to add task in todaypage in browser.gif",
            text: "This GIF shows opening Today, clicking Add Task, and saving a new task."
          },
          quickAddWeekBrowser: {
            question: "Quick-add a task in Week on desktop",
            title: "how to quickly add task in weekpage browser.gif",
            text: "This GIF shows choosing a time in Week and creating a task faster."
          },
          addTaskWeekMobile: {
            question: "Add a task in Week on mobile",
            title: "how to add task in weekpage in mobile.gif",
            text: "This GIF shows pressing a time slot in mobile Week and adding a task."
          },
          taskMap: {
            question: "Open the map from a task",
            title: "how to enable map function for each task(both mobile and desktop browser).gif",
            text: "This GIF shows opening the map link from a task on desktop or mobile."
          },
          openWebAppPc: {
            question: "Open the planner as a desktop web app",
            title: "how to open a web app in pc.gif",
            text: "This GIF shows installing or opening the planner as a desktop web app."
          },
          resetNotificationsPc: {
            question: "Enable or reset Task Notifications",
            title: "how to reset:enable notification in pc.gif",
            text: "This GIF shows enabling Task Notifications from Help or fixing browser notification settings."
          },
          exportIcs: {
            question: "Export tasks as a calendar file (.ics)",
            title: "how to export tasks as ics calendar file.gif",
            text: "This GIF shows clicking Export ICS on Today, choosing a filter, and downloading the .ics file to open in a calendar app."
          },
          syllabusManual: {
            question: "Import a syllabus using your own AI",
            title: "how to import syllabus manually.gif",
            text: "1. Click Import Syllabus in the sidebar.\n2. Paste your syllabus text or upload a PDF or CSV, then click Next.\n3. Choose Copy prompt to my AI.\n4. Optionally add study preferences (e.g. \"remind me 3 days before exams\").\n5. Click Next to see the generated prompt — copy it with the Copy Prompt button.\n6. Paste the prompt into any AI (ChatGPT, Claude, etc.) and copy the JSON it returns.\n7. Paste that JSON into the wizard and click Import Tasks.\n8. Review the extracted tasks, edit or remove any, then click to add them to your planner."
          }
        },
        taskNotifications: {
          title: "Task Notifications",
          body: "Enable Task Notifications when you want task alerts, task start reminders, and daily task check-ins from this browser or installed app.",
          enable: "Enable Task Notifications",
          disable: "Disable Task Notifications",
          dialogTitle: "Enable Task Notifications?",
          explanation: "Enable notifications to receive task alerts, upcoming task start reminders, and daily task check-ins.",
          confirmEnable: "Enable Task Notifications",
          enabled: "Task Notifications are enabled for this browser or device.",
          disabled: "Task Notifications are disabled for this browser or device.",
          denied: "Task Notifications are blocked. Re-enable them from your browser or site notification settings, then try again.",
          unsupported: "This browser does not support Task Notifications through web push.",
          enableError: "We couldn't enable Task Notifications. Check browser notification settings and try again.",
          disableError: "We couldn't disable Task Notifications for this browser or device."
        },
        guides: {
          title: "How To Use This Website",
          step0: "TaskTide is for planning a week of work from start to finish. Create a clean account, add what you need to do, arrange it by day or time, then mark work complete as your week moves forward.",
          step1: "If you want to plan today, start on Today. Add tasks, import calendar events from an ICS file if you have one, and use the list as your daily work plan. Every action — create, edit, complete, delete — confirms with a brief message at the bottom of the screen.",
          step2: "When you need to organize the whole week, open Week. Place tasks into time slots, compare busy days, and adjust your plan before the work happens.",
          step3: "Use Month when you want to scan a larger schedule, choose a future date, or jump back into Today for a specific day.",
          step4: "Use Reminders for notes that are not tied to one schedule slot but should stay easy to find until you complete them.",
          step5Desktop: "On desktop, use the left sidebar to move between Reminders, Today, Week, Month, Stats, Help, and the install guide.",
          step5Mobile: "On mobile, use the bottom navigation to move between the main pages — including Stats for your 30-day productivity overview — and the top install button to learn how to add TaskTide to your device.",
          step6Desktop: "If you want TaskTide to open like an app, choose Install app and follow the walkthrough for your browser. If you want task alerts, task start reminders, and daily task check-ins, open Help and choose Enable Task Notifications.",
          step6Mobile: "If you want TaskTide on your home screen, choose Install app and follow the mobile steps for your browser. Then open Help and choose Enable Task Notifications if you want task alerts, task start reminders, and daily task check-ins.",
          step7Desktop: "If your connection drops, keep editing tasks normally. TaskTide will merge repeated offline edits and sync them when the server is available again. Heavier areas such as Week, Month, Help, and Updates load when you open them, so the first screen can start sooner. Use Updates to see what changed recently, and use Help when you need the full workflow explained again.",
          step7Mobile: "If your connection drops, keep editing tasks normally. TaskTide will merge repeated offline edits and sync them when the server is available again. Heavier areas such as Week, Month, Help, and Updates load when you open them, so the first screen can start sooner. Use Updates to see what changed recently, and use Help when you need the full workflow explained again."
        },
        faq: {
          title: "Common Q&A",
          q1: {
            question: "How does repeat work for tasks?",
            answer: "Choose a begin date, then choose how often the task repeats. You can keep it once, or repeat it daily, weekly, monthly, or yearly."
          },
          q2: {
            question: "How do reminders differ from tasks?",
            answer: "Tasks are planned by date. Reminders are simple notes that stay visible until you mark them done."
          },
          q3: {
            question: "Why does a task need a valid end time?",
            answer: "If you use an end time, it must be the same as or later than the start time."
          },
          q4: {
            question: "Who can see the submitted questions?",
            answer: "Normal users only see their own questions. Admin accounts can see all questions and delete them if needed."
          },
          q5: {
            question: "How does clicking in Week view work?",
            answer: "You can jump to a date, pick a time slot, and create a task from Week. On mobile, press and hold the time range you want."
          },
          q6: {
            question: "How does the layout change on mobile devices?",
            answer: "The app uses bottom navigation, a touch-friendly Week view, and full-screen forms on mobile."
          },
          q7: {
            question: "What happens if a save request fails?",
            answer: "Task changes stay visible and sync later when the app is offline. If a help question fails to post, your draft stays in the box."
          },
          q8: {
            question: "Can I change the language before logging in?",
            answer: "Yes. Use the EN / 中文 button on the login page to switch the authentication screen before you sign in or register."
          },
          q9: {
            question: "What happens when I edit one repeating task occurrence?",
            answer: "The app asks whether you want to change only that day or the whole repeating series."
          },
          q10: {
            question: "Do browser Task Notifications keep growing in storage?",
            answer: "No. Old notification records are cleaned up automatically."
          },
          q12: {
            question: "How do I get Task Notifications on phone and computer?",
            answer: "Desktop:\n1. Open Help.\n2. Choose Enable Task Notifications.\n3. Confirm the explanation, then allow notifications if your browser asks.\n\nIPhone or iPad:\n1. Add TaskTide to Home Screen.\n2. Open TaskTide from your Home Screen.\n3. Open Help and choose Enable Task Notifications.\n4. If needed, check Settings > Notifications > TaskTide.\n5. Make sure notifications are on.\n\nAndroid:\n1. Install TaskTide if your browser supports it.\n2. Open TaskTide.\n3. Open Help and choose Enable Task Notifications.\n4. If needed, check Settings > Apps > TaskTide or your browser > Notifications.\n5. Make sure notifications are on.\n\nAfter setup, task alerts, task start reminders, and daily task check-ins can arrive even when TaskTide is closed."
          },
          q13: {
            question: "How do I install the mobile web app?",
            answer: "IPhone or iPad:\n1. Open TaskTide in Safari.\n2. Tap Share.\n3. Tap Add to Home Screen.\n4. Confirm the TaskTide app name.\n5. Open TaskTide from your Home Screen.\n\nAndroid:\n1. Open TaskTide in Chrome, Edge, or another supported browser.\n2. Open the browser menu.\n3. Tap Install app or Add to Home screen.\n4. Confirm TaskTide.\n5. Open TaskTide from your Home Screen or app list."
          },
          q14: {
            question: "Do installed mobile web apps work the same on every browser?",
            answer: "No.\n\nIPhone and iPad:\n- Use Safari for the best install support.\n\nAndroid:\n- Chrome and Edge usually work best.\n- Other browsers can vary by device and version.\n\nIf install or notification options do not appear, try Safari on iPhone/iPad or Chrome/Edge on Android."
          },
          q15: {
            question: "How does sign-in stay active in this browser?",
            answer: "The planner keeps your sign-in in a secure browser session cookie. On the hosted web app, signing in should keep you in the planner even when the app and API use different web addresses. You usually stay signed in until you log out or the session expires."
          },
          q16: {
            question: "Can I use tasks offline in the installed web app?",
            answer: "Yes, after you sign in once while online. Install TaskTide, open it while online so your tasks are cached, then you can reopen cached tasks, add tasks, edit tasks, mark tasks done, and delete tasks while offline. Task changes sync when the app can reach the server again."
          },
          q17: {
            question: "How do I restart or skip the app tour?",
            answer: "The tour runs once for new users. To skip it mid-tour, tap Skip in the tour tooltip. The tour will not appear again on that browser. Two steps—opening Week view and opening Help Center—require you to tap the real button rather than clicking Next, so you discover each section by doing."
          },
          q11: {
            question: "What does the ICS importer support?",
            answer: "Import ICS on Today to turn calendar events into tasks. It supports titles, notes, locations, timed events, multi-day events, and common repeat rules."
          },
          q18: {
            question: "How do I export my tasks to a calendar app?",
            answer: "On Today, click Export ICS. Choose whether to include all tasks, incomplete tasks only, or tasks within a date range, then click Download .ics. Open the downloaded file in Apple Calendar, Google Calendar, Outlook, or any app that supports the ICS format."
          },
          q19: {
            question: "What does the Stats page show?",
            answer: "Stats shows your task activity for the past 30 days. You can see how many tasks you completed, created, and left overdue, your overall completion rate, and how these compare with the previous 30 days. The page also shows daily trend bars, behaviour insights, and your most and least productive days of the week."
          },
          q20: {
            question: "How does syllabus import work?",
            answer: "Click Import Syllabus in the sidebar. Paste your syllabus text or upload a PDF or CSV file, then click Next. Choose how to generate tasks: pick Copy prompt to my AI to get a ready-made prompt you paste into any AI — nothing ever leaves your browser — or pick Analyze with Claude to send your text to Claude directly (a consent screen shows exactly what will be sent before anything is submitted). After the AI produces a JSON list, paste it back and the wizard validates each item, showing specific errors if anything is wrong. Review every extracted task, edit or remove any, then click Import to add them to your planner. If you close the browser mid-import, the wizard saves your progress for 24 hours so you can pick up where you left off."
          },
          q21: {
            question: "Where can I see what changed recently?",
            answer: "Open Updates to read the latest TaskTide changes. The Help Center also stays aligned with new workflows, so you can return here when a new feature changes how you plan, manage, or complete tasks."
          }
        },
        ask: {
          title: "Ask A Question",
          field: "Your question",
          submit: "Send Question"
        },
        community: {
          titleUser: "My Questions",
          titleAdmin: "All User Questions",
          scopeUser: "Only you and admin accounts can see the questions in this list.",
          scopeAdmin: "Admin view: you can review questions from every signed-in user.",
          deleteSuccess: "The question has been deleted.",
          deleteError: "We couldn't delete that question.",
          empty: "No questions yet.",
          meta: "Asked by {{username}} on {{createdAt}}"
        }
      },
      dialog: {
        doneMessage: "Mark \"{{title}}\" as done?",
        deleteMessage: "Delete \"{{title}}\"?",
        deleteSyllabusHint: "This task was imported from a syllabus.",
        deleteSyllabusAction: "Delete all {{count}} syllabus tasks",
        allDoneMessage: "Mark all tasks for this day as done?",
        allDoneAction: "All done",
        addTaskTitle: "Add task",
        editTaskTitle: "Edit task",
        taskName: "Task name",
        endDateError: "End date must be the same as or later than begin date.",
        endTimeError: "End time must be equal to or later than start time.",
        repeatTitle: "Repeat options",
        editRepeat: "Edit",
        repeatEvery: "Repeat every",
        repeatIntervalValue: "Every {{value}} {{unit}}",
        onDays: "On days",
        onMonthDays: "On days of month",
        until: "Until",
        forever: "Forever",
        endDate: "End date",
        editSeriesTitle: "Update repeating task",
        editSeriesMessage: "Choose whether these changes should affect only this day or the entire repeating series.",
        editSeriesHint: "Repeat and begin-date changes apply when you update the entire series.",
        deleteSeriesTitle: "Delete repeating task",
        deleteSeriesMessage: "Choose whether to delete only this day or the entire repeating series.",
        deleteSeriesHint: "Deleting only this day hides that one occurrence and keeps the rest of the series available.",
        editingOccurrence: "Editing occurrence on {{date}}",
        editEntireSeries: "Editing repeating task",
        thisDayOnly: "This day only",
        entireSeries: "Entire series",
        repeatOptions: {
          none: "None (Once)",
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
          yearly: "Yearly"
        },
        repeatUnits: {
          daily: "day(s)",
          weekly: "week(s)",
          monthly: "month(s)",
          yearly: "year(s)"
        },
        highest: "{{value}} (Highest)",
        lowest: "{{value}} (Lowest)",
        weekdays: {
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          sunday: "Sunday"
        },
        mapProviders: {
          google: "Google Maps",
          apple: "Apple Maps",
          baidu: "Baidu Maps"
        }
      },
      stats: {
        title: "Analytics",
        subtitle: "Your task activity over the past 30 days",
        emptyTitle: "Not enough activity yet",
        emptySubtitle: "Complete more tasks and your 30-day statistics will appear here.",
        completed: "Completed",
        created: "Created",
        completionRate: "Completion Rate",
        overdue: "Overdue",
        outOf: "of {{total}} scheduled",
        tasksAdded: "tasks added",
        ofScheduledTasks: "of scheduled tasks",
        incompletePastDays: "incomplete on past days",
        currentPeriod: "Last 30 Days",
        previousPeriod: "Previous 30 Days",
        comparisonTitle: "Compared With Previous 30 Days",
        vsLabel: "vs",
        same: "Similar",
        better: "+{{value}} more",
        worse: "−{{value}} fewer",
        betterRate: "+{{value}}%",
        worseRate: "−{{value}}%",
        trendTitle: "30-Day Completion Trend",
        trendSubtitle: "Each bar shows tasks completed (green) vs remaining (gray) that day",
        legendCompleted: "Completed",
        legendRemaining: "Remaining",
        insightsTitle: "Behaviour Insights",
        insightMoreCompleted: "You completed {{percent}}% more tasks than the previous 30 days.",
        insightFewerCompleted: "You completed {{percent}}% fewer tasks than the previous 30 days.",
        insightOverdueDown: "Overdue tasks decreased compared with the previous period.",
        insightOverdueUp: "Overdue tasks increased compared with the previous period.",
        insightBacklogGrowing: "You created more tasks than you completed, so your task backlog may be growing.",
        insightBacklogShrinking: "You completed more tasks than you created — great progress on your backlog.",
        insightMostProductiveDay: "Your most productive day was {{day}}.",
        insightLeastProductiveDay: "Your least productive day was {{day}}.",
        detailsTitle: "Details",
        bestDay: "Most Productive Day",
        worstDay: "Least Productive Day",
        avgDaily: "Avg. Completed Per Day",
        tasksPerDay: "tasks/day",
        backlogChange: "Backlog Change",
        backlogGrowing: "+{{count}} (growing)",
        backlogShrinking: "−{{count}} (shrinking)",
        backlogNeutral: "Neutral",
        currentPeriodRange: "Current: {{start}} – {{end}}",
        previousPeriodRange: "Previous: {{start}} – {{end}}"
      },
      syllabus: {
        importButton: "Import Syllabus",
        step1Title: "Upload or Paste Syllabus",
        step2Title: "Tasks Found",
        pasteLabel: "Paste syllabus text",
        uploadLabel: "Upload PDF or CSV",
        analyze: "Analyze",
        analyzing: "Analyzing…",
        analyzeError: "Analysis failed. Please try again.",
        reviewHeader: "{{count}} tasks found — review and confirm.",
        noDraftsFound: "No tasks could be extracted from this syllabus.",
        confidenceLow: "Low confidence",
        editItem: "Edit",
        deleteItem: "Remove",
        restoreItem: "Restore",
        back: "Back",
        confirmImport_one: "Add {{count}} to Planner",
        confirmImport_other: "Add {{count}} to Planner",
        importing: "Importing…",
        importSuccess_one: "{{count}} task imported",
        importSuccess_other: "{{count}} tasks imported",
        confirmError: "Import failed. Please try again.",
        resumePrompt: "You have an unfinished import from your last session.",
        resume: "Resume",
        startFresh: "Start Fresh",
        consentTitle: "Review before sending to Claude",
        consentBody: "The following text will be sent to Claude for analysis:",
        consentConfirm: "Send to Claude",
        consentCancel: "Cancel",
        next: "Next",
        fileTypeError: "Unsupported file type. For Excel files, please export to CSV first.",
        methodTitle: "How would you like to import tasks?",
        methodManual: "Copy prompt to my AI",
        methodManualDesc: "Generate a prompt you paste into any AI. Nothing leaves your browser.",
        methodAuto: "Analyze with Claude",
        methodAutoDesc: "Your syllabus text is sent to Claude for analysis.",
        preferencesTitle: "Study Preferences",
        preferencesLabel: "Any hints for the AI? (optional)",
        preferencesPlaceholder: "e.g. remind me 3 days before each exam",
        preferencesHint: "These instructions are added to the AI prompt.",
        promptTitle: "Your AI Prompt",
        promptPrivacy: "Nothing is sent anywhere — paste this prompt into any AI you choose.",
        promptCopy: "Copy Prompt",
        promptCopied: "Copied!",
        promptNext: "I've pasted it — Next",
        pasteJsonTitle: "Paste AI Response",
        pasteJsonLabel: "Paste the JSON array from the AI",
        pasteJsonNext: "Import Tasks",
        pasteJsonError: "Could not parse the JSON — check the errors below."
      },
      onboarding: {
        title: "Quick tour",
        skip: "Skip",
        done: "Done",
        steps: {
          addTask: {
            title: "Add a task",
            text: "Tap here to create your first task for today."
          },
          taskList: {
            title: "Your tasks",
            text: "Your tasks appear here after you save."
          },
          languageSwitch: {
            title: "Switch language",
            text: "Change the app language between English and Chinese."
          },
          downloadApp: {
            title: "Download app",
            text: "Install TaskTide for quicker access from your home screen."
          },
          openWeek: {
            title: "Open Week view",
            text: "Tap Week to see and plan your tasks across the week."
          },
          openHelp: {
            title: "Open Help Center",
            text: "Tap Help to find guides, walkthroughs, and answers."
          },
          notificationToggle: {
            title: "Task notifications",
            text: "Turn task notifications on or off here. Availability depends on your browser."
          }
        }
      }
    }
  },
  zh: {
    translation: {
      app: {
        loading: "正在加载数据...",
        offlinePageUnavailable: "此页面在离线状态下无法访问，请联网后重试。"
      },
      common: {
        confirm: "确认",
        cancel: "取消",
        close: "关闭",
        delete: "删除",
        done: "完成",
        next: "下一步",
        undo: "撤销",
        save: "保存",
        add: "添加",
        edit: "编辑",
        moveToToday: "移到今天",
        moveOccurrenceToToday: "将本次移到今天",
        repeat: "重复",
        beginDate: "开始日期",
        endDate: "结束日期",
        date: "日期",
        weekday: "星期",
        emergency: "紧急程度",
        startTimeOptional: "开始时间（可选）",
        endTimeOptional: "结束时间（可选）",
        descriptionOptional: "描述（可选）",
        locationOptional: "地点（可选）",
        mapProvider: "地图提供商"
      },
      nav: {
        reminders: "提醒",
        today: "今天",
        week: "周视图",
        month: "月视图",
        stats: "统计",
        help: "帮助",
        mobileNavigation: "移动端导航",
        logout: "退出登录",
        switchLanguage: "切换语言",
        installApp: "安装应用",
        greeting: "你好，{{name}}！"
      },
      login: {
        title: {
          login: "欢迎回来",
          register: "创建账号"
        },
        fields: {
          username: "用户名",
          password: "密码"
        },
        actions: {
          login: "登录",
          register: "注册",
          waiting: "请稍候...",
          switchToLogin: "已有账号？去登录",
          switchToRegister: "还没有账号？去注册"
        },
        status: {
          registrationSuccess: "注册成功，请登录。"
        },
        errors: {
          usernameTaken: "用户名已被使用",
          invalidCredentials: "用户名或密码错误",
          requiredFields: "请输入用户名和密码",
          usernameTooShort: "用户名至少需要 3 个字符",
          passwordTooShort: "密码至少需要 8 个字符",
          failedToRegister: "注册失败",
          failedToLogin: "登录失败",
          generic: "发生了一些问题"
        }
      },
      notifications: {
        dailyReminderTitle: "每日提醒",
        dailyReminderBody: "别忘了今天的任务。",
        taskStartingSoonTitle: "任务即将开始：{{title}}",
        taskStartingSoonBody: "开始时间：{{time}}"
      },
      today: {
        allDay: "全天任务",
        scheduled: "日程安排",
        noTasks: "当日没有安排任务。",
        addTask: "添加任务",
        goToToday: "回到今天",
        importIcs: "导入 ICS",
        importIcsInput: "导入 ICS 文件",
        importSuccess: "已从 {{name}} 导入 {{count}} 个任务。",
        importSuccessWithSkipped: "已从 {{name}} 导入 {{count}} 个任务，并跳过 {{skipped}} 个暂不支持的条目。",
        importEmpty: "{{name}} 中没有可导入的事件。",
        importError: "无法导入 {{name}}。",
        markAllDone: "全部完成",
        activeCount: "进行中 {{count}}",
        completedCount: "已完成 {{count}}",
        productivityTitle: "效率统计",
        productivityPitch: "先快速看一下最近的完成节奏。最近 7 天完成 {{completed}} / {{total}}（{{percent}}%）。",
        productivityToday: "所选日期",
        productivityLast7Days: "最近 7 天",
        productivityLast30Days: "最近 30 天",
        viewProductivityDetails: "查看统计与图表",
        hideProductivityDetails: "收起统计与图表",
        statsValue: "完成 {{completed}} / {{total}}（{{percent}}%）",
        productivityTrendTitle: "近 7 天完成趋势",
        productivityTrendHint: "柱形高度表示当天任务量，绿色表示已完成，灰色表示仍未完成。",
        productivityLegendCompleted: "已完成",
        productivityLegendRemaining: "未完成",
        taskMeta: "{{type}} • 优先级 {{priority}}",
        locationLabel: "地点：{{location}}",
        modify: "修改",
        toToday: "移到今天",
        toTomorrow: "移到明天",
        map: "地图",
        previousDay: "前一天",
        nextDay: "后一天",
        exportIcs: "导出 ICS",
        exportDialogTitle: "导出到日历",
        exportFilterLabel: "包含",
        exportAll: "所有任务",
        exportIncomplete: "仅未完成任务",
        exportDateRange: "指定日期范围内的任务",
        exportStartDate: "开始日期",
        exportEndDate: "结束日期",
        exportDownload: "下载 .ics",
        exportDateRangeError: "开始日期不能晚于结束日期。",
        taskTypes: {
          once: "一次",
          daily: "每天",
          weekly: "每周",
          monthly: "每月",
          yearly: "每年"
        }
      },
      week: {
        title: "周视图",
        listView: "列表视图",
        timeGridView: "时间网格",
        todayButton: "今天",
        mobileCreateHint: "在手机上可直接在时间网格中长按一段时间范围，在该时段创建任务，也支持跨到下一天的范围。"
      },
      month: {
        jumpToCurrentMonth: "跳到当前月份",
        moreTasks: "+{{count}} 个更多",
        mobileSwipeHint: "上下滑动切换月份",
        mobileGestureDescription: "向上滑到上个月，向下滑到下个月。",
        desktopHint: "桌面端使用箭头切换",
        scanHint: "按天查看任务密度",
        weekdays: {
          sun: "日",
          mon: "一",
          tue: "二",
          wed: "三",
          thu: "四",
          fri: "五",
          sat: "六"
        }
      },
      reminder: {
        title: "进行中的提醒",
        addReminder: "添加提醒",
        empty: "目前没有进行中的提醒！",
        priority: "优先级：{{value}}",
        modify: "修改",
        createTitle: "创建提醒",
        editTitle: "编辑提醒",
        reminderTitle: "标题",
        notesOptional: "备注（可选）",
        emergencyField: "紧急程度（1=最高，5=最低）"
      },
      toast: {
        taskCreated: "任务已创建",
        taskUpdated: "任务已更新",
        taskDeleted: "任务已删除",
        taskDone: "任务已完成",
        allTasksDone: "所有任务已完成",
        reminderCreated: "提醒已创建",
        reminderUpdated: "提醒已更新",
        syllabusDeleted: "所有课程任务已删除",
        syllabusDeleteFailed: "课程任务删除失败"
      },
      release: {
        toolbar: "更新",
        dialogTitle: "最新更新",
        historyTitle: "更新历史",
        viewHistory: "查看历史",
        latestBadge: "最新",
        releasedOn: "发布时间 {{date}}",
        sections: {
          features: "新功能",
          improvements: "改进",
          fixes: "问题修复"
        }
      },
      help: {
        title: "帮助中心",
        subtitleUser: "了解如何使用这个计划工具、查看常见问答，并把问题提交到管理员审核列表。",
        subtitleAdmin: "了解如何使用这个计划工具、查看常见问答，并查看所有用户提交的问题。",
        previous: "上一步",
        walkthroughStep: "步骤 {{current}} / {{total}}",
        submitSuccess: "你的问题已保存。",
        submitError: "问题发布失败，草稿会保留在输入框中。",
        walkthroughs: {
          title: "快捷演示",
          open: "打开",
          mediaPlaceholderTitle: "GIF 占位区域",
          mediaPlaceholderBody: "把你的演示 GIF 放到这个路径后，就会替换当前占位区域。",
          addTaskBrowser: {
            question: "在桌面端从 Today 添加任务",
            title: "how to add task in todaypage in browser.gif",
            text: "这个 GIF 会演示在桌面浏览器中打开 Today、点击 Add Task，并保存新任务。"
          },
          quickAddWeekBrowser: {
            question: "在桌面端的 Week 快速添加任务",
            title: "how to quickly add task in weekpage browser.gif",
            text: "这个 GIF 会演示在桌面浏览器的 Week 页面快速选择时间并创建任务。"
          },
          addTaskWeekMobile: {
            question: "在手机端的 Week 添加任务",
            title: "how to add task in weekpage in mobile.gif",
            text: "这个 GIF 会演示在手机端的 Week 页面按住时间格并添加任务。"
          },
          taskMap: {
            question: "从任务中打开地图",
            title: "how to enable map function for each task(both mobile and desktop browser).gif",
            text: "这个 GIF 会演示在手机端或桌面端从任务里打开地图链接。"
          },
          openWebAppPc: {
            question: "在桌面端把计划器作为网页应用打开",
            title: "how to open a web app in pc.gif",
            text: "这个 GIF 会演示在桌面端安装或打开计划器网页应用。"
          },
          resetNotificationsPc: {
            question: "开启或重置 Task Notifications",
            title: "how to reset:enable notification in pc.gif",
            text: "这个 GIF 会演示从 Help 开启 Task Notifications，或修复浏览器通知设置。"
          },
          exportIcs: {
            question: "将任务导出为日历文件（.ics）",
            title: "how to export tasks as ics calendar file.gif",
            text: "这个 GIF 会演示在 Today 点击导出 ICS、选择筛选条件，以及下载 .ics 文件并在日历应用中打开的完整流程。"
          },
          syllabusManual: {
            question: "使用自己的 AI 导入课程大纲",
            title: "how to import syllabus manually.gif",
            text: "1. 点击侧边栏中的「导入课程大纲」。\n2. 粘贴大纲文本或上传 PDF/CSV 文件，然后点击「下一步」。\n3. 选择「复制提示词到我的 AI」。\n4. 可选：填写学习偏好（例如「考试前 3 天提醒我」）。\n5. 点击「下一步」查看生成的提示词，用「复制提示词」按钮复制。\n6. 将提示词粘贴到任意 AI（ChatGPT、Claude 等）并复制它返回的 JSON。\n7. 将 JSON 粘贴回向导，点击「导入任务」。\n8. 检查提取的任务，编辑或删除不需要的，然后点击确认导入到计划中。"
          }
        },
        taskNotifications: {
          title: "Task Notifications",
          body: "如果希望这个浏览器或已安装应用接收 task alerts、task start reminders 和 daily task check-ins，请开启 Task Notifications。",
          enable: "Enable Task Notifications",
          disable: "Disable Task Notifications",
          dialogTitle: "开启 Task Notifications？",
          explanation: "Enable notifications to receive task alerts, upcoming task start reminders, and daily task check-ins.",
          confirmEnable: "Enable Task Notifications",
          enabled: "这个浏览器或设备已开启 Task Notifications。",
          disabled: "这个浏览器或设备已关闭 Task Notifications。",
          denied: "Task Notifications 已被阻止。请从浏览器或网站通知设置中重新开启，然后再试一次。",
          unsupported: "这个浏览器不支持通过网页推送使用 Task Notifications。",
          enableError: "无法开启 Task Notifications。请检查浏览器通知设置后再试一次。",
          disableError: "无法为这个浏览器或设备关闭 Task Notifications。"
        },
        guides: {
          title: "网站使用说明",
          step0: "TaskTide 用来从开始到完成规划一周的工作。先创建清晰账号，再添加要做的事，按日期或时间安排，然后随着一周推进把事项标记为完成。",
          step1: "如果要规划今天，就从 Today 开始。添加任务，有 ICS 文件时可以导入日历事件，并把列表当作当天的执行计划。每次创建、编辑、完成或删除操作后，屏幕底部都会显示简短的确认提示。",
          step2: "需要整理整周安排时，打开 Week。把任务放进时间段，比较哪些天更忙，并在开始前调整计划。",
          step3: "想查看更大范围、选择未来日期，或进入某一天的 Today 时，使用 Month。",
          step4: "Reminders 适合记录不绑定具体时间段、但需要一直容易找到直到完成的事项。",
          step5Desktop: "桌面端可以用左侧边栏切换 Reminders、Today、Week、Month、Stats、Help，并打开安装指引。",
          step5Mobile: "手机端可以用底部导航切换主要页面（包括查看 30 天效率概览的 Stats 页），也可以用顶部安装按钮学习如何把 TaskTide 加到设备上。",
          step6Desktop: "如果希望 TaskTide 像应用一样打开，请选择“安装应用”，然后按浏览器演示操作。如果希望收到 task alerts、task start reminders 和 daily task check-ins，请打开 Help 并选择 Enable Task Notifications。",
          step6Mobile: "如果希望 TaskTide 出现在主屏幕，请选择“安装应用”，然后按手机浏览器步骤操作。之后如果希望收到 task alerts、task start reminders 和 daily task check-ins，请打开 Help 并选择 Enable Task Notifications。",
          step7Desktop: "如果连接中断，可以继续正常编辑任务。TaskTide 会合并重复的离线修改，并在服务器恢复后同步。Week、Month、Help 和 Updates 等较重区域会在打开时加载，让首次进入更快。使用 Updates 查看最近变化，需要重新理解完整流程时可以回到 Help。",
          step7Mobile: "如果连接中断，可以继续正常编辑任务。TaskTide 会合并重复的离线修改，并在服务器恢复后同步。Week、Month、Help 和 Updates 等较重区域会在打开时加载，让首次进入更快。使用 Updates 查看最近变化，需要重新理解完整流程时可以回到 Help。"
        },
        faq: {
          title: "常见问答",
          q1: {
            question: "任务的重复设置怎么用？",
            answer: "先选开始日期，再选择重复方式。你可以设为一次、每天、每周、每月或每年。"
          },
          q2: {
            question: "提醒和任务有什么不同？",
            answer: "任务按日期安排。提醒更像会一直显示的简短备忘。"
          },
          q3: {
            question: "为什么结束时间必须有效？",
            answer: "如果设置结束时间，它必须和开始时间一样晚或更晚。"
          },
          q4: {
            question: "谁可以看到提交的问题？",
            answer: "普通用户只会看到自己的问题。管理员可以看到所有问题，也可以删除问题。"
          },
          q5: {
            question: "Week 页面中的点击行为是什么？",
            answer: "你可以从 Week 跳到某一天，也可以直接选时间来创建任务。手机端可以长按时间范围来添加任务。"
          },
          q6: {
            question: "移动设备上的布局会怎样变化？",
            answer: "手机端会使用底部导航、触控更方便的 Week 视图，以及全屏表单。"
          },
          q7: {
            question: "如果保存请求失败会怎样？",
            answer: "离线时，任务修改会继续显示，并在应用恢复连接后同步。如果帮助问题发送失败，草稿会保留下来。"
          },
          q8: {
            question: "我可以在登录前切换语言吗？",
            answer: "可以。使用登录页上的 EN / 中文 按钮，就能在登录或注册前先切换认证界面的语言。"
          },
          q9: {
            question: "修改重复任务的一天时会发生什么？",
            answer: "应用会问你是只改这一天，还是改整个重复系列。"
          },
          q10: {
            question: "浏览器 Task Notifications 会一直占用越来越多的存储吗？",
            answer: "不会。旧的通知记录会自动清理。"
          },
          q12: {
            question: "怎样才能在手机和电脑上都收到 Task Notifications？",
            answer: "桌面端：\n1. 打开 Help。\n2. 选择 Enable Task Notifications。\n3. 确认说明后，如果浏览器询问，请允许通知。\n\nIPhone 或 iPad：\n1. 先把 TaskTide 加入主屏幕。\n2. 从主屏幕打开 TaskTide。\n3. 打开 Help 并选择 Enable Task Notifications。\n4. 如果需要，到 设置 > 通知 > TaskTide 检查。\n5. 确认通知已开启。\n\nAndroid：\n1. 如果浏览器支持，先安装 TaskTide。\n2. 打开 TaskTide。\n3. 打开 Help 并选择 Enable Task Notifications。\n4. 如果需要，到 设置 > 应用 > TaskTide 或你的浏览器 > 通知 检查。\n5. 确认通知已开启。\n\n完成后，即使 TaskTide 关闭，也能收到 task alerts、task start reminders 和 daily task check-ins。"
          },
          q13: {
            question: "怎么安装移动端网页应用？",
            answer: "IPhone 或 iPad：\n1. 用 Safari 打开 TaskTide。\n2. 点分享。\n3. 点“添加到主屏幕”。\n4. 确认 TaskTide 应用名称。\n5. 从主屏幕打开 TaskTide。\n\nAndroid：\n1. 用 Chrome、Edge 或其他支持的浏览器打开 TaskTide。\n2. 打开浏览器菜单。\n3. 点“安装应用”或“添加到主屏幕”。\n4. 确认 TaskTide。\n5. 从主屏幕或应用列表打开 TaskTide。"
          },
          q14: {
            question: "不同浏览器安装后的移动网页应用效果一样吗？",
            answer: "不完全一样。\n\nIPhone 和 iPad：\n- Safari 的支持最好。\n\nAndroid：\n- Chrome 和 Edge 通常最完整。\n- 其他浏览器会因设备和版本不同而有差异。\n\n如果没有看到安装或通知选项，iPhone/iPad 请优先试 Safari，Android 请优先试 Chrome 或 Edge。"
          },
          q15: {
            question: "这个浏览器里的登录状态会怎样保持？",
            answer: "计划器会用更安全的浏览器会话 Cookie 保持登录。在托管网页版中，即使应用和 API 使用不同的网址，登录后也应该继续停留在计划器内。一般情况下，除非你主动退出或会话过期，否则会继续保持登录。"
          },
          q16: {
            question: "安装后的网页应用可以离线使用任务吗？",
            answer: "可以，但需要先在线登录一次。安装 TaskTide，并在线打开一次让任务完成缓存后，你可以在离线时重新打开缓存任务、添加任务、编辑任务、完成任务和删除任务。应用重新连接服务器后会同步这些任务修改。"
          },
          q17: {
            question: "如何重新开始或跳过应用引导？",
            answer: "引导只在新用户首次使用时出现。如需中途跳过，点击引导提示中的「跳过」即可，同一浏览器上将不再显示。其中打开「周视图」和「帮助中心」这两步需要你点击真实按钮才能继续，目的是帮你亲自发现每个功能区域。"
          },
          q11: {
            question: "ICS 导入功能支持什么？",
            answer: "你可以在 Today 导入 ICS，把日历事件变成任务。支持标题、备注、地点、定时事件、跨天事件和常见重复规则。"
          },
          q18: {
            question: "如何把任务导出到日历应用？",
            answer: "在 Today 点击「导出 ICS」，选择导出所有任务、仅未完成任务或指定日期范围内的任务，然后点击「下载 .ics」。用 Apple 日历、Google 日历、Outlook 或任何支持 ICS 格式的应用打开下载的文件即可。"
          },
          q19: {
            question: "统计页面（Stats）显示什么？",
            answer: "Stats 页面展示你过去 30 天的任务活动情况，包括已完成、已创建和逾期的任务数量，以及整体完成率，并与前 30 天进行对比。页面还包含每日趋势柱状图、行为洞察，以及一周中效率最高和最低的日期。"
          },
          q20: {
            question: "课程大纲导入功能是如何工作的？",
            answer: "点击侧边栏中的「导入课程大纲」，粘贴大纲文本或上传 PDF 或 CSV 文件，然后点击「下一步」。选择生成方式：「复制提示词到我的 AI」会生成一段提示词，您可以粘贴到任何 AI 中——数据不会离开您的浏览器；「用 Claude 自动分析」则会将您的文本发送给 Claude，发送前会显示确认界面。AI 返回 JSON 列表后，将其粘贴回向导，系统会逐项校验并在出现问题时给出具体错误提示。核查每条任务草稿，编辑或删除不需要的，然后点击导入加入计划中。如中途关闭浏览器，向导会保存进度 24 小时，重新打开即可继续。"
          },
          q21: {
            question: "在哪里查看最近更新？",
            answer: "打开 Updates 可以阅读 TaskTide 最近的变化。Help Center 也会随着新流程更新，所以当新功能改变规划、管理或完成任务的方式时，可以回到这里重新查看说明。"
          }
        },
        ask: {
          title: "提交问题",
          field: "你的问题",
          submit: "发送问题"
        },
        community: {
          titleUser: "我的问题",
          titleAdmin: "所有用户问题",
          scopeUser: "这个列表中的问题只有你和管理员账号可以看到。",
          scopeAdmin: "管理员视图：你可以查看所有已登录用户提交的问题。",
          deleteSuccess: "该问题已删除。",
          deleteError: "无法删除该问题。",
          empty: "还没有问题。",
          meta: "{{username}} 提问于 {{createdAt}}"
        }
      },
      dialog: {
        doneMessage: "将“{{title}}”标记为完成？",
        deleteMessage: "删除“{{title}}”？",
        deleteSyllabusHint: "此任务由课程大纲批量导入。",
        deleteSyllabusAction: "删除全部 {{count}} 个课程任务",
        allDoneMessage: "将这一天的所有任务标记为完成？",
        allDoneAction: "全部完成",
        addTaskTitle: "添加任务",
        editTaskTitle: "编辑任务",
        taskName: "任务名称",
        endDateError: "结束日期必须等于或晚于开始日期。",
        endTimeError: "结束时间必须等于或晚于开始时间。",
        repeatTitle: "重复设置",
        editRepeat: "编辑",
        repeatEvery: "重复间隔",
        repeatIntervalValue: "每 {{value}} 个{{unit}}",
        onDays: "在这些星期",
        onMonthDays: "在每月这些日期",
        until: "结束方式",
        forever: "一直重复",
        endDate: "结束日期",
        editSeriesTitle: "更新重复任务",
        editSeriesMessage: "请选择这些修改是只影响这一天，还是影响整个重复系列。",
        editSeriesHint: "重复方式和开始日期的修改会在你选择整个系列时生效。",
        deleteSeriesTitle: "删除重复任务",
        deleteSeriesMessage: "请选择只删除这一天，还是删除整个重复系列。",
        deleteSeriesHint: "如果只删除这一天，系统会隐藏这一次出现，其他重复日期会保留。",
        editingOccurrence: "正在编辑 {{date}} 这一天",
        editEntireSeries: "正在编辑重复任务",
        thisDayOnly: "只改这一天",
        entireSeries: "整个系列",
        repeatOptions: {
          none: "不重复（一次）",
          daily: "每天",
          weekly: "每周",
          monthly: "每月",
          yearly: "每年"
        },
        repeatUnits: {
          daily: "天",
          weekly: "周",
          monthly: "个月",
          yearly: "年"
        },
        highest: "{{value}}（最高）",
        lowest: "{{value}}（最低）",
        weekdays: {
          monday: "星期一",
          tuesday: "星期二",
          wednesday: "星期三",
          thursday: "星期四",
          friday: "星期五",
          saturday: "星期六",
          sunday: "星期日"
        },
        mapProviders: {
          google: "谷歌地图",
          apple: "苹果地图",
          baidu: "百度地图"
        }
      },
      stats: {
        title: "数据分析",
        subtitle: "过去 30 天的任务活动情况",
        emptyTitle: "暂无足够数据",
        emptySubtitle: "完成更多任务后，你的 30 天统计数据将显示在这里。",
        completed: "已完成",
        created: "已创建",
        completionRate: "完成率",
        overdue: "逾期",
        outOf: "共 {{total}} 个任务",
        tasksAdded: "个任务已添加",
        ofScheduledTasks: "已安排任务",
        incompletePastDays: "过去天数未完成",
        currentPeriod: "最近 30 天",
        previousPeriod: "前 30 天",
        comparisonTitle: "与前 30 天对比",
        vsLabel: "对比",
        same: "相近",
        better: "+{{value}} 个",
        worse: "−{{value}} 个",
        betterRate: "+{{value}}%",
        worseRate: "−{{value}}%",
        trendTitle: "30 天完成趋势",
        trendSubtitle: "每条柱表示当天已完成（绿色）与未完成（灰色）任务",
        legendCompleted: "已完成",
        legendRemaining: "未完成",
        insightsTitle: "行为洞察",
        insightMoreCompleted: "你比前 30 天多完成了 {{percent}}% 的任务。",
        insightFewerCompleted: "你比前 30 天少完成了 {{percent}}% 的任务。",
        insightOverdueDown: "与上一周期相比，逾期任务有所减少。",
        insightOverdueUp: "与上一周期相比，逾期任务有所增加。",
        insightBacklogGrowing: "你创建的任务多于完成的任务，任务积压可能在增加。",
        insightBacklogShrinking: "你完成的任务多于创建的任务，积压在减少，保持下去！",
        insightMostProductiveDay: "你效率最高的一天是{{day}}。",
        insightLeastProductiveDay: "你效率最低的一天是{{day}}。",
        detailsTitle: "详情",
        bestDay: "效率最高的一天",
        worstDay: "效率最低的一天",
        avgDaily: "日均完成任务数",
        tasksPerDay: "个/天",
        backlogChange: "积压变化",
        backlogGrowing: "+{{count}}（在增加）",
        backlogShrinking: "−{{count}}（在减少）",
        backlogNeutral: "基本持平",
        currentPeriodRange: "当前：{{start}} – {{end}}",
        previousPeriodRange: "前期：{{start}} – {{end}}"
      },
      syllabus: {
        importButton: "导入课程大纲",
        step1Title: "上传或粘贴课程大纲",
        step2Title: "找到的任务",
        pasteLabel: "粘贴课程大纲文本",
        uploadLabel: "上传 PDF 或 CSV",
        analyze: "分析",
        analyzing: "正在分析…",
        analyzeError: "分析失败，请重试。",
        reviewHeader: "找到 {{count}} 个任务 — 核对后确认。",
        noDraftsFound: "未能从该大纲中提取到任何任务。",
        confidenceLow: "置信度低",
        editItem: "编辑",
        deleteItem: "删除",
        restoreItem: "恢复",
        back: "返回",
        confirmImport_one: "加入计划 ({{count}})",
        confirmImport_other: "加入计划 ({{count}})",
        importing: "正在导入…",
        importSuccess_one: "已导入 {{count}} 个任务",
        importSuccess_other: "已导入 {{count}} 个任务",
        confirmError: "导入失败，请重试。",
        resumePrompt: "您有一个上次未完成的导入任务。",
        resume: "继续",
        startFresh: "重新开始",
        consentTitle: "发送前请确认内容",
        consentBody: "以下文本将发送给 Claude 进行分析：",
        consentConfirm: "发送给 Claude",
        consentCancel: "取消",
        next: "下一步",
        fileTypeError: "不支持该文件格式。如需导入 Excel 文件，请先导出为 CSV。",
        methodTitle: "请选择导入方式",
        methodManual: "复制提示词到我的 AI",
        methodManualDesc: "生成一段提示词，粘贴到任意 AI。数据不会离开您的浏览器。",
        methodAuto: "用 Claude 自动分析",
        methodAutoDesc: "课程大纲文本将发送给 Claude 进行分析。",
        preferencesTitle: "学习偏好",
        preferencesLabel: "对 AI 有什么特别说明？（选填）",
        preferencesPlaceholder: "例如：考试前 3 天提醒我",
        preferencesHint: "这些说明会附加到 AI 提示词中。",
        promptTitle: "您的 AI 提示词",
        promptPrivacy: "数据不会发送到任何地方——请将此提示词粘贴到您选择的任意 AI 中。",
        promptCopy: "复制提示词",
        promptCopied: "已复制！",
        promptNext: "已粘贴 — 下一步",
        pasteJsonTitle: "粘贴 AI 回复",
        pasteJsonLabel: "将 AI 返回的 JSON 数组粘贴到此处",
        pasteJsonNext: "导入任务",
        pasteJsonError: "无法解析 JSON — 请检查以下错误。"
      },
      onboarding: {
        title: "快速引导",
        skip: "跳过",
        done: "完成",
        steps: {
          addTask: {
            title: "添加任务",
            text: "点这里创建今天的第一个任务。"
          },
          taskList: {
            title: "你的任务",
            text: "保存后，任务会显示在这里。"
          },
          languageSwitch: {
            title: "切换语言",
            text: "在这里切换英文和中文。"
          },
          downloadApp: {
            title: "下载应用",
            text: "将 TaskTide 安装到主屏幕，访问更便捷。"
          },
          openWeek: {
            title: "打开周视图",
            text: "点击「周视图」查看和安排一周的任务。"
          },
          openHelp: {
            title: "打开帮助中心",
            text: "点击「帮助」查看演示、向导和常见问题。"
          },
          notificationToggle: {
            title: "任务通知",
            text: "在这里开启或关闭任务通知。是否可用取决于你的浏览器。"
          }
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
