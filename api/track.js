export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({
                success: false,
                error: "Telegram credentials are missing"
            });
        }

        const data = req.body || {};

        // ==================================================
        // REQUEST / NETWORK INFORMATION
        // ==================================================

        const forwardedFor = req.headers["x-forwarded-for"];

        const ip = forwardedFor
            ? String(forwardedFor).split(",")[0].trim()
            : req.headers["x-real-ip"] ||
              req.socket?.remoteAddress ||
              "Unknown";

        const country =
            req.headers["x-vercel-ip-country"] ||
            "Unknown";

        const region =
            req.headers["x-vercel-ip-country-region"] ||
            "Unknown";

        const city =
            req.headers["x-vercel-ip-city"] ||
            "Unknown";

        const timezone =
            req.headers["x-vercel-ip-timezone"] ||
            data.timezone ||
            "Unknown";

        const isp =
            req.headers["x-vercel-ip-isp"] ||
            data.isp ||
            "Unavailable";

        const asn =
            req.headers["x-vercel-ip-asn"] ||
            data.asn ||
            "Unavailable";

        const userAgent =
            req.headers["user-agent"] ||
            "Unknown";


        // ==================================================
        // EVENT TYPE
        // ==================================================

        const eventType =
            data.eventType || "visit";


        // ==================================================
        // VISITOR INFORMATION
        // ==================================================

        const device =
            data.device || "Unknown";

        const browser =
            data.browser || "Unknown";

        const os =
            data.os || "Unknown";

        const screen =
            data.screen || "Unknown";

        const language =
            data.language || "Unknown";

        const visitCount =
            data.visitCount || 1;

        const bot =
            data.bot === true ||
            data.bot === "true";


        // ==================================================
        // PAGE / SESSION
        // ==================================================

        const page =
            data.page || "/";

        const entryPage =
            data.entryPage || page;

        const exitPage =
            data.exitPage ||
            page;

        const referrer =
            data.referrer ||
            "Direct";

        const duration =
            data.duration ||
            "0s";

        const maxScroll =
            typeof data.maxScroll === "number"
                ? `${Math.max(0, Math.min(100, data.maxScroll))}%`
                : `${data.maxScroll || 0}%`;


        // ==================================================
        // SECTIONS
        // ==================================================

        const sections =
            Array.isArray(data.sections)
                ? data.sections
                : [];

        const sectionTimes =
            data.sectionTimes &&
            typeof data.sectionTimes === "object"
                ? data.sectionTimes
                : {};

        // ==================================================
        // ACTIONS
        // ==================================================

        const actions =
            Array.isArray(data.actions)
                ? data.actions
                : [];


        // ==================================================
        // CERTIFICATE ACTIVITY
        // ==================================================

        const certificates =
            Array.isArray(data.certificates)
                ? data.certificates
                : [];


        // ==================================================
        // DATE / TIME
        // ==================================================

        const now = new Date();

        const date = now.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const time = now.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });


        // ==================================================
        // LOCATION
        // ==================================================

        let approximateLocation = [
            city,
            region,
            country
        ]
            .filter(
                value =>
                    value &&
                    value !== "Unknown"
            )
            .join(", ");

        if (!approximateLocation) {
            approximateLocation =
                "Unavailable";
        }


        // ==================================================
        // CLEAN REFERRER
        // ==================================================

        let cleanReferrer =
            String(referrer);

        if (
            cleanReferrer &&
            cleanReferrer !== "Direct"
        ) {
            try {
                const url =
                    new URL(cleanReferrer);

                cleanReferrer =
                    url.hostname +
                    url.pathname;
            } catch {
                // Keep original value
            }
        }


        // ==================================================
        // FORMAT SECTION JOURNEY
        // ==================================================

        let sectionJourney = "None";

        if (sections.length > 0) {
            sectionJourney = sections
                .map(section => {
                    if (
                        typeof section === "string"
                    ) {
                        return section;
                    }

                    return (
                        section.name ||
                        "Unknown"
                    );
                })
                .join(" → ");
        }


        // ==================================================
        // FORMAT SECTION TIMES
        // ==================================================

        let sectionTimeText = "None";

        const sectionTimeEntries =
            Object.entries(sectionTimes);

        if (sectionTimeEntries.length > 0) {
            sectionTimeText =
                sectionTimeEntries
                    .map(([name, seconds]) => {
                        return `${name} · ${formatDuration(seconds)}`;
                    })
                    .join("\n");
        }


        // ==================================================
        // FORMAT ACTIONS
        // ==================================================

        let actionText = "None";

        if (actions.length > 0) {
            actionText = actions
                .map(action => {
                    if (
                        typeof action === "string"
                    ) {
                        return action;
                    }

                    return (
                        action.name ||
                        action.action ||
                        "Unknown"
                    );
                })
                .join(" · ");
        }


        // ==================================================
        // FORMAT CERTIFICATES
        // ==================================================

        let certificateText = "None";

        if (certificates.length > 0) {
            certificateText =
                certificates
                    .map(cert => {
                        const name =
                            cert.name ||
                            cert.title ||
                            "Certificate";

                        const viewed =
                            cert.viewed === true ||
                            cert.viewed === "true";

                        const seconds =
                            cert.duration ??
                            cert.viewTime ??
                            null;

                        if (
                            viewed &&
                            seconds !== null
                        ) {
                            return `👁 ${name} · ${formatDuration(seconds)}`;
                        }

                        if (viewed) {
                            return `👁 ${name}`;
                        }

                        return `○ ${name}`;
                    })
                    .join("\n");
        }


        // ==================================================
        // SECURITY STATUS
        // ==================================================

        const securityStatus = bot
            ? "🤖 Automated client suspected"
            : "👤 Human browser";

        // ==================================================
        // MESSAGE: NEW VISITOR
        // ==================================================

        if (eventType === "visit") {

            const message = [
                `🌐  <b>New visitor</b>`,
                ``,
                `🟢 Active now`,
                `${escapeHtml(browser)} · ${escapeHtml(os)} · ${escapeHtml(device)}`,
                ``,
                `📍 ${escapeHtml(approximateLocation)}`,
                `🌐 <code>${escapeHtml(ip)}</code>`,
                `🏢 ${escapeHtml(isp)} · ${escapeHtml(asn)}`,
                `🕐 ${escapeHtml(timezone)}`,
                ``,
                `━━━━━━━━━━━━━━━━`,
                ``,
                `📄 <b>Portfolio</b>`,
                `${escapeHtml(page)} · ${escapeHtml(cleanReferrer)}`,
                `👁 Visit #${escapeHtml(String(visitCount))}`,
                ``,
                `🖥 ${escapeHtml(screen)}`,
                `🗣 ${escapeHtml(language)}`,
                `🕐 ${escapeHtml(time)} · ${escapeHtml(date)}`,
                ``,
                `━━━━━━━━━━━━━━━━`,
                ``,
                `🔐 <b>Security</b>`,
                `${escapeHtml(securityStatus)}`
            ].join("\n");


            return await sendTelegram(
                res,
                botToken,
                chatId,
                message
            );
        }


        // ==================================================
        // MESSAGE: FINAL SESSION SUMMARY
        // ==================================================

        if (eventType === "summary") {

            const message = [
                `📊  <b>Session completed</b>`,
                ``,
                `🔴 Ended · ${escapeHtml(time)}`,
                `Duration · ${escapeHtml(String(duration))}`,
                ``,
                `${escapeHtml(browser)} · ${escapeHtml(os)} · ${escapeHtml(device)}`,
                `Visit #${escapeHtml(String(visitCount))}`,
                ``,
                `📍 ${escapeHtml(approximateLocation)}`,
                `🌐 <code>${escapeHtml(ip)}</code>`,
                `🏢 ${escapeHtml(isp)} · ${escapeHtml(asn)}`,
                ``,
                `━━━━━━━━━━━━━━━━`,
                ``,
                `📄 <b>Journey</b>`,
                `${escapeHtml(sectionJourney)}`,
                ``,
                `⏱ <b>Time spent</b>`,
                `${escapeHtml(sectionTimeText)}`,
                ``,
                `🖱 <b>Clicks</b>`,
                `${escapeHtml(actionText)}`,
                ``,
                `📜 <b>Maximum scroll</b>`,
                escapeHtml(maxScroll),
                ``,
                `📜 <b>Certificates</b>`,
                escapeHtml(certificateText),
                ``,
                `🚪 <b>Exit</b>`,
                escapeHtml(exitPage),
                ``,
                `━━━━━━━━━━━━━━━━`,
                ``,
                `🔐 <b>Security</b>`,
                `${escapeHtml(securityStatus)}`
            ].join("\n");


            return await sendTelegram(
                res,
                botToken,
                chatId,
                message
            );
        }


        // ==================================================
        // UNKNOWN EVENT
        // ==================================================

        return res.status(400).json({
            success: false,
            error: "Unknown event type"
        });


    } catch (error) {

        console.error(
            "Tracking server error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Tracking server error"
        });
    }
}


// ======================================================
// TELEGRAM
// ======================================================

async function sendTelegram(
    res,
    botToken,
    chatId,
    message
) {
    const telegramURL =
        `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response =
        await fetch(telegramURL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
                disable_web_page_preview: true
            })
        });

    const result =
        await response.json();

    if (!response.ok) {

        console.error(
            "Telegram error:",
            result
        );

        return res.status(500).json({
            success: false,
            error: "Telegram message failed"
        });
    }

    return res.status(200).json({
        success: true,
        messageId:
            result.result?.message_id || null
    });
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// DURATION
// ======================================================

function formatDuration(seconds) {

    const total =
        Math.max(
            0,
            Math.round(
                Number(seconds) || 0
            )
        );

    const minutes =
        Math.floor(total / 60);

    const remaining =
        total % 60;

    if (minutes === 0) {
        return `${remaining}s`;
    }

    return `${minutes}m ${remaining}s`;
}
