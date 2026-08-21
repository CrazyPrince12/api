const express = require('express');
const router = express.Router();
const path = require('path');
const database = require('./func/database');
const { toDocs } = require('./func/catalog');
const {
    clearSessionCookie,
    getSessionToken,
    verifySessionToken
} = require('./func/session');

function getAuthenticatedUser(req) {
    const token = getSessionToken(req);
    const decoded = verifySessionToken(token);
    if (!decoded) return null;

    const user = database.getDatabaseByUser(decoded.mail);
    if (!user) return null;
    if (decoded.userid && user.userId !== decoded.userid) return null;
    if (user.isBanned || !user.isVerified || !user.apikey) return null;

    return user;
}

function requireDocsPageSession(req, res, next) {
    const user = getAuthenticatedUser(req);
    if (!user) {
        clearSessionCookie(req, res);
        return res.redirect(302, '/');
    }

    req.user = user;
    next();
}

function requireDocsAssetSession(req, res, next) {
    const user = getAuthenticatedUser(req);
    if (!user) {
        clearSessionCookie(req, res);
        return res.status(401).type('text/plain').send('Authentification requise.');
    }

    req.user = user;
    next();
}

router.get('/', requireDocsPageSession, (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, '..', 'public', 'docs.html'));
});

router.get('/catalog.js', requireDocsAssetSession, (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    // Le catalogue doit toujours être frais après un déploiement :
    // sinon la page docs affiche des endpoints mais les clics ne réagissent plus.
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const docs = toDocs();
    res.send(`window.CROWN_DOCS = ${JSON.stringify(docs)}; window.EMPIRE_DOCS = window.CROWN_DOCS;`);
});

module.exports = router;
