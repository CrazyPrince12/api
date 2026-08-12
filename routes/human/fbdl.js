const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { facebookdlfunc } = require('../func/facebook');
const { getBuffer } = require('../func/functions');
const { guessExt } = require('../func/humanProxy');

const D = 'https://api.delirius.online';
const Z = 'https://api.dorratz.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

// Une image (JPEG/PNG/GIF) est detectee via ses octets magiques
function looksLikeImage(buffer) {
  if (!buffer || buffer.length < 4) return false;
  return (buffer[0] === 0xff && buffer[1] === 0xd8) || // JPEG
         (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) || // PNG
         (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46); // GIF
}

/**
 * Parcourt recursivement le JSON d'un upstream et classe chaque URL :
 * plus le score est eleve, plus la ressource ressemble a une video.
 */
function rankFacebookUrls(obj, depth = 0, score = 0, out = []) {
  if (!obj || depth > 6) return out;
  if (typeof obj === 'string') {
    if (/^https?:\/\//i.test(obj)) {
      let s = score;
      if (/\.mp4(?:\?|$)/i.test(obj) || /\/video\//i.test(obj)) s += 5;
      if (/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(obj) || /thumb|image|cover|preview|poster|photo|avatar/i.test(obj)) s -= 5;
      out.push({ url: obj, score: s });
    }
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => rankFacebookUrls(item, depth + 1, score, out));
    return out;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      let s = score;
      if (/^(hd|sd|video|videoUrl|video_url|playable_url|download|downloadUrl|download_url|url_download|src|source|link)$/i.test(k)) s += 3;
      else if (/thumb|image|cover|preview|poster|photo|avatar/i.test(k)) s -= 3;
      rankFacebookUrls(v, depth + 1, s, out);
    }
  }
  return out;
}

/**
 * Essaie les upstreams externes et ne garde que la VIDEO (jamais l image).
 * Retourne { buffer, ext } ou throw si aucun upstream ne donne une video.
 */
async function downloadFacebookVideoUpstream(url) {
  const upstreams = [
    `${D}/download/facebook`,
    `${Z}/v2/fb`,
    `${Z}/v2/facebook`
  ];
  let lastErr;
  for (const up of upstreams) {
    try {
      const r = await axios.get(up, {
        params: { url },
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 5,
        headers: { 'User-Agent': UA, Accept: '*/*' }
      });
      const ct = (r.headers['content-type'] || '').split(';')[0].trim();
      const buffer = Buffer.from(r.data);
      // Reponse binaire directe : la garder uniquement si ce n est pas une image
      if (!/json/i.test(ct) && !looksLikeImage(buffer)) {
        return { buffer, ext: guessExt(ct) === 'bin' ? 'mp4' : guessExt(ct) };
      }
      // Reponse JSON : chercher l URL de la video
      const text = buffer.toString('utf8');
      const json = JSON.parse(text);
      const candidates = rankFacebookUrls(json).sort((a, b) => b.score - a.score);
      for (const candidate of candidates) {
        try {
          const dl = await axios.get(candidate.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxRedirects: 5,
            headers: { 'User-Agent': UA, Accept: '*/*' }
          });
          const dlBuffer = Buffer.from(dl.data);
          if (looksLikeImage(dlBuffer)) continue; // c est une image, on passe a la suivante
          const dlCt = (dl.headers['content-type'] || '').split(';')[0].trim();
          const ext = /video|mp4/i.test(dlCt) || /\.mp4(?:\?|$)/i.test(candidate.url) ? 'mp4' : (guessExt(dlCt) === 'bin' ? 'mp4' : guessExt(dlCt));
          return { buffer: dlBuffer, ext };
        } catch (_) {}
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Aucun upstream Facebook n a repondu avec une video.');
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

    // 1) ENDPOINT fonctionnalités (facebookdlfunc) en première option — video uniquement
    try {
      const results = await facebookdlfunc(url);
      const fileData = results?.resultado?.data;
      if (typeof fileData !== 'string' || !/^https?:/i.test(fileData)) {
        throw new Error('Aucune video Facebook renvoyee par facebookdlfunc');
      }
      const fileBuffer = await getBuffer(fileData);
      if (looksLikeImage(fileBuffer)) {
        throw new Error('facebookdlfunc a renvoye une image, essai upstream suivant');
      }
      const fileName = writeTmp(fileBuffer, 'facebook_video', 'mp4');
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.sendFile(fileName, { root: './tmp' });
    } catch (_) {
      // fallback vers les upstreams externes
    }

    // 2) UPSTREAMS EXTERNES (delirius + dorratz) en secours — video uniquement
    const { buffer, ext } = await downloadFacebookVideoUpstream(url);
    const fileName = writeTmp(buffer, 'facebook_video', ext || 'mp4');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(fileName, { root: './tmp' });
  } catch (error) {
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
