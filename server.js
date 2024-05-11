const express = require("express");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();
const port = 3000;
let capturedImage = null;

app.use(express.json());
app.use(cors());

app.post("/buscar-perfil", async (req, res) => {
  const username = req.body.username;
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.instagram.com/${username}/`);
    await page.setViewport({ width: 375, height: 812 });
    await delay(3000);
    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });
    console.log("Print da tela capturado com sucesso.");
    capturedImage = Buffer.from(screenshotBase64, "base64");
    await browser.close();
    res.status(200).send("Captura realizada com sucesso.");
  } catch (error) {
    console.error("Erro durante a verificação:", error);
    res.status(500).json({ error: "Erro ao verificar o Instagram." });
  }
});

app.get("/obter-imagem", async (req, res) => {
  if (!capturedImage) {
    res.status(404).send("Imagem não encontrada.");
    return;
  }
  await delay(500);
  res.setHeader("Content-Type", "image/jpeg");
  res.send(capturedImage);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
