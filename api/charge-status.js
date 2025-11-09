// api/charge-status.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { txid } = req.body;

  if (!txid) {
    return res.status(400).json({ error: "txid is required" });
  }

  const url = `https://pix-h.api.efipay.com.br/v2/cob/${txid}`;

  try {
    const auth = Buffer.from(
      `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao consultar cobrança:", error);
    res.status(500).json({ error: "Erro ao consultar cobrança" });
  }
}
