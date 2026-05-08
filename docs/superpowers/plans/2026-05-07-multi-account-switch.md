# Multi-Account Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace password-on-every-switch with one-click account switching backed by 30-day switch tokens, while allowing new accounts to be added inline without logging out.

**Architecture:** `/login` returns a `switchToken` JWT (30-day). A new `/account-switch` endpoint validates that token and issues a session cookie. A new `/account-token` endpoint authenticates and returns only a switch token (no cookie change) for the inline Add Account form. `savedAccounts` in localStorage changes from `string[]` to `{ username, switchToken }[]`.

**Tech Stack:** Node.js/Express, jsonwebtoken, React 18, TypeScript, MUI v7, Vitest, Node test runner

---

## File Map

| File | Change |
|---|---|
| `backend/server.js` | Add `SWITCH_TOKEN_EXPIRY_SECONDS`, update `/login` response, add `POST /account-switch`, add `POST /account-token` |
| `backend/tests/server.behavior.test.js` | Add tests for new endpoints and updated `/login` |
| `frontend/src/app/storage.ts` | New `SavedAccount` type, updated `getSavedAccounts`/`addSavedAccount`/`removeSavedAccount`, new `getSwitchToken`, migration |
| `frontend/src/app/storage.behavior.test.ts` | Full rewrite for new shape + migration |
| `frontend/src/i18n.ts` | Add `sessionExpired`, `addAnotherAccount`, `addAndStay`, `addFailed`; update `noSavedAccounts`, `switchAccounts.text` |
| `frontend/src/pages/LoginPage.tsx` | Pass `data.switchToken` to `addSavedAccount` |
| `frontend/src/pages/SettingsPage.tsx` | Redesign switch dialog: one-click chips, inline add form, remove password state |
| `frontend/src/pages/SettingsPage.behavior.test.tsx` | Add tests for one-click switch, expired token, inline add-account |
| `frontend/package.json` + `backend/package.json` | Bump version to `2.11.0` |
| `RELEASENOTES.md` | Add v2.11.0 entry |
| `frontend/src/app/releaseNotes.ts` | Prepend v2.11.0 release note |
| `frontend/src/app/helpCenter.ts` | Update switch accounts walkthrough |
| `README.md` | Note multi-account feature |
| `DEVLOG.md` | Record implementation details |

---

## Task 1: Add switch token constant and update `/login` to return `switchToken`

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Add the `SWITCH_TOKEN_EXPIRY_SECONDS` constant after `SESSION_COOKIE_MAX_AGE_MS`**

Open `backend/server.js`. After line:
```js
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
```
Add:
```js
const SWITCH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
```

- [ ] **Step 2: Update the `/login` handler to generate and return `switchToken`**

Find the existing `/login` handler (around line 479). The final `res.status(200).json(...)` line currently reads:
```js
res.status(200).json({ username: user.username, role: sessionUser.role });
```
Replace the two lines that build the token and send the response:
```js
const token = jwt.sign(sessionUser, process.env.JWT_SECRET, { expiresIn: '7d' });
setSessionCookie(req, res, token);
res.status(200).json({ username: user.username, role: sessionUser.role });
```
With:
```js
const token = jwt.sign(sessionUser, process.env.JWT_SECRET, { expiresIn: '7d' });
const switchToken = jwt.sign(
  { userId: String(user._id), username: user.username, role, type: 'switch' },
  process.env.JWT_SECRET,
  { expiresIn: SWITCH_TOKEN_EXPIRY_SECONDS }
);
setSessionCookie(req, res, token);
res.status(200).json({ username: user.username, role: sessionUser.role, switchToken });
```

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat(backend): return switchToken from /login"
```

---

## Task 2: Add `POST /account-switch` and `POST /account-token` endpoints

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Add `POST /account-switch` after the `/login` route**

After the closing `});` of the `/login` handler, add:

```js
// INPUT: username plus a previously-issued switch token
// OUTPUT: new session cookie for the target account
// EFFECT: Switches the active browser session without requiring a password
app.post('/account-switch', async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const switchToken = String(req.body?.switchToken ?? '').trim();

  if (!username || !switchToken) {
    return res.status(400).json({ error: 'Username and switchToken are required' });
  }

  let payload;
  try {
    payload = jwt.verify(switchToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Switch token invalid or expired' });
  }

  if (payload.type !== 'switch' || String(payload.username ?? '').toLowerCase() !== username.toLowerCase()) {
    return res.status(401).json({ error: 'Switch token invalid or expired' });
  }

  try {
    const user = await User.findOne(buildUsernameLookup(username));
    if (!user) return res.status(401).json({ error: 'Switch token invalid or expired' });

    const role = await persistResolvedUserRole(user);
    const sessionUser = toSessionUser({ userId: user._id, username: user.username, role });
    const token = jwt.sign(sessionUser, process.env.JWT_SECRET, { expiresIn: '7d' });

    setSessionCookie(req, res, token);
    res.status(200).json({ username: user.username, role: sessionUser.role });
  } catch {
    res.status(500).json({ error: 'Failed to switch account' });
  }
});
```

- [ ] **Step 2: Add `POST /account-token` after `/account-switch`**

```js
// INPUT: username and password
// OUTPUT: switch token for the target account (no session cookie change)
// EFFECT: Authenticates a secondary account so it can be saved for later one-click switching
app.post('/account-token', async (req, res) => {
  try {
    const validatedPayload = validateLoginPayload(req.body?.username, req.body?.password);
    if (validatedPayload.error) {
      return res.status(400).json({ error: validatedPayload.error });
    }

    const user = await User.findOne(buildUsernameLookup(validatedPayload.username));
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(validatedPayload.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const role = await persistResolvedUserRole(user);
    const switchToken = jwt.sign(
      { userId: String(user._id), username: user.username, role, type: 'switch' },
      process.env.JWT_SECRET,
      { expiresIn: SWITCH_TOKEN_EXPIRY_SECONDS }
    );

    res.status(200).json({ username: user.username, switchToken });
  } catch {
    res.status(500).json({ error: 'Failed to generate account token' });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat(backend): add /account-switch and /account-token endpoints"
```

---

## Task 3: Backend tests for new endpoints

**Files:**
- Modify: `backend/tests/server.behavior.test.js`

- [ ] **Step 1: Add test — `/login` now includes `switchToken` in response**

After the existing `'behavior: login sets a session cookie for valid credentials'` test, add:

```js
test('behavior: login response includes a switchToken for the account switcher', async () => {
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed', role: 'USER' });
  User.updateOne = async () => ({ matchedCount: 0 });
  bcrypt.compare = async () => true;
  jwt.sign = (payload) => `signed-${payload.type ?? 'session'}`;

  const result = await invokeApp(app, '/login', {
    method: 'POST',
    body: { username: 'tom', password: 'secret' },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(typeof result.json.switchToken, 'string');
  assert.ok(result.json.switchToken.length > 0);
});
```

- [ ] **Step 2: Add test — `/account-switch` succeeds with valid token**

```js
test('behavior: account-switch sets a session cookie for a valid switch token', async () => {
  User.findOne = async () => ({ _id: 'user-1', username: 'tom', password: 'hashed', role: 'USER' });
  User.updateOne = async () => ({ matchedCount: 0 });
  jwt.verify = (_token, _secret) => ({ type: 'switch', username: 'tom', userId: 'user-1', role: 'USER' });
  jwt.sign = () => 'new-session-token';

  const result = await invokeApp(app, '/account-switch', {
    method: 'POST',
    body: { username: 'tom', switchToken: 'valid-switch-token' },
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json, { username: 'tom', role: 'USER' });
  assert.match(result.headers['set-cookie'], /tasktide_session=new-session-token/);
});
```

- [ ] **Step 3: Add test — `/account-switch` rejects expired token**

```js
test('behavior: account-switch returns 401 for an expired or invalid switch token', async () => {
  jwt.verify = () => { throw new Error('jwt expired'); };

  const result = await invokeApp(app, '/account-switch', {
    method: 'POST',
    body: { username: 'tom', switchToken: 'expired-token' },
  });

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Switch token invalid or expired' });
});
```

- [ ] **Step 4: Add test — `/account-switch` rejects mismatched username**

```js
test('behavior: account-switch returns 401 when username does not match token payload', async () => {
  jwt.verify = () => ({ type: 'switch', username: 'casey', userId: 'user-2', role: 'USER' });

  const result = await invokeApp(app, '/account-switch', {
    method: 'POST',
    body: { username: 'tom', switchToken: 'valid-but-wrong-user' },
  });

  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.json, { error: 'Switch token invalid or expired' });
});
```

- [ ] **Step 5: Add test — `/account-switch` returns 400 for missing fields**

```js
test('behavior: account-switch returns 400 when username or switchToken is missing', async () => {
  const missingToken = await invokeApp(app, '/account-switch', {
    method: 'POST',
    body: { username: 'tom' },
  });
  const missingUsername = await invokeApp(app, '/account-switch', {
    method: 'POST',
    body: { switchToken: 'some-token' },
  });

  assert.equal(missingToken.statusCode, 400);
  assert.equal(missingUsername.statusCode, 400);
});
```

- [ ] **Step 6: Add test — `/account-token` returns switch token without touching session cookie**

```js
test('behavior: account-token returns a switchToken without setting a session cookie', async () => {
  User.findOne = async () => ({ _id: 'user-2', username: 'casey', password: 'hashed', role: 'USER' });
  User.updateOne = async () => ({ matchedCount: 0 });
  bcrypt.compare = async () => true;
  jwt.sign = (payload) => `signed-${payload.type ?? 'session'}`;

  const result = await invokeApp(app, '/account-token', {
    method: 'POST',
    body: { username: 'casey', password: 'password1' },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.json.username, 'casey');
  assert.equal(typeof result.json.switchToken, 'string');
  assert.ok(result.json.switchToken.length > 0);
  assert.equal(result.headers['set-cookie'], undefined);
});
```

- [ ] **Step 7: Add test — `/account-token` rejects invalid credentials**

```js
test('behavior: account-token returns 400 for invalid credentials', async () => {
  User.findOne = async () => ({ _id: 'user-2', username: 'casey', password: 'hashed', role: 'USER' });
  bcrypt.compare = async () => false;

  const result = await invokeApp(app, '/account-token', {
    method: 'POST',
    body: { username: 'casey', password: 'wrongpassword' },
  });

  assert.equal(result.statusCode, 400);
  assert.deepEqual(result.json, { error: 'Invalid credentials' });
});
```

- [ ] **Step 8: Run backend tests to verify they pass**

```bash
cd backend && node --test tests/server.behavior.test.js
```

Expected: all new tests pass.

- [ ] **Step 9: Commit**

```bash
cd ..
git add backend/tests/server.behavior.test.js
git commit -m "test(backend): add coverage for /account-switch, /account-token, and switchToken in /login"
```

---

## Task 4: Update frontend storage — `SavedAccount` type and functions

**Files:**
- Modify: `frontend/src/app/storage.ts`

- [ ] **Step 1: Add `SavedAccount` type and export it**

Near the top of `storage.ts`, after the existing type imports (around line 4), add:

```ts
export type SavedAccount = { username: string; switchToken: string };
```

- [ ] **Step 2: Add `migrateSavedAccounts` helper (private)**

After the `writeJsonStorage` function, add:

```ts
function migrateSavedAccounts(raw: unknown): SavedAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): SavedAccount | null => {
      if (typeof entry === 'string' && entry.trim()) {
        return { username: entry.trim(), switchToken: '' };
      }
      if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as SavedAccount).username === 'string' &&
        (entry as SavedAccount).username.trim()
      ) {
        return {
          username: (entry as SavedAccount).username.trim(),
          switchToken: typeof (entry as SavedAccount).switchToken === 'string'
            ? (entry as SavedAccount).switchToken
            : '',
        };
      }
      return null;
    })
    .filter((entry): entry is SavedAccount => entry !== null);
}
```

- [ ] **Step 3: Replace `getSavedAccounts`**

Find the existing `getSavedAccounts` function and replace it entirely:

```ts
// INPUT: none
// OUTPUT: saved account list with switch tokens
// EFFECT: Lists saved accounts and migrates old string-only entries to the new shape
export function getSavedAccounts(): SavedAccount[] {
  return migrateSavedAccounts(readJsonStorage(SAVED_ACCOUNTS_KEY, []));
}
```

- [ ] **Step 4: Replace `addSavedAccount`**

Find the existing `addSavedAccount` function and replace it entirely:

```ts
// INPUT: username and switch token
// OUTPUT: updated saved account list
// EFFECT: Stores up to ten accounts; re-adding an existing username refreshes its switch token
export function addSavedAccount(username: string, switchToken: string) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) return;
  const accounts = getSavedAccounts().filter(
    (a) => a.username.toLowerCase() !== normalizedUsername.toLowerCase()
  );
  writeJsonStorage(SAVED_ACCOUNTS_KEY, [{ username: normalizedUsername, switchToken }, ...accounts].slice(0, 10));
}
```

- [ ] **Step 5: Replace `removeSavedAccount`**

Find the existing `removeSavedAccount` function and replace it entirely:

```ts
// INPUT: username
// OUTPUT: updated saved account list
// EFFECT: Removes one saved account from the switcher
export function removeSavedAccount(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  writeJsonStorage(
    SAVED_ACCOUNTS_KEY,
    getSavedAccounts().filter((a) => a.username.toLowerCase() !== normalizedUsername)
  );
}
```

- [ ] **Step 6: Add `getSwitchToken` after `removeSavedAccount`**

```ts
// INPUT: username
// OUTPUT: stored switch token or null
// EFFECT: Supplies the account switcher with the credential needed for one-click switching
export function getSwitchToken(username: string): string | null {
  const normalizedUsername = username.trim().toLowerCase();
  const account = getSavedAccounts().find((a) => a.username.toLowerCase() === normalizedUsername);
  return account?.switchToken || null;
}
```

- [ ] **Step 7: Check TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/storage.ts
git commit -m "feat(storage): update savedAccounts to store switch tokens"
```

---

## Task 5: Update storage behavior tests

**Files:**
- Modify: `frontend/src/app/storage.behavior.test.ts`

- [ ] **Step 1: Replace the entire file**

```ts
// INPUT: saved account localStorage state
// OUTPUT: behavior coverage for saved account helpers with switch tokens
// EFFECT: Verifies account switching stores usernames and tokens, caps the list, and migrates old format
import { beforeEach, describe, expect, it } from "vitest";

import { addSavedAccount, getSavedAccounts, getSwitchToken, removeSavedAccount } from "./storage";

describe("saved account storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getSavedAccounts returns [] when localStorage is empty", () => {
    expect(getSavedAccounts()).toEqual([]);
  });

  it("addSavedAccount stores username and switchToken", () => {
    addSavedAccount("tom", "token-abc");

    expect(getSavedAccounts()).toEqual([{ username: "tom", switchToken: "token-abc" }]);
  });

  it("addSavedAccount deduplicates by username and caps at 10", () => {
    ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "a"].forEach((u) =>
      addSavedAccount(u, `token-${u}`)
    );

    const accounts = getSavedAccounts();
    expect(accounts).toHaveLength(10);
    expect(accounts[0].username).toBe("a");
    expect(accounts[0].switchToken).toBe("token-a");
    expect(accounts.map((a) => a.username)).not.toContain("b");
  });

  it("addSavedAccount refreshes the switch token when re-adding an existing username", () => {
    addSavedAccount("tom", "old-token");
    addSavedAccount("tom", "new-token");

    expect(getSavedAccounts()).toEqual([{ username: "tom", switchToken: "new-token" }]);
  });

  it("removeSavedAccount removes the correct entry", () => {
    addSavedAccount("tom", "t1");
    addSavedAccount("casey", "t2");
    addSavedAccount("sam", "t3");

    removeSavedAccount("casey");

    expect(getSavedAccounts().map((a) => a.username)).toEqual(["sam", "tom"]);
  });

  it("getSwitchToken returns the token for a known username", () => {
    addSavedAccount("tom", "token-xyz");

    expect(getSwitchToken("tom")).toBe("token-xyz");
  });

  it("getSwitchToken returns null for an unknown username", () => {
    expect(getSwitchToken("nobody")).toBeNull();
  });

  it("getSavedAccounts migrates old string-only entries to the new shape", () => {
    localStorage.setItem("savedAccounts", JSON.stringify(["tom", "casey"]));

    expect(getSavedAccounts()).toEqual([
      { username: "tom", switchToken: "" },
      { username: "casey", switchToken: "" },
    ]);
  });

  it("getSwitchToken returns null for a migrated entry with no token", () => {
    localStorage.setItem("savedAccounts", JSON.stringify(["tom"]));

    expect(getSwitchToken("tom")).toBeNull();
  });
});
```

- [ ] **Step 2: Run storage tests**

```bash
cd frontend && npm run test:run -- storage.behavior
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/storage.behavior.test.ts
git commit -m "test(storage): update saved account tests for switch token shape"
```

---

## Task 6: Add new i18n strings

**Files:**
- Modify: `frontend/src/i18n.ts`

- [ ] **Step 1: Add English strings under `settings.account`**

Find the English `settings.account` block (around line 118). Add these keys after `switchFailed`:
```ts
sessionExpired: "Session expired for {{username}} — please re-add this account",
addAnotherAccount: "Add another account",
addAndStay: "Add & Stay",
addFailed: "Failed to add account",
```

- [ ] **Step 2: Update English `noSavedAccounts` text**

Find:
```ts
noSavedAccounts: "No saved accounts. Log into another account to save it here.",
```
Replace with:
```ts
noSavedAccounts: "No saved accounts. Use \"Add another account\" below to add one.",
```

- [ ] **Step 3: Update English `switchAccounts.text` in help center strings**

Find (around line 367):
```ts
switchAccounts: {
  question: "Switch accounts",
  title: "switch accounts.gif",
  text: "What it does:\nSwitch Account lets you reuse saved usernames without saving passwords.\n\nHow to use:\n1. Open Settings.\n2. Click Switch Account.\n3. Choose a saved username.\n4. Enter that account password.\n5. Submit to switch."
},
```
Replace with:
```ts
switchAccounts: {
  question: "Switch accounts",
  title: "switch accounts.gif",
  text: "What it does:\nSwitch Account lets you save multiple accounts and switch between them with one click — no password needed after the first login.\n\nHow to use:\n1. Open Settings.\n2. Click Switch Account (or Add Account).\n3. To add a new account: expand \"Add another account\", enter credentials, click Add & Stay.\n4. To switch: click any saved account chip. You are switched instantly.\n5. To remove an account: click the × on its chip."
},
```

- [ ] **Step 4: Add Chinese strings under `settings.account`**

Find the Chinese `settings.account` block (around line 895). Add after `switchFailed`:
```ts
sessionExpired: "{{username}} 的会话已过期，请重新添加此账号",
addAnotherAccount: "添加其他账号",
addAndStay: "添加并留在当前账号",
addFailed: "添加账号失败",
```

- [ ] **Step 5: Update Chinese `noSavedAccounts`**

Find:
```ts
noSavedAccounts: "没有已保存账号。登录另一个账号后，它会显示在这里。",
```
Replace with:
```ts
noSavedAccounts: "没有已保存账号。在下方「添加其他账号」中添加一个。",
```

- [ ] **Step 6: Update Chinese `switchAccounts.text`**

Find (around line 1141):
```ts
switchAccounts: {
  question: "切换账号",
  title: "switch accounts.gif",
  text: "功能说明：\n「切换账号」可以复用已保存的用户名，但不会保存密码。\n\n使用方法：\n1. 打开「设置」。\n2. 点击「切换账号」。\n3. 选择已保存的用户名。\n4. 输入该账号密码。\n5. 提交后完成切换。"
},
```
Replace with:
```ts
switchAccounts: {
  question: "切换账号",
  title: "switch accounts.gif",
  text: "功能说明：\n「切换账号」支持保存多个账号，首次登录后即可一键切换，无需再次输入密码。\n\n使用方法：\n1. 打开「设置」。\n2. 点击「切换账号」或「添加账号」。\n3. 添加新账号：展开「添加其他账号」，输入账号密码，点击「添加并留在当前账号」。\n4. 切换账号：点击已保存账号的标签即可立即切换。\n5. 删除账号：点击标签上的 × 即可移除。"
},
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/i18n.ts
git commit -m "feat(i18n): add strings for one-click account switching"
```

---

## Task 7: Update `LoginPage.tsx` to pass `switchToken` to `addSavedAccount`

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Update the `addSavedAccount` call after successful login**

Find (around line 96):
```ts
setAuth(data.username, data.role);
addSavedAccount(data.username);
onLoginSuccess();
```
Replace with:
```ts
setAuth(data.username, data.role);
addSavedAccount(data.username, data.switchToken ?? "");
onLoginSuccess();
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(login): store switchToken after login for one-click account switching"
```

---

## Task 8: Redesign `SettingsPage.tsx` switch dialog

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Update the storage imports**

Find:
```ts
import {
  addSavedAccount,
  getSavedAccounts,
  getUsername,
  isAdminUser,
  removeSavedAccount,
  setAuth,
} from "../app/storage";
```
Replace with:
```ts
import {
  type SavedAccount,
  addSavedAccount,
  getSavedAccounts,
  getSwitchToken,
  getUsername,
  isAdminUser,
  removeSavedAccount,
  setAuth,
} from "../app/storage";
```

- [ ] **Step 2: Replace the switch-related state declarations**

Find these five state lines (around line 89):
```ts
const [switchOpen, setSwitchOpen] = useState(false);
const [savedAccounts, setSavedAccounts] = useState<string[]>(() => getSavedAccounts());
const [selectedAccount, setSelectedAccount] = useState("");
const [switchPassword, setSwitchPassword] = useState("");
const [switchError, setSwitchError] = useState("");
```
Replace with:
```ts
const [switchOpen, setSwitchOpen] = useState(false);
const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => getSavedAccounts());
const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);
const [switchError, setSwitchError] = useState("");
const [failedAccount, setFailedAccount] = useState("");
const [addAccountOpen, setAddAccountOpen] = useState(false);
const [addUsername, setAddUsername] = useState("");
const [addPassword, setAddPassword] = useState("");
const [addError, setAddError] = useState("");
const [addLoading, setAddLoading] = useState(false);
```

- [ ] **Step 3: Replace the `handleSwitchAccount` function**

Find the existing `handleSwitchAccount` function (around line 202) and replace it entirely with two new functions:

```ts
async function handleSwitchAccount(username: string) {
  setSwitchError("");
  setFailedAccount("");
  setSwitchingAccount(username);

  const switchToken = getSwitchToken(username) ?? "";

  try {
    const response = await fetch(`${API_URL}/account-switch`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, switchToken }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSwitchError(t("settings.account.sessionExpired", { username }));
      setFailedAccount(username);
      setSwitchingAccount(null);
      return;
    }

    setAuth(data.username, data.role);
    setSwitchOpen(false);
    onLoginSuccess();
  } catch {
    setSwitchError(t("settings.account.switchFailed"));
    setSwitchingAccount(null);
  }
}

async function handleAddAccount(event: FormEvent) {
  event.preventDefault();
  setAddError("");
  setAddLoading(true);

  try {
    const response = await fetch(`${API_URL}/account-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: addUsername, password: addPassword }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setAddError(data.error || t("settings.account.addFailed"));
      setAddLoading(false);
      return;
    }

    addSavedAccount(data.username, data.switchToken ?? "");
    setSavedAccounts(getSavedAccounts());
    setAddUsername("");
    setAddPassword("");
    setAddAccountOpen(false);
  } catch {
    setAddError(t("settings.account.addFailed"));
  } finally {
    setAddLoading(false);
  }
}
```

- [ ] **Step 4: Replace `handleRemoveAccount`**

Find the existing `handleRemoveAccount` function:
```ts
function handleRemoveAccount(account: string) {
  removeSavedAccount(account);
  setSavedAccounts(getSavedAccounts());
  if (selectedAccount === account) {
    setSelectedAccount("");
    setSwitchPassword("");
  }
}
```
Replace with:
```ts
function handleRemoveAccount(username: string) {
  removeSavedAccount(username);
  setSavedAccounts(getSavedAccounts());
  if (failedAccount === username) {
    setSwitchError("");
    setFailedAccount("");
  }
}
```

- [ ] **Step 5: Update the "Add Account" button to open the dialog with add form expanded**

Find:
```tsx
<Button variant="outlined" onClick={() => setSwitchOpen(true)}>
  {t("settings.account.switchAccount")}
</Button>
```

After that button, find the current "Add Account" button which calls `onLogout`. The current "Add Account" button text is `t("settings.account.addAccount")` and it calls `onLogout`. Replace that button with:
```tsx
<Button
  variant="outlined"
  onClick={() => {
    setAddAccountOpen(true);
    setSwitchOpen(true);
  }}
>
  {t("settings.account.addAccount")}
</Button>
```

- [ ] **Step 6: Add a dialog close handler that resets add-form state**

Before the `return` of the component, add a helper:
```ts
function handleSwitchDialogClose() {
  setSwitchOpen(false);
  setSwitchError("");
  setFailedAccount("");
  setAddAccountOpen(false);
  setAddUsername("");
  setAddPassword("");
  setAddError("");
}
```

- [ ] **Step 7: Replace the entire switch dialog JSX**

Find the existing Dialog block starting with:
```tsx
<Dialog open={switchOpen} onClose={() => setSwitchOpen(false)} fullWidth maxWidth="sm">
```
and ending with its closing `</Dialog>` tag. Replace the entire block with:

```tsx
<Dialog open={switchOpen} onClose={handleSwitchDialogClose} fullWidth maxWidth="sm">
  <DialogTitle>{t("settings.account.switchAccount")}</DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ pt: 1 }}>
      {savedAccounts.length === 0 ? (
        <Alert severity="info">{t("settings.account.noSavedAccounts")}</Alert>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {savedAccounts.map(({ username }) => (
            <Chip
              key={username}
              label={username}
              onClick={() => { void handleSwitchAccount(username); }}
              onDelete={() => handleRemoveAccount(username)}
              deleteIcon={<DeleteRoundedIcon />}
              disabled={switchingAccount !== null}
            />
          ))}
        </Stack>
      )}
      {switchError && (
        <Alert
          severity="error"
          action={
            failedAccount ? (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setAddUsername(failedAccount);
                  setAddAccountOpen(true);
                }}
              >
                {t("common.reAdd", "Re-add")}
              </Button>
            ) : undefined
          }
        >
          {switchError}
        </Alert>
      )}
      <Accordion
        expanded={addAccountOpen}
        onChange={(_, expanded) => setAddAccountOpen(expanded)}
        disableGutters
        elevation={0}
        sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography variant="body2">{t("settings.account.addAnotherAccount")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="form" onSubmit={(e) => { void handleAddAccount(e); }}>
            <Stack spacing={1.5}>
              {addError && <Alert severity="error">{addError}</Alert>}
              <TextField
                label={t("settings.account.username", { username: "" }).replace(/:\s*$/, "")}
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                required
                autoComplete="username"
                size="small"
              />
              <TextField
                label={t("settings.account.currentPassword")}
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                autoComplete="current-password"
                size="small"
              />
              <Button type="submit" variant="contained" disabled={addLoading}>
                {addLoading ? "…" : t("settings.account.addAndStay")}
              </Button>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleSwitchDialogClose}>{t("common.close")}</Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 8: Fix the i18n key for the "Username" label in the add form**

The TextField label above uses a workaround. Replace it with a dedicated key. Add `addUsernameLabel: "Username"` and `addUsernameLabel: "用户名"` to `i18n.ts` under `settings.account` (both EN and ZH), then update the TextField label to:
```tsx
label={t("settings.account.addUsernameLabel")}
```

- [ ] **Step 9: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/SettingsPage.tsx frontend/src/i18n.ts
git commit -m "feat(settings): one-click account switching with inline add-account form"
```

---

## Task 9: Update SettingsPage behavior tests

**Files:**
- Modify: `frontend/src/pages/SettingsPage.behavior.test.tsx`

- [ ] **Step 1: Update the storage mock to include new functions**

Find:
```ts
const storageMocks = vi.hoisted(() => ({
  isAdminUser: vi.fn(),
}));

vi.mock("../app/storage", async () => {
  const actual = await vi.importActual<typeof import("../app/storage")>("../app/storage");
  return {
    ...actual,
    isAdminUser: storageMocks.isAdminUser,
  };
});
```
Replace with:
```ts
const storageMocks = vi.hoisted(() => ({
  isAdminUser: vi.fn(),
  getSavedAccounts: vi.fn(),
  getSwitchToken: vi.fn(),
  addSavedAccount: vi.fn(),
  removeSavedAccount: vi.fn(),
}));

vi.mock("../app/storage", async () => {
  const actual = await vi.importActual<typeof import("../app/storage")>("../app/storage");
  return {
    ...actual,
    isAdminUser: storageMocks.isAdminUser,
    getSavedAccounts: storageMocks.getSavedAccounts,
    getSwitchToken: storageMocks.getSwitchToken,
    addSavedAccount: storageMocks.addSavedAccount,
    removeSavedAccount: storageMocks.removeSavedAccount,
  };
});
```

- [ ] **Step 2: Reset new mocks in `beforeEach`**

Find the `beforeEach` block and add after `storageMocks.isAdminUser.mockReset().mockReturnValue(false);`:
```ts
storageMocks.getSavedAccounts.mockReset().mockReturnValue([]);
storageMocks.getSwitchToken.mockReset().mockReturnValue(null);
storageMocks.addSavedAccount.mockReset();
storageMocks.removeSavedAccount.mockReset();
```

- [ ] **Step 3: Add test — one-click chip switch calls `/account-switch` and triggers `onLoginSuccess`**

```ts
it("clicking a saved account chip calls /account-switch and reloads session", async () => {
  const user = userEvent.setup();
  storageMocks.getSavedAccounts.mockReturnValue([{ username: "casey", switchToken: "tok-abc" }]);
  storageMocks.getSwitchToken.mockReturnValue("tok-abc");
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ username: "casey", role: "USER" }) });
  vi.stubGlobal("fetch", fetchMock);
  const onLoginSuccess = vi.fn();

  renderSettingsPage({ onLoginSuccess });
  await user.click(screen.getByRole("button", { name: "Switch Account" }));
  await user.click(screen.getByRole("button", { name: "casey" }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/account-switch"),
      expect.objectContaining({ body: JSON.stringify({ username: "casey", switchToken: "tok-abc" }) })
    );
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Add test — expired token shows inline error with Re-add button**

```ts
it("shows session-expired error with Re-add button when switch token is rejected", async () => {
  const user = userEvent.setup();
  storageMocks.getSavedAccounts.mockReturnValue([{ username: "casey", switchToken: "expired" }]);
  storageMocks.getSwitchToken.mockReturnValue("expired");
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Switch token invalid or expired" }) });
  vi.stubGlobal("fetch", fetchMock);

  renderSettingsPage();
  await user.click(screen.getByRole("button", { name: "Switch Account" }));
  await user.click(screen.getByRole("button", { name: "casey" }));

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(/Session expired/);
    expect(screen.getByRole("button", { name: /Re-add/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Add test — inline add-account form calls `/account-token` and stores the token**

```ts
it("inline add-account form calls /account-token and stores the switch token without logging out", async () => {
  const user = userEvent.setup();
  storageMocks.getSavedAccounts.mockReturnValue([]);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ username: "sam", switchToken: "new-tok" }) });
  vi.stubGlobal("fetch", fetchMock);
  const onLogout = vi.fn();

  renderSettingsPage({ onLogout });
  await user.click(screen.getByRole("button", { name: "Add Account" }));
  await user.click(screen.getByText("Add another account"));
  await user.type(screen.getByLabelText(/Username/i), "sam");
  await user.type(screen.getByLabelText(/password/i), "password1");
  await user.click(screen.getByRole("button", { name: /Add & Stay/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/account-token"),
      expect.objectContaining({ body: JSON.stringify({ username: "sam", password: "password1" }) })
    );
    expect(storageMocks.addSavedAccount).toHaveBeenCalledWith("sam", "new-tok");
    expect(onLogout).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Add test — add-account form shows error on failed login**

```ts
it("inline add-account form shows error when credentials are rejected", async () => {
  const user = userEvent.setup();
  storageMocks.getSavedAccounts.mockReturnValue([]);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ email: "", emailNotifications: false }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Invalid credentials" }) });
  vi.stubGlobal("fetch", fetchMock);

  renderSettingsPage();
  await user.click(screen.getByRole("button", { name: "Add Account" }));
  await user.click(screen.getByText("Add another account"));
  await user.type(screen.getByLabelText(/Username/i), "nobody");
  await user.type(screen.getByLabelText(/password/i), "wrongpass");
  await user.click(screen.getByRole("button", { name: /Add & Stay/i }));

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
```

- [ ] **Step 7: Run frontend tests**

```bash
cd frontend && npm run test:run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/SettingsPage.behavior.test.tsx
git commit -m "test(settings): add coverage for one-click switching and inline add-account"
```

---

## Task 10: Version bump and required docs updates

**Files:**
- Modify: `frontend/package.json`, `backend/package.json`, `RELEASENOTES.md`, `frontend/src/app/releaseNotes.ts`, `frontend/src/app/helpCenter.ts`, `README.md`, `DEVLOG.md`

- [ ] **Step 1: Bump version to `2.11.0` in both package.json files**

In `frontend/package.json`, change `"version": "2.10.1"` to `"version": "2.11.0"`.
In `backend/package.json`, change `"version": "2.10.0"` to `"version": "2.11.0"`.

- [ ] **Step 2: Prepend to `RELEASENOTES.md`**

```markdown
## Version 2.11.0 – Update Released (2026-05-07)

### What's New
- Added: Save multiple accounts (up to 10) and switch between them with one click — no password needed after the first login.
- Added: Add a new account from the Switch Account dialog without logging out of your current session.

### Improvements
- Improved: Saved account slots increased from 5 to 10.
- Improved: The Switch Account dialog now shows all saved accounts as one-click chips — no intermediate selection step.
```

- [ ] **Step 3: Prepend to `frontend/src/app/releaseNotes.ts` RELEASE_NOTES array**

```ts
{
  id: "2026-05-07-multi-account-switch",
  version: "v2.11.0",
  releasedAt: "2026-05-07",
  title: { en: "One-Click Account Switching", zh: "一键切换账号" },
  summary: {
    en: "Switch between saved accounts instantly — no password re-entry after the first login.",
    zh: "首次登录后，随时一键切换账号，无需重复输入密码。",
  },
  changes: {
    en: [
      "Added: Save up to 10 accounts and switch with a single click.",
      "Added: Add a new account inline without logging out.",
      "Improved: Saved account limit raised from 5 to 10.",
    ],
    zh: [
      "新增：最多保存 10 个账号，一键点击即可切换。",
      "新增：可在不退出当前账号的情况下内联添加新账号。",
      "改进：已保存账号数量上限从 5 提升至 10。",
    ],
  },
},
```

- [ ] **Step 4: Update `frontend/src/app/helpCenter.ts`**

Find the "Switch accounts" walkthrough section. Update the step text to describe the new flow:
- Old flow: select chip → enter password → submit
- New flow: add account once via "Add another account" → future switches are one-click

Replace the existing walkthrough steps for account switching with:
```
1. Open Settings.
2. Click "Switch Account" or "Add Account".
3. To add a new account: expand "Add another account", enter the username and password, then click "Add & Stay". Your current session is untouched.
4. To switch to a saved account: click its chip. You are switched instantly.
5. To remove an account from the list: click the × on its chip.
```

- [ ] **Step 5: Update `README.md`**

Find the account/auth section of the README. Add a bullet noting multi-account one-click switching via switch tokens.

- [ ] **Step 6: Append to `DEVLOG.md`**

```markdown
## 2026-05-07 — Multi-Account Switch (v2.11.0)

### Changes
- `backend/server.js`: `POST /login` now returns `switchToken` (30-day JWT, `type: "switch"`). New `POST /account-switch` validates a switch token and issues a session cookie. New `POST /account-token` authenticates and returns only a switch token (no cookie change) for inline add-account without disrupting the active session.
- `frontend/src/app/storage.ts`: `savedAccounts` shape changed from `string[]` to `{ username, switchToken }[]`. Migration handles old string entries by assigning `switchToken: ""`. Cap raised to 10. New `getSwitchToken(username)` helper.
- `frontend/src/pages/LoginPage.tsx`: `addSavedAccount` now receives `data.switchToken` after login.
- `frontend/src/pages/SettingsPage.tsx`: Switch dialog redesigned — one-click chip switching via `/account-switch`, inline add-account form via `/account-token`. "Add Account" button opens dialog with add form expanded.

### Design decisions
- `/account-token` is separate from `/login` so inline add-account doesn't overwrite the active session cookie.
- Switch tokens are stateless JWTs (no DB storage). Expiry is 30 days. When expired, the chip error prompts re-add.
- `getSwitchToken` returns `null` (not `""`) for migrated old entries, so the UI correctly shows the re-add prompt for them.
```

- [ ] **Step 7: Run full test suite**

```bash
cd /path/to/weekly-todo && npm test
```

Expected: all tests pass.

- [ ] **Step 8: Final commit**

```bash
git add frontend/package.json backend/package.json RELEASENOTES.md frontend/src/app/releaseNotes.ts frontend/src/app/helpCenter.ts README.md DEVLOG.md
git commit -m "chore: bump to v2.11.0 and update docs for multi-account switching"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/login` returns `switchToken` → Task 1
- ✅ `POST /account-switch` validates token → Task 2
- ✅ `POST /account-token` for inline add without session disruption → Task 2 (spec implied this via "stay logged in" requirement)
- ✅ `savedAccounts` shape updated → Task 4
- ✅ Migration of old string entries → Task 4
- ✅ Cap raised to 10 → Task 4
- ✅ `getSwitchToken` helper → Task 4
- ✅ One-click chip switch → Task 8
- ✅ Inline add-account form → Task 8
- ✅ Expired token inline error with Re-add → Task 8
- ✅ "Add Account" button opens dialog with form expanded → Task 8
- ✅ `LoginPage` passes `switchToken` → Task 7
- ✅ All backend tests → Task 3
- ✅ All storage tests → Task 5
- ✅ All SettingsPage tests → Task 9
- ✅ Docs and version → Task 10

**Type consistency:**
- `SavedAccount` defined in Task 4, imported in Task 8 — consistent
- `addSavedAccount(username, switchToken)` defined in Task 4, called in Tasks 7 and 8 — consistent
- `getSwitchToken(username)` defined in Task 4, called in Task 8 — consistent
- `handleSwitchAccount(username: string)` defined in Task 8, called from chip `onClick` in Task 8 — consistent
- `handleAddAccount(event: FormEvent)` defined in Task 8, used in form `onSubmit` in Task 8 — consistent

**No placeholders:** All steps have concrete code. No "TBD" or "similar to above."
