import "dotenv/config";

export const env = {
    PORT: Number(process.env.PORT ?? 3000),
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN ?? "",
    GRAPH_API_TOKEN: process.env.GRAPH_API_TOKEN ?? ""
};

if (!env.WEBHOOK_VERIFY_TOKEN) {
    console.warn("Aviso: falta WEBHOOK_VERIFY_TOKEN en .env");
}
if (!env.GRAPH_API_TOKEN) {
    console.warn("Aviso: falta GRAPH_API_TOKEN en .env (solo necesario si vas a responder con Graph API)");
}
