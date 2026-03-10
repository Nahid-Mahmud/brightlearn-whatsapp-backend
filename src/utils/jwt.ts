import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export const generateJwtToken = (
  jwtPayload: JwtPayload,
  jwtSecret: string,
  jwtExpiration: string
): string => {
  const token = jwt.sign(jwtPayload, jwtSecret, {
    expiresIn: jwtExpiration,
  } as SignOptions);

  return token;
};

export const verifyJwtToken = (
  jwtToken: string,
  jwtSecret: string
): JwtPayload => {
  try {
    const decodedToken = jwt.verify(jwtToken, jwtSecret) as JwtPayload;
    return decodedToken;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.message === 'invalid signature') {
        throw new Error(
          'Invalid token signature. The token may have been tampered with or is using a different secret.'
        );
      } else if (error.message === 'jwt malformed') {
        throw new Error('Malformed token. Please provide a valid JWT token.');
      } else if (error.message === 'jwt expired') {
        throw new Error('Token has expired. Please log in again.');
      }
    }
    throw error;
  }
};
