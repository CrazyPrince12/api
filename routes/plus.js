const { createRouter, handle } = require('./func/bridge');
const { catalog, Z } = require('./func/catalog');

const router = createRouter('plus', catalog);

router.get('/v2/:name', (req, res) => {
  const name = req.params.name;
  return handle({
    required: [],
    optional: [],
    upstream: `${Z}/v2/${encodeURIComponent(name)}`,
    type: 'auto',
    example: ''
  }, req, res);
});

router.get('/v1/:name', (req, res) => {
  const name = req.params.name;
  return handle({
    required: [],
    optional: [],
    upstream: `${Z}/v1/${encodeURIComponent(name)}`,
    type: 'auto',
    example: ''
  }, req, res);
});

module.exports = router;
