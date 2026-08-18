const D = 'https://api.delirius.online';
const P = 'https://api.popcat.xyz';
const Z = 'https://api.dorratz.com';

const SKIP = new Set(['loli', 'lolipc', 'lolivid', 'nsfwloli']);

function ep(category, name, params = [], extra = {}) {
  if (SKIP.has(name)) return null;
  const required = params.filter((p) => !p.endsWith('?')).map((p) => p.replace(/\?$/, ''));
  const optional = params.filter((p) => p.endsWith('?')).map((p) => p.slice(0, -1));
  const pathName = extra.path || `/${name}`;
  const exampleQuery = extra.example || buildExample(required, extra.sample);
  return {
    category,
    name,
    path: pathName,
    required,
    optional,
    upstream: extra.upstream || `${D}/${extra.upstreamPath || `${category}/${name}`}`,
    fallbacks: extra.fallbacks || [],
    type: extra.type || 'auto',
    label: extra.label || name,
    example: exampleQuery,
    group: extra.group || category,
    aliases: extra.aliases || {}
  };
}

function buildExample(required, sample = {}) {
  const defaults = {
    url: 'https://youtu.be/JLWRZ8eWyZo',
    text: 'api empire',
    query: 'naruto',
    q: 'twice',
    image: '/crown-logo.png',
    image1: '/crown-logo.png',
    image2: '/crown-logo.png',
    url1: '/crown-logo.png',
    url2: '/crown-logo.png',
    username: 'CrazyPrince',
    name: 'CrazyPrince',
    language: 'fr',
    format: '360p'
  };
  const parts = required.map((key) => `${key}=${encodeURIComponent(sample[key] || defaults[key] || 'valeur')}`);
  return parts.length ? parts.join('&') : '';
}

function list(category, rows) {
  return rows.map((row) => {
    if (typeof row === 'string') return ep(category, row);
    const [name, params, extra] = row;
    return ep(category, name, params || [], extra || {});
  }).filter(Boolean);
}

const download = list('download', [
  ['applemusic', ['url'], { group: 'Musique', sample: { url: 'https://music.apple.com/es/album/i-cant-stop-me/1535654236?i=1535654244' } }],
  ['webtoon', ['url'], { group: 'Autres', sample: { url: 'https://www.webtoons.com/es/action/fog-land/list?title_no=9361' } }],
  ['capcut', ['url'], { group: 'Video', fallbacks: [`${Z}/v2/capcut`], sample: { url: 'https://www.capcut.com/tv2/ZSHdcPokP/' } }],
  ['threads', ['url'], { group: 'Reseaux', fallbacks: [`${Z}/v2/threads`], sample: { url: 'https://www.threads.net/@afaseleccionen/post/C51QGO-rn0R' } }],
  ['mega', [], { group: 'Fichiers' }],
  ['ytmp3', ['url'], { group: 'YouTube', fallbacks: [`${Z}/v2/ytmp3`] }],
  ['ytmp3v2', ['url'], { group: 'YouTube', fallbacks: [`${Z}/v2/ytmp3`] }],
  ['ytmp4', ['url', 'format?'], { group: 'YouTube', fallbacks: [`${Z}/v2/ytmp4`] }],
  ['ytmp4v2', ['url', 'format?'], { group: 'YouTube', fallbacks: [`${Z}/v2/ytmp4`], upstream: `${D}/download/ytmp4v2` }],
  ['telegramstories', ['url'], { group: 'Telegram', sample: { url: 'https://t.me/hielsajean/s/428' } }],
  ['tiktok', ['url'], { group: 'TikTok', fallbacks: [`${Z}/v2/tiktok`], sample: { url: 'https://vt.tiktok.com/ZS43DntHW/' } }],
  ['instagram', ['url'], { group: 'Instagram', fallbacks: [`${Z}/v2/instagram`, `${Z}/v2/igdl`], sample: { url: 'https://www.instagram.com/janextruong/p/C7cVzn2yzXB/' } }],
  ['instagramv2', ['url'], { group: 'Instagram', sample: { url: 'https://www.instagram.com/janextruong/p/C7cVzn2yzXB/' } }],
  ['twitterdl', ['url'], { group: 'X Twitter', fallbacks: [`${Z}/v2/twitter`], sample: { url: 'https://x.com/Wendyta_vc/status/1925681330727137327' } }],
  ['pornhub', ['url'], { group: 'Adult', sample: { url: 'https://es.pornhub.com/view_video.php?viewkey=69206bab2519a' } }],
  ['xnxxdl', ['url'], { group: 'Adult', sample: { url: 'https://www.xnxx.com/video-11qev1b8/estudiante_latina_se_da_unos_sentones_' } }],
  ['xvideos', ['url'], { group: 'Adult', sample: { url: 'https://www.xvideos.com/video.oulbllpc80d/skinny_horny_latina' } }],
  ['stickerly', ['url'], { group: 'Stickers', sample: { url: 'https://sticker.ly/s/MPTYYK' } }],
  ['stickerwiki', ['url'], { group: 'Stickers', sample: { url: 'https://stickers.wiki/es/telegram/lovehwangyejii/' } }],
  ['imgur', ['url'], { group: 'Fichiers', sample: { url: 'https://imgur.com/gallery/ouMQkN1' } }],
  ['pastebin', ['url'], { group: 'Fichiers', sample: { url: 'https://pastebin.com/WcVJ9TMu' } }],
  ['apk', ['query'], { group: 'Apps', fallbacks: [`${Z}/v2/apk`], aliases: { text: 'query', q: 'query' }, sample: { query: 'whatsapp' } }],
  ['twitter', ['url'], { group: 'X Twitter', fallbacks: [`${Z}/v2/twitter`], sample: { url: 'https://x.com/godmitzu/status/1818622494502195564' } }],
  ['spotifydl', ['url'], { group: 'Musique', fallbacks: [`${Z}/v2/spotify`], sample: { url: 'https://open.spotify.com/track/37ZtpRBkHcaq6hHy0X98zn' } }],
  ['spotifyinfo', ['url'], { group: 'Musique', sample: { url: 'https://open.spotify.com/track/37ZtpRBkHcaq6hHy0X98zn' } }],
  ['gofile', ['url'], { group: 'Fichiers' }],
  ['soundcloud', ['url'], { group: 'Musique', fallbacks: [`${Z}/v2/soundcloud`], sample: { url: 'https://soundcloud.com/twice-57013/one-spark' } }],
  ['facebook', ['url'], { group: 'Facebook', fallbacks: [`${Z}/v2/fb`, `${Z}/v2/facebook`], sample: { url: 'https://www.facebook.com/share/v/17G62zi96v/' } }],
  ['gitclone', ['url'], { group: 'Fichiers', sample: { url: 'https://github.com/CrazyPrince12/api' } }],
  ['spotifyalbum', ['url'], { group: 'Musique', sample: { url: 'https://open.spotify.com/album/22DL6IRGNYNenKej7aw8pO' } }],
  ['spotifyplaylist', ['url'], { group: 'Musique', sample: { url: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO4gtw7S' } }],
  ['pinterestdl', ['url'], { group: 'Pinterest', fallbacks: [`${Z}/v2/pinterest`], sample: { url: 'https://pin.it/2Vflx5O' } }],
  ['telegramsticker', ['url'], { group: 'Telegram', sample: { url: 'https://t.me/addstickers/Tuaisesana_by_fStikBot' } }],
  ['mediafire', ['url'], { group: 'Fichiers', fallbacks: [`${Z}/v2/mediafire`], sample: { url: 'https://www.mediafire.com/file/example' } }],
  ['snackvideo', ['url'], { group: 'Video', fallbacks: [`${Z}/v2/snackvideo`], sample: { url: 'https://www.snackvideo.com/@soSophi_/video/5219259131520495917' } }]
]);

const search = list('search', [
  ['webtoons', ['query', 'language?'], { group: 'Comics', aliases: { text: 'query', q: 'query' } }],
  ['amazon', ['query', 'page?', 'language?'], { group: 'Shopping', aliases: { text: 'query' } }],
  ['facebooksearch', ['query'], { group: 'Reseaux', aliases: { text: 'query' } }],
  ['instagramreels', ['query', 'language?'], { group: 'Instagram', aliases: { text: 'query' } }],
  ['vimeo', ['query', 'limit?', 'page?'], { group: 'Video', aliases: { text: 'query' } }],
  ['patreon', ['query', 'page?'], { group: 'Reseaux', aliases: { text: 'query' } }],
  ['tumblr', ['tag', 'limit?'], { group: 'Images', aliases: { text: 'tag', query: 'tag', q: 'tag' } }],
  ['wiki', ['q', 'language?'], { group: 'Infos', aliases: { text: 'q', query: 'q' } }],
  ['appstore', ['q'], { group: 'Apps', aliases: { text: 'q', query: 'q' } }],
  ['playstore', ['q', 'limit?', 'lang?'], { group: 'Apps', aliases: { text: 'q', query: 'q' }, fallbacks: [`${Z}/v2/playstore`] }],
  ['npm', ['q', 'limit?'], { group: 'Dev', aliases: { text: 'q', query: 'q' }, fallbacks: [`${P}/npm`] }],
  ['spotify', ['q', 'limit?'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['spotifysearchweb', ['q', 'limit?'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['spotifyalbum', ['q', 'limit?'], { group: 'Musique', aliases: { text: 'q', query: 'q' }, upstream: `${D}/search/spotifyalbum` }],
  ['spotifyplaylist', ['q', 'limit?'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['tenor', ['q'], { group: 'GIF', aliases: { text: 'q', query: 'q' } }],
  ['deezer', ['q'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['genius', ['q'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['geniuslyrics', ['url', 'parse?'], { group: 'Musique' }],
  ['ytsearch', ['q'], { group: 'YouTube', aliases: { text: 'q', query: 'q' } }],
  ['ytmusic', ['q'], { group: 'YouTube', aliases: { text: 'q', query: 'q' } }],
  ['ytmusicalbum', ['q'], { group: 'YouTube', aliases: { text: 'q', query: 'q' } }],
  ['pokecard', ['text', 'url?'], { group: 'Anime' }],
  ['pinterest', ['text'], { group: 'Images', aliases: { query: 'text', q: 'text' } }],
  ['pinterestv2', ['text'], { group: 'Images', aliases: { query: 'text', q: 'text' } }],
  ['pinterestvideo', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['gimage', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['musixmatch', ['query'], { group: 'Musique', aliases: { text: 'query', q: 'query' } }],
  ['lyrics', ['query'], { group: 'Musique', aliases: { text: 'query', q: 'query' }, fallbacks: [`${P}/lyrics`, `${Z}/v2/lyrics`] }],
  ['applemusic', ['query'], { group: 'Musique', aliases: { text: 'query', q: 'query' } }],
  ['rule34', ['query'], { group: 'NSFW', aliases: { text: 'query', q: 'query' }, sample: { query: 'waifu' } }],
  ['googlesearch', ['query'], { group: 'Web', aliases: { text: 'query', q: 'query' }, fallbacks: [`${Z}/v2/google`] }],
  ['movie', ['query'], { group: 'Films', aliases: { text: 'query', q: 'query' } }],
  ['bing', ['query'], { group: 'Web', aliases: { text: 'query', q: 'query' } }],
  ['bingimage', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['bingvideos', ['query'], { group: 'Video', aliases: { text: 'query', q: 'query' } }],
  ['movieyts', ['search'], { group: 'Films', aliases: { text: 'search', query: 'search', q: 'search' } }],
  ['soundcloud', ['q', 'limit?'], { group: 'Musique', aliases: { text: 'q', query: 'q' } }],
  ['tiktoksearch', ['query'], { group: 'TikTok', aliases: { text: 'query', q: 'query' } }],
  ['tiktoksearchimages', ['query', 'limit?'], { group: 'TikTok', aliases: { text: 'query', q: 'query' } }],
  ['yahoo', ['query', 'language?'], { group: 'Web', aliases: { text: 'query', q: 'query' } }],
  ['500px', ['query', 'cursor?'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['dailymotion', ['query', 'page?', 'limit?'], { group: 'Video', aliases: { text: 'query', q: 'query' } }],
  ['bangbros', ['query'], { group: 'NSFW', aliases: { text: 'query', q: 'query' } }],
  ['cookpad', ['query', 'country?'], { group: 'Cuisine', aliases: { text: 'query', q: 'query' } }],
  ['cookpaddetail', ['url'], { group: 'Cuisine' }],
  ['stickerwiki', ['query'], { group: 'Stickers', aliases: { text: 'query', q: 'query' } }],
  ['wallcraft', ['query'], { group: 'Fonds', aliases: { text: 'query', q: 'query' } }],
  ['stickerly', ['query'], { group: 'Stickers', aliases: { text: 'query', q: 'query' } }],
  ['inkafarma', ['query', 'limit?'], { group: 'Shopping', aliases: { text: 'query', q: 'query' } }],
  ['elcomercio', ['query'], { group: 'Actu', aliases: { text: 'query', q: 'query' } }],
  ['pixaiart', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['southpark', ['query', 'page?'], { group: 'Series', aliases: { text: 'query', q: 'query' } }],
  ['ani1', ['query'], { group: 'Anime', aliases: { text: 'query', q: 'query' } }],
  ['pixabay', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['steam', ['query'], { group: 'Jeux', aliases: { text: 'query', q: 'query' }, fallbacks: [`${P}/steam`] }],
  ['wattpadsearch', ['query', 'limit?'], { group: 'Livres', aliases: { text: 'query', q: 'query' } }],
  ['wattpaddetail', ['id'], { group: 'Livres' }],
  ['unsplash', ['q'], { group: 'Images', aliases: { text: 'q', query: 'q' } }],
  ['animesearch', ['q'], { group: 'Anime', aliases: { text: 'q', query: 'q' } }],
  ['mangasearch', ['q'], { group: 'Anime', aliases: { text: 'q', query: 'q' } }],
  ['pornhub', ['query', 'page?', 'apikey?'], { group: 'NSFW', aliases: { text: 'query', q: 'query' } }],
  ['xnxxsearch', ['query'], { group: 'NSFW', aliases: { text: 'query', q: 'query' } }],
  ['xvideos', ['query', 'page?'], { group: 'NSFW', aliases: { text: 'query', q: 'query' } }],
  ['gelbooru', ['query'], { group: 'NSFW', aliases: { text: 'query', q: 'query' }, sample: { query: 'waifu' } }],
  ['safebooru', ['query'], { group: 'Anime', aliases: { text: 'query', q: 'query' }, sample: { query: 'waifu' } }],
  ['rule34v2', ['query', 'page?'], { group: 'NSFW', aliases: { text: 'query', q: 'query' }, sample: { query: 'waifu' } }],
  ['zerochan', ['q'], { group: 'Anime', aliases: { text: 'q', query: 'q' }, sample: { q: 'waifu' } }],
  ['konachan', ['q'], { group: 'Anime', aliases: { text: 'q', query: 'q' }, sample: { q: 'waifu' } }],
  ['wallpapers', ['q'], { group: 'Fonds', aliases: { text: 'q', query: 'q' } }],
  ['uhdpaper', ['query'], { group: 'Fonds', aliases: { text: 'query', q: 'query' } }],
  ['wallhaven', ['q', 'page?'], { group: 'Fonds', aliases: { text: 'q', query: 'q' } }],
  ['anilist', ['q'], { group: 'Anime', aliases: { text: 'q', query: 'q' } }]
]);

const tools = list('tools', [
  ['country', ['text'], { group: 'Infos' }],
  ['emoji', ['text'], { group: 'Emoji' }],
  ['minecraft', ['limit?', 'page?'], { group: 'Jeux' }],
  ['checknsfw', ['image'], { group: 'Moderation' }],
  ['checkporn', ['image'], { group: 'Moderation' }],
  ['xstalk', ['username'], { group: 'Stalk' }],
  ['videy', ['video'], { group: 'Video' }],
  ['domains', ['domain'], { group: 'Web' }],
  ['symbols', ['query'], { group: 'Texte', aliases: { text: 'query', q: 'query' } }],
  ['ephoto', ['effect', 'text', 'text2?'], { group: 'Createur' }],
  ['photofuniatext', ['effect', 'text', 'text2?'], { group: 'Createur' }],
  ['photofuniaimage', ['effect', 'image'], { group: 'Createur' }],
  ['table', ['element'], { group: 'Sciences' }],
  ['boostrap', [], { group: 'Web' }],
  ['ibb', ['image', 'filename?'], { group: 'Upload' }],
  ['flaginfo', ['query'], { group: 'Infos', aliases: { text: 'query', q: 'query' } }],
  ['telegramorg', ['url', 'filename?'], { group: 'Upload' }],
  ['whatsappchannelstalk', ['channel'], { group: 'Stalk' }],
  ['stickerpack', ['query', 'page?'], { group: 'Stickers', aliases: { text: 'query', q: 'query' } }],
  ['pokemon', ['query', 'language?'], { group: 'Jeux', aliases: { text: 'query', q: 'query' } }],
  ['pokemonrd', [], { group: 'Jeux' }],
  ['ipinfo', ['ip'], { group: 'Reseau' }],
  ['robloxstalk', ['username', 'type?'], { group: 'Stalk' }],
  ['discord', ['url', 'filename?'], { group: 'Upload' }],
  ['postimage', ['url', 'filename?'], { group: 'Upload' }],
  ['gtts', ['text', 'language?'], { group: 'Audio', type: 'binary' }],
  ['applenewsroom', ['language?'], { group: 'Actu' }],
  ['wabetainfo', [], { group: 'Actu' }],
  ['infoyt', ['url'], { group: 'YouTube' }],
  ['checkurl', ['url'], { group: 'Web' }],
  ['translate', ['text', 'language'], { group: 'Texte', fallbacks: [`${P}/translate`] }],
  ['telegramchannelstalk', ['channel'], { group: 'Stalk' }],
  ['htmlextract', ['url'], { group: 'Web' }],
  ['hostingchecker', ['url'], { group: 'Web' }],
  ['savewebzip', ['url'], { group: 'Web' }],
  ['ping', [], { group: 'Reseau' }],
  ['mojito', ['emoji'], { group: 'Emoji' }],
  ['mixed', ['emoji1', 'emoji2'], { group: 'Emoji' }],
  ['noticias', ['language?', 'country?'], { group: 'Actu' }],
  ['sswebpdf', ['url'], { group: 'Capture', type: 'binary' }],
  ['ssweb', ['url'], { group: 'Capture', type: 'image', fallbacks: [`${P}/screenshot`] }],
  ['telegramstalk', ['username'], { group: 'Stalk' }],
  ['tiktokstalk', ['q'], { group: 'Stalk', aliases: { username: 'q', text: 'q', query: 'q' }, fallbacks: [`${Z}/v2/ttstalk`] }],
  ['steamstalk', ['username'], { group: 'Stalk' }],
  ['igstalk', ['username'], { group: 'Stalk', fallbacks: [`${Z}/v2/igstalk`] }],
  ['threadsststalk', ['username'], { group: 'Stalk' }],
  ['pintereststalk', ['username'], { group: 'Stalk' }]
]);

const ia = list('ia', [
  ['bypass', ['url'], { group: 'IA' }],
  ['age', ['image', 'language?'], { group: 'Vision' }],
  ['upscale', ['image'], { group: 'Vision', type: 'image' }],
  ['enhance', ['image', 'scale?'], { group: 'Vision', type: 'image' }],
  ['checkaesthetic', ['image'], { group: 'Vision' }],
  ['celebrity', ['image'], { group: 'Vision' }],
  ['ripleai', ['query'], { group: 'Chat', aliases: { text: 'query', q: 'query' } }],
  ['gptprompt', ['text', 'prompt'], { group: 'Chat' }],
  ['chatgpt', ['q'], { group: 'Chat', aliases: { text: 'q', query: 'q' }, fallbacks: [`${Z}/ai/gpt`] }],
  ['gemini', ['query'], { group: 'Chat', aliases: { text: 'query', q: 'query' }, fallbacks: [`${Z}/ai/gemini`] }],
  ['weather', ['query'], { group: 'Infos', aliases: { text: 'query', q: 'query' }, fallbacks: [`${P}/weather`] }]
]);

const nsfw = list('nsfw', [
  ['corean', [], { group: 'NSFW', type: 'image' }],
  ['tiktok', [], { group: 'NSFW', type: 'binary' }],
  ['boobs', [], { group: 'NSFW', type: 'image' }],
  ['girls', [], { group: 'NSFW', type: 'image' }]
]);

const random = list('random', [
  ['duck', [], { group: 'Animaux', type: 'image' }],
  ['coffee', [], { group: 'Images', type: 'image' }],
  ['picsum', [], { group: 'Images', type: 'image' }],
  ['loremflickr', ['flags?'], { group: 'Images', type: 'image' }],
  ['dog', [], { group: 'Animaux', type: 'image' }],
  ['cat', ['text?'], { group: 'Animaux', type: 'image' }],
  ['avatar', ['style?'], { path: '/avatar/:seed', group: 'Avatars', type: 'image', upstream: (params) => `${D}/random/avatar/${encodeURIComponent(params.seed || 'empire')}?style=${encodeURIComponent(params.style || 'pixel-art')}` }]
]);

const reactionNames = [
  'anal', 'blowjob', 'cum', 'fuck', 'nekonsfw', 'pussylick', 'solo', 'yuri',
  'angry', 'bite', 'blush', 'bonk', 'bully', 'confy', 'cringe', 'cry', 'cuddle',
  'dance', 'eevee', 'fluff', 'glomp', 'handhold', 'happy', 'highfive', 'hug',
  'kick', 'kill', 'kiss', 'lay', 'lick', 'nekosfw', 'nom', 'pat', 'poke', 'pout',
  'slap', 'smile', 'smug', 'tail', 'tickle', 'wink', 'yeet'
];
const reactions = list('reactions', reactionNames.map((name) => [name, [], { group: name.match(/anal|blowjob|cum|fuck|nekonsfw|pussylick|solo|yuri/) ? 'NSFW' : 'SFW', type: 'image' }]));

const shorten = list('shorten', [
  ['googleshort', ['url'], { group: 'Liens' }],
  ['tinyurl', ['url'], { group: 'Liens' }],
  ['isgd', ['url'], { group: 'Liens' }],
  ['shorten', ['url'], { group: 'Liens' }],
  ['vurl', ['url'], { group: 'Liens' }],
  ['dagd', ['url'], { group: 'Liens' }]
]);

const canvas = list('canvas', [
  ['brat', ['text'], { group: 'Texte', type: 'image' }],
  ['bratvideo', ['text'], { group: 'Texte', type: 'binary' }],
  ['bratanime', ['text'], { group: 'Texte', type: 'image' }],
  ['patrick', ['url'], { group: 'Memes', type: 'image' }],
  ['quote', ['image', 'text', 'footer?'], { group: 'Memes', type: 'image', fallbacks: [`${P}/quote`] }],
  ['tweet', ['name', 'username', 'comment', 'image', 'theme?'], { group: 'Memes', type: 'image', fallbacks: [`${P}/tweet`] }],
  ['pokeview', ['query', 'view?'], { group: 'Jeux' }],
  ['xnxxcard', ['image', 'title'], { group: 'Memes', type: 'image' }],
  ['phub', ['image', 'username', 'text'], { group: 'Memes', type: 'image' }],
  ['bofetada', ['url1', 'url2'], { group: 'Memes', type: 'image' }],
  ['bed', ['url1', 'url2'], { group: 'Memes', type: 'image' }],
  ['circle', ['url'], { group: 'Filtres', type: 'image' }],
  ['affect', ['url'], { group: 'Memes', type: 'image' }],
  ['facepalm', ['url'], { group: 'Memes', type: 'image' }],
  ['shit', ['url'], { group: 'Memes', type: 'image' }],
  ['trash', ['url'], { group: 'Memes', type: 'image' }],
  ['balcard', ['url', 'background', 'username', 'discriminator', 'money', 'xp', 'level'], { group: 'Cartes', type: 'image' }],
  ['ship', ['image1', 'image2', 'name1', 'name2', 'percentage?', 'text?'], { group: 'Cartes', type: 'image', fallbacks: [`${P}/ship`] }],
  ['friendship', ['image1', 'image2', 'name1', 'name2', 'percentage?', 'text?'], { group: 'Cartes', type: 'image' }],
  ['gaycard', ['url', 'name', 'rank?'], { group: 'Memes', type: 'image' }],
  ['ttp', ['text', 'color?'], { group: 'Stickers', type: 'image' }],
  ['attp', ['text'], { group: 'Stickers', type: 'image' }],
  ['petgif', ['url', 'resolution?', 'delay?'], { group: 'Filtres', type: 'binary', fallbacks: [`${P}/pet`] }],
  ['book', ['text', 'footer?'], { group: 'Texte', type: 'image' }],
  ['jokeoverhead', ['url'], { group: 'Memes', type: 'image', fallbacks: [`${P}/jokeoverhead`] }],
  ['slap', ['url1', 'url2'], { group: 'Memes', type: 'image' }],
  ['hitler', ['url'], { group: 'Memes', type: 'image' }],
  ['delete', ['url'], { group: 'Memes', type: 'image' }],
  ['rip', ['url'], { group: 'Memes', type: 'image' }],
  ['gay', ['url'], { group: 'Filtres', type: 'image' }],
  ['invert', ['url'], { group: 'Filtres', type: 'image', fallbacks: [`${P}/invert`] }],
  ['simp', ['url'], { group: 'Memes', type: 'image' }],
  ['autorizo', ['url'], { group: 'Memes', type: 'image' }],
  ['noautorizo', ['url'], { group: 'Memes', type: 'image' }],
  ['changemymind', ['text'], { group: 'Memes', type: 'image' }],
  ['createqr', ['text'], { group: 'Outils', type: 'image' }]
]);

const anime = list('anime', [
  ['total_characters', [], { group: 'Infos' }],
  ['gacha', [], { group: 'Random' }],
  ['characterlist', ['query'], { group: 'Infos', aliases: { text: 'query', q: 'query' } }],
  ['hitomi', ['url'], { group: 'Adult' }],
  ['hentaitv', ['query'], { group: 'Adult', aliases: { text: 'query', q: 'query' } }],
  ['pixiv', ['query'], { group: 'Images', aliases: { text: 'query', q: 'query' } }],
  ['nhentaisearch', ['query'], { group: 'Adult', aliases: { text: 'query', q: 'query' } }],
  ['nhentai', ['query'], { group: 'Adult', aliases: { text: 'query', q: 'query' }, sample: { query: 'naruto' } }],
  ['animesearch', ['query'], { group: 'Infos', aliases: { text: 'query', q: 'query' } }],
  ['animeinfo', ['query'], { group: 'Infos', aliases: { text: 'query', q: 'query' } }],
  ['animeinfourl', ['url'], { group: 'Infos' }],
  ['newsanime', [], { group: 'Actu' }],
  ['maid', [], { group: 'Random', type: 'image' }],
  ['selfie', [], { group: 'Random', type: 'image' }],
  ['oppai', [], { group: 'Adult', type: 'image' }],
  ['mori_calliope', [], { group: 'Random', type: 'image' }],
  ['marin_kitagawa', [], { group: 'Random', type: 'image' }],
  ['uniform', [], { group: 'Random', type: 'image' }],
  ['avatar', [], { group: 'Random', type: 'image' }],
  ['hentaivid', [], { group: 'Adult', type: 'binary' }],
  ['foxgirl', [], { group: 'Random', type: 'image' }],
  ['neko', [], { group: 'Random', type: 'image' }]
]);

const plus = [
  ep('plus', 'welcomecard', ['background', 'avatar', 'text1', 'text2', 'text3'], { group: 'Cartes', type: 'image', upstream: `${P}/welcomecard` }),
  ep('plus', 'color', ['hex'], { path: '/color/:hex?', group: 'Infos', upstream: (p) => `${P}/color/${encodeURIComponent((p.hex || p.text || 'ff5733').replace('#', ''))}` }),
  ep('plus', 'achievement', ['text', 'icon?'], { group: 'Memes', type: 'image', upstream: `${P}/achievement` }),
  ep('plus', 'emojipasta', ['text'], { group: 'Texte', upstream: `${P}/emojipasta` }),
  ep('plus', 'caption', ['image', 'caption', 'dark?', 'bottom?', 'fontsize?'], { group: 'Memes', type: 'image', upstream: `${P}/caption` }),
  ep('plus', 'discordmessage', ['username', 'content', 'avatar?', 'color?', 'timestamp?'], { group: 'Memes', type: 'image', upstream: `${P}/discord` }),
  ep('plus', 'couldread', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/couldread` }),
  ep('plus', 'supreme', ['text'], { group: 'Logos', type: 'image', upstream: `${P}/supreme` }),
  ep('plus', 'periodictable', ['element'], { group: 'Sciences', aliases: { text: 'element', q: 'element', query: 'element' }, upstream: `${P}/periodic-table` }),
  ep('plus', 'periodictablerandom', [], { group: 'Sciences', upstream: `${P}/periodic-table/random` }),
  ep('plus', 'huerotate', ['image', 'deg?'], { group: 'Filtres', type: 'image', upstream: `${P}/huerotate` }),
  ep('plus', 'nokia', ['image'], { group: 'Memes', type: 'image', upstream: `${P}/nokia` }),
  ep('plus', 'pickuplines', [], { group: 'Texte', upstream: `${P}/pickuplines` }),
  ep('plus', 'imdb', ['q'], { group: 'Films', aliases: { text: 'q', query: 'q' }, upstream: `${P}/imdb` }),
  ep('plus', 'jail', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/jail` }),
  ep('plus', 'unforgivable', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/unforgivable` }),
  ep('plus', 'screenshot', ['url'], { group: 'Capture', type: 'image', upstream: `${P}/screenshot` }),
  ep('plus', 'randomcolor', [], { group: 'Infos', upstream: `${P}/randomcolor` }),
  ep('plus', 'steam', ['q'], { group: 'Jeux', aliases: { text: 'q', query: 'q' }, upstream: `${P}/steam` }),
  ep('plus', 'sadcat', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/sadcat` }),
  ep('plus', 'oogway', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/oogway` }),
  ep('plus', 'communism', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/communism` }),
  ep('plus', 'car', [], { group: 'Images', upstream: `${P}/car` }),
  ep('plus', 'pooh', ['text1', 'text2'], { group: 'Memes', type: 'image', upstream: `${P}/pooh` }),
  ep('plus', 'showerthoughts', [], { group: 'Texte', upstream: `${P}/showerthoughts` }),
  ep('plus', 'wanted', ['image'], { group: 'Memes', type: 'image', upstream: `${P}/wanted` }),
  ep('plus', 'reddit', ['sub'], { path: '/reddit/:sub?', group: 'Infos', aliases: { text: 'sub', q: 'sub' }, upstream: (p) => `${P}/subreddit/${encodeURIComponent(p.sub || p.text || 'askreddit')}` }),
  ep('plus', 'github', ['username'], { path: '/github/:username?', group: 'Dev', aliases: { text: 'username', q: 'username' }, upstream: (p) => `${P}/github/${encodeURIComponent(p.username || p.text || 'CrazyPrince')}` }),
  ep('plus', 'weather', ['q'], { group: 'Infos', aliases: { text: 'q', query: 'q' }, upstream: `${P}/weather` }),
  ep('plus', 'whowouldwin', ['image1', 'image2'], { group: 'Memes', type: 'image', upstream: `${P}/whowouldwin` }),
  ep('plus', 'gun', ['image'], { group: 'Memes', type: 'image', upstream: `${P}/gun` }),
  ep('plus', 'lulcat', ['text'], { group: 'Texte', upstream: `${P}/lulcat` }),
  ep('plus', 'opinion', ['image', 'text'], { group: 'Memes', type: 'image', upstream: `${P}/opinion` }),
  ep('plus', 'drake', ['text1', 'text2'], { group: 'Memes', type: 'image', upstream: `${P}/drake` }),
  ep('plus', 'npm', ['q'], { group: 'Dev', aliases: { text: 'q', query: 'q' }, upstream: `${P}/npm` }),
  ep('plus', 'fact', [], { group: 'Texte', upstream: `${P}/fact` }),
  ep('plus', 'joke', [], { group: 'Texte', upstream: `${P}/joke` }),
  ep('plus', 'biden', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/biden` }),
  ep('plus', 'pikachu', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/pikachu` }),
  ep('plus', 'mock', ['text'], { group: 'Texte', upstream: `${P}/mock` }),
  ep('plus', 'wyr', [], { group: 'Texte', upstream: `${P}/wyr` }),
  ep('plus', 'meme', [], { group: 'Memes', upstream: `${P}/meme` }),
  ep('plus', 'colorify', ['image', 'color'], { group: 'Filtres', type: 'image', upstream: `${P}/colorify` }),
  ep('plus', 'drip', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/drip` }),
  ep('plus', 'clown', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/clown` }),
  ep('plus', 'translate', ['text', 'to'], { group: 'Texte', aliases: { language: 'to' }, upstream: `${P}/translate` }),
  ep('plus', 'encode', ['text'], { group: 'Texte', upstream: `${P}/encode` }),
  ep('plus', 'decode', ['binary'], { group: 'Texte', aliases: { text: 'binary' }, upstream: `${P}/decode` }),
  ep('plus', 'uncover', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/uncover` }),
  ep('plus', 'ad', ['image'], { group: 'Memes', type: 'image', upstream: `${P}/ad` }),
  ep('plus', 'blur', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/blur` }),
  ep('plus', 'invert', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/invert` }),
  ep('plus', 'greyscale', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/greyscale` }),
  ep('plus', '8ball', [], { path: '/8ball', group: 'Texte', upstream: `${P}/8ball` }),
  ep('plus', 'alert', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/alert` }),
  ep('plus', 'caution', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/caution` }),
  ep('plus', 'facts', ['text'], { group: 'Memes', type: 'image', upstream: `${P}/facts` }),
  ep('plus', 'doublestruck', ['text'], { group: 'Texte', upstream: `${P}/doublestruck` }),
  ep('plus', 'texttomorse', ['text'], { group: 'Texte', upstream: `${P}/texttomorse` }),
  ep('plus', 'reverse', ['text'], { group: 'Texte', upstream: `${P}/reverse` }),
  ep('plus', 'itunes', ['q'], { group: 'Musique', aliases: { text: 'q', query: 'q' }, upstream: `${P}/itunes` }),
  ep('plus', 'happysad', ['text1', 'text2'], { group: 'Memes', type: 'image', upstream: `${P}/happysad` }),
  ep('plus', 'pet', ['image'], { group: 'Filtres', type: 'binary', upstream: `${P}/pet` }),
  ep('plus', 'lyrics', ['song'], { group: 'Musique', aliases: { text: 'song', q: 'song', query: 'song' }, upstream: `${P}/lyrics` }),
  ep('plus', 'quote', ['image', 'text'], { group: 'Memes', type: 'image', upstream: `${P}/quote` }),
  ep('plus', 'tweet', ['image', 'text', 'displayname?', 'username?'], { group: 'Memes', type: 'image', upstream: `${P}/tweet` }),
  ep('plus', 'mnm', ['image'], { group: 'Filtres', type: 'image', upstream: `${P}/mnm` }),
  ep('plus', 'jokeoverhead', ['image'], { group: 'Memes', type: 'image', upstream: `${P}/jokeoverhead` }),
  ep('plus', 'ship', ['user1', 'user2'], { group: 'Memes', type: 'image', aliases: { image1: 'user1', image2: 'user2' }, upstream: `${P}/ship` })
].filter(Boolean);

const flaming = [
  ep('flaming', 'water-logo', ['text'], { group: 'Logos', type: 'image', upstream: (p) => flamingUrl('water-logo', p.text, { fontsize: 100, fillTextColor: '%23000', shadowGlowColor: '%23000', backgroundColor: '%23000', host: 'https://flamingtext.com' }) }),
  ep('flaming', 'crafts-logo', ['text'], { group: 'Logos', type: 'image', upstream: (p) => flamingUrl('crafts-logo', p.text, { host: 'https://flamingtext.com' }) }),
  ep('flaming', 'amped-logo', ['text'], { group: 'Logos', type: 'image', upstream: (p) => flamingUrl('amped-logo', p.text, { host: 'https://flamingtext.com' }) }),
  ep('flaming', 'sketch-name', ['text'], { group: 'Logos', type: 'image', upstream: (p) => flamingUrl('sketch-name', p.text, { fontsize: 100, fillTextType: 1, fillTextPattern: 'Warning!', host: 'https://www6.flamingtext.com' }) }),
  ep('flaming', 'sketch-name-gold', ['text'], { group: 'Logos', type: 'image', upstream: (p) => flamingUrl('sketch-name', p.text, {
    fontsize: 100,
    fillTextType: 1,
    fillTextPattern: 'Warning!',
    fillColor1Color: '%23f2aa4c',
    fillColor2Color: '%23f2aa4c',
    fillColor3Color: '%23f2aa4c',
    fillColor4Color: '%23f2aa4c',
    fillColor5Color: '%23f2aa4c',
    fillColor6Color: '%23f2aa4c',
    fillColor7Color: '%23f2aa4c',
    fillColor8Color: '%23f2aa4c',
    fillColor9Color: '%23f2aa4c',
    fillColor10Color: '%23f2aa4c',
    fillOutlineColor: '%23f2aa4c',
    fillOutline2Color: '%23f2aa4c',
    backgroundColor: '%23101820',
    host: 'https://www6.flamingtext.com'
  }) })
];

function flamingUrl(script, text, extra = {}) {
  const host = extra.host || 'https://flamingtext.com';
  const params = new URLSearchParams();
  params.set('imageoutput', 'true');
  params.set('script', script);
  params.set('doScale', 'true');
  params.set('scaleWidth', extra.scaleWidth || '800');
  params.set('scaleHeight', extra.scaleHeight || '500');
  if (extra.fontsize) params.set('fontsize', String(extra.fontsize));
  else params.set('fontsize', '90');
  for (const [key, val] of Object.entries(extra)) {
    if (key === 'host') continue;
    params.set(key, String(val).replace(/^%23/, '#'));
  }
  params.set('text', text || 'empire');
  return `${host}/net-fu/proxy_form.cgi?${params.toString()}`;
}

const catalog = [
  ...download,
  ...search,
  ...tools,
  ...ia,
  ...nsfw,
  ...random,
  ...reactions,
  ...shorten,
  ...canvas,
  ...anime,
  ...plus,
  ...flaming
];

const DOCS_META = {
  download: { id: 'collapseDownloadPlus', icon: 'fa fa-fw fa-cloud-download-alt', title: 'Telechargeurs Plus' },
  search: { id: 'collapseSearchPlus', icon: 'fas fa-fw fa-search-plus', title: 'Recherche Plus' },
  ia: { id: 'collapseIa', icon: 'fas fa-fw fa-robot', title: 'Intelligence artificielle' },
  tools: { id: 'collapseToolsPlus', icon: 'fas fa-fw fa-wrench', title: 'Outils Plus' },
  canvas: { id: 'collapseCanvasPlus', icon: 'fas fa-fw fa-image', title: 'Canvas et memes' },
  plus: { id: 'collapsePlus', icon: 'fas fa-fw fa-star', title: 'Memes et infos' },
  flaming: { id: 'collapseFlaming', icon: 'fas fa-fw fa-fire', title: 'Logos Flaming' },
  reactions: { id: 'collapseReactions', icon: 'fas fa-fw fa-heart', title: 'Reactions' },
  random: { id: 'collapseRandomPlus', icon: 'fas fa-fw fa-random', title: 'Aleatoire Plus' },
  shorten: { id: 'collapseShorten', icon: 'fas fa-fw fa-link', title: 'Raccourcisseurs' },
  nsfw: { id: 'collapseNsfwPlus', icon: 'fas fa-exclamation-triangle', title: 'NSFW Plus' },
  anime: { id: 'collapseAnimePlus', icon: 'fas fa-fw fa-tv', title: 'Anime Plus' }
};

const PREFIX = {
  download: '/api/download',
  search: '/api/search',
  tools: '/api/tools',
  ia: '/api/ia',
  nsfw: '/api/nsfw',
  random: '/api/random',
  reactions: '/api/reactions',
  shorten: '/api/shorten',
  canvas: '/api/canvas',
  anime: '/api/anime',
  plus: '/api/plus',
  flaming: '/api/maker/flaming'
};

const LEGACY_DOCS = {
  download: [
    { header: 'Classiques YouTube', items: [
      { href: '/api/v1/ytmp3?url=https://youtu.be/JLWRZ8eWyZo', label: 'MP3 V1' },
      { href: '/api/v2/ytmp3?url=https://youtu.be/JLWRZ8eWyZo', label: 'MP3 V2' },
      { href: '/api/v1/ytmp4?url=https://youtu.be/JLWRZ8eWyZo', label: 'MP4 V1' },
      { href: '/api/v2/ytmp4?url=https://youtu.be/JLWRZ8eWyZo', label: 'MP4 V2' },
      { href: '/api/ytplay?text=begin%20you', label: 'Lecture texte' },
      { href: '/api/ytplay?url=https://youtu.be/JLWRZ8eWyZo', label: 'Lecture URL' },
      { href: '/api/ytinfo?url=https://youtu.be/JLWRZ8eWyZo', label: 'YT Info' }
    ]},
    { header: 'Classiques reseaux', items: [
      { href: '/api/v1/igdl?url=https://www.instagram.com/reel/C6Xf0ZvLQnl/', label: 'Instagram V1' },
      { href: '/api/tiktokv1?url=https://vm.tiktok.com/ZM6Wcc2ag', label: 'TikTok V1' },
      { href: '/api/tiktokv2?url=https://vm.tiktok.com/ZM6Wcc2ag', label: 'TikTok V2' },
      { href: '/api/ttimg?url=https://vm.tiktok.com/ZM6WcvHcP', label: 'TikTok image' },
      { href: '/api/facebook?url=https://fb.watch/fOTpgn6UFQ', label: 'Facebook' },
      { href: '/api/twitterdl?url=https://twitter.com/auronplay/status/1586487664274206720', label: 'X Twitter' },
      { href: '/api/spotifydl?url=https://open.spotify.com/track/3Wrjm47oTz2sjIgck11l5e', label: 'Spotify DL' },
      { href: '/api/spotifyinfo?url=https://open.spotify.com/track/3Wrjm47oTz2sjIgck11l5e', label: 'Spotify info' },
      { href: '/api/xnxxdl?url=https://www.xnxx.com/video-11qev1b8/estudiante_latina_se_da_unos_sentones_', label: 'XNXX' }
    ]}
  ],
  search: [
    { header: 'Classiques', items: [
      { href: '/api/ytsearch?text=begin%20you', label: 'Recherche YT' },
      { href: '/api/spotifysearch?text=maneskin%20beggin', label: 'Recherche Spotify' },
      { href: '/api/xnxxsearch?text=latina', label: 'Recherche XNXX' },
      { href: '/api/stickersearch?text=flores', label: 'Recherche stickers' }
    ]}
  ],
  tools: [
    { header: 'Classiques', items: [
      { href: '/api/chatgpt?text=Bonjour', label: 'ChatGPT' },
      { href: '/api/tempmail/getmail', label: 'TempMail' },
      { href: '/api/lyrics?text=maneskin%20beggin', label: 'Paroles' },
      { href: '/api/googleImage?text=naruto', label: 'Google Image' },
      { href: '/api/ssweb?url=https://github.com/BanditDapi', label: 'SSWEB' },
      { href: '/api/igstalk?username=luisitocomunica', label: 'IG Stalk' },
      { href: '/api/tiktokstalk?username=luisitocomunica', label: 'TikTok Stalk' },
      { href: '/api/pinterest?text=girl', label: 'Pinterest' }
    ]}
  ]
};

const STATIC_DOCS = [
  {
    id: 'collapseNsfwLegacy',
    icon: 'fas fa-exclamation-triangle',
    title: 'NSFW',
    groups: [{
      header: 'NSFW aleatoire',
      items: ['girls', 'boobs', 'corean', 'tiktok', 'nsfwass', 'nsfwbdsm', 'nsfwcum', 'nsfwero', 'nsfwfemdom', 'nsfwfoot', 'nsfwglass', 'nsfworgy', 'nsfwtrap', 'ecchi', 'hentai', 'yuri', 'yaoi']
        .map((name) => ({ href: `/api/nsfw/${name}`, label: name }))
    }]
  },
  {
    id: 'collapse18plus',
    icon: 'fas fa-user-slash',
    title: 'Aleatoire +18',
    groups: [{
      header: '+18 aleatoire',
      items: [
        ['packgirl', 'Packs filles'], ['packmen', 'Packs hommes'], ['gawrgura', 'Gawr Gura'],
        ['booty', 'Booty'], ['furro', 'Furro'], ['imglesbian', 'Image lesbienne'],
        ['panties', 'Panties'], ['pechos', 'Seins'], ['pene', 'Penis'],
        ['porno', 'Porno'], ['tetas', 'Poitrine'], ['videoxxx', 'Video XXX'],
        ['videoxxxlesbi', 'Video XXX lesbienne']
      ].map(([name, label]) => ({ href: `/api/adult/${name}`, label }))
    }]
  },
  {
    id: 'collapseAnimeLegacy',
    icon: 'fas fa-fw fa-tv',
    title: 'Anime aleatoire',
    groups: [{
      header: 'Personnages',
      items: ['neko', 'foxgirl', 'maid', 'gacha', 'waifu', 'cosplay', 'akira', 'akiyama', 'anna', 'asuna', 'ayuzawa', 'boruto', 'chiho', 'chitoge', 'deidara', 'eba', 'elaina', 'emilia', 'erza', 'hestia', 'hinata', 'inori', 'isuzu', 'itachi', 'itori', 'kaga', 'kagura', 'kaori', 'keneki', 'kotori', 'kurumi', 'madara', 'mikasa', 'miku', 'minato', 'naruto', 'nezuko', 'sagiri', 'sakura', 'sasuke']
        .map((name) => ({ href: `/api/anime/${name}`, label: name }))
        .concat([{ href: '/api/anime/animesearch?query=Naruto', label: 'recherche anime' }])
    }]
  },
  {
    id: 'collapseWallpaper',
    icon: 'fas fa-fw fa-image',
    title: 'Fonds d ecran',
    groups: [{
      header: 'Fonds aleatoires',
      items: ['coffee', 'wprandom', 'cristianoronaldo', 'messi', 'itzy', 'navidad', 'wpmountain', 'pubg', 'wpgaming', 'aesthetic', 'pentol', 'cartoon', 'cyberspace', 'technology', 'doraemon', 'hacker', 'planet']
        .map((name) => ({ href: `/api/wallpaper/${name}`, label: name }))
    }]
  },
  {
    id: 'collapseMarker',
    icon: 'fas fa-fw fa-paint-brush',
    title: 'Createur',
    groups: [
      { header: 'stickers', items: [{ href: '/api/maker/attp?text=api%20empire', label: 'Attp' }] },
      { header: 'Canvas', items: [
        { href: '/api/maker/canvas/welcome?titulo=Bienvenue&username=User&groupname=Groupe&profile=/crown-logo.png', label: 'Carte bienvenue' },
        { href: '/api/maker/canvas/welcome2?username=CrazyPrince&groupname=API%20Empire&membercount=12&description=Bienvenue&profile=/crown-logo.png', label: 'Carte bienvenue 2' },
        { href: '/api/maker/canvas/goodbye?username=crazyprince&groupname=api%20empire&membercount=12&memberdiscriminator=13&profile=/crown-logo.png&background=https://telegra.ph/file/82d079999da723cc80899.png', label: 'Carte au revoir' }
      ]},
      { header: 'textpro', items: [
        { href: '/api/maker/textpro/deep-sea-metal?text=api%20empire', label: 'Deep Sea Metal' },
        { href: '/api/maker/textpro/wolf-logo-galaxy?text1=api%20empire&text2=by%20crazyprince', label: 'Wolf Logo Galaxy' }
      ]},
      { header: 'photooxy', items: [{ href: '/api/maker/photooxy/flaming?text=api%20empire', label: 'Texte enflamme' }] },
      { header: 'ephoto360', items: [{ href: '/api/maker/ephoto360/eraser-deleting-text?text=api%20empire', label: 'Texte gomme' }] }
    ]
  }
];

function toDocs() {
  const byCat = {};
  for (const item of catalog) {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
  }
  const dynamic = Object.keys(DOCS_META).map((category) => {
    const meta = DOCS_META[category];
    const groups = {};
    for (const item of byCat[category] || []) {
      if (!groups[item.group]) groups[item.group] = [];
      const localPath = item.path.includes(':')
        ? item.path.replace(/\/:([^/?]+)\??/g, (_, key) => {
          const sample = (item.example.match(new RegExp(`${key}=([^&]+)`)) || [])[1];
          return `/${sample || 'empire'}`;
        })
        : item.path;
      const href = `${PREFIX[category]}${localPath}${item.example ? `?${item.example}` : ''}`;
      groups[item.group].push({ href, label: item.label });
    }
    const extra = LEGACY_DOCS[category] || [];
    return {
      id: meta.id,
      icon: meta.icon,
      title: meta.title,
      groups: [
        ...extra,
        ...Object.entries(groups).map(([header, items]) => ({ header, items }))
      ]
    };
  });
  return [...dynamic, ...STATIC_DOCS];
}

module.exports = {
  catalog,
  toDocs,
  flamingUrl,
  PREFIX,
  D,
  P,
  Z
};
