# Account Switch Reload — Design Spec

**Date:** 2026-05-08
**Status:** Approved

## Problem

After a successful account switch, `onLoginSuccess()` calls `setIsAuthenticated(true)` in `App.tsx`. Because `isAuthenticated` is already `true`, React sees no state change, the `useEffect([isAuthenticated])` that loads tasks/reminders/avatar never re-fires, and the app stays showing the previous user's data (or gets stuck in a loading state).

## Fix

In `frontend/src/pages/SettingsPage.tsx`, inside `handleSwitchAccount`, replace:

```ts
setAuth(data.username, data.role);
setSwitchOpen(false);
onLoginSuccess();
```

With:

```ts
setAuth(data.username, data.role);
window.location.reload();
```

`setAuth` persists the new username/role to localStorage before the reload so the UI has the correct display name immediately. The reload reinitializes the full app against the new session cookie — tasks, reminders, and avatar all load fresh for the new user.

## Scope

- **File changed:** `frontend/src/pages/SettingsPage.tsx` (3 lines → 2 lines in `handleSwitchAccount`)
- **No backend changes**
- **No other frontend files change**
- The `onLoginSuccess` prop on `SettingsPage` is preserved — it remains part of the component contract

## Tests

Update `SettingsPage.behavior.test.tsx` — the existing test `"clicking a saved account chip calls /account-switch and reloads session"` currently asserts `onLoginSuccess` is called. Update it to assert `window.location.reload` is called instead.
