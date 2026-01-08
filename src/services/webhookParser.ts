import type { MetaWebhookBody, MetaMessage } from "../domain/metaWebhook";
import type { IncomingTextEvent } from "../domain/events";
import type { Result } from "../utils/result";

export function parseIncomingTextEvent(body: MetaWebhookBody): Result<IncomingTextEvent> {
    const entry0 = body.entry?.[0];
    if (!entry0) return { ok: false, reason: "Falta entry[0] en el payload", details: body };

    const change0 = entry0.changes?.[0];
    if (!change0) return { ok: false, reason: "Falta changes[0] en el payload", details: entry0 };

    const value = change0.value;
    if (!value) return { ok: false, reason: "Falta value en el payload", details: change0 };

    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) return { ok: false, reason: "Falta metadata.phone_number_id", details: value.metadata };

    const message0: MetaMessage | undefined = value.messages?.[0];
    if (!message0) {
        return { ok: false, reason: "No hay messages[0] (posible evento distinto a mensajes)", details: value };
    }

    if (message0.type !== "text") {
        return { ok: false, reason: `Mensaje no es texto (type=${message0.type})`, details: message0 };
    }

    const textBody = (message0 as any).text?.body;
    if (!textBody) return { ok: false, reason: "Falta text.body en el mensaje", details: message0 };

    return {
        ok: true,
        value: {
            kind: "text",
            messageId: (message0 as any).id,
            from: (message0 as any).from,
            body: textBody,
            phoneNumberId
        }
    };
}
