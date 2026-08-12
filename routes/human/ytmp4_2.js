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
  const link = req.query.url;
  const format = req.query.format;
  try {
    if (!link) {
      return res.setHeader('Content-Type', 'application/json')
        .status(400)
        .send(JSON.stringify({
          status: false,
          message: "Vous devez indiquer l URL de la video YouTube"
        }, null, 2));
    }

    // 1) NOUVEAUX ENDPOINTS en première option (autres upstreams)
    try {
      const params = { url: link };
      if (format) params.format = format;
      const { buffer, contentType } = await tryUpstreams([
        `${D}/download/ytmp4v2`,
        `${Z}/v2/ytmp4`,
        `${D}/download/ytmp4`
      ], params);
      const ext = guessExt(contentType);
      const fileName = writeTmp(buffer, 'video', (ext === 'bin' || !ext) ? 'mp4' : ext);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {}

    // 2) ANCIENLE METHODE
    const videoData = await YT.mp4_2(link);
    let infovid;
    try { infovid = await YT.ytinfo(link); } catch { infovid = { resultado: { title: null } }; }
    const videoBuffer = Buffer.from(videoData.buffer);
    const fileName = writeTmp(videoBuffer, 'video', 'mp4');
    res.download(`./tmp/${fileName}`, `${infovid.resultado?.title || fileName}.mp4`, (err) => {
      if (err) res.sendFile(path.join(__dirname, '../../public/500.html'));
    });
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
