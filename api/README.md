# 💸 Integração PIX com Efí (Gerencianet) + Vercel

Este projeto cria uma API simples hospedada na **Vercel**, capaz de gerar QR Codes PIX via **Efí Bank (Gerencianet)**.

---

## ⚙️ Endpoints disponíveis

| Rota | Função |
|------|--------|
| `/api/create-charge` | Cria uma nova cobrança PIX e retorna o QR Code e o código copia e cola |
| `/api/charge-status` | Consulta o status de uma cobrança existente (aguardando, paga etc.) |
| `/api/webhook` | Recebe notificações automáticas da Efí quando um pagamento é confirmado |

---

## 🧩 Variáveis de ambiente necessárias

Na **Vercel**, acesse **Settings → Environment Variables** e adicione estas variáveis:

| Nome | Valor | Exemplo |
|------|--------|----------|
| `EFI_CLIENT_ID` | Seu Client ID da Efí | `Client_Id_xxx...` |
| `EFI_CLIENT_SECRET` | Seu Client Secret da Efí | `Client_Secret_xxx...` |
| `EFI_CERT_BASE64` | Certificado `.pem` convertido em base64 (opcional por enquanto) | — |

> ⚠️ O `EFI_CERT_BASE64` é usado apenas se você quiser usar autenticação com certificado.  
> No sandbox, só `CLIENT_ID` e `CLIENT_SECRET` bastam!

---

## 🧪 Testando o endpoint

Após conectar o projeto à Vercel:

1. Vá até:  
https://seu-projeto.vercel.app/api/create-charge

pgsql
Copiar código
2. Envie uma requisição **POST** com JSON:
```json
{
  "valor": 6.99,
  "descricao": "Oferta Especial"
}
A resposta conterá:

json
Copiar código
{
  "qr_code": "string",
  "copia_cola": "string",
  "expira_em": "10 minutos"
}
💡 Dicas
As URLs começam com: https://seu-projeto.vercel.app/api/...

Você pode usar isso direto na sua página do Gemini Build, para gerar e exibir o QR Code.

O webhook (/api/webhook) pode ser usado futuramente para marcar pagamento automático.

🚀 Deploy
Conecte este repositório na Vercel.

Vá em Settings → Environment Variables e adicione as 3 variáveis.

Clique em Deploy.

Teste acessando:

arduino
Copiar código
https://seu-projeto.vercel.app/api/create-charge
Feito com ❤️ por Handerson + Doug ⚡






