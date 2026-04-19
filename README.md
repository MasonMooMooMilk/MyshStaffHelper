# MyshStaffHelper

A Vencord plugin for Mysh server staff. Adds right-click options to any message to fire Wick bot's `/timeout add` and `/ban add` slash commands in the configured log channels, then deletes the offending message.

## What it does

Right-click any message in the Mysh server and you'll see:

- **Timeout User** — submenu with pre-filled duration + reason (Use Market, Begging, Self Promo, Slurs, Harassment, ban 28d, etc.)
- **Ban User** — submenu with pre-filled ban reasons (Nsfw, Scamming staff, Irl trading, Hacking, Other)

Clicking a category:
1. Sends the corresponding Wick slash command to the appropriate log channel (`#timeouts` or `#bans`)
2. Deletes the original message (only if the command succeeded)

The context menu only appears in the Mysh server — it's hardcoded to the guild ID, so it won't clutter right-click menus elsewhere.

---

## Install — Windows (regular Vencord)

### Prerequisites

1. [Node.js](https://nodejs.org/) (LTS version)
2. pnpm — open PowerShell and run: `npm install -g pnpm`
3. [Git](https://git-scm.com/download/win)

### Steps

Open PowerShell and run:

```powershell
# 1. Clone Vencord
cd $HOME
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install --frozen-lockfile

# 2. Clone this plugin into userplugins
cd src\userplugins
git clone https://github.com/MasonMooMooMilk/MyshStaffHelper wickModerator

# 3. Build Vencord with the plugin included
cd $HOME\Vencord
pnpm build

# 4. Inject into Discord (this replaces your current Vencord)
pnpm inject
```

The `pnpm inject` step opens the VencordInstaller. Click **Install** next to the Discord branch you use (usually **Discord stable**).

### Finish

1. Fully close Discord (right-click tray icon → **Quit Discord** — X in the corner isn't enough)
2. Reopen Discord
3. Go to **Settings (gear icon) → Vencord → Plugins**
4. Search for **WickModerator**
5. Toggle it on

---

## Install — macOS (Vesktop)

### Prerequisites

```bash
brew install node git
npm install -g pnpm
```

### Steps

```bash
# 1. Clone Vencord
git clone https://github.com/Vendicated/Vencord ~/Vencord
cd ~/Vencord
pnpm install --frozen-lockfile

# 2. Clone this plugin into userplugins
cd ~/Vencord/src/userplugins
git clone https://github.com/MasonMooMooMilk/MyshStaffHelper wickModerator

# 3. Build
cd ~/Vencord
pnpm build
```

### Point Vesktop at the custom build

1. Open Vesktop → **Settings → Developer Options**
2. Under **Vencord Location**, click **Change**
3. Select `~/Vencord/dist` (full path, e.g. `/Users/yourname/Vencord/dist`)
4. Fully quit Vesktop (Cmd+Q) and relaunch

Then enable **WickModerator** in **Settings → Vencord → Plugins**.

---

## First-time usage

Wick's slash commands need to be cached in Discord once before the plugin can find them:

1. Open the timeout log channel (`#timeouts`)
2. Type `/` and wait for Wick's autocomplete to appear
3. Press Escape
4. Do the same in the ban log channel

After that, right-click any offender's message and pick a category.

## Requirements

- You must have **Manage Messages** permission in the channel where you right-click (needed for the message delete)
- Wick must have permission to receive interactions in the log channels

## Troubleshooting

Open DevTools (**Ctrl+Shift+I** on Windows, **Cmd+Option+I** on Mac) and check the Console for `[WickModerator]` logs.

- **"Missing Permissions" (403 code 50013)** — You don't have Discord permission for the action, or Wick doesn't have access to the log channel.
- **"Unknown Integration" (400 code 10005)** — Wick isn't accessible in the target channel. Check the log channel's integration settings.
- **"not loaded" error** — Wick's commands aren't cached yet. Open the log channel and type `/` first.
- **Menu doesn't appear** — Make sure you're right-clicking in the Mysh server — the plugin only activates there.

## Updating

```bash
cd ~/Vencord/src/userplugins/wickModerator   # Windows: cd $HOME\Vencord\src\userplugins\wickModerator
git pull
cd ~/Vencord && pnpm build                   # Windows: cd $HOME\Vencord; pnpm build
```

**Windows only:** after rebuilding, run `pnpm inject` again (and re-install) so Discord picks up the new build.
**Vesktop:** just restart the app.
