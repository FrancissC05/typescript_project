import type { Request, Response } from "express";
import { env } from "../config/env";
import { parseIncomingTextEvent } from "../services/webhookParser";
import { WhatsAppApiService } from "../services/whatsappApi.service";

const whatsappApi = new WhatsAppApiService(env.GRAPH_API_TOKEN);

export function verifyWebhook(req: Request, res: Response) {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response) {
    // Regla práctica: responder rápido a Meta
    res.sendStatus(200);

    try {
        const parsed = parseIncomingTextEvent(req.body);

        if (!parsed.ok) {
            console.log("Webhook ignorado:", parsed.reason);
            return;
        }

        const event = parsed.value;

        // Aquí va tu “regla” (sin ifs anidados)
        const bodyLower = event.body.toLowerCase();
        if (!bodyLower.includes("send money")) return;

        await whatsappApi.sendTextReply({
            phoneNumberId: event.phoneNumberId,
            to: event.from,
            replyToMessageId: event.messageId,
            text: `Echo: ${event.body}`
        });
    } catch (err) {
        console.error("Error procesando webhook:", err);
    }
}
