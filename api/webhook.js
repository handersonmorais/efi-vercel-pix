// api/webhook.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notificacao = req.body;

    console.log("📢 Webhook recebido:", notificacao);

    // Aqui você pode salvar no Supabase, enviar e-mail, etc.
    // Por enquanto, só confirma o recebimento.
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
}
