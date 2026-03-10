import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/prisma';
import bcryptjs from 'bcryptjs';

const buildUser = (overrides?: Partial<{ email: string; name: string }>) => {
  return {
    email: overrides?.email ?? 'test.user@example.com',
    name: overrides?.name ?? 'Test User',
    password: 'Password123!',
  };
};

describe('Auth Routes', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = buildUser({ email: 'register.user@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should reject invalid signup payload', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = buildUser({ email: 'login.user@example.com' });
      // const hashedPassword = await hashPassword(user.password);
      const hashedPassword = bcryptjs.hashSync(user.password, 10);

      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ])
      );
    });

    it('should reject invalid credentials', async () => {
      const user = buildUser({ email: 'bad.login@example.com' });
      const hashedPassword = bcryptjs.hashSync(user.password, 10);

      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'WrongPassword!' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should create a new access token from refresh token', async () => {
      const user = buildUser({ email: 'refresh.user@example.com' });
      const hashedPassword = bcryptjs.hashSync(user.password, 10);

      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
        },
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      const cookiesHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(cookiesHeader)
        ? cookiesHeader
        : cookiesHeader
          ? [cookiesHeader]
          : [];
      const refreshCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken=')
      );

      expect(refreshCookie).toBeDefined();

      if (!refreshCookie) {
        throw new Error('Refresh token cookie was not set');
      }

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('accessToken=')])
      );
    });

    it('should reject requests without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Refresh token is required');
    });
  });
});
