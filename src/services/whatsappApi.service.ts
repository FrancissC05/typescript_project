import axios from "axios";

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
            headers: {
                Authorization: `Bearer ${this.graphApiToken}`
            },
            data: {
                messaging_product: "whatsapp",
                to,
                text: { body: text },
                context: { message_id: replyToMessageId }
            }
        });
    }
}
