export type ActionContext = {
    /** ID del número de teléfono de WhatsApp Business */
    phoneNumberId: string;
    /** Número de teléfono del usuario que envió el mensaje */
    from: string;
    /** ID del mensaje al que se responderá */
    messageId: string;
};

/**
 * Eventos que pueden llegar desde WhatsApp
 * - text: Mensaje de texto del usuario
 * - button: Click en un botón interactivo
 */
export type IncomingTextEvent =
    | IncomingTextMessage
    | IncomingButtonClick;

/**
 * Mensaje de texto enviado por el usuario
 */
export type IncomingTextMessage = {
    kind: "text";
    messageId: string;
    from: string;
    body: string;
    phoneNumberId: string;
};

/**
 * Click en un botón interactivo
 */
export type IncomingButtonClick = {
    kind: "button";
    messageId: string;
    from: string;
    buttonId: string;
    phoneNumberId: string;
};

export function createActionContext(event: IncomingTextEvent): ActionContext {
    return {
        phoneNumberId: event.phoneNumberId,
        from: event.from,
        messageId: event.messageId
    };
}

/**
 * Type guards para trabajar con eventos de forma segura
 */
export function isTextMessage(event: IncomingTextEvent): event is IncomingTextMessage {
    return event.kind === "text";
}

export function isButtonClick(event: IncomingTextEvent): event is IncomingButtonClick {
    return event.kind === "button";
}