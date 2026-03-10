import dotenv from 'dotenv';

dotenv.config();

interface EnvVariables {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  REDIS_USER_NAME: string;
  REDIS_PASSWORD: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
}

const loadEnvVariable = (): EnvVariables => {
  const requiredEnvVariables = [
    'PORT',
    'NODE_ENV',
    'REDIS_USER_NAME',
    'REDIS_PASSWORD',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
    REDIS_USER_NAME: process.env.REDIS_USER_NAME as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: process.env.REDIS_PORT as string,
  };
};

const envVariables = loadEnvVariable();
export default envVariables;
