export interface IncomingTextEvent {
    kind: "text";
    messageId: string;
    from: string;
    body: string;
    phoneNumberId: string;
}
