process.on('uncaughtException', (err) => {
  console.error('Erreur non interceptee :', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Rejet de promesse non gere :', reason);
});

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const chalk = require('chalk');
const PORT = parseInt(process.env.PORT || 2035, 10);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const favicon = require('serve-favicon');
const nodemailer = require('nodemailer');

const visitors = new Set();
let totalRequests = 0;
let totalVisitors = 0;

app.set('trust proxy', 1);
app.use(cors());

// Initialiser le serveur de messagerie si active
if (process.env.new_user_verification === 'true' && process.env.smtp_user && process.env.smtp_password) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.smtp_host || 'smtp-relay.brevo.com',
      port: Number(process.env.smtp_port) || 587,
      secure: process.env.smtp_is_secure === 'true',
      auth: {
        user: process.env.smtp_user,
        pass: process.env.smtp_password
      }
    });
    global.mTransporter = transporter;
  } catch (err) {
    console.error('Erreur d initialisation SMTP :', err);
  }
}

// Utilitaires de metriques
const getUptimeSeconds = () => Math.floor(process.uptime());

const formatUptime = (totalSeconds) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  parts.push(`${hours}h ${minutes}m ${seconds}s`);
  return parts.join(' ');
};

// Mesure reelle de la latence : moyenne mobile sur les 100 dernieres requetes
const LATENCY_WINDOW = 100;
const latencySamples = [];
let latencySum = 0;

// Middleware de comptage des requetes, visiteurs et mesure de latence reelle
app.use((req, res, next) => {
  req.startTime = process.hrtime.bigint();
  totalRequests++;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
  if (!visitors.has(userIp)) {
    visitors.add(userIp);
    totalVisitors++;
  }
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - req.startTime) / 1e6;
    latencySamples.push(elapsedMs);
    latencySum += elapsedMs;
    if (latencySamples.length > LATENCY_WINDOW) {
      latencySum -= latencySamples.shift();
    }
  });
  next();
});

// Middleware favicon
const faviconPath = path.join(__dirname, 'public', 'crown-logo.png');
if (fs.existsSync(faviconPath)) {
  app.use(favicon(faviconPath));
} else {
  const defaultFavicon = path.join(__dirname, 'public', 'favicon.ico');
  if (fs.existsSync(defaultFavicon)) {
    app.use(favicon(defaultFavicon));
  }
}

// Routes principales
const home = require('./routes/home');
const docs = require('./routes/docs');
const apirouter5 = require('./routes/human-apis');

app.use('/', home);
app.use('/docs', docs);
app.use('/api', require('./routes'));

// Routes human / pages de telechargement direct
app.use('/human', require('./routes/human'));
app.use('/human', apirouter5);

// Fichiers statiques
app.use('/tmp', express.static('tmp'));
app.use(express.static('public'));
app.use(express.static('data'));

// Route de statut & metriques
app.get('/status', (req, res) => {
  const uptimeSeconds = getUptimeSeconds();
  // Latence reelle : moyenne mobile du temps de traitement des requetes recentes.
  // Si aucun echantillon significatif, on mesure cette requete elle-meme.
  let latencyMs = latencySamples.length ? latencySum / latencySamples.length : 0;
  if (latencyMs < 0.05 && req.startTime) {
    latencyMs = Number(process.hrtime.bigint() - req.startTime) / 1e6;
  }
  const response = {
    status: true,
    name: 'CROWN API',
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds: uptimeSeconds,
    latencia: `${Math.max(1, Math.round(latencyMs))} ms`,
    latencyMs: Math.max(1, Math.round(latencyMs)),
    totalRequests: totalRequests,
    totalVisitors: Math.max(1, totalVisitors),
    creator: 'CrazyPrince',
    developer: 'CrazyPrince, Développeur Camerounais',
    phoneNumber: '+237694268225',
    github: 'https://github.com/BanditDapi/',
    orangeMoney: '+237694268225'
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json(response);
});

app.disable('x-powered-by');

// Gestionnaire 404
app.use((req, res) => {
  res.status(404);
  const filePath = path.join(__dirname, 'public', '404.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.json({ status: false, message: 'Ressource introuvable sur CROWN API.' });
  }
});

// Nettoyage automatique du dossier temporaire
const clearTmpFiles = () => {
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) return;
  fs.readdir(tmpDir, (err, files) => {
    if (err) return;
    const filesToDelete = (files || []).filter((file) => file !== 'file');
    filesToDelete.forEach((file) => {
      const filePath = path.join(tmpDir, file);
      fs.unlink(filePath, () => {});
    });
  });
};
setInterval(clearTmpFiles, 60000);

// Verification des mises a jour du repo
let previousCommitSHA = '';
let isError = false;
async function checkRepoUpdates() {
  if (isError) return;
  try {
    const response = await axios.get('https://api.github.com/repos/CrazyPrince12/api/commits?per_page=1', { timeout: 10000 });
    if (response.data && response.data[0]) {
      const { sha } = response.data[0];
      if (previousCommitSHA && sha !== previousCommitSHA) {
        try {
          execSync('git pull > /dev/null 2>&1');
        } catch {}
      }
      previousCommitSHA = sha;
    }
  } catch {
    isError = true;
  }
}
setInterval(checkRepoUpdates, 300000);

// Demarrage du serveur
app.listen(PORT, '0.0.0.0', function () {
  const line = chalk.cyan('====================================================');
  const title = chalk.magenta.bold('|                CROWN API — REST API              |');
  const serverUrl = 'http://localhost:' + PORT;
  const serverMessage = chalk.green.bold('| Serveur actif   : ') + chalk.blue.bold(serverUrl);
  const creatorMessage = chalk.magenta.bold('| Developpeur     : CrazyPrince (Cameroun)');
  const numberMessage = chalk.yellow.bold('| WhatsApp / Momo : +237694268225');
  const githubMessage = chalk.cyan.bold('| GitHub          : https://github.com/BanditDapi/');
  console.log(line);
  console.log(title);
  console.log(line);
  console.log(serverMessage);
  console.log(creatorMessage);
  console.log(numberMessage);
  console.log(githubMessage);
  console.log(line);
});
