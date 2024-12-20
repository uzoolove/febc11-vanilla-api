import logger from '#utils/logger.js';
import dotenv from 'dotenv';

// 기본 .env 파일 로딩(package.json에서 로딩함)
dotenv.config({ path: '.env' });
// 환경별 .env 파일 로딩
logger.log('NODE_ENV', process.env.NODE_ENV);
if (process.env.NODE_ENV) {
  dotenv.config({ override: true, path: `.env.${process.env.NODE_ENV}` });
}

export const db = {
  url: process.env.DB_URL,
  clientIds: ['00-sample', '00-board', '00-brunch', '00-nike', '00-toyzrus', '00-openmarket', 'vanilla00', 'vanilla01', 'vanilla02', 'vanilla03', 'vanilla04', 'vanilla05', 'vanilla06', 'vanilla07', 'vanilla08', 'vanilla09', 'vanilla10', 'final00', 'final01', 'final02', 'final03', 'final04', 'final05', 'final06', 'final07', 'final08', 'final09', 'final10'],
};

export const jwt = {
  access: {
    secretKey: 'ShoppingAccessToken', // 암호키
    options: {
      algorithm: 'HS256', // 대칭키 방식
      expiresIn: '1d',  // 하루
      // expiresIn: '2h',  // 2시간
      // expiresIn: '10m', // 10분
      // expiresIn: '10s',  // 10초
      issuer: 'FESP', // 발행자
    },
  },
  refresh: {
    secretKey: 'ShoppingRefreshToken',
    options: {
      algorithm: 'HS256',
      expiresIn: '30d',
      // expiresIn: '30s',
      issuer: 'FESP',
    },
  }
};

export const cors = {
  origin: [
    /^https?:\/\/localhost/,
    /^https?:\/\/127.0.0.1/,
    /netlify.app$/,
    /vercel.app$/,
    /fesp.shop$/,
    /codepen.io$/,
    /stackblitz.com$/,
    /webcontainer.io$/,
    new RegExp(process.env.APP_HOST)
  ]
};

export default { db, jwt, cors };