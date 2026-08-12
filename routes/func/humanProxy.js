const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DROP_KEYS = /^(creator|author|powered|poweredby|powered_by|source|source_name|api_name|owner|by|ts)$/i;
const SOURCE_NAME = /delirius|dorratz|popcat|itsdevdiego|darlyn1234|darlyn|delirius api|welcome to delirius/gi;
const SOURCE_URL = /https?:\/\/(?:api\.)?(?:delirius\.online|dorratz\.com|popcat\.xyz)[^\s"'<>]*/gi;

function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (DROP_KEYS.test(k)) continue;
      if (/delirius|dorratz|popcat|itsdevdiego|darlyn/i.test(k)) continue;
      out[k] = scrub(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    return value.replace(SOURCE_URL, '').replace(SOURCE_NAME, 'Empire').trim();
  }
  return value;
}

function wrapJson(payload) {
  if (payload == null) return { status: false };
  if (typeof payload !== 'object') return { status: true, resultado: payload };
  const clean = scrub(payload);
  const failed = clean.ok === false || clean.status === false || clean.success === false;
  let resultado = clean.data ?? clean.resultado ?? clean.result ?? clean.results;
  if (resultado === undefined) {
    const { ok, status, error, message, success, ...rest } = clean;
    resultado = Object.keys(rest).length ? rest : clean;
  }
  if (failed) return { status: false, message: clean.error || clean.message };
  return { status: true, resultado };
}

function isBinary(contentType, buffer) {
  if (/image|video|audio|octet-stream|pdf|zip|ogg|webp|gif/i.test(contentType || '')) return true;
  if (!buffer || buffer.length < 4) return false;
  const b0 = buffer[0], b1 = buffer[1], b2 = buffer[2], b3 = buffer[3];
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return true; // PNG
  if (b0 === 0xff && b1 === 0xd8) return true; // JPEG
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return true; // GIF
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return true; // Webp
  if (b0 === 0x1a && b1 === 0x45 && b2 === 0xdf && b3 === 0xa3) return true; // Webm/Matroska
  if (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) return true; // MP3 ID3
  if (b0 === 0x00 && b1 === 0x00 && b2 === 0x00) return true; // MP4/ISO-BMFF containers often start with 00 00
  return false;
}

function guessExt(contentType) {
  if (!contentType) return 'bin';
  if (/audio\/mpeg/i.test(contentType)) return 'mp3';
  if (/audio\/(mp4|aac|x-m4a)/i.test(contentType)) return 'm4a';
  if (/audio\/ogg/i.test(contentType)) return 'ogg';
  if (/audio\/wav/i.test(contentType)) return 'wav';
  if (/video\/mp4/i.test(contentType)) return 'mp4';
  if (/video\/webm/i.test(contentType)) return 'webm';
  if (/image\/png/i.test(contentType)) return 'png';
  if (/image\/jpeg/i.test(contentType)) return 'jpg';
  if (/image\/gif/i.test(contentType)) return 'gif';
  if (/image\/webp/i.test(contentType)) return 'webp';
  if (/application\/zip/i.test(contentType)) return 'zip';
  return 'bin';
}

/**
 * Cherche dans un objet (récursivement) une URL de téléchargement directe.
 * Accepte une valeur "url", "download", "dl", "direct", "link", "url_download", "audio", "video", "source", "src"
 * qui ressemble à une URL http(s).
 */
function findDownloadUrl(obj, depth = 0) {
  if (depth > 5 || !obj) return null;
  if (typeof obj === 'string') {
    if (/^https?:\/\//i.test(obj)) return obj;
    return null;
  }
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const u = findDownloadUrl(it, depth + 1);
      if (u) return u;
    }
    return null;
  }
  if (typeof obj === 'object') {
    const priorKeys = ['url', 'download', 'dl', 'direct', 'direct_url', 'directUrl', 'url_download',
      'link', 'src', 'source', 'audio', 'video', 'media', 'file', 'downloadUrl'];
    for (const k of priorKeys) {
      if (obj[k] != null) {
        const u = findDownloadUrl(obj[k], depth + 1);
        if (u) return u;
      }
    }
    for (const v of Object.values(obj)) {
      const u = findDownloadUrl(v, depth + 1);
      if (u) return u;
    }
  }
  return null;
}

async function callUpstream(url, params) {
  return axios.get(url, {
    params,
    responseType: 'arraybuffer',
    timeout: 60000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
    headers: {
      'User-Agent': UA,
      Accept: '*/*'
    }
  });
}

/**
 * Essaie une liste d'URLs upstreams successivement.
 * Retourne dès qu'un upstream répond un binaire téléchargeable (parsing JSON pour trouver un lien de dl inclus).
 * En cas d'échec, throw — à l'appelant de fallback sur l'ancien code.
 */
async function tryUpstreams(upstreams, params) {
  let lastErr;
  for (const entry of upstreams) {
    try {
      const url = typeof entry === 'function' ? entry(params) : entry;
      const resp = await callUpstream(url, params);
      const buffer = Buffer.from(resp.data);
      const ct = resp.headers['content-type'] || '';
      if (isBinary(ct, buffer)) {
        return { buffer, contentType: ct.split(';')[0].trim() || 'application/octet-stream' };
      }
      // Tentative JSON
      try {
        const text = buffer.toString('utf8');
        const json = JSON.parse(text);
        const wrapped = wrapJson(json);
        if (wrapped.status) {
          const dlUrl = findDownloadUrl(wrapped.resultado);
          if (dlUrl) {
            // Télécharger l'URL directe
            const dl = await axios.get(dlUrl, {
              responseType: 'arraybuffer',
              timeout: 60000,
              maxRedirects: 5,
              headers: { 'User-Agent': UA, Accept: '*/*' }
            });
            const dlBuffer = Buffer.from(dl.data);
            const dlCt = (dl.headers['content-type'] || '').split(';')[0].trim();
            if (isBinary(dlCt, dlBuffer)) {
              return { buffer: dlBuffer, contentType: dlCt || 'application/octet-stream' };
            }
          }
        }
      } catch {
        // pas du JSON, on continue
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Aucun upstream n a repondu.');
}

module.exports = {
  tryUpstreams,
  guessExt
};
