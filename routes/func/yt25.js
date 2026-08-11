/*
Licence MIT

Copyright (c) 2023 Arom

Permission est accordee, gratuitement, a toute personne obtenant une copie
de ce logiciel et des fichiers de documentation associes (le "Logiciel"),
de l utiliser, le copier, le modifier, le fusionner, le publier, le distribuer,
le sous-licencier et/ou vendre des copies du Logiciel, et d autoriser les
personnes a qui le Logiciel est fourni a le faire, sous reserve des conditions suivantes :

L avis de copyright et cette note d autorisation doivent etre inclus dans toutes
les copies ou parties substantielles du Logiciel.

LE LOGICIEL EST FOURNI "TEL QUEL", SANS GARANTIE D AUCUNE SORTE, EXPRESSE OU
IMPLICITE, Y COMPRIS MAIS SANS S Y LIMITER LES GARANTIES DE QUALITE MARCHANDE,
D ADEQUATION A UN USAGE PARTICULIER ET D ABSENCE DE CONTREFACON. EN AUCUN CAS
LES AUTEURS OU TITULAIRES DU COPYRIGHT NE POURRONT ETRE TENUS RESPONSABLES
D UNE RECLAMATION, D UN DOMMAGE OU D UNE AUTRE RESPONSABILITE, QUE CE SOIT
DANS LE CADRE D UN CONTRAT, D UN DELIT OU AUTRE, DECOULANT DE, OU EN LIEN AVEC
LE LOGICIEL OU SON UTILISATION OU D AUTRES TRAITEMENTS DANS LE LOGICIEL.

Credits :
- Code original : https://github.com/ruhend2001/ruhend-ytmp3
- Code original : https://github.com/ruhend2001/ruhend-ytmp4
- Edite par : https://github.com/BrunoSobrino
*/

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');

const ytmp33 = async (url) => {
  const parameters = {
    'url': url,
    'format': 'mp3',
    'lang': 'en'
  };

  try {
    const conversionResponse = await axios.post('https://s64.notube.net/recover_weight.php', querystring.stringify(parameters));
    if (!conversionResponse.data.token) {
      throw new Error("Aucun jeton recu dans la reponse de conversion.");
    }
    const token = conversionResponse.data.token;
    const downloadPageResponse = await axios.get('https://notube.net/en/download?token=' + token);

    if (downloadPageResponse.status !== 200) {
      throw new Error("Impossible de recuperer la page de telechargement.");
    }

    const $ = cheerio.load(downloadPageResponse.data);
    const result = {
      'titulo': $('#breadcrumbs-section h2').text(),
      'descargar': $('#breadcrumbs-section #downloadButton').attr('href')
    };

    return { status: true, resultados: result };
  } catch (error) {
    console.error("Erreur lors de la conversion de la video YouTube :", error);
    return { status: false, error: error.message };
  }
};

const ytmp44 = async (url) => {
  const parameters = {
    'url': url,
    'format': 'mp4',
    'lang': 'en'
  };

  try {
    const conversionResponse = await axios.post('https://s64.notube.net/recover_weight.php', querystring.stringify(parameters));
    if (!conversionResponse.data.token) {
      throw new Error("Aucun jeton recu dans la reponse de conversion.");
    }
    const token = conversionResponse.data.token;
    const downloadPageResponse = await axios.get('https://notube.net/en/download?token=' + token);

    if (downloadPageResponse.status !== 200) {
      throw new Error("Impossible de recuperer la page de telechargement.");
    }

    const $ = cheerio.load(downloadPageResponse.data);
    const result = {
      'titulo': $('#breadcrumbs-section h2').text(),
      'descargar': $('#breadcrumbs-section #downloadButton').attr('href')
    };

    return { status: true, resultados: result };
  } catch (error) {
    console.error("Erreur lors de la conversion de la video YouTube :", error);
    return { status: false, error: error.message };
  }
};

module.exports = {
  ytmp33,
  ytmp44
};
