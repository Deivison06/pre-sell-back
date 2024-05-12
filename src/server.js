require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();
const port = process.env.PORT_APP;
let capturedImage = null;
const corsOptions = {
  origin: "https://pre.instapower.app.br/", // Permitir apenas solicitações deste domínio
  methods: ["GET", "POST"], // Permitir apenas métodos GET e POST
};

app.use(cors(corsOptions)); // Aplicar as opções CORS

app.use(express.json()); // Middleware para parsing de JSON

app.post("/buscar-perfil", async (req, res) => {
  const username = req.body.username;
  try {
    console.log(`Iniciando a captura do perfil ${username}`);
    const browser = await puppeteer.launch({headless});
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.setViewport({ width: 375, height: 812 });
    console.log("Aguardando 3 segundos para carregamento completo da página...");
    await delay(3000); // Aguarda 3 segundos para garantir o carregamento completo da página
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });
    console.log("Print da tela capturado com sucesso.");
    capturedImage = Buffer.from(screenshotBase64, "base64");
    await browser.close();
    console.log(`Captura do perfil ${username} concluída.`);
    res.status(200).send("Captura realizada com sucesso.");
  } catch (error) {
    console.error("Erro durante a verificação:", error);
    res.status(500).json({ error: "Erro ao verificar o Instagram." });
  }
});

app.get("/obter-imagem", async (req, res) => {
  console.log("Solicitando imagem capturada...");
  if (!capturedImage) {
    console.log("Imagem não encontrada.");
    res.status(404).send("Imagem não encontrada.");
    return;
  }
  await delay(500);
  console.log("Enviando imagem capturada para o cliente...");
  res.setHeader("Content-Type", "image/jpeg");
  res.send(capturedImage);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
