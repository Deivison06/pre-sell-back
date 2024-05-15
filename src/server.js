require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const tmp = require("tmp");
const fs = require("fs");
const app = express();
const port = 3000;
const capturedImages = {}; // Armazena imagens capturadas por username
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/buscar-perfil", async (req, res) => {
  const username = req.body.username;
  try {
    console.log(`Iniciando a captura do perfil ${username}`);
    // Crie um diretório temporário
    const tmpDir = tmp.dirSync();
    
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      userDataDir: tmpDir.name
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.999 Safari/537.36');
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.setViewport({ width: 375, height: 812 });
    console.log("Aguardando 3 segundos para carregamento completo da página...");
    await delay(7000); // Aguarda 3 segundos para garantir o carregamento completo da página
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });
    console.log("Print da tela capturado com sucesso.");
    capturedImages[username] = Buffer.from(screenshotBase64, "base64");
    await browser.close();
    console.log(`Captura do perfil ${username} concluída.`);
    
    // Limpa o diretório temporário
    fs.rm(tmpDir.name, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error("Erro ao remover diretório temporário:", err);
      } else {
        console.log(`Diretório temporário ${tmpDir.name} removido com sucesso.`);
      }
    });

    res.status(200).send("Captura realizada com sucesso.");
  } catch (error) {
    console.error("Erro durante a verificação:", error);
    res.status(500).json({ error: "Erro ao verificar o Instagram." });
  }
});

app.get("/obter-imagem", async (req, res) => {
  const username = req.query.username;
  console.log(`Solicitando imagem capturada para ${username}...`);
  if (!capturedImages[username]) {
    console.log("Imagem não encontrada.");
    res.status(404).send("Imagem não encontrada.");
    return;
  }
  await delay(500);
  console.log(`Enviando imagem capturada para ${username}...`);
  res.setHeader("Content-Type", "image/jpeg");
  res.send(capturedImages[username]);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
