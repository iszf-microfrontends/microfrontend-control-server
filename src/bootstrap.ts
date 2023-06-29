import express from 'express';

type MicrofrontendDto = {
  name: string;
  url: string;
  component: string;
};

const app = express();
const port = 3000;

const startedMicrofrontends: MicrofrontendDto[] = [];

app.use(express.json());

app.get('/started-microfrontends', (_req, res) => {
  res.status(200).json(startedMicrofrontends);
});

app.post('/microfrontend-started', (req, res) => {
  const data = req.body as MicrofrontendDto;
  startedMicrofrontends.push(data);
  res.status(200).json({ success: true });
});

app.post('/microfrontend-closed', (req, res) => {
  const data = req.body as { name: string };
  const closedMicrofrontendIndex = startedMicrofrontends.findIndex((mf) => mf.name === data.name);
  startedMicrofrontends.splice(closedMicrofrontendIndex, 1);
  res.status(200).json({ success: true });
});

const bootstrap = () => {
  try {
    app.listen(port, () => {
      console.log(`Microfrontend control server listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

bootstrap();
