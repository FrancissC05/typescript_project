export interface MetaWebhookBody {
    entry?: Array<{
        changes?: Array<{
            value?: {
                messages?: Array<MetaMessage>;
                metadata?: { phone_number_id?: string };
            };
        }>;
    }>;
}

export type MetaMessage = MetaTextMessage | MetaOtherMessage;

export interface MetaTextMessage {
    id: string;
    from: string;
    type: "text";
    text: { body: string };
}

export interface MetaOtherMessage {
    type: string;
    [k: string]: unknown;
}
