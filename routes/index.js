const router = require('express').Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const database = require('./func/database');

const path = __dirname;

const routerVersion = {
  ytmp3: '/v1/ytmp3',
  ytmp3_2: '/v2/ytmp3',
  ytmp4: '/v1/ytmp4', 
  ytmp4_2: '/v2/ytmp4',
  igdl: '/v1',
  getmail: '/tempmail',
  getmessages: '/tempmail'
};

const pathIgnore = ['func', 'human', 'human-apis'];

const removeExtention = (filename) => {
  return filename.split('.').shift();
};

router.use(function (req, res, next) {
  if (req.url.includes('manageusers')) return next();
  const apiKey = req.query.apikey;
  if (!apiKey) {
    return res.status(401).json({ status: false, message: "Aucune cle API fournie." });
  }
  let search = database.getDatabaseByApiKey(apiKey);
  if (!search) {
    return res.status(401).json({ status: false, message: "Cle API invalide." });
  }

  if (search.isBanned) {
    return res.status(403).json({ status: false, message: "Vous etes banni, contactez le dev." });
  }

  if (!search.isVerified) {
    return res.status(401).json({ status: false, message: "L utilisateur n a pas verifie son e-mail." });
  }

  const freeLimit = Number(process.env.free_user_limit || 10000);
  const premLimit = Number(process.env.premium_user_limit || 1000000);
  const limit = search.isPremium ? premLimit : freeLimit;
  const lastUsedTime = new Date(search.lastUsed).getTime() || 0;

  if (lastUsedTime < Date.now() - 86400000) {
    database.UpdateDatabase(search.mail, { uses: 0, lastUsed: new Date().toISOString() });
  } else if (search.uses >= limit) {
    return res.status(429).json({ status: false, message: "Limite quotidienne atteinte, revenez demain." });
  }

  database.addUse(search.mail);
  next();
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

fs.readdirSync(path).filter(filename => {
  const name = removeExtention(filename);
  const version = routerVersion[name] ?? '';
  if (name !== 'index' && !pathIgnore.includes(name) && filename.endsWith('.js')) {
    router.use(`${version}/${name.startsWith('ytmp') ? '' : name}`, require(`./${filename}`));
  }
});

module.exports = router;
