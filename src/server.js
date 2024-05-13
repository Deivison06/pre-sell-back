require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const app = express();
const port = 3000;
let capturedImage = null;
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.post("/buscar-perfil", async (req, res) => {
  const username = req.body.username;
  const user = 'deivison_santtosg';
  const password = 'Senha@123';
  
  try {
    console.log(`Iniciando a captura do perfil ${username}`);
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    
    // Navigate to Instagram and login
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
    
    console.log(`Iniciando login ${username}`);
   
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', user);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]');
    console.log(`login feito ${username}`);
    
    // Aguardar um segundo após o login antes de fazer o primeiro clique
    await delay(6000);

    // Primeiro clique (substitua o seletor com o correto)
    await page.click('span > div > a[href="#"]');

    // Aguardar um segundo após o primeiro clique antes de fazer a pesquisa
    await delay(2000);

    console.log(`Pesquisando perfil ${username}`);
    await page.waitForSelector('input[placeholder="Pesquisar"]');
    await page.type('input[placeholder="Pesquisar"]', username);
    await delay(2000); // Aguarda 2 segundos para exibir os resultados da pesquisa
    await page.keyboard.press('Enter'); // Pressiona a tecla Enter para realizar a pesquisa
    await page.waitForSelector('div:nth-child(2) > div >div>div>div>div>div>div>div:nth-child(2) div:nth-child(1) a'); // Aguarda o primeiro resultado da pesquisa
    await page.click('div:nth-child(2) > div >div>div>div>div>div>div>div:nth-child(2) div:nth-child(1) a'); // Clica no primeiro resultado
    console.log(`Perfil ${username} encontrado e clicado`);
    await delay(1000);
    await page.setViewport({ width: 375, height: 812 });
    console.log("Aguardando 3 segundos para carregamento completo da página...");
    await delay(2000); // Aguarda 3 segundos para garantir o carregamento completo da página
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
