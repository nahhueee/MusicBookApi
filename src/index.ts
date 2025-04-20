import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './conf/app.config';
const path = require('path');

const app = express();

//setings
app.set('port', process.env.Port || config.port);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'upload')));

//Starting the server
app.listen(app.get('port'), () => {
    console.log('server ' + process.env.NODE_ENV + ' on port ' + app.get('port'));
});

//#region Rutas
import cancionesRoute from './routes/cancionesRuta';
import listasRoute from './routes/listasRuta';
import miscRoute from './routes/miscRuta';

app.use('/musicbook/canciones', cancionesRoute);
app.use('/musicbook/listas', listasRoute);
app.use('/musicbook/misc', miscRoute);
//#endregion

//Index Route
app.get('/musicbook', (req, res) => {
    res.status(200).send('Servidor de Musicbook funcionando en este puerto.');
});

//404
app.use((_req, res) => {
    res.status(404).send('No se encontró el recurso solicitado.');
});
  
