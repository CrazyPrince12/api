const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { facebookdlfunc } = require('../func/facebook');
const { getBuffer } = require('../func/functions');
const { tryUpstreams, guessExt } = require('../func/humanProxy');

const D = 'https://api.delirius.online';
const Z = 'https://api.dorratz.com';

function writeTmp(buffer, prefix, ext) {
  let fileName = `${prefix}_${Date.now()}.${ext}`;
  let fileIndex = 1;
  while (fs.existsSync(`./tmp/${fileName}`)) {
    fileName = `${prefix}_${Date.now()}_${fileIndex}.${ext}`;
    fileIndex++;
  }
  fs.writeFileSync(`./tmp/${fileName}`, buffer);
  return fileName;
}

router.get('/', async (req, res) => {
  const url = req.query.url;
  try {
    if (!url) {
      return res.setHeader('Content-Type', 'application/json')
        .status(400)
        .send(JSON.stringify({
          status: false,
          message: "Vous devez indiquer l URL de la video Facebook."
        }, null, 2));
    }

    // 1) NOUVEAUX ENDPOINTS (delirius + dorratz) en première option
    try {
      const { buffer, contentType } = await tryUpstreams([
        `${D}/download/facebook`,
        `${Z}/v2/fb`,
        `${Z}/v2/facebook`
      ], { url });
      const ext = guessExt(contentType);
      const fileName = writeTmp(buffer, 'facebook_video', ext === 'bin' ? 'mp4' : ext);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {
      // fallback vers l'ancienne méthode
    }

    // 2) ANCIENLE METHODE (garde pour compatibilite)
    const results = await facebookdlfunc(url);
    const fileData = results.resultado.data;
    const fileBuffer = Buffer.isBuffer(fileData) ? fileData : await getBuffer(fileData);
    const fileName = writeTmp(fileBuffer, 'facebook_video', 'mp4');
    res.attachment(fileName);
    res.send(fileBuffer);
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
