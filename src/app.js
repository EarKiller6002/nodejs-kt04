import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import adminRouter from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
  helmet({
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

app.use(errorHandler);

export default app;
