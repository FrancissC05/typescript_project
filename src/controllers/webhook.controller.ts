import type { Request, Response } from "express";
import { env } from "../config/env";
import { parseIncomingTextEvent } from "../services/webhookParser";
import { WhatsAppApiService } from "../services/whatsappApi.service";
import { WebhookHandlerService } from "../services/webhookHandler.service";

// Instancias de servicios
const whatsappApi = new WhatsAppApiService(env.GRAPH_API_TOKEN);
const webhookHandler = new WebhookHandlerService(whatsappApi);

export function verifyWebhook(req: Request, res: Response) {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;

    const isValid = mode === "subscribe" && token === env.WEBHOOK_VERIFY_TOKEN;

    return isValid ? res.status(200).send(challenge) : res.sendStatus(403);
}

const shouldLogIgnoredWebhook = (reason: string): boolean =>
    !reason.startsWith("No hay messages");

export async function receiveWebhook(req: Request, res: Response): Promise<void> {
    // 1. Responder rápido a Meta
    res.sendStatus(200);

    try {
        // 2. Parsear el evento
        const parsed = parseIncomingTextEvent(req.body);

        // 3. Si no es válido, loguear y salir
        const logIfNeeded = (reason: string) => {
            shouldLogIgnoredWebhook(reason) && console.log("Webhook ignorado:", reason);
        };

        // 4. Si es válido, delegar TODO al service
        return parsed.ok
            ? await webhookHandler.processIncomingEvent(parsed.value)
            : logIfNeeded(parsed.reason);

    } catch (err) {
        console.error("Error en receiveWebhook:", err);
    }
}