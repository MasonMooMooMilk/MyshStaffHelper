import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import {
    ApplicationCommandIndexStore,
    AuthenticationStore,
    ChannelStore,
    Menu,
    RestAPI,
    SnowflakeUtils,
} from "@webpack/common";

const GUILD_ID = "1348001287920423004";
const TIMEOUT_CHANNEL_ID = "1448679097126490296";
const BAN_CHANNEL_ID = "1476690738124296212";
const WICK_APP_ID = "536991182035746816";

const TIMEOUT_CATEGORIES: Array<{ label: string; duration: string; reason: string }> = [
    { label: "Use Market (1d)",            duration: "1d",  reason: "Use Market" },
    { label: "Begging (1d)",               duration: "1d",  reason: "Begging" },
    { label: "Self Promo (3d)",            duration: "3d",  reason: "Self Promo" },
    { label: "Slurs (14d)",                duration: "14d", reason: "Slurs" },
    { label: "Harassment of Members (1d)", duration: "1d",  reason: "Harassment of members" },
    { label: "Harassment of Staff (2d)",   duration: "2d",  reason: "Harassment of staff" },
    { label: "ban (28d)",                  duration: "28d", reason: "ban later" },
];

const BAN_REASONS = [
    "Nsfw",
    "Scamming staff",
    "Irl trading",
    "Hacking",
    "Other",
];

const OPT_SUBCOMMAND = 1;
const OPT_STRING = 3;
const OPT_USER = 6;

function findRootCommand(guildId: string, commandName: string): any | null {
    const state = (ApplicationCommandIndexStore as any).getGuildState(guildId);
    const sections = state?.result?.sections;
    if (!sections) return null;

    for (const section of Object.values(sections) as any[]) {
        for (const cmd of Object.values(section.commands ?? {}) as any[]) {
            const root = cmd.rootCommand ?? cmd;
            if (root?.name !== commandName) continue;
            const appId = root.application_id ?? root.applicationId;
            if (appId !== WICK_APP_ID) continue;
            return root;
        }
    }
    return null;
}

async function runSlashCommand(
    channelId: string,
    commandName: string,
    subCommandName: string,
    subOptions: Array<{ name: string; type: number; value: string }>
): Promise<boolean> {
    try {
        const channel = (ChannelStore as any).getChannel(channelId);
        if (!channel?.guild_id) throw new Error("Target channel not found or not in a guild");

        const root = findRootCommand(channel.guild_id, commandName);
        if (!root) throw new Error(`/${commandName} not loaded. Open the target channel once and type "/" to cache Wick's commands, then try again.`);

        const sessionId = (AuthenticationStore as any).getSessionId();
        const nonce = (SnowflakeUtils as any).fromTimestamp(Date.now());

        const appId = root.application_id ?? root.applicationId;

        const payload = {
            type: 2,
            application_id: appId,
            guild_id: channel.guild_id,
            channel_id: channelId,
            session_id: sessionId,
            data: {
                version: root.version,
                id: root.id,
                name: commandName,
                type: 1,
                options: [{
                    type: OPT_SUBCOMMAND,
                    name: subCommandName,
                    options: subOptions,
                }],
                application_command: root,
                attachments: [],
            },
            nonce,
            analytics_location: "slash_command",
        };

        console.log("[WickModerator] Sending payload:", JSON.parse(JSON.stringify(payload)));

        await (RestAPI as any).post({
            url: "/interactions",
            body: payload,
        });
        console.log("[WickModerator] Success");
        return true;
    } catch (err: any) {
        console.error("[WickModerator] Failed to run slash command:", err);
        console.error("[WickModerator] Response body:", err?.body);
        console.error("[WickModerator] Status:", err?.status);
        return false;
    }
}

(window as any).__wickDebug = {
    findRootCommand,
    runSlashCommand,
    getCmds: (guildId = GUILD_ID) => (ApplicationCommandIndexStore as any).getGuildState(guildId),
};

async function deleteMessage(channelId: string, messageId: string) {
    try {
        await (RestAPI as any).del({
            url: `/channels/${channelId}/messages/${messageId}`,
        });
    } catch (err: any) {
        console.error("[WickModerator] Failed to delete message:", err);
    }
}

async function doTimeout(userId: string, duration: string, reason: string, msgChannelId: string, messageId: string) {
    const ok = await runSlashCommand(TIMEOUT_CHANNEL_ID, "timeout", "add", [
        { name: "user",     type: OPT_USER,   value: userId },
        { name: "duration", type: OPT_STRING, value: duration },
        { name: "reason",   type: OPT_STRING, value: reason },
    ]);
    if (ok) await deleteMessage(msgChannelId, messageId);
}

async function doBan(userId: string, reason: string, msgChannelId: string, messageId: string) {
    const ok = await runSlashCommand(BAN_CHANNEL_ID, "ban", "add", [
        { name: "user",   type: OPT_USER,   value: userId },
        { name: "reason", type: OPT_STRING, value: reason },
    ]);
    if (ok) await deleteMessage(msgChannelId, messageId);
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message, channel } = props as any;
    if (!message?.author?.id) return;

    const guildId = message.guild_id ?? channel?.guild_id;
    if (guildId !== GUILD_ID) return;

    const userId = message.author.id as string;
    const msgChannelId = message.channel_id as string;
    const messageId = message.id as string;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem id="wick-timeout" label="Timeout User">
            {TIMEOUT_CATEGORIES.map(cat => (
                <Menu.MenuItem
                    key={cat.label}
                    id={`wick-timeout-${cat.label.replace(/\s+/g, "-").toLowerCase()}`}
                    label={cat.label}
                    action={() => doTimeout(userId, cat.duration, cat.reason, msgChannelId, messageId)}
                />
            ))}
        </Menu.MenuItem>,
        <Menu.MenuItem id="wick-ban" label="Ban User">
            {BAN_REASONS.map(reason => (
                <Menu.MenuItem
                    key={reason}
                    id={`wick-ban-${reason.replace(/\s+/g, "-").toLowerCase()}`}
                    label={reason}
                    action={() => doBan(userId, reason, msgChannelId, messageId)}
                />
            ))}
        </Menu.MenuItem>
    );
};

export default definePlugin({
    name: "WickModerator",
    description: "Right-click a message to fire Wick's /timeout or /ban slash command in the configured mod channels.",
    authors: [{ name: "Moderator", id: 0n }],

    contextMenus: {
        "message": messageContextMenuPatch,
    },
});
