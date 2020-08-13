import express from 'express';
import routes from './routes';
import cors from 'cors';

const app =express();

app.use(cors())
app.use(express.json()); // -> insominia nao consegue ler json entao temos que converter
app.use(routes);

app.listen(8080);



