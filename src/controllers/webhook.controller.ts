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
    // Meta espera respuesta rápida
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

        // 1) EVENTO TEXTO
        if (msgEvent.kind === "text") {
            const bodyLower = msgEvent.body.toLowerCase();

            // Trigger para mostrar menú
            if (bodyLower.includes("menu") || bodyLower.includes("start")) {
                await whatsappApi.sendMenuButtons({
                    phoneNumberId: msgEvent.phoneNumberId,
                    to: msgEvent.from,
                    replyToMessageId: msgEvent.messageId
                });
                return;
            }

            // Comandos por texto (tu lógica actual)
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
            }

            if (bodyLower.includes("send money")) {
                await whatsappApi.sendTextReply({
                    phoneNumberId: msgEvent.phoneNumberId,
                    to: msgEvent.from,
                    replyToMessageId: msgEvent.messageId,
                    text: `Echo: ${msgEvent.body}`
                });
                return;
            }

            // Fallback para texto
            await whatsappApi.sendTextReply({
                phoneNumberId: msgEvent.phoneNumberId,
                to: msgEvent.from,
                replyToMessageId: msgEvent.messageId,
                text: `Escribe "menu" para ver opciones, o usa "send music" / "send money".`
            });
            return;
        }

        // 2) EVENTO BOTÓN
        if (msgEvent.kind === "button") {
            // Mapear IDs de botones a acciones
            if (msgEvent.buttonId === "SEND_MUSIC") {
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
            }

            if (msgEvent.buttonId === "SEND_MONEY") {
                await whatsappApi.sendTextReply({
                    phoneNumberId: msgEvent.phoneNumberId,
                    to: msgEvent.from,
                    replyToMessageId: msgEvent.messageId,
                    text: "Opción SEND_MONEY seleccionada. (Aquí va tu lógica real)."
                });
                return;
            }

            // Botón desconocido
            await whatsappApi.sendTextReply({
                phoneNumberId: msgEvent.phoneNumberId,
                to: msgEvent.from,
                replyToMessageId: msgEvent.messageId,
                text: `Botón no reconocido: ${msgEvent.buttonId}`
            });
            return;
        }

        // Si llega un kind no soportado (por si amplías en el futuro)
        console.log("Evento no soportado:", msgEvent);
    } catch (err) {
        console.error("Error en receiveWebhook:", err);
    }
}
