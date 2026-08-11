const router = require('express').Router()
const fs = require('fs')

// pour ne pas casser la compatibilite avec les endpoints existants

const routerVersion = {
  ytmp3_1: '/v1/ytmp3',
  ytmp3_2: '/v2/ytmp3',
  ytmp4_1: '/v1/ytmp4', 
  ytmp4_2: '/v2/ytmp4'
}

const path = __dirname

const removeExtention = (filename) => {
  return filename.split('.').shift()
}

// lit tous les fichiers du dossier human et cree les routes dynamiquement
// exemple :
// ytmp3_1.js : retire d abord l extension .js, il reste le nom ytmp3
// passe par la version -> /v1/ytmp3 et si le nom commence par ytmp la route reste /v1/ytmp3 puis require du fichier ./ytmp3_1.js

fs.readdirSync(path).filter(filename => {
  const name = removeExtention(filename)
  if(name !== 'index') {
    const version = routerVersion[name] ?? ''
    router.use(`${version}/${name.startsWith('ytmp') ? '' : name}`, require(`./${filename}`))
  }
})

module.exports = router