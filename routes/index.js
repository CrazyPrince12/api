const router = require('express').Router()
const bodyParser = require('body-parser')
const fs = require('fs')
const database = require('./func/database')


const path = __dirname

const routerVersion = {
  ytmp3: '/v1/ytmp3',
  ytmp3_2: '/v2/ytmp3',
  ytmp4: '/v1/ytmp4', 
  ytmp4_2: '/v2/ytmp4',
  igdl: '/v1',
  getmail: '/tempmail',
  getmessages: '/tempmail'
}

// ces routes sont ignorees car elles sont utilisees directement dans index, et func n est pas une route 

const pathIgnore = ['func', 'human', 'human-apis']

const removeExtention = (filename) => {
  return filename.split('.').shift()
}


router.use(function (req, res, next) {
  if (req.url.includes('manageusers')) return next()
  const apiKey = req.query.apikey
  //console.log(apiKey);
  if (!apiKey) {
    return res.status(401).json({ status: false, message: "Aucune cle API fournie" })
  }
  let search = database.getDatabaseByApiKey(apiKey)
  if (!search) {
    return res.status(401).json({ status: false, message: "Cle API invalide" })
  }

  if (search.isBanned) {
    return res.status(401).json({ status: false, message: "Cet utilisateur a ete banni" })
  }

  if (!search.isVerified) {
    return res.status(401).json({ status: false, message: "L utilisateur n a pas verifie son e-mail" })
  }

  if (!search.isPremium) {
    // Verifier si 24 heures se sont ecoulees
    if (search.lastUsed < Date.now() - 86400000) {
      search.lastUsed = Date.now()
      search.uses = 0
    }
    if (search.uses >= Number(process.env.free_user_limit)) {
      return res.status(401).json({ status: false, message: "Limite quotidienne atteinte, revenez demain" })
    }
  } else {
    if (search.lastUsed < Date.now() - 86400000) {
      search.lastUsed = Date.now()
      search.uses = 0
    }
    if (search.uses >= Number(process.env.premium_user_limit)) {
      return res.status(401).json({ status: false, message: "Limite quotidienne atteinte, revenez demain" })
    }
  }

  database.addUse(search.mail)

  next();
});

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

fs.readdirSync(path).filter(filename => {

  const name = removeExtention(filename)

  const version = routerVersion[name] ?? ''

  //console.log(`${version}/${name.startsWith('ytmp') ? '' : name}`);
  if(name !== 'index' && !pathIgnore.includes(name)) {
    router.use(`${version}/${name.startsWith('ytmp') ? '' : name}`, require(`./${filename}`))
  }
})


module.exports = router
