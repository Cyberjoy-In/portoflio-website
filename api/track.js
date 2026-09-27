export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const {
            page,
            referrer,
            screen,
            language
        } = req.body || {};

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({
                error: "Telegram configuration missing"
            });
        }

        // Vercel-provided country information
        const country =
            req.headers["x-vercel-ip-country"] || "Unknown";

        const userAgent =
            req.headers["user-agent"] || "Unknown";

        const message = `
🔔 New Portfolio Visit

📄 Page: ${page || "Unknown"}
🌍 Country: ${country}
💻 Screen: ${screen || "Unknown"}
🌐 Language: ${language || "Unknown"}

🔗 Referrer:
${referrer || "Direct visit"}

🖥 Browser:
${userAgent}

🕐 Time:
${new Date().toISOString()}
        `;

        const telegramURL =
            `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(result);

            return res.status(500).json({
                error: "Telegram message failed"
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });
    }
}
