import app from './app.js';
import { config, prisma } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`Сервер запущен на http://localhost:${config.port}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
