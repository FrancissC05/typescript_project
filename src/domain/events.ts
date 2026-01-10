export type IncomingTextEvent =
    | {
        kind: "text";
        messageId: string;
        from: string;
        body: string;
        phoneNumberId: string;
    }
    | {
        kind: "button";
        messageId: string;
        from: string;
        buttonId: string;
        phoneNumberId: string;
    };
