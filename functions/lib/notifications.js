"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserUpdate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const params_1 = require("firebase-functions/params");
const admin = require("firebase-admin");
// Initialize admin if not already
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Define secret for Discord Webhook URL
const discordWebhookUrl = (0, params_1.defineSecret)("DISCORD_WEBHOOK_URL");
exports.onUserUpdate = (0, firestore_1.onDocumentWritten)({
    document: "users/{userId}",
    secrets: [discordWebhookUrl]
}, async (event) => {
    var _a, _b, _c, _d;
    const userId = event.params.userId;
    const beforeData = ((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data()) || {};
    const afterData = ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data()) || {};
    const oldMessage = beforeData.message || "";
    const newMessage = afterData.message || "";
    const oldDonations = ((_c = beforeData.donations) === null || _c === void 0 ? void 0 : _c.total) || 0;
    const newDonations = ((_d = afterData.donations) === null || _d === void 0 ? void 0 : _d.total) || 0;
    const oldDisplayName = beforeData.displayName || "";
    const newDisplayName = afterData.displayName || "";
    // Sync to public leaderboard if they have donations
    if (newDonations > 0) {
        await db.collection('leaderboard').doc(userId).set({
            displayName: afterData.leaderboardName || afterData.displayName || 'Anonymous',
            photoURL: afterData.photoURL || null,
            amount: newDonations,
            message: afterData.message || null,
            approvalStatus: afterData.messageApprovalStatus || 'pending',
            isAnonymous: afterData.displayOnLeaderboard === false,
            showAmount: afterData.showAmount || 'exact',
            lastActiveAt: afterData.lastActiveAt || admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        logger.info(`Synced leaderboard entry for ${userId}`);
    }
    else {
        // Remove from leaderboard if donations are 0 (shouldn't really happen but for safety)
        await db.collection('leaderboard').doc(userId).delete();
    }
    // Detection: New message or donation increase for Discord notifications
    const messageChanged = newMessage !== oldMessage && newMessage !== "";
    const donationIncreased = newDonations > oldDonations;
    const nameChanged = newDisplayName !== oldDisplayName;
    if (!messageChanged && !donationIncreased && !nameChanged)
        return;
    // Only send notification if it's a significant event (donation or message)
    if (!messageChanged && !donationIncreased)
        return;
    logger.info(`Notification trigger for ${userId}`, { messageChanged, donationIncreased });
    const embed = {
        title: donationIncreased ? "💰 New Support for Proxle!" : "📝 Message Pending Approval",
        color: donationIncreased ? 0x00ff7f : 0x00bfff, // Green for money, Blue for messages
        fields: [
            { name: "User", value: afterData.displayName || "Anonymous", inline: true },
            { name: "Email", value: afterData.email || "No email", inline: true },
            { name: "Total Donated", value: `$${newDonations.toFixed(2)}`, inline: true }
        ],
        timestamp: new Date().toISOString()
    };
    if (messageChanged) {
        embed.fields.push({ name: "Pending Message", value: `"${newMessage}"`, inline: false });
    }
    const payload = {
        username: "Proxle Bot",
        avatar_url: "https://proxle.app/oauth-logo.png",
        embeds: [embed],
        content: `[Open Nexus Control Dashboard](https://proxle.app/admin)`
    };
    try {
        const response = await fetch(discordWebhookUrl.value(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Discord API error: ${response.statusText}`);
        }
        logger.info("Discord notification sent successfully.");
    }
    catch (error) {
        logger.error("Failed to send Discord notification.", error);
    }
});
//# sourceMappingURL=notifications.js.map