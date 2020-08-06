import express from 'express';
import routes from './routes';
import cors from 'cors';

const app =express();

app.use(express.json()); // -> insominia nao consegue ler json entao temos que converter
app.use(routes);
app.use(cors())

app.listen(8080);
