# Account Switch Reload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the account switch so the app fully reloads after a successful switch, loading tasks and reminders for the new user.

**Architecture:** Replace the `onLoginSuccess()` call (which no-ops when `isAuthenticated` is already `true`) with `window.location.reload()`. The `setAuth` call before it persists the new username/role to localStorage so the UI is correct immediately after reload.

**Tech Stack:** React, TypeScript, Vitest

---

### Task 1: Update the test to expect `window.location.reload`

**Files:**
- Modify: `frontend/src/pages/SettingsPage.behavior.test.tsx:152-173`

- [ ] **Step 1: Stub `window.location.reload` in the test**

Replace the test `"clicking a saved account chip calls /account-switch and reloads session"` (line 152) with this version:

```ts
it("clicking a saved account chip calls /account-switch and reloads session", async () => {
  const user = userEvent.setup();
  storageMocks.getSavedAccounts.mockReturnValue([{ username: "casey", switchToken: "tok-abc" }]);
  storageMocks.getSwitchToken.mockReturnValue("tok-abc");
  const reloadMock = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload: reloadMock });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ username: "casey", role: "USER" }) });
  vi.stubGlobal("fetch", fetchMock);

  renderSettingsPage();
  await user.click(screen.getByRole("button", { name: "Switch Account" }));
  await user.click(screen.getByRole("button", { name: "casey" }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/account-switch"),
      expect.objectContaining({ body: JSON.stringify({ username: "casey", switchToken: "tok-abc" }) })
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd frontend && npm run test:run -- --reporter=verbose SettingsPage.behavior
```

Expected: FAIL — `reloadMock` not called (code still calls `onLoginSuccess`)

- [ ] **Step 3: Commit the failing test**

```bash
git add frontend/src/pages/SettingsPage.behavior.test.tsx
git commit -m "test: expect window.location.reload after account switch"
```

---

### Task 2: Fix `handleSwitchAccount` to call `window.location.reload()`

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx:232-234`

- [ ] **Step 1: Apply the fix**

In `handleSwitchAccount`, replace lines 232–234:

```ts
// Before
setAuth(data.username, data.role);
setSwitchOpen(false);
onLoginSuccess();
```

With:

```ts
setAuth(data.username, data.role);
window.location.reload();
```

- [ ] **Step 2: Run tests to confirm they pass**

```bash
cd frontend && npm run test:run -- --reporter=verbose SettingsPage.behavior
```

Expected: all tests PASS

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/ftj_tom/Desktop/Personal\ Project/todo/weekly-todo && npm test 2>&1 | tail -20
```

Expected: no new failures

- [ ] **Step 4: Bump version and update required project files**

Bump version from `2.11.0` → `2.11.1` (patch — bug fix) in `frontend/package.json`.

Update `RELEASENOTES.md`:

```markdown
## Version 2.11.1 – Update Released (2026-05-08)

### Fixes
- Fixed: After switching to a saved account, the app now fully reloads so your tasks, reminders, and avatar load correctly for the new account.
```

Prepend to `RELEASE_NOTES` array in `frontend/src/app/releaseNotes.ts`:

```ts
{
  id: "2026-05-08-account-switch-reload",
  version: "v2.11.1",
  releasedAt: "2026-05-08",
  title: { en: "Account Switch Fix", zh: "账号切换修复" },
  summary: {
    en: "Switching to a saved account now fully reloads the app for the new user.",
    zh: "切换到已保存的账号后，应用现在会为新用户完整重新加载。",
  },
  changes: {
    en: ["Fixed: After switching accounts, tasks and reminders now load correctly for the new account."],
    zh: ["修复：切换账号后，任务和提醒现在会为新账号正确加载。"],
  },
},
```

Update `DEVLOG.md` with a brief entry about the fix.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SettingsPage.tsx frontend/package.json RELEASENOTES.md frontend/src/app/releaseNotes.ts DEVLOG.md
git commit -m "fix: reload page after account switch so tasks load for new user (v2.11.1)"
```
