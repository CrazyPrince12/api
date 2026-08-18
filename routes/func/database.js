const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const databaseDir = path.resolve(__dirname, '../../database.json');

if (!fs.existsSync(databaseDir)) {
  fs.writeFileSync(databaseDir, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Lit la base de données depuis database.json
 * @returns {Array<object>}
 */
function readDb() {
  try {
    if (!fs.existsSync(databaseDir)) {
      fs.writeFileSync(databaseDir, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(databaseDir, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur de lecture de database.json :', error);
    return [];
  }
}

/**
 * Écrit la base de données dans database.json
 * @param {Array<object>} data
 * @returns {boolean}
 */
function writeDb(data) {
  try {
    fs.writeFileSync(databaseDir, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur d ecriture dans database.json :', error);
    return false;
  }
}

/**
 * Récupère un utilisateur par email
 * @param {string} mail 
 * @param {boolean} [includePassword=false]
 */
const getDatabaseByUser = (mail, includePassword = false) => {
  const database = readDb();
  const user = database.find(u => u.mail === mail);
  if (!user) return undefined;
  if (includePassword) return { ...user };
  const { hashPassword, ...safeUser } = user;
  return safeUser;
};

/**
 * Récupère un utilisateur par clé API
 * @param {string} apikey 
 */
const getDatabaseByApiKey = (apikey) => {
  const database = readDb();
  const user = database.find(u => u.apikey === apikey);
  if (!user) return undefined;
  const { hashPassword, ...safeUser } = user;
  return safeUser;
};

/**
 * Récupère un utilisateur par ID utilisateur
 * @param {string} userId 
 */
const getDatabaseByUserId = (userId) => {
  const database = readDb();
  const user = database.find(u => u.userId === userId);
  if (!user) return undefined;
  const { hashPassword, ...safeUser } = user;
  return safeUser;
};

/**
 * Récupère un utilisateur par code de vérification
 * @param {string} verifyCode 
 */
const getDatabaseByVerifyCode = (verifyCode) => {
  const database = readDb();
  const user = database.find(u => u.verifyCode === verifyCode);
  if (!user) return undefined;
  const { hashPassword, ...safeUser } = user;
  return safeUser;
};

/**
 * Récupère l'ensemble des utilisateurs (sans hash de mot de passe)
 */
const getDatabase = () => {
  const database = readDb();
  return database.map(({ hashPassword, ...user }) => user);
};

/**
 * Ajoute un nouvel utilisateur
 */
const PostDatabase = (mail, password, verify) => {
  const database = readDb();
  const hashPassword = crypto.createHash('md5').update(password).digest('hex');
  const userId = crypto.createHash('md5').update(mail + hashPassword).digest('hex');
  const newUser = {
    mail,
    hashPassword,
    apikey: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    date: new Date().toISOString(),
    isVerified: verify ? true : false,
    verifyCode: !verify ? crypto.createHash('md5').update(userId + mail).digest('hex') : undefined,
    isPremium: false,
    isBanned: false,
    lastUsed: new Date().toISOString(),
    uses: 0,
    userId
  };
  database.push(newUser);
  writeDb(database);
  return newUser;
};

/**
 * Met à jour un utilisateur
 */
const UpdateDatabase = (mail, data) => {
  const database = readDb();
  const userIndex = database.findIndex(u => u.mail === mail);
  if (userIndex === -1) return null;
  database[userIndex] = { ...database[userIndex], ...data };
  writeDb(database);
  return database[userIndex];
};

/**
 * Incrémente le compteur d'utilisation
 */
const addUse = (mail) => {
  const database = readDb();
  const userIndex = database.findIndex(u => u.mail === mail);
  if (userIndex === -1) return false;
  database[userIndex].uses = (database[userIndex].uses || 0) + 1;
  database[userIndex].lastUsed = new Date().toISOString();
  writeDb(database);
  return true;
};

/**
 * Supprime un utilisateur
 */
const DeleteDatabase = (mail) => {
  const database = readDb();
  const userIndex = database.findIndex(u => u.mail === mail);
  if (userIndex === -1) return false;
  database.splice(userIndex, 1);
  writeDb(database);
  return true;
};

module.exports = {
  getDatabaseByUser,
  getDatabaseByApiKey,
  getDatabaseByUserId,
  getDatabaseByVerifyCode,
  PostDatabase,
  UpdateDatabase,
  DeleteDatabase,
  getDatabase,
  addUse
};
