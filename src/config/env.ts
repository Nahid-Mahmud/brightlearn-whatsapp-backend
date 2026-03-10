import dotenv from 'dotenv';
import path from 'path';

// Load the appropriate .env file based on NODE_ENV
// Use __dirname to find the project root (go up from src/config to project root)
const projectRoot = path.resolve(__dirname, '..', '..');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(projectRoot, envFile) });

interface EnvVariables {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  REDIS_USER_NAME: string;
  REDIS_PASSWORD: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  TEST_PHONE_NUMBERS?: string;
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
    TEST_PHONE_NUMBERS: process.env.TEST_PHONE_NUMBERS,
  };
};

const envVariables = loadEnvVariable();

// Helper function to get test phone numbers as array
export const getTestPhoneNumbers = (): string[] => {
  if (!envVariables.TEST_PHONE_NUMBERS) {
    return [];
  }
  return envVariables.TEST_PHONE_NUMBERS.split(',').map((num) => num.trim());
};

export default envVariables;
