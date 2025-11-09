// /api/create-charge.js
// Cria uma cobrança PIX (cobrança com QR dinâmico) na Efí e retorna:
// { txid, qrCodeBase64, copiaCola, expires_at }
// ATENÇÃO: ajuste EFI_AUTH_URL e EFI_API_URL conforme a doc oficial da Efí

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const USE_SUPABASE = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// helper: salva no DB (Supabase) ou em memória (somente para teste)
async function saveCharge(record) {
  if (USE_SUPABASE) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // chamada direta à tabela "charges" via REST do Supabase
    const resp = await axios.post(`${supabaseUrl}/rest/v1/charges`, record, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }
    });
    return resp.data[0];
  } else {
    // WARNING: in-memory store (não persiste entre invocações serverless)
    global.__EFI_CHARGES = global.__EFI_CHARGES || {};
    global.__EFI_CHARGES[record.txid] = record;
    return record;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, produtoId, valor } = req.body || {};
  if (!email || !valor) return res.status(400).json({ error: 'email e valor são obrigatórios' });

  try {
    // 1) Obter token (client_credentials)
    // Ajuste/valide o payload de acordo com a doc Efí
    const tokenResp = await axios.post(`${process.env.EFI_AUTH_URL}`, {
      client_id: process.env.EFI_CLIENT_ID,
      client_secret: process.env.EFI_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const accessToken = tokenResp.data.access_token;
    if (!accessToken) throw new Error('erro ao obter access_token da Efí');

    // 2) Criar cobrança (PIX cob) com validade 10 minutos
    const txid = `tx-${uuidv4()}`; // seu identificador interno (único)
    const now = Date.now();
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutos

    // NOTE: o body abaixo é um exemplo genérico. Ajuste conforme doc oficial Efí:
    const cobPayload = {
      txid,
      valor: valor.toString(),
      expiracao: 600, // segundos = 10 minutos
      infoAdicionais: [
        { nome: "email", valor: email },
        { nome: "produtoId", valor: produtoId || 'padrao' }
      ],
      // você pode incluir campo para exibir instruções ou referência
      // ex: descricao: 'Compra - Oferta R$6,99'
    };

    const cobResp = await axios.post(`${process.env.EFI_API_URL}/pix/cob`, cobPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // resposta esperada (ajuste conforme retorno real da Efí)
    // supondo que cobResp.data contenha: { txid, qrCodeBase64, copiaCola, expires_at }
    const data = cobResp.data;

    // fallback se não vier qr em base64: pode vir um payload para gerar QRCODE
    // mantenha os campos que vamos retornar ao front:
    const result = {
      txid: data.txid || txid,
      qrCodeBase64: data.qrCodeBase64 || data.qr || null,
      copiaCola: data.copiaCola || data.payload || data.qr || null,
      expires_at: data.expires_at || expiresAt,
      raw: data
    };

    // 3) salvar no DB (status pending)
    const record = {
      txid: result.txid,
      email,
      produtoId: produtoId || null,
      valor: result.raw?.valor || valor,
      status: 'pending',
      expires_at: result.expires_at,
      created_at: new Date().toISOString()
    };

    await saveCharge(record);

    return res.json(result);

  } catch (err) {
    console.error('create-charge error:', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'erro ao criar cobrança', detail: err.response?.data || err.message });
  }
};
