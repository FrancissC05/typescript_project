import { WhatsAppApiService } from "./whatsappApi.service";
import type {IncomingTextEvent, IncomingTextMessage, IncomingButtonClick, ActionContext} from "../domain/events";
import { createActionContext as createContext } from "../domain/events";
import { env } from "../config/env";

type ActionHandler = (ctx: ActionContext) => Promise<void>;

type TextMatcher = {
    match: (text: string) => boolean;
    handler: ActionHandler;
};

export class WebhookHandlerService {
    constructor(private whatsappApi: WhatsAppApiService) {}

    private sendMusicAction: ActionHandler = async (ctx) => {
        const audioPath = env.AUDIO_FILE_PATH;

        const executeUploadAndSend = async (path: string) => {
            const mediaId = await this.whatsappApi.uploadAudioFromFile({
                phoneNumberId: ctx.phoneNumberId,
                filePath: path,
                mimeType: "audio/mpeg"
            });

            await this.whatsappApi.sendAudioById({
                phoneNumberId: ctx.phoneNumberId,
                to: ctx.from,
                replyToMessageId: ctx.messageId,
                mediaId
            });
        };

        const logMissingConfig = () => console.log("AUDIO_FILE_PATH no configurada.");

        return audioPath ? await executeUploadAndSend(audioPath) : logMissingConfig();
    };

    private sendMoneyAction: ActionHandler = async (ctx) => {
        await this.whatsappApi.sendTextReply({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.from,
            replyToMessageId: ctx.messageId,
            text: "Opción SEND_MONEY seleccionada. (Aquí va tu lógica real)."
        });
    };

    private showMenuAction: ActionHandler = async (ctx) => {
        await this.whatsappApi.sendMenuButtons({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.from,
            replyToMessageId: ctx.messageId
        });
    };

    private sendHelpMessage: ActionHandler = async (ctx) => {
        await this.whatsappApi.sendTextReply({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.from,
            replyToMessageId: ctx.messageId,
            text: 'Escribe "menu" para ver opciones, o usa "send music" / "send money".'
        });
    };

    private createUnknownButtonHandler = (buttonId: string): ActionHandler =>
        async (ctx) => {
            await this.whatsappApi.sendTextReply({
                phoneNumberId: ctx.phoneNumberId,
                to: ctx.from,
                replyToMessageId: ctx.messageId,
                text: `Botón no reconocido: ${buttonId}`
            });
        };

    private readonly textStrategies: ReadonlyArray<TextMatcher> = [
        {
            match: (text) => text.includes("menu") || text.includes("start"),
            handler: this.showMenuAction
        },
        {
            match: (text) => text.includes("send music"),
            handler: this.sendMusicAction
        },
        {
            match: (text) => text.includes("send money"),
            handler: this.sendMoneyAction
        }
    ] as const;

    private readonly buttonHandlers: Readonly<Record<string, ActionHandler>> = {
        SEND_MUSIC: this.sendMusicAction,
        SEND_MONEY: this.sendMoneyAction
    } as const;

    /**
     * Procesa mensajes de texto del usuario
     * Busca en las estrategias definidas cuál aplicar según el contenido
     */
    async handleTextMessage(event: IncomingTextMessage): Promise<void> {
        const bodyLower = event.body.toLowerCase();
        const context = createContext(event);

        const strategy = this.textStrategies.find(s => s.match(bodyLower));
        const handler = strategy?.handler ?? this.sendHelpMessage;

        await handler(context);
    }

    /**
     * Procesa clicks en botones interactivos
     * Busca el handler correspondiente al buttonId o usa el handler de error
     */
    async handleButtonClick(event: IncomingButtonClick): Promise<void> {
        const context = createContext(event);
        const handler = this.buttonHandlers[event.buttonId] ?? this.createUnknownButtonHandler(event.buttonId);

        await handler(context);
    }

    /**
     * Punto de entrada principal para procesar cualquier evento
     * Delega al procesador específico según el tipo de evento
     */
    async processIncomingEvent(event: IncomingTextEvent): Promise<void> {
        const processors: Readonly<Record<IncomingTextEvent["kind"], (e: IncomingTextEvent) => Promise<void>>> = {
            text: (e) => this.handleTextMessage(e as IncomingTextMessage),
            button: (e) => this.handleButtonClick(e as IncomingButtonClick)
        };

        const processor = processors[event.kind];
        
        return processor 
            ? await processor(event)
            : console.log("Evento no soportado:", event);
    }
}