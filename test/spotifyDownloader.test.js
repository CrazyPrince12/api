const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
// SpottyDL re-exports methods through read-only getters; mock their source modules.
const SpottyInfo = require('spottydl/dist/Info');
const SpottyDownload = require('spottydl/dist/Download');
const { downloadTrack, downloadAlbum } = require('../routes/func/spotifyDownloader');

const trackUrl = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT';
const albumUrl = 'https://open.spotify.com/album/2mxFsS5yylSTHNivV53HoA';
const trackInfo = {
  title: 'Same title',
  artist: 'Artist',
  album: 'Album',
  year: '2026',
  id: 'video-id',
  albumCoverURL: 'https://example.com/cover.jpg',
  trackNumber: 1
};

async function assertRemoved(directory) {
  await assert.rejects(fs.stat(directory), { code: 'ENOENT' });
}

function mockSuccessfulDownload(t, directories) {
  t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, directory) => {
    directories.push(directory);
    assert.equal(directory.endsWith(path.sep), true);
    const filename = path.join(directory, `${metadata.title}.mp3`);
    await fs.writeFile(filename, Buffer.from(metadata.id));
    return [{ status: 'Success', filename }];
  });
}

test('track downloads keep metadata and return an audioBuffer without temporary files', async (t) => {
  const directories = [];
  t.mock.method(SpottyInfo, 'getTrack', async (url) => {
    assert.equal(url, trackUrl);
    return trackInfo;
  });
  mockSuccessfulDownload(t, directories);

  const result = await downloadTrack(trackUrl);

  assert.deepEqual(result, { ...trackInfo, audioBuffer: Buffer.from(trackInfo.id) });
  assert.equal(directories.length, 1);
  await assertRemoved(directories[0]);
});

test('album downloads preserve trackList order, buffers and duplicate titles', async (t) => {
  const directories = [];
  const album = {
    name: 'Album',
    artist: 'Artist',
    year: '2026',
    albumCoverURL: trackInfo.albumCoverURL,
    tracks: [
      { title: 'Same title', id: 'first-video', trackNumber: 1 },
      { title: 'Same title', id: 'second-video', trackNumber: 2 }
    ]
  };
  t.mock.method(SpottyInfo, 'getAlbum', async (url) => {
    assert.equal(url, albumUrl);
    return album;
  });
  mockSuccessfulDownload(t, directories);

  const result = await downloadAlbum(albumUrl);

  assert.equal(result.name, album.name);
  assert.equal(result.trackList.length, 2);
  assert.deepEqual(result.trackList.map((track) => track.audioBuffer.toString()), ['first-video', 'second-video']);
  assert.deepEqual(result.trackList.map((track) => track.trackNumber), [1, 2]);
  for (const track of result.trackList) {
    assert.equal(track.artist, album.artist);
    assert.equal(track.album, album.name);
    assert.equal(track.year, album.year);
    assert.equal(track.albumCoverURL, album.albumCoverURL);
  }
  assert.equal(new Set(directories).size, 2);
  for (const directory of directories) await assertRemoved(directory);
});

test('simultaneous downloads of the same title use separate directories', async (t) => {
  const directories = [];
  t.mock.method(SpottyInfo, 'getTrack', async (url) => ({ ...trackInfo, id: url }));
  mockSuccessfulDownload(t, directories);

  const results = await Promise.all([downloadTrack('first'), downloadTrack('second')]);

  assert.deepEqual(results.map((result) => result.audioBuffer.toString()), ['first', 'second']);
  assert.equal(new Set(directories).size, 2);
  for (const directory of directories) await assertRemoved(directory);
});

test('metadata errors from SpottyDL are rejected instead of being treated as tracks', async (t) => {
  t.mock.method(SpottyInfo, 'getTrack', async () => 'Caught: Spotify unavailable');
  const downloader = t.mock.method(SpottyDownload, 'downloadTrack', async () => assert.fail('must not download'));

  await assert.rejects(downloadTrack(trackUrl), /Spotify unavailable/);
  assert.equal(downloader.mock.callCount(), 0);
});

test('invalid metadata objects are rejected for both tracks and albums', async (t) => {
  for (const metadata of [null, undefined, []]) {
    t.mock.method(SpottyInfo, 'getTrack', async () => metadata);
    t.mock.method(SpottyInfo, 'getAlbum', async () => metadata);
    await assert.rejects(downloadTrack(trackUrl), /Metadonnees Spotify indisponibles/);
    await assert.rejects(downloadAlbum(albumUrl), /Metadonnees Spotify indisponibles/);
  }
});

test('empty or malformed albums fail before attempting any download', async (t) => {
  const downloader = t.mock.method(SpottyDownload, 'downloadTrack', async () => assert.fail('must not download'));
  for (const tracks of [[], undefined, 'invalid']) {
    t.mock.method(SpottyInfo, 'getAlbum', async () => ({ name: 'Album', tracks }));
    await assert.rejects(downloadAlbum(albumUrl), /Aucun morceau trouve/);
  }
  assert.equal(downloader.mock.callCount(), 0);
});

test('failed downloads are rejected and partial files are cleaned up', async (t) => {
  let directory;
  t.mock.method(SpottyInfo, 'getTrack', async () => trackInfo);
  t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, outputPath) => {
    directory = outputPath;
    const filename = path.join(directory, 'partial.mp3');
    await fs.writeFile(filename, 'partial');
    return [{ status: 'Failed (stream)', filename }];
  });

  await assert.rejects(downloadTrack(trackUrl), /Failed \(stream\)/);
  await assertRemoved(directory);
});

test('error strings returned by the downloader are rejected and cleaned up', async (t) => {
  let directory;
  t.mock.method(SpottyInfo, 'getTrack', async () => trackInfo);
  t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, outputPath) => {
    directory = outputPath;
    return 'Caught: ffmpeg unavailable';
  });

  await assert.rejects(downloadTrack(trackUrl), /ffmpeg unavailable/);
  await assertRemoved(directory);
});

test('invalid download results are rejected and cleaned up', async (t) => {
  const directories = [];
  t.mock.method(SpottyInfo, 'getTrack', async () => trackInfo);
  for (const result of [null, [], [null], [{ status: 'Success' }]]) {
    t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, outputPath) => {
      directories.push(outputPath);
      return result;
    });
    await assert.rejects(downloadTrack(trackUrl), /Aucun fichier audio|Echec du telechargement/);
  }
  for (const directory of directories) await assertRemoved(directory);
});

test('missing or empty audio files are rejected and cleaned up', async (t) => {
  const directories = [];
  t.mock.method(SpottyInfo, 'getTrack', async () => trackInfo);
  for (const empty of [false, true]) {
    t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, outputPath) => {
      directories.push(outputPath);
      const filename = path.join(outputPath, 'track.mp3');
      if (empty) await fs.writeFile(filename, '');
      return [{ status: 'Success', filename }];
    });
    await assert.rejects(downloadTrack(trackUrl), empty ? /fichier audio Spotify est vide/ : { code: 'ENOENT' });
  }
  for (const directory of directories) await assertRemoved(directory);
});

test('unexpected downloader rejections still clean up temporary files', async (t) => {
  let directory;
  t.mock.method(SpottyInfo, 'getTrack', async () => trackInfo);
  t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, outputPath) => {
    directory = outputPath;
    await fs.writeFile(path.join(directory, 'partial.mp3'), 'partial');
    throw new Error('network error');
  });

  await assert.rejects(downloadTrack(trackUrl), /network error/);
  await assertRemoved(directory);
});

test('an album track failure rejects the album and leaves no intermediate files', async (t) => {
  const directories = [];
  t.mock.method(SpottyInfo, 'getAlbum', async () => ({
    name: 'Album',
    artist: 'Artist',
    year: '2026',
    albumCoverURL: trackInfo.albumCoverURL,
    tracks: [trackInfo, { ...trackInfo, id: 'failed-video' }]
  }));
  t.mock.method(SpottyDownload, 'downloadTrack', async (metadata, directory) => {
    directories.push(directory);
    const filename = path.join(directory, 'track.mp3');
    await fs.writeFile(filename, metadata.id);
    return [{ status: metadata.id === 'failed-video' ? 'Failed (stream)' : 'Success', filename }];
  });

  await assert.rejects(downloadAlbum(albumUrl), /Failed \(stream\)/);
  assert.equal(directories.length, 2);
  for (const directory of directories) await assertRemoved(directory);
});
