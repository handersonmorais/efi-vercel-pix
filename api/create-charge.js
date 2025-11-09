// api/create-charge.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { amount, description, email } = req.body || {};
  // amount em centavos (ex: 699) ou número (aceita 699)
  const valorCents = Number(amount) || 699;

  try {
    // 1) pega token (client credentials) — usa a URL da sandbox via ENV
    const authUrl = process.env.EFI_AUTH_URL;
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResp = await fetch(authUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ grant_type: "client_credentials" })
    });

    const tokenJson = await tokenResp.json();
    if (!tokenResp.ok) {
      return res.status(400).json({ error: "Falha ao obter token", details: tokenJson });
    }
    const accessToken = tokenJson.access_token;

    // 2) criar cobrança (cob) — endpoint base vem da ENV
    const apiBase = process.env.EFI_API_URL; // ex: https://pix-h.api.efipay.com.br/v2
    const createCobUrl = `${apiBase}/cob`;

    // corpo conforme spec Efipay (calendario.expiracao em segundos)
    const payload = {
      calendario: { expiracao: 600 }, // 10 minutos
      valor: { original: (valorCents / 100).toFixed(2) }, // ex: "6.99"
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: description || "Oferta R$6,99",
      infoAdicionais: [
        { nome: "email", valor: email || "nao-informado" }
      ]
    };

    const cobResp = await fetch(createCobUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const cobJson = await cobResp.json();
    if (!cobResp.ok) {
      return res.status(400).json({ error: "Erro ao criar cobrança", details: cobJson });
    }

    // 3) normalizar resposta para o front
    // Efipay sandbox costuma retornar dados com campos como: txid, calendario, location, pixCopiaECola
    const result = {
      txid: cobJson.txid || cobJson.location?.id || null,
      status: cobJson.status || "ATIVA",
      copiaCola: cobJson.pixCopiaECola || cobJson.qrCode || cobJson.payload || null,
      raw: cobJson
    };

    // algumas vezes o QR precisa ser gerado pelo front com o payload; devolvemos o payload
    return res.status(200).json(result);

  } catch (err) {
    console.error("create-charge error:", err);
    return res.status(500).json({ error: "Erro ao criar cobrança", details: err.message });
  }
}
