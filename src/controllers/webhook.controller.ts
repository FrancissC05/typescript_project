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
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
}

export async function receiveWebhook(req: Request, res: Response) {
    // WhatsApp/Meta espera respuesta rápida para no reintentar/timeout
    res.sendStatus(200);

    try {
        const parsed = parseIncomingTextEvent(req.body);

        if (!parsed.ok) {
            if (!parsed.reason.startsWith("No hay messages[0]")) {
                console.log("Webhook ignorado:", parsed.reason);
            }
            return;
        }

        const msgEvent = parsed.value;
        const bodyLower = msgEvent.body.toLowerCase();

        if (bodyLower.includes("send music")) {
            if (!env.AUDIO_FILE_PATH) {
                console.log("AUDIO_FILE_PATH no configurada.");
                return;
            }

            const mediaId = await whatsappApi.uploadAudioFromFile({
                phoneNumberId: msgEvent.phoneNumberId,
                filePath: env.AUDIO_FILE_PATH,
                mimeType: "audio/mpeg"
            });

            await whatsappApi.sendAudioById({
                phoneNumberId: msgEvent.phoneNumberId,
                to: msgEvent.from,
                replyToMessageId: msgEvent.messageId,
                mediaId
            });
            return;

        } else if (bodyLower.includes("send money")) {
            await whatsappApi.sendTextReply({
                phoneNumberId: msgEvent.phoneNumberId,
                to: msgEvent.from,
                replyToMessageId: msgEvent.messageId,
                text: `Echo: ${msgEvent.body}`
            });
            return;

        } else {
            // opcional: respuesta por defecto
            await whatsappApi.sendTextReply({
                phoneNumberId: msgEvent.phoneNumberId,
                to: msgEvent.from,
                replyToMessageId: msgEvent.messageId,
                text: `Comando no reconocido. Prueba "send music" o "send money".`
            });
            return;
        }
    } catch (err) {
        console.error("Error en receiveWebhook:", err);
    }
}
