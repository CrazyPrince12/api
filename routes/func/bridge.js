const axios = require('axios');
const path = require('path');
const express = require('express');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DROP_KEYS = /^(creator|author|powered|poweredby|powered_by|source|source_name|api_name|owner|by|ts)$/i;
const SOURCE_NAME = /delirius|dorratz|popcat|itsdevdiego|darlyn1234|darlyn|delirius api|welcome to delirius/gi;
const SOURCE_URL = /https?:\/\/(?:api\.)?(?:delirius\.online|dorratz\.com|popcat\.xyz)[^\s"'<>]*/gi;

function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (DROP_KEYS.test(key)) continue;
      if (/delirius|dorratz|popcat|itsdevdiego|darlyn/i.test(key)) continue;
      out[key] = scrub(val);
    }
    return out;
  }
  if (typeof value === 'string') {
    return value.replace(SOURCE_URL, '').replace(SOURCE_NAME, 'Empire').trim();
  }
  return value;
}

function wrapJson(payload) {
  if (payload == null) {
    return { status: false, message: 'Aucune donnee recue.', creator: 'BrunoSobrino' };
  }
  if (typeof payload !== 'object') {
    return { status: true, resultado: payload, creator: 'BrunoSobrino' };
  }
  const clean = scrub(payload);
  const failed = clean.ok === false || clean.status === false || clean.success === false;
  let resultado = clean.data ?? clean.resultado ?? clean.result ?? clean.results;
  if (resultado === undefined) {
    const { ok, status, error, message, success, ...rest } = clean;
    resultado = Object.keys(rest).length ? rest : clean;
  }
  if (failed) {
    return {
      status: false,
      message: clean.error || clean.message || 'La requete a echoue.',
      creator: 'BrunoSobrino'
    };
  }
  return { status: true, resultado, creator: 'BrunoSobrino' };
}

function pickParams(req, item) {
  const params = { ...(req.query || {}) };
  delete params.apikey;
  if (req.params) {
    for (const [key, val] of Object.entries(req.params)) {
      if (val != null) params[key] = val;
    }
  }
  const aliases = item.aliases || {};
  for (const [from, to] of Object.entries(aliases)) {
    if (params[from] != null && params[to] == null) params[to] = params[from];
  }
  const needed = [...(item.required || []), ...(item.optional || [])];
  if (params.text != null) {
    if (needed.includes('query') && params.query == null) params.query = params.text;
    if (needed.includes('q') && params.q == null) params.q = params.text;
  }
  if (params.query != null && needed.includes('q') && params.q == null) params.q = params.query;
  if (params.q != null && needed.includes('query') && params.query == null) params.query = params.q;
  return params;
}

function isBinary(contentType, buffer) {
  if (/image|video|audio|octet-stream|pdf|zip|ogg|webp|gif/i.test(contentType || '')) return true;
  if (!buffer || buffer.length < 4) return false;
  const b0 = buffer[0];
  const b1 = buffer[1];
  const b2 = buffer[2];
  const b3 = buffer[3];
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return true;
  if (b0 === 0xff && b1 === 0xd8) return true;
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) return true;
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) return true;
  if (b0 === 0x1a && b1 === 0x45 && b2 === 0xdf && b3 === 0xa3) return true;
  return false;
}

function guessType(buffer) {
  if (!buffer || buffer.length < 4) return 'application/octet-stream';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  return 'application/octet-stream';
}

async function callUpstream(url, params) {
  return axios.get(url, {
    params,
    responseType: 'arraybuffer',
    timeout: 50000,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: {
      'User-Agent': UA,
      Accept: '*/*'
    }
  });
}

function resolveUrl(entry, params) {
  if (typeof entry === 'function') return { url: entry(params), params: {} };
  return { url: entry, params };
}

async function handle(item, req, res) {
  const params = pickParams(req, item);
  for (const key of item.required || []) {
    if (params[key] == null || String(params[key]).trim() === '') {
      const errorResponse = {
        status: false,
        message: `Vous devez fournir le parametre requis : ${key}.`,
        example: item.example || undefined,
        creator: 'BrunoSobrino'
      };
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).send(JSON.stringify(errorResponse, null, 2));
    }
  }

  const queue = [item.upstream, ...(item.fallbacks || [])].filter(Boolean);
  for (const entry of queue) {
    try {
      const target = resolveUrl(entry, params);
      const response = await callUpstream(target.url, target.params);
      if (response.status >= 400) continue;
      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || '';
      if (item.type === 'image' || item.type === 'binary' || isBinary(contentType, buffer)) {
        res.setHeader('Content-Type', contentType || guessType(buffer));
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        return res.send(buffer);
      }
      const text = buffer.toString('utf8');
      try {
        const json = JSON.parse(text);
        res.setHeader('Content-Type', 'application/json');
        return res.send(JSON.stringify(wrapJson(json), null, 2));
      } catch {
        res.setHeader('Content-Type', 'application/json');
        return res.send(JSON.stringify(wrapJson(text), null, 2));
      }
    } catch {
      // try next upstream
    }
  }
  return res.sendFile(path.join(__dirname, '../../public/500.html'));
}

function attachCategory(router, category, catalog, options = {}) {
  const skip = new Set(options.skip || []);
  for (const item of catalog.filter((entry) => entry.category === category)) {
    if (skip.has(item.path) || skip.has(item.name)) continue;
    router.get(item.path, (req, res) => handle(item, req, res));
  }
  return router;
}

function createRouter(category, catalog, options) {
  const router = express.Router();
  attachCategory(router, category, catalog, options);
  return router;
}

module.exports = {
  handle,
  attachCategory,
  createRouter,
  wrapJson,
  scrub,
  pickParams
};
