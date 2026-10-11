const SpottyDL = require('spottydl');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

function requireMetadata(metadata) {
  // SpottyDL returns an error string instead of rejecting on metadata failures.
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(typeof metadata === 'string' ? metadata : 'Metadonnees Spotify indisponibles.');
  }
  return metadata;
}

async function downloadTrackInfo(metadata) {
  // Separate directories also isolate simultaneous downloads of the same title.
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'crown-spotify-'));
  try {
    const results = await SpottyDL.downloadTrack(metadata, directory + path.sep);
    if (!Array.isArray(results) || results.length !== 1 || !results[0]) {
      throw new Error(typeof results === 'string' ? results : 'Aucun fichier audio Spotify recu.');
    }
    const result = results[0];
    if (result.status !== 'Success' || typeof result.filename !== 'string' || !result.filename) {
      throw new Error(`Echec du telechargement Spotify : ${result.status || 'resultat invalide'}.`);
    }
    const audioBuffer = await fs.readFile(result.filename);
    if (!audioBuffer.length) {
      throw new Error('Le fichier audio Spotify est vide.');
    }
    return { ...metadata, audioBuffer };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function downloadTrack(url) {
  const metadata = requireMetadata(await SpottyDL.getTrack(url));
  return downloadTrackInfo(metadata);
}

async function downloadAlbum(url) {
  const album = requireMetadata(await SpottyDL.getAlbum(url));
  if (!Array.isArray(album.tracks) || album.tracks.length === 0) {
    throw new Error('Aucun morceau trouve dans cet album Spotify.');
  }
  const trackList = [];
  // Read each file before downloading the next: SpottyDL names files by title,
  // and two tracks in an album can have the same title.
  for (const track of album.tracks) {
    trackList.push(await downloadTrackInfo({
      ...track,
      artist: album.artist,
      album: album.name,
      year: album.year,
      albumCoverURL: album.albumCoverURL
    }));
  }
  // Keep the buffer-based contract used by the existing Spotify routes.
  return { ...album, trackList };
}

module.exports = { downloadTrack, downloadAlbum };
