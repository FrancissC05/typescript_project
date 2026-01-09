import axios from "axios";
import { readFile } from "node:fs/promises";

export class WhatsAppApiService {
    constructor(
        private graphApiToken: string,
        private apiVersion: string = "v18.0"
    ) { }

    async sendTextReply(params: {
        phoneNumberId: string;
        to: string;
        replyToMessageId: string;
        text: string;
    }): Promise<void> {
        const { phoneNumberId, to, replyToMessageId, text } = params;

        await axios({
            method: "POST",
            url: `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`,
            headers: { Authorization: `Bearer ${this.graphApiToken}` },
            data: {
                messaging_product: "whatsapp",
                to,
                text: { body: text },
                context: { message_id: replyToMessageId }
            }
        });
    }

    // 1) SUBIR AUDIO A META -> media_id
    async uploadAudioFromFile(params: {
        phoneNumberId: string;
        filePath: string;
        mimeType: string; // ejemplo: "audio/mpeg" o "audio/ogg"
    }): Promise<string> {
        const { phoneNumberId, filePath, mimeType } = params;

        const fileBuffer = await readFile(filePath);
        const fileBlob = new Blob([fileBuffer], { type: mimeType });

        const form = new FormData();
        form.append("messaging_product", "whatsapp");
        form.append("file", fileBlob, filePath);

        const resp = await fetch(
            `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/media`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.graphApiToken}`
                    // NO pongas Content-Type aquí: fetch lo genera para multipart/form-data
                },
                body: form
            }
        );

        const data = (await resp.json()) as any;

        if (!resp.ok) {
            throw new Error(`Media upload failed (${resp.status}): ${JSON.stringify(data)}`);
        }

        if (!data?.id) {
            throw new Error(`Media upload did not return id: ${JSON.stringify(data)}`);
        }

        return data.id as string;
    }

    // 2) ENVIAR AUDIO USANDO media_id
    async sendAudioById(params: {
        phoneNumberId: string;
        to: string;
        replyToMessageId: string;
        mediaId: string;
    }): Promise<void> {
        const { phoneNumberId, to, replyToMessageId, mediaId } = params;

        await axios({
            method: "POST",
            url: `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`,
            headers: { Authorization: `Bearer ${this.graphApiToken}` },
            data: {
                messaging_product: "whatsapp",
                to,
                type: "audio",
                audio: { id: mediaId },
                context: { message_id: replyToMessageId }
            }
        });
    }
}
