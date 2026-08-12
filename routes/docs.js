const express = require('express');
const router = express.Router();
const path = require('path');
const { toDocs } = require('./func/catalog');

router.get('/', async (req, res) => {
    const indexPath = path.join(__dirname, '..', 'public', 'docs.html');
    res.sendFile(indexPath);
});

router.get('/catalog.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(`window.EMPIRE_DOCS = ${JSON.stringify(toDocs())};`);
});

module.exports = router;
