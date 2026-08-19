const express = require('express');
const router = express.Router();
const path = require('path');
const { toDocs } = require('./func/catalog');

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'docs.html'));
});

router.get('/catalog.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    // Le catalogue doit toujours être frais après un déploiement :
    // sinon la page docs affiche des endpoints mais les clics ne réagissent plus.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const docs = toDocs();
    res.send(`window.CROWN_DOCS = ${JSON.stringify(docs)}; window.EMPIRE_DOCS = window.CROWN_DOCS;`);
});

module.exports = router;
