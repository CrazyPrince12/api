# API REST par BrunoSobrino

- EN COURS DE DEVELOPPEMENT

------------------

## —◉ APIs en ligne :
- Cafirexos : [api.cafirexos.com](https://api.cafirexos.com)
* Note : Disponible uniquement depuis le bot heberge sur [cafirexos](https://dash.cafirexos.com)
- Onrender : [api-brunosobrino.onrender.com](https://api-brunosobrino.onrender.com/docs)
* Note : API a jour a 100 % et compatible avec canvas, apikey : BrunoSobrino
- Compatible avec Canvas : [api-brunosobrino-dcaf9040.koyeb.app](https://api-brunosobrino-dcaf9040.koyeb.app)
* Note : Presque toutes les autres fonctions marchent normalement, API non mise a jour.

## —◉ Nouveaux endpoints (option principale)
Les routes d origine restent intactes. De nouvelles categories sont disponibles en premier dans `/docs` :
- `/api/download/*` telechargeurs
- `/api/search/*` recherches
- `/api/ia/*` intelligence artificielle
- `/api/tools/*` outils
- `/api/canvas/*` canvas et memes
- `/api/plus/*` memes, infos, et `/api/plus/v1|v2/:name`
- `/api/maker/flaming/:script` logos flaming
- `/api/reactions/*` reactions
- `/api/random/*` images aleatoires
- `/api/shorten/*` raccourcisseurs

Les reponses JSON suivent le format BrunoSobrino : `{ status, resultado, creator }`.

## —◉ Fonctions supplementaires :
- YouTube : [api.cafirexos.com/human/youtube](https://api-brunosobrino.onrender.com/human/youtube)
- Instagram : [api.cafirexos.com/human/instagram](https://api-brunosobrino.onrender.com/human/instagram)
- Facebook : [api.cafirexos.com/human/facebook](https://api-brunosobrino.onrender.com/human/facebook)

------------------

## —◉ Bugs et plus :
- IgStalk [BUG]
- Connexion des utilisateurs [BETA]
- Cle API requise [BETA]
- Cle API Premium [PARTIEL]

------------------

## —◉ Configuration
- Apres l installation de cette API, modifiez le fichier "example.env", puis une fois configure, renommez-le en ".env".
- Nous recommandons de definir un [JWT_SECRET](https://github.com/BrunoSobrino/api/blob/2109f7c00962c8ede489337e1b0218c8783e3ce3/example.env#L2) unique, sinon il serait facile de voler les jetons de session.
- Pour utiliser reCAPTCHA, creez votre cle privee et publique sur [ce site](https://www.google.com/recaptcha/admin/create?hl=fr)
- Vous pouvez utiliser le service SMTP de [Brevo](https://www.brevo.com/free-smtp-server/). Pour commencer, inscrivez-vous, renseignez quelques informations, allez dans la section transactionnelle et copiez les identifiants SMTP.
- Les limites de chaque cle API se reinitialisent toutes les 24 heures.

------------------

## —◉ Activer sur Cafirexos
<a href="https://www.cafirexos.com"><img src="https://grxcwmcwbxwj.objectstorage.sa-saopaulo-1.oci.customer-oci.com/n/grxcwmcwbxwj/b/cafirexos/o/logos%2Flogo_2.png" height="125px"></a>
- Site web : [www.cafirexos.com](https://www.cafirexos.com)
- Dash : [dash.cafirexos.com](https://dash.cafirexos.com)
- Panneau : [panel.cafirexos.com](https://panel.cafirexos.com)
- Documentation : [docs.cafirexos.com](https://docs.cafirexos.com)
- Canal WhatsApp : [cafirexos.com/whatsapp](https://cafirexos.com/whatsapp)
- Communaute WhatsApp : [cafirexos.com/comunidad](https://cafirexos.com/comunidad)

## —◉ Activer sur Koyeb

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/BrunoSobrino/api&branch=koyeb&name=api-for-canvas&ports=2027;http;/) 

## —◉ Activer sur Replit

[![Run on Repl.it](https://repl.it/badge/github/BrunoSobrino/api)](https://repl.it/github/BrunoSobrino/api) 
  
## —◉ Activer sur Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2FBrunoSobrino%2Fapi) 

------------------

## —◉ Collaborateurs
<a href="https://github.com/Daniel9822"><img src="https://github.com/Daniel9822.png" width="100" height="100" alt="Daniel9822"/></a>
<a href="https://github.com/Shizu-SH"><img src="https://github.com/Shizu-SH.png" width="100" height="100" alt="Shizu-SH"/></a>
<a href="https://github.com/dftzippo"><img src="https://github.com/dftzippo.png" width="100" height="100" alt="dftzippo"/></a>
<a href="https://github.com/ferhacks"><img src="https://github.com/ferhacks.png" width="100" height="100" alt="ferhacks"/></a>

## —◉ Proprietaire
<a href="https://github.com/BrunoSobrino"><img src="https://github.com/BrunoSobrino.png" width="150" height="150" alt="BrunoSobrino"/></a>
- API REST par Bruno Sobrino
