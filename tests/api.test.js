import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/index.js';

describe('Blog Platform API — Auth, RBAC & Security Tests', () => {
  const user1 = {
    email: 'user1@example.com',
    password: 'Password123!',
    name: 'User One',
  };

  const user2 = {
    email: 'user2@example.com',
    password: 'Password123!',
    name: 'User Two',
  };

  let user1Token;
  let user2Token;
  let createdPostId;

  beforeAll(async () => {
    await prisma.post.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.post.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('POST /auth/register — успешная регистрация пользователя', async () => {
    const res = await request(app).post('/auth/register').send(user1);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(user1.email);
    expect(res.body).not.toHaveProperty('password');
  });

  test('POST /auth/register — ошибка 409 при дублирующемся email', async () => {
    const res = await request(app).post('/auth/register').send(user1);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /auth/login — успешный вход и получение токенов', async () => {
    const res = await request(app).post('/auth/login').send({
      email: user1.email,
      password: user1.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/);

    user1Token = res.body.accessToken;
  });

  test('POST /auth/login — ошибка 401 при неверном пароле', async () => {
    const res = await request(app).post('/auth/login').send({
      email: user1.email,
      password: 'WrongPassword!',
    });

    expect(res.statusCode).toBe(401);
  });

  test('GET /auth/me — ошибка 401 без токена авторизации', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.statusCode).toBe(401);
  });

  test('GET /auth/me — успешное получение профиля с валидным токеном', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(user1.email);
  });

  test('DELETE /api/posts/:id — другой USER получает 403 при удалении чужого поста', async () => {
    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Пост первого пользователя', content: 'Текст', tags: ['test'] });

    expect(postRes.statusCode).toBe(201);
    createdPostId = postRes.body.id;

    await request(app).post('/auth/register').send(user2);
    const login2Res = await request(app).post('/auth/login').send({
      email: user2.email,
      password: user2.password,
    });
    user2Token = login2Res.body.accessToken;

    const deleteRes = await request(app)
      .delete(`/api/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(deleteRes.statusCode).toBe(403);
  });

  test('DELETE /api/posts/:id — владелец успешно удаляет свой пост (204)', async () => {
    const deleteRes = await request(app)
      .delete(`/api/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(deleteRes.statusCode).toBe(204);
  });

  test('Security Headers — присутствуют X-Frame-Options и X-Content-Type-Options', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
