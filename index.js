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
const getUptime = () => {
  const uptimeInSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = uptimeInSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Middleware de comptage des requetes et visiteurs
app.use((req, res, next) => {
  req.startTime = Date.now();
  totalRequests++;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
  if (!visitors.has(userIp)) {
    visitors.add(userIp);
    totalVisitors++;
  }
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
  const uptime = getUptime();
  const latency = Date.now() - (req.startTime || Date.now());
  const response = {
    status: true,
    name: 'CROWN API',
    uptime: uptime,
    latencia: `${Math.max(1, latency)} ms`,
    totalRequests: totalRequests,
    totalVisitors: Math.max(1, totalVisitors),
    creator: 'CrazyPrince',
    developer: 'CrazyPrince, Développeur Camerounais',
    phoneNumber: '+237694268225',
    github: 'https://github.com/BanditDapi/',
    orangeMoney: '+237694268225'
  };
  res.setHeader('Content-Type', 'application/json');
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
