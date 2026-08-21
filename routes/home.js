const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Empêche de contourner la protection de /docs via le fichier statique.
router.get('/docs.html', (req, res) => {
    res.redirect(302, '/docs');
});

module.exports = router;
