require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const tmp = require("tmp");
const fs = require("fs");
const app = express();
const port = process.env.PORT_APP;
const capturedImages = {};
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
    const tmpDir = tmp.dirSync();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--start-fullscreen"],
      userDataDir: tmpDir.name,
    });

    const page = await browser.newPage();
    console.log("Nova página criada.");

    await page.setViewport({ width: 375, height: 812 });
    console.log("Viewport configurado.");

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.999 Safari/537.36"
    );
    console.log("User agent configurado.");

    const cookiesPath = 'cookies.json';
    let loggedIn = false;

    // Verificar se o arquivo de cookies existe
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
        console.log("Cookies carregados.");
        
        // Verificar se o login ainda é válido
        await page.goto(`https://www.instagram.com/${username}/`);
        await delay(2000); // Aguarde o carregamento da página

        const loginCheck = await page.$('input[name="username"]');
        if (!loginCheck) {
          loggedIn = true;
        }
      }
    }
    if (!loggedIn) {
      console.log("Realizando login.");
      await page.goto("https://www.instagram.com/accounts/login/");
      await page.waitForSelector('input[name="username"]', { visible: true });
      console.log("Campo de usuário encontrado.");
      await delay(500);
      await page.type('input[name="username"]', process.env.INSTAGRAM_USERNAME, delay(50));
      console.log("Usuário digitado.");

      await delay(500);
      await page.type('input[name="password"]', process.env.INSTAGRAM_PASSWORD, delay(50));
      console.log("Senha digitada.");
      await delay(500);

      await page.click('button[type="submit"]');
      console.log("Botão de login clicado.");
      
      await page.waitForNavigation();
      console.log("Navegação após login.");

      // Verificar se o login foi bem-sucedido
      const loginFailed = await page.$('div[role="alert"]');
      if (loginFailed) {
        throw new Error("Falha no login do Instagram.");
      }
      console.log("Login bem-sucedido.");

      // Evitar pop-ups de notificações
      const notNowButton = await page.$('button.sqdOP.yWX7d.y3zKF');
      if (notNowButton) {
        await notNowButton.click();
        console.log("Botão 'Not Now' clicado.");
      }

      // Salvar cookies após o login
      const cookies = await page.cookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log("Cookies salvos.");

      await page.goto(`https://www.instagram.com/${username}/`);
      await page.waitForNavigation(); // Aguarde a navegação após o login
    }
console.log("Página do perfil acessível.");

await delay(3000);
const screenshotBase64 = await page.screenshot({ encoding: "base64" });
capturedImages[username] = Buffer.from(screenshotBase64, "base64");
console.log("Screenshot capturado.");
    
    await browser.close();
    console.log(`Captura do perfil ${username} concluída.`);

    fs.rm(tmpDir.name, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error("Erro ao remover diretório temporário:", err);
      } else {
        console.log(
          `Diretório temporário ${tmpDir.name} removido com sucesso.`
        );
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
  await delay(300);
  console.log(`Enviando imagem capturada para ${username}...`);
  res.setHeader("Content-Type", "image/jpeg");
  res.send(capturedImages[username]);
});

app.listen(port, () => {
  console.log("Running server");
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
