const express = require('express');
const router = express.Router();
const path = require('path');
const crypto = require('crypto');
const database = require('./func/database');
const jwt = require('jsonwebtoken');

let processR = process.env.use_recaptcha;
processR = processR === 'true';

router.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    if (!mail || !password) {
        return res.status(400).json({ status: false, message: "Donnees de connexion manquantes." });
    }
    
    let unbase64;
    try {
        unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    } catch {
        unbase64 = password;
    }
    const hashPasswd = crypto.createHash('md5').update(unbase64).digest('hex');
    const user = database.getDatabaseByUser(mail, true);

    if (!user) {
        return res.status(404).json({ status: false, message: "Utilisateur introuvable, veuillez contacter le dev." });
    }

    if (user.isBanned) {
        return res.status(403).json({ status: false, message: "Vous etes banni, contactez le dev." });
    }

    if (user.hashPassword !== hashPasswd) {
        return res.status(401).json({ status: false, message: "Mot de passe incorrect." });
    }

    if (!user.isVerified) {
        return res.status(401).json({ status: false, message: "Compte non verifie. Consultez votre boite de reception ou les spams." });
    }

    const token = jwt.sign(
        { mail: mail, userid: user.userId },
        process.env.JWT_SECRET || 'B3tterTh@nB',
        { expiresIn: '7d' }
    );
    return res.status(200).json({ status: true, token: token, message: "Connexion reussie." });
});

router.post('/register', async (req, res) => {
    const { mail, password, recaptchaVerify } = req.body;
    if (!mail || !password) {
        return res.status(400).json({ status: false, message: "Donnees manquantes." });
    }

    if (processR && !recaptchaVerify) {
        return res.status(400).json({ status: false, message: "reCAPTCHA manquant." });
    }

    const user = database.getDatabaseByUser(mail);
    if (user) {
        return res.status(409).json({ status: false, message: "Compte deja enregistre. Connectez-vous ou contactez le dev." });
    }

    if (processR) {
        try {
            const recaptcha = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.recaptcha_secret}&response=${recaptchaVerify}`, {
                method: 'POST'
            });
            const recaptchaJson = await recaptcha.json();
            if (!recaptchaJson.success) {
                return res.status(400).json({ status: false, message: "reCAPTCHA invalide." });
            }
        } catch {
            return res.status(400).json({ status: false, message: "Erreur de verification reCAPTCHA." });
        }
    }

    let unbase64;
    try {
        unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    } catch {
        unbase64 = password;
    }

    const newUser = database.PostDatabase(mail, unbase64, !(process.env.new_user_verification === 'true'));

    if (process.env.new_user_verification === 'true') {
        try {
            if (global.mTransporter) {
                await global.mTransporter.sendMail({
                    from: process.env.smtp_user,
                    to: mail,
                    subject: "CROWN API - Verification de votre adresse e-mail",
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                        <meta charset="utf-8">
                        <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0c0e17; color: #e2e8f0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; padding: 25px; background-color: #121624; border-radius: 12px; border: 1px solid #7c3aed; }
                        h1 { color: #8b5cf6; text-align: center; font-size: 24px; }
                        p { margin-bottom: 16px; line-height: 1.6; color: #cbd5e1; }
                        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 15px 0; text-align: center; }
                        .signature { margin-top: 25px; border-top: 1px solid #2d3748; padding-top: 15px; text-align: center; font-size: 13px; color: #94a3b8; }
                        </style>
                        </head>
                        <body>
                        <div class="container">
                            <h1>CROWN API - Verification de compte</h1>
                            <p>Bonjour,</p>
                            <p>Merci pour votre inscription sur CROWN API, propulsee par CrazyPrince.</p>
                            <p>Pour activer votre acces API, veuillez cliquer sur le bouton ci-dessous :</p>
                            <p style="text-align: center;"><a href="https://${req.headers.host}/api/manageusers/verify?token=${newUser.verifyCode}" class="btn">Verifier mon compte</a></p>
                            <p>Si vous n avez pas demande cette inscription, ignorez simplement cet e-mail.</p>
                            <div class="signature">
                                <p><strong>CROWN API</strong></p>
                                <p>CrazyPrince - Developpeur Camerounais</p>
                                <p>WhatsApp : +237694268225</p>
                            </div>
                        </div>
                        </body>
                        </html>
                    `
                });
            }
            return res.status(200).json({ status: true, message: "Compte enregistre. Veuillez verifier votre e-mail pour finaliser l activation." });
        } catch (error) {
            console.error(error);
            database.DeleteDatabase(newUser.mail);
            return res.status(500).json({ status: false, message: "Erreur lors de l envoi de l e-mail, contactez le dev via WhatsApp (+237694268225)." });
        }
    }

    return res.status(200).json({ status: true, message: "Compte enregistre avec succes." });
});

router.get('/user', async (req, res) => {
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ status: false, message: "Aucun jeton d autorisation fourni." });
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) {
        return res.status(401).json({ status: false, message: "Jeton de session manquant." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'B3tterTh@nB');
        const user = database.getDatabaseByUser(decoded.mail);
        if (!user) {
            return res.status(404).json({ status: false, message: "Utilisateur introuvable." });
        }
        if (user.isBanned) {
            return res.status(403).json({ status: false, message: "Vous etes banni, contactez le dev." });
        }
        const freeLimit = Number(process.env.free_user_limit || 10000);
        const premLimit = Number(process.env.premium_user_limit || 1000000);
        const currentLimit = user.isPremium ? premLimit : freeLimit;
        return res.status(200).json({
            status: true,
            user: user,
            CurrentLimit: currentLimit
        });
    } catch (error) {
        return res.status(401).json({ status: false, message: "Session expiree ou jeton invalide." });
    }
});

router.get('/fetchRecaptcha', async (req, res) => {
    if (!processR) {
        return res.status(404).json({ status: false, message: "reCAPTCHA desactive." });
    }
    const recaptchaSiteKey = process.env.recaptcha_site_key;
    return res.status(200).json({ status: true, sitekey: recaptchaSiteKey });
});

router.get('/verify', async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).json({ status: false, message: "Jeton de verification manquant." });
    }
    const user = database.getDatabaseByVerifyCode(token);
    if (!user) {
        return res.status(404).json({ status: false, message: "Utilisateur introuvable." });
    }
    if (user.isVerified) {
        return res.redirect("/login.html?verified=already");
    }
    database.UpdateDatabase(user.mail, { isVerified: true });
    return res.redirect("/login.html?verified=true");
});

router.post('/requestReset', async (req, res) => {
    const mail = req.body.mail;
    const recaptchaVerify = req.body.recaptchaVerify;
    if (!mail) {
        return res.status(400).json({ status: false, message: "Adresse e-mail requise." });
    }
    const user = database.getDatabaseByUser(mail);
    if (!user) {
        return res.status(404).json({ status: false, message: "Aucun compte associe a cet e-mail." });
    }
    if (user.isBanned) {
        return res.status(403).json({ status: false, message: "Vous etes banni, contactez le dev." });
    }

    if (processR && !recaptchaVerify) {
        return res.status(400).json({ status: false, message: "reCAPTCHA manquant." });
    }

    if (processR) {
        try {
            const recaptcha = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.recaptcha_secret}&response=${recaptchaVerify}`, {
                method: 'POST'
            });
            const recaptchaJson = await recaptcha.json();
            if (!recaptchaJson.success) {
                return res.status(400).json({ status: false, message: "reCAPTCHA invalide." });
            }
        } catch {
            return res.status(400).json({ status: false, message: "Erreur de verification reCAPTCHA." });
        }
    }

    const resetCode = crypto.randomBytes(20).toString('hex');
    database.UpdateDatabase(user.mail, { resetCode: resetCode });
    try {
        if (global.mTransporter) {
            await global.mTransporter.sendMail({
                from: process.env.smtp_user,
                to: mail,
                subject: "CROWN API - Reinitialisation de mot de passe",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                    <meta charset="utf-8">
                    <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0c0e17; color: #e2e8f0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; padding: 25px; background-color: #121624; border-radius: 12px; border: 1px solid #7c3aed; }
                    h1 { color: #8b5cf6; text-align: center; }
                    p { margin-bottom: 16px; line-height: 1.6; color: #cbd5e1; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 15px 0; }
                    .signature { margin-top: 25px; border-top: 1px solid #2d3748; padding-top: 15px; text-align: center; font-size: 13px; color: #94a3b8; }
                    </style>
                    </head>
                    <body>
                    <div class="container">
                        <h1>CROWN API - Reinitialisation</h1>
                        <p>Bonjour,</p>
                        <p>Pour reinitialiser votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
                        <p style="text-align: center;"><a href="https://${req.headers.host}/api/manageusers/reset?token=${resetCode}" class="btn">Reinitialiser mon mot de passe</a></p>
                        <p>Si vous n avez pas demande cette reinitialisation, ignorez cet e-mail.</p>
                        <div class="signature">
                            <p><strong>CROWN API</strong></p>
                            <p>CrazyPrince - Developpeur Camerounais</p>
                        </div>
                    </div>
                    </body>
                    </html>
                `
            });
        }
        return res.status(200).json({ status: true, message: "E-mail de reinitialisation envoye. Consultez votre boite de reception ou les spams." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Erreur lors de l envoi de l e-mail, contactez le dev via WhatsApp (+237694268225)." });
    }
});

router.get('/reset', async (req, res) => {
    const token = req.query.token;
    return res.redirect("/reset.html?resetToken=" + encodeURIComponent(token || ''));
});

router.post('/reset', async (req, res) => {
    const token = req.body.tokenReset;
    const password = req.body.password;
    if (!token || !password) {
        return res.status(400).json({ status: false, message: "Donnees requises manquantes." });
    }
    const users = database.getDatabase();
    const user = users.find(u => u.resetCode === token);
    if (!user) {
        return res.status(404).json({ status: false, message: "Jeton de reinitialisation invalide ou expire." });
    }
    let unbase64;
    try {
        unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    } catch {
        unbase64 = password;
    }
    database.UpdateDatabase(user.mail, {
        hashPassword: crypto.createHash('md5').update(unbase64).digest('hex'),
        resetCode: undefined
    });
    return res.status(200).json({ status: true, message: "Mot de passe reinitialise avec succes." });
});

module.exports = router;
