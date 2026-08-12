const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const YT = require('../func/YT_mp3_mp4');
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
  const format = req.query.format;
  try {
    if (!match_url) {
      return res.setHeader('Content-Type', 'application/json')
        .status(400)
        .send(JSON.stringify({
          status: false,
          message: "Vous devez indiquer l URL de la video YouTube"
        }, null, 2));
    }

    // 1) ENDPOINT fonctionnalités (ytdl3 -> ruhend-scraper ytmp4) en première option
    try {
      const youtubeInfo = await obtenerInformacionYoutube(match_url);
      const video = youtubeInfo?.resultado?.ytmp4?.video;
      const title = youtubeInfo?.resultado?.ytmp4?.title;
      if (!youtubeInfo?.status || !video) {
        throw new Error('ytmp4 indisponible via fonctionnalites');
      }
      const videoBuffer = await getBuffer(video);
      const fileName = writeTmp(Buffer.isBuffer(videoBuffer) ? videoBuffer : Buffer.from(videoBuffer), 'videomp4', 'mp4');
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${title || fileName}.mp4"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {}

    // 2) UPSTREAMS EXTERNES (delirius) en secours
    try {
      const params = { url: match_url };
      if (format) params.format = format;
      const { buffer, contentType } = await tryUpstreams([
        `${D}/download/ytmp4`,
        `${D}/download/ytmp4v2`
      ], params);
      const ext = guessExt(contentType);
      const fileName = writeTmp(buffer, 'videomp4', (ext === 'bin' || !ext) ? 'mp4' : ext);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {}

    // 3) ANCIENNE METHODE (ytdl-core) en dernier recours
    const videoData = await YT.mp4(match_url);
    const videoPath = videoData.path;
    const fileName = path.basename(videoPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(fileName, { root: './tmp' });
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
