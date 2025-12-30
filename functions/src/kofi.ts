import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

// Ko-fi Verification Token (found in Ko-fi Webhook settings)
const kofiVerificationToken = defineSecret("KOFI_VERIFICATION_TOKEN");

export const kofiWebhook = onRequest({
    secrets: [kofiVerificationToken]
}, async (req, res) => {
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
    const db = getFirestore();

    if (email && amount > 0) {
        try {
            const usersRef = db.collection('users');
            const q = await usersRef.where('email', '==', email).get();

            if (!q.empty) {
                const userDoc = q.docs[0];
                const userData = userDoc.data();

                await userDoc.ref.update({
                    'donations.total': (userData.donations?.total || 0) + amount,
                    'donations.count': (userData.donations?.count || 0) + 1,
                    'lastDonationAt': new Date(),
                    'isSupporter': true
                });
                logger.info(`Successfully credited ${email} with $${amount}`);
            } else {
                logger.warn(`Donation received from ${email} but no matching user found in Firestore.`);
            }
        } catch (error) {
            logger.error("Firestore update error", error);
        }
    }

    // 3. Always return 200 to Ko-fi
    res.status(200).send("OK");
});
