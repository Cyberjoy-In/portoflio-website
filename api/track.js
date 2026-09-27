export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const data = req.body || {};

        // =========================
        // TELEGRAM CONFIG
        // =========================

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({
                error: "Telegram credentials are missing"
            });
        }

        // =========================
        // IP ADDRESS
        // =========================

        const forwardedFor =
            req.headers["x-forwarded-for"] ||
            req.headers["x-real-ip"] ||
            "";

        const ip =
            forwardedFor
                .split(",")[0]
                .trim() || "Unknown";

        // =========================
        // VERCEL LOCATION HEADERS
        // =========================

        const country =
            req.headers["x-vercel-ip-country"] || "Unknown";

        const region =
            req.headers["x-vercel-ip-country-region"] || "Unknown";

        const city =
            req.headers["x-vercel-ip-city"] || "Unknown";

        const timezone =
            req.headers["x-vercel-ip-timezone"] || "Unknown";

        // =========================
        // USER AGENT
        // =========================

        const userAgent =
            req.headers["user-agent"] || "Unknown";

        // =========================
        // CLIENT DATA
        // =========================

        const {
            page,
            referrer,
            screen,
            language,

            device,
            browser,
            os,

            duration,
            scrollDepth,

            sections,
            sectionTimes,

            actions,

            visitCount,
            entryPage,
            exitPage,

            latitude,
            longitude,
            accuracy,
            locationPermission,

            bot
        } = data;

        // =========================
        // FORMAT HELPERS
        // =========================

        const safe = (value, fallback = "Unknown") => {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return fallback;
            }

            return String(value);
        };

        const formatSeconds = (seconds) => {
            const total = Math.max(
                0,
                Number(seconds) || 0
            );

            const minutes = Math.floor(total / 60);
            const secs = Math.floor(total % 60);

            if (minutes === 0) {
                return `${secs}s`;
            }

            return `${minutes}m ${secs}s`;
        };

        // =========================
        // LOCATION
        // =========================

        let locationText = "";

        if (
            locationPermission === "granted" &&
            latitude !== undefined &&
            longitude !== undefined
        ) {
            locationText = `
📍 PRECISE LOCATION
Latitude: ${safe(latitude)}
Longitude: ${safe(longitude)}
Accuracy: ±${safe(accuracy, "Unknown")} m
Source: Browser Location
Permission: Granted
`;
        } else {
            locationText = `
📍 APPROX. LOCATION
City: ${safe(city)}
State: ${safe(region)}
Country: ${safe(country)}
Timezone: ${safe(timezone)}
Source: IP Geolocation
Confidence: Approximate
`;
        }

        // =========================
        // SECTIONS
        // =========================

        let sectionsText = "None";

        if (Array.isArray(sections) && sections.length > 0) {
            sectionsText = sections
                .map(section => `✓ ${section}`)
                .join("\n");
        }

        // =========================
        // SECTION TIME
        // =========================

        let sectionTimesText = "None";

        if (
            sectionTimes &&
            typeof sectionTimes === "object"
        ) {
            const entries = Object.entries(sectionTimes);

            if (entries.length > 0) {
                sectionTimesText = entries
                    .map(([section, seconds]) => {
                        return `${section}: ${formatSeconds(seconds)}`;
                    })
                    .join("\n");
            }
        }

        // =========================
        // ACTIONS
        // =========================

        let actionsText = "None";

        if (Array.isArray(actions) && actions.length > 0) {
            actionsText = actions
                .map(action => `✓ ${action}`)
                .join("\n");
        }

        // =========================
        // SECURITY
        // =========================

        const botStatus =
            bot === true || bot === "true"
                ? "Yes"
                : "No";

        // =========================
        // TELEGRAM MESSAGE
        // =========================

        const message = `
🔎 NEW PORTFOLIO VISITOR
━━━━━━━━━━━━━━━━━━━━

🕐 VISIT
Time: ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
        })}
Duration: ${safe(duration, "0s")}
Visit: ${safe(visitCount, "1")}
Entry: ${safe(entryPage, page || "/")}
Exit: ${safe(exitPage, page || "/")}
Referrer: ${safe(referrer, "Direct visit")}

🌐 NETWORK
IP: ${ip}
ISP: ${safe(req.headers["x-vercel-ip-isp"])}
ASN: ${safe(req.headers["x-vercel-ip-asn"])}

${locationText}

💻 DEVICE
Device: ${safe(device)}
OS: ${safe(os)}
Browser: ${safe(browser)}
Screen: ${safe(screen)}
Language: ${safe(language)}

📖 SECTIONS VIEWED
${sectionsText}

⏱️ SECTION TIME
${sectionTimesText}

📊 ENGAGEMENT
Scroll depth: ${safe(scrollDepth, "0%")}

🖱️ ACTIONS
${actionsText}

🤖 SECURITY
Bot/Crawler: ${botStatus}

━━━━━━━━━━━━━━━━━━━━
`;

        // =========================
        // TELEGRAM API
        // =========================

        const telegramURL =
            `https://api.telegram.org/bot${botToken}/sendMessage`;

        const telegramResponse = await fetch(
            telegramURL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            }
        );

        const telegramResult =
            await telegramResponse.json();

        if (!telegramResponse.ok) {
            console.error(
                "Telegram error:",
                telegramResult
            );

            return res.status(500).json({
                error: "Telegram message failed"
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        console.error(
            "Tracking server error:",
            error
        );

        return res.status(500).json({
            error: "Server error"
        });
    }
}
