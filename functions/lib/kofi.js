"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kofiWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
// Ko-fi Verification Token (found in Ko-fi Webhook settings)
const kofiVerificationToken = (0, params_1.defineSecret)("KOFI_VERIFICATION_TOKEN");
exports.kofiWebhook = (0, https_1.onRequest)({
    secrets: [kofiVerificationToken]
}, async (req, res) => {
    var _a, _b;
    // Ko-fi sends data as application/x-www-form-urlencoded
    // But they often wrap the JSON in a 'data' field
    const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
    logger.info("Received Ko-fi Webhook", payload);
    // 1. Verification
    // Note: Ko-fi sends the verification token in the 'verification_token' field of the JSON
    if (payload.verification_token !== kofiVerificationToken.value()) {
        logger.error("Invalid Ko-fi Verification Token");
        res.status(401).send("Unauthorized");
        return;
    }
    // 2. Identify the user (Proxle uses Email or custom name)
    // We'll try to find the user by email first
    const email = (payload.email || "").toLowerCase();
    const amount = parseFloat(payload.amount || "0");
    const db = (0, firestore_1.getFirestore)();
    if (email && amount > 0) {
        try {
            const usersRef = db.collection('users');
            const q = await usersRef.where('email', '==', email).get();
            if (!q.empty) {
                const userDoc = q.docs[0];
                const userData = userDoc.data();
                const isPublic = payload.is_public === true || payload.is_public === "1" || payload.is_public === 1;
                const newMessage = payload.message || null;
                const updateData = {
                    'donations.total': (((_a = userData.donations) === null || _a === void 0 ? void 0 : _a.total) || 0) + amount,
                    'donations.count': (((_b = userData.donations) === null || _b === void 0 ? void 0 : _b.count) || 0) + 1,
                    'lastDonationAt': new Date(),
                    'isSupporter': true,
                    'isAnonymous': !isPublic,
                    'leaderboardName': payload.from_name || userData.displayName || "Supporter"
                };
                if (newMessage) {
                    updateData['message'] = newMessage;
                    updateData['messageApprovalStatus'] = 'pending';
                }
                await userDoc.ref.update(updateData);
                logger.info(`Successfully credited ${email} with $${amount}`);
            }
            else {
                logger.warn(`Donation received from ${email} but no matching user found in Firestore.`);
            }
        }
        catch (error) {
            logger.error("Firestore update error", error);
        }
    }
    // 3. Always return 200 to Ko-fi
    res.status(200).send("OK");
});
//# sourceMappingURL=kofi.js.map