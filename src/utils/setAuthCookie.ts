import { Response } from 'express';

interface TokenInfo {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: TokenInfo) => {
  if (tokenInfo.accessToken) {
    res.cookie('accessToken', tokenInfo.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // maxAge: 60 * 60 * 1000 * 24,
      maxAge: 30 * 60 * 1000 // 30 minutes
    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie('refreshToken', tokenInfo.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 * 24 * 30,
    });
  }
};
