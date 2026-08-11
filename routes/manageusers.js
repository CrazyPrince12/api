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
        return res.status(400).json({ status: false, message: "Donnees manquantes" });
    }
    const unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    const hashPasswd = crypto.createHash('md5').update(unbase64).digest('hex')
    const user = database.getDatabaseByUser(mail, true);
    //console.log(hashPasswd);
    //7console.log(user);
    if (!user) {
        return res.status(404).json({ status: false, message: "[❗] Utilisateur introuvable, veuillez vous inscrire." });
    }
    if (user.hashPassword !== hashPasswd) {
        return res.status(401).json({ status: false, message: "[❗] Mot de passe incorrect. Il doit contenir au moins 8 caracteres." });
    }
    if (!user.isVerified) {
        return res.status(401).json({ status: false, message: "[❗] Compte non verifie. Consultez votre boite de reception ou les spams." });
    }

    const token = jwt.sign({ mail: mail, userid: user.userId }, process.env.JWT_SECRET || 'B3tterTh@nB');
    res.status(200).json({ status: true, token: token });

});

router.post('/register', async (req, res) => {
    const { mail, password, recaptchaVerify } = req.body;
    if (!mail || !password) {
        return res.status(400).json({ status: false, message: "Donnees manquantes" });
    }

    if (processR && !recaptchaVerify) {
        return res.status(400).json({ status: false, message: "reCAPTCHA manquant" });
    }

    const user = database.getDatabaseByUser(mail);
    if (user) {
        return res.status(409).json({ status: false, message: "[❗] Compte deja enregistre. Verifiez votre e-mail et connectez-vous." });
    }
    if (processR) {
        const recaptcha = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.recaptcha_secret}&response=${recaptchaVerify}`, {
            method: 'POST'
        });
        const recaptchaJson = await recaptcha.json();
        if (!recaptchaJson.success) {
            return res.status(400).json({ status: false, message: "reCAPTCHA invalide" });
        }
    }
    const unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    const newUser = database.PostDatabase(mail, unbase64, !(process.env.new_user_verification === 'true'));
    if (process.env.new_user_verification === 'true') {
        // send mail
        try {
        //console.log('Envoi de l e-mail a ' + mail);
        const info = await mTransporter.sendMail({
            from: process.env.smtp_user,
            to: mail,
            subject: "Verification de votre e-mail",
            html: `
                <html>
                <head>
                <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #007bff;
                    text-align: center;
                }
                p {
                    margin-bottom: 20px;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                    font-weight: bold;
                }
                .signature {
                    margin-top: 20px;
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                    text-align: center;
                }
                </style>
                </head>
                <body>
                <div class="container">
                <h1>Verification de l e-mail</h1>
                <p>Bonjour,</p>
                <p>Pour terminer votre inscription et utiliser nos services API, cliquez sur le lien suivant :</p>
                <p><a href="https://${req.headers.host}/api/manageusers/verify?token=${newUser.verifyCode}">Verifier l e-mail</a></p>
                <p>Si vous n avez pas demande cet e-mail, ignorez-le simplement.</p>
                <p>Merci !</p>
                <div class="signature">
                <p><strong>The Shadow Brokers - TEAM</strong></p>
                <p><strong>Bruno Sobrino</strong></p>
                </div>
                </div>
                </body>
                </html>
                `
          });
        //console.log("Message sent: %s", info.messageId);
        return res.status(200).json({ status: true, message: "[❗] Compte enregistre. Pour terminer, verifiez votre e-mail (pensez a regarder les spams)." });
        } catch (error) {
            console.log(error);
            database.DeleteDatabase(newUser.mail);
            return res.status(500).json({ status: false, message: "[⚠️] Erreur lors de l envoi de l e-mail, signalez le probleme sur Github." });
        }
    }
    return res.status(200).json({ status: true, message: "[❗] Compte enregistre." });
});

router.get('/user', async (req, res) => {
    let token = req.headers['authorization'];
    // remove Bearer from token
    token = token.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: false, message: "[❗] Aucun jeton fourni. Cliquez sur le lien envoye par e-mail." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'B3tterTh@nB');
        const user = database.getDatabaseByUser(decoded.mail);
        if (!user) {
            return res.status(404).json({ status: false, message: "Utilisateur introuvable" });
        }
        return res.status(200).json({ status: true, user: user, CurrentLimit: user.isPremium ? Number(process.env.premium_user_limit) : Number(process.env.free_user_limit) });
    } catch (error) {
        return res.status(401).json({ status: false, message: "[❗] Jeton invalide. Cliquez sur le lien envoye par e-mail." });
    }
});

router.get('/fetchRecaptcha', async (req, res) => {
    if (!processR) {
        return res.status(404).json({ status: false, message: "[❗] reCAPTCHA desactive." });
    }
    const recaptchaSiteKey = process.env.recaptcha_site_key;
    return res.status(200).json({ status: true, sitekey: recaptchaSiteKey });
})

router.get('/verify', async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).json({ status: false, message: "Jeton manquant" });
    }
    const user = database.getDatabaseByVerifyCode(token);
    if (!user) {
        return res.status(404).json({ status: false, message: "Utilisateur introuvable" });
    }
    if (user.isVerified) {
        return res.status(400).json({ status: false, message: "Compte deja verifie" });
    }
    const updatedUser = database.UpdateDatabase(user.mail, { isVerified: true });
    return res.redirect("/login.html?verified=true");
})

router.post('/requestReset', async (req, res) => {
    const mail = req.body.mail;
    const recaptchaVerify = req.body.recaptchaVerify;
    if (!mail) {
        return res.status(400).json({ status: false, message: "E-mail manquant" });
    }
    const user = database.getDatabaseByUser(mail);
    if (!user) {
        return res.status(404).json({ status: false, message: "[❗] Utilisateur introuvable. Verifiez que l e-mail est correct." });
    }

    if (processR && !recaptchaVerify) {
        return res.status(400).json({ status: false, message: "reCAPTCHA manquant" });
    }

    if (processR) {
        const recaptcha = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.recaptcha_secret}&response=${recaptchaVerify}`, {
            method: 'POST'
        });
        const recaptchaJson = await recaptcha.json();
        if (!recaptchaJson.success) {
            return res.status(400).json({ status: false, message: "reCAPTCHA invalide" });
        }
    }

    const resetCode = crypto.randomBytes(20).toString('hex');
    const updatedUser = database.UpdateDatabase(user.mail, { resetCode: resetCode });
    try {
        const info = await mTransporter.sendMail({
            from: process.env.smtp_user,
            to: mail,
            subject: "Reinitialiser le mot de passe",
            html: `
            <html>
            <head>
            <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1 {
                color: #007bff;
                text-align: center;
            }
            p {
                margin-bottom: 20px;
            }
            a {
                color: #007bff;
                text-decoration: none;
                font-weight: bold;
            }
            .signature {
                margin-top: 20px;
                border-top: 1px solid #ccc;
                padding-top: 10px;
                text-align: center;
            }
            </style>
            </head>
            <body>
            <div class="container">
            <h1>Reinitialiser le mot de passe</h1>
            <p>Bonjour,</p>
            <p>Pour reinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
            <p><a href="https://${req.headers.host}/api/manageusers/reset?token=${resetCode}">Reinitialiser le mot de passe</a></p>
            <p>Si vous n avez pas demande cette reinitialisation, ignorez simplement cet e-mail.</p>
            <p>Merci !</p>
            <div class="signature">
            <p><strong>The Shadow Brokers - TEAM</strong></p>
            <p><strong>Bruno Sobrino</strong></p>
            </div>
            </div>
            </body>
            </html>
            `
        });
        //console.log("Message sent: %s", info.messageId);
        return res.status(200).json({ status: true, message: "[❗] E-mail envoye. Consultez votre boite de reception ou les spams." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "[⚠️] Erreur lors de l envoi de l e-mail, signalez le probleme sur Github." });
    }
})

router.get('/reset', async (req, res) => {
    const token = req.query.token;
    return res.redirect("/reset.html?resetToken=" + token);
})

router.post('/reset', async (req, res) => {
    const token = req.body.tokenReset;
    const password = req.body.password;
    if (!token || !password) {
        return res.status(400).json({ status: false, message: "Donnees manquantes" });
    }
    const users = database.getDatabase()
    const user = users.find(user => user.resetCode === token);
    if (!user) {
        return res.status(404).json({ status: false, message: "[❗] Utilisateur introuvable, veuillez vous inscrire." });
    }
    const unbase64 = Buffer.from(password, 'base64').toString('utf-8');
    const updatedUser = database.UpdateDatabase(user.mail, { hashPassword: crypto.createHash('md5').update(unbase64).digest('hex'), resetCode: undefined });
    return res.status(200).json({ status: true, message: "[❗] Mot de passe reinitialise." });
})


module.exports = router;
