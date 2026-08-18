const express = require('express');
const router = express.Router();
const path = require('path');
const { toDocs } = require('./func/catalog');

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'docs.html'));
});

router.get('/catalog.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    const docs = toDocs();
    res.send(`window.CROWN_DOCS = ${JSON.stringify(docs)}; window.EMPIRE_DOCS = window.CROWN_DOCS;`);
});

module.exports = router;
