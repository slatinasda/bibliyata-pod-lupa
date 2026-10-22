const app = require('./app');
const { ensureDatabase } = require('./db/ensure');

const PORT = process.env.PORT || 3000;
ensureDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Библията под лупа listening on port ${PORT}`);
  });
});
