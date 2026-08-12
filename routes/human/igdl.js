const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const archiver = require('archiver');
const { igdl2 } = require('../func/igdl');
const { getBuffer } = require('../func/functions');
const { tryUpstreams, guessExt } = require('../func/humanProxy');

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

async function fetchBinary(link) {
  const r = await axios.get(link, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 5,
    headers: { 'User-Agent': UA, Accept: '*/*' }
  });
  return { buffer: Buffer.from(r.data), contentType: (r.headers['content-type'] || '').split(';')[0].trim() };
}

/**
 * Essaie les nouveaux endpoints. Retourne { zip, file } ou throw.
 * Parse JSON pour extraire les URLs (array d'objets {type,url}).
 */
async function downloadNew(url) {
  // Essayer d'abord binaire direct
  for (const up of [`${D}/download/instagram`, `${Z}/v2/instagram`, `${Z}/v2/igdl`, `${D}/download/instagramv2`]) {
    try {
      const { buffer, contentType } = await tryUpstreams([up], { url });
      if (!/json/i.test(contentType)) {
        const ext = guessExt(contentType);
        return { single: { buffer, ext: ext === 'bin' ? 'mp4' : ext } };
      }
    } catch (_) {}
  }
  // Sinon, récupérer le JSON et télécharger chaque média
  let lastErr;
  for (const up of [`${D}/download/instagram`, `${Z}/v2/instagram`, `${Z}/v2/igdl`, `${D}/download/instagramv2`]) {
    try {
      const r = await axios.get(up, {
        params: { url },
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 5,
        headers: { 'User-Agent': UA, Accept: '*/*' }
      });
      const text = Buffer.from(r.data).toString('utf8');
      const json = JSON.parse(text);
      // Extraire le résultat quel que soit le wrapping
      const data = json.resultado || json.data || json.result || json.results || json;
      const items = Array.isArray(data) ? data : (data?.data ? data.data : (data?.media ? data.media : null));
      if (Array.isArray(items) && items.length) {
        const downloaded = [];
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const link = it.url || it.url_download || it.downloadUrl || it.dl || it.link || (typeof it === 'string' ? it : null);
          if (!link) continue;
          const { buffer, contentType } = await fetchBinary(link);
          const isVideo = /video/i.test(contentType) || /mp4/i.test(link) || it.type === 'video';
          downloaded.push({ buffer, ext: isVideo ? 'mp4' : (guessExt(contentType) === 'bin' ? 'jpg' : guessExt(contentType)) });
        }
        if (downloaded.length === 1) {
          return { single: downloaded[0] };
        }
        if (downloaded.length > 1) {
          return { multi: downloaded };
        }
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Aucun upstream Instagram n a repondu.');
}

router.get('/', async (req, res) => {
  const url = req.query.url;
  try {
    if (!url) {
      return res.setHeader('Content-Type', 'application/json')
        .status(400)
        .send(JSON.stringify({
          status: false,
          message: "Vous devez indiquer l URL de la video, publication, reel ou image Instagram."
        }, null, 2));
    }

    // 1) NOUVEAUX ENDPOINTS en première option
    try {
      const dl = await downloadNew(url);
      if (dl.single) {
        const ext = dl.single.ext;
        const ct = ext === 'mp4' ? 'video/mp4' : (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
        const fileName = writeTmp(dl.single.buffer, 'instagram', ext);
        res.setHeader('Content-Type', ct);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.sendFile(fileName, { root: './tmp' });
      }
      if (dl.multi) {
        // ZIP
        const zipFileName = `instagram_${Date.now()}.zip`;
        const zipFilePath = path.join(__dirname, `../../tmp/${zipFileName}`);
        const output = fs.createWriteStream(zipFilePath);
        const zip = archiver('zip', { zlib: { level: 9 } });
        output.on('close', () => {
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
          res.sendFile(zipFilePath);
        });
        zip.on('error', () => res.sendFile(path.join(__dirname, '../../public/500.html')));
        zip.pipe(output);
        dl.multi.forEach((f, i) => {
          const tmpName = writeTmp(f.buffer, `instagram_part_${i + 1}`, f.ext);
          zip.file(path.join(__dirname, `../../tmp/${tmpName}`), { name: tmpName });
        });
        return zip.finalize();
      }
    } catch (_) {
      // fallback vers l'ancienne méthode
    }

    // 2) ANCIENLE METHODE (igdl2)
    const results = await igdl2(url);

    if (results.data.length > 1) {
      const archivosPromises = results.data.map(async (archivo, index) => {
        const fileType = archivo.type;
        const fileUrl = archivo.url_download;
        const archivoBuffer = await getBuffer(fileUrl);
        const extension = fileType === 'video' ? 'mp4' : 'jpg';
        const fileName = writeTmp(archivoBuffer, `instagram_${index + 1}`, extension);
        return { fileName, fileType };
      });

      const archivosDescargados = await Promise.all(archivosPromises);

      const zipFileName = `instagram_${Date.now()}.zip`;
      const zipFilePath = path.join(__dirname, `../../tmp/${zipFileName}`);
      const output = fs.createWriteStream(zipFilePath);
      const zip = archiver('zip', { zlib: { level: 9 } });
      output.on('close', () => {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        res.sendFile(zipFilePath);
      });
      zip.pipe(output);
      archivosDescargados.forEach(({ fileName }) => {
        zip.file(path.join(__dirname, `../../tmp/${fileName}`), { name: fileName });
      });
      zip.finalize();
    } else {
      const fileType = results.data[0].type;
      const fileUrl = results.data[0].url_download;
      const archivoBuffer = await getBuffer(fileUrl);
      const extension = fileType === 'video' ? 'mp4' : 'jpg';
      const fileName = writeTmp(archivoBuffer, 'instagram', extension);
      res.setHeader('Content-Type', fileType === 'video' ? 'video/mp4' : 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(fileName, { root: './tmp' });
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de la requete : ${error.message}`);
    res.sendFile(path.join(__dirname, '../../public/500.html'));
  }
});

module.exports = router;
