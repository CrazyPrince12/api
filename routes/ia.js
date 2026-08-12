const { createRouter } = require('./func/bridge');
const { catalog } = require('./func/catalog');

module.exports = createRouter('ia', catalog);
