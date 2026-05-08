# Multi-Account Switch — Design Spec

**Date:** 2026-05-07
**Status:** Approved

## Overview

Redesign the account switcher so users can save multiple accounts and switch between them with one click — no password re-entry. Adding a new account uses an inline login form without logging out the current session. Switch credentials are stored as long-lived JWTs (switch tokens) in localStorage.

---

## Backend Changes

### `POST /login` (modified)

In addition to the existing session cookie and `{ username, role }` response body, also return `{ switchToken }`.

The switch token is a JWT signed with `JWT_SECRET` containing:

```json
{ "userId": "...", "username": "...", "role": "...", "type": "switch" }
```

Expiry: **30 days**.

### `POST /account-switch` (new)

No authentication middleware. Accepts:

```json
{ "username": "...", "switchToken": "..." }
```

Validation:
1. Verify the JWT signature and expiry.
2. Check `payload.type === "switch"`.
3. Check `payload.username` matches the submitted `username` (case-insensitive).

On success: set a new session cookie (same as `/login`) and return `{ username, role }`.

On failure: return `401 { error: "..." }`.

No database changes required — switch tokens are stateless.

---

## Frontend Storage (`storage.ts`)

### Shape change

`savedAccounts` in localStorage changes from:

```ts
string[]
```

to:

```ts
{ username: string; switchToken: string }[]
```

### Updated functions

| Function | Change |
|---|---|
| `getSavedAccounts()` | Returns `{ username, switchToken }[]` |
| `addSavedAccount(username, switchToken)` | Accepts both fields; deduplicates by username (case-insensitive); re-adding refreshes the token; cap raised from 5 to **10** |
| `removeSavedAccount(username)` | Unchanged behavior |
| `getSwitchToken(username)` | New — returns stored token for username, or `null` |

### Migration

On first read, if `savedAccounts` contains plain strings (old format), silently convert each entry to `{ username: entry, switchToken: "" }`. An empty `switchToken` means the account will show an inline "re-add" prompt on first switch attempt.

---

## Frontend UI (`SettingsPage.tsx`)

### Switch Account dialog (redesigned)

- Account chips render as before.
- **One-click switching**: clicking a chip immediately calls `POST /account-switch` with the stored token. No password field, no intermediate selection state.
- **On success**: reload app as the new user.
- **On expired/invalid token**: show inline error on the chip row — *"Session expired — please re-add this account"* — with a "Re-add" button that opens the inline login form pre-filled with that username.
- **On network failure**: show a generic inline error. The current session is preserved.
- **`×` delete button**: removes the account from storage (unchanged).

### Add Account section (new, inside the same dialog)

- A collapsible "Add another account" section at the bottom of the dialog.
- Contains: username field, password field, "Add & Stay" submit button.
- On success: store `{ username, switchToken }`, add the chip, collapse the form. Current session is untouched.
- On failure: show inline error below the form.
- Re-adding an existing username silently refreshes its switch token.

### "Add Account" button (Settings page)

Changes from calling `onLogout` to opening the switch dialog with the "Add another account" section pre-expanded.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Switch token expired or tampered | Inline error on chip row with "Re-add" button |
| Network failure during switch | Inline error in dialog; current session preserved |
| Adding an already-saved account | Deduplicates; refreshes switch token silently |
| Adding currently-logged-in account | Allowed; refreshes that account's token |
| Empty `switchToken` (migrated old account) | Switch attempt returns 401 → shows "re-add" prompt |

---

## Tests

### `storage.behavior.test.ts`
- Migration: old `string[]` format converts to `{ username, switchToken: "" }[]`
- `addSavedAccount` stores token and deduplicates by username
- `addSavedAccount` re-adding refreshes the switch token
- `getSwitchToken` returns token for known username, `null` for unknown
- Cap of 10 accounts enforced

### `SettingsPage.behavior.test.tsx`
- One-click chip switch calls `/account-switch` and reloads
- Expired token response shows inline error with "Re-add" button
- Inline add-account form submits to `/login`, stores token, adds chip without logout
- Inline add-account form shows error on failed login
- "Add Account" button on settings page opens dialog with add section expanded

### Backend tests
- `POST /account-switch` with valid token → 200 + new session cookie
- `POST /account-switch` with expired token → 401
- `POST /account-switch` with mismatched username → 401
- `POST /account-switch` with missing fields → 400
- `POST /login` response includes `switchToken` field
