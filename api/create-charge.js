// api/create-charge.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { amount, description } = req.body;

  try {
    const clientId = process.env.EFI_CLIENT_ID;
    const clientSecret = process.env.EFI_CLIENT_SECRET;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // 🔹 CORRIGIDO AQUI:
    const tokenResponse = await fetch("https://pix.efi.com.br/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json({ error: "Falha ao obter token", details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // 🔹 CORRIGIDO AQUI:
    const chargeResponse = await fetch("https://pix.efi.com.br/v2/cob", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendario: { expiracao: 600 },
        valor: { original: (amount / 100).toFixed(2) },
        chave: "51700dfc-4383-4c2f-a6a6-f1e79b8237a2",
        solicitacaoPagador: description || "Oferta R$6,99",
      }),
    });

    const chargeData = await chargeResponse.json();
    res.status(200).json(chargeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cobrança", details: error.message });
  }
}
