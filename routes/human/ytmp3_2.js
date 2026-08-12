const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const YT = require('../func/YT_mp3_mp4');
const { tryUpstreams, guessExt } = require('../func/humanProxy');

const D = 'https://api.delirius.online';
const Z = 'https://api.dorratz.com';

function writeTmp(buffer, prefix, ext) {
  let fileName = `${prefix}_${Date.now()}.${ext}`;
  let fileIndex = 1;
  while (fs.existsSync(`./tmp/${fileName}`)) {
    const baseName = path.basename(fileName, '.' + ext);
    fileName = `${baseName}_${fileIndex}.${ext}`;
    fileIndex++;
  }
  fs.writeFileSync(`./tmp/${fileName}`, buffer);
  return fileName;
}

router.get('/', async (req, res) => {
  const match_url = req.query.url;
  try {
    if (!match_url) {
      return res.setHeader('Content-Type', 'application/json')
        .status(400)
        .send(JSON.stringify({
          status: false,
          message: "Vous devez indiquer l URL de la video YouTube"
        }, null, 2));
    }

    // 1) NOUVEAUX ENDPOINTS en première option (autres upstreams)
    try {
      const { buffer, contentType } = await tryUpstreams([
        `${D}/download/ytmp3v2`,
        `${Z}/v2/ytmp3`,
        `${D}/download/ytmp3`
      ], { url: match_url });
      const ext = guessExt(contentType);
      const fileName = writeTmp(buffer, 'audio', (ext === 'bin' || !ext) ? 'mp3' : ext);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {}

    // 2) ANCIENLE METHODE
    const audioBuffer = await YT.mp3_2(match_url);
    let infoaud;
    try { infoaud = await YT.ytinfo(match_url); } catch { infoaud = { resultado: { title: null } }; }
    const fileName = writeTmp(audioBuffer, 'audio', 'mp3');
    res.download(`./tmp/${fileName}`, `${infoaud.resultado?.title || fileName}.mp3`, (err) => {
      if (err) res.sendFile(path.join(__dirname, '../../public/500.html'));
    });
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
