const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { obtenerInformacionYoutube } = require('../func/ytdl3');
const { getBuffer } = require('../func/functions');
const { tryUpstreams, guessExt } = require('../func/humanProxy');

const D = 'https://api.delirius.online';

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

    // 1) NOUVEAU ENDPOINT (delirius) en première option
    try {
      const { buffer, contentType } = await tryUpstreams([
        `${D}/download/ytmp3`,
        `${D}/download/ytmp3v2`
      ], { url: match_url });
      const ext = guessExt(contentType);
      const fileName = writeTmp(buffer, 'audiomp3', (ext === 'bin' || !ext) ? 'mp3' : ext);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {}

    // 2) ANCIENLE METHODE
    const youtubeInfo = await obtenerInformacionYoutube(match_url);
    const audioBuffer = await getBuffer(youtubeInfo.resultado.ytmp3v2.audio);
    const fileName = writeTmp(audioBuffer, 'audiomp3', 'mp3');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${youtubeInfo.resultado.ytmp3v2.title || fileName}.mp3"`);
    res.sendFile(fileName, { root: './tmp' });
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
