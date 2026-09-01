const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
    console.log(`PIA Backend funcionando en puerto ${port}`);
});
