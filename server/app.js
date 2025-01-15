import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './swagger-output.json' assert {type: 'json'};
import logger, { errorLogger } from './utils/logger.js';
import indexRouter from './routes/index.js';
import timer from 'node:timers/promises';
import config from './config/index.js';
import rateLimit from 'express-rate-limit';
import moment from 'moment';

var app = express();

const blacklistedIps = new Map();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/apidocs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// 요청 제한 설정 (10초에 100번 요청 가능)
const limiter = rateLimit({
  windowMs: 1000 * 10, // 10초
  max: 100, // 최대 요청 횟수
  keyGenerator: (req) => req.ip, // 요청 IP를 키로 사용
  handler: function(req, res /*, next*/) {
    const blockTime = 1000*60*60; // 한 시간
    // 차단된 IP 목록에 추가
    blacklistedIps.set(req.ip, { ip: req.ip, time: Date.now() });
    setTimeout(() => {
      errorLogger.error('블랙리스트 해제', req.ip);
      // 차단된 IP 목록에서 제거
      blacklistedIps.delete(req.ip);
    }, blockTime);
    errorLogger.error('블랙리스트 추가', req.ip);
    res.status(429).json({ ok: 0, message: '요청 횟수 제한 초과(100회/10초)로 인해 IP를 차단합니다.' });
  }
});

app.use((req, res, next) => {
  // 블랙리스트에 등록된 IP는 요청을 차단
  const blacklist = blacklistedIps.get(req.ip);
  if (blacklist) {
    const blockEndTime = moment(blacklist.time).add(1, 'hour');
    const minutesLeft = blockEndTime.diff(moment(), 'minutes'); // 남은 시간(분) 계산
    return res.status(403).json({ ok: 0, message: `요청 횟수 제한 초과(100회/10초)로 인해 이 IP는 1시간 동안 접속이 차단되었습니다. 차단 해제까지 남은 시간 ${minutesLeft}분 동안 어디에서 무한루프가 발생했는지 확인한 후 버그를 수정하고 재도전하세요^^`});
  }
  next();
});

// 모든 경로에 제한 적용
app.use(limiter);

app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(
  // '/api',
  async function (req, res, next) {
    if (req.query.delay) {
      await timer.setTimeout(req.query.delay);
    }
    next();
  },
  indexRouter
);

// 404 에러
app.use(function(req, res, next){
  const err = new Error(`${req.url} 리소스를 찾을 수 없습니다.`);
  err.status = 404;
  next(err);
});

// 500 에러
app.use(function(err, req, res, next){
  logger.error(err.status === 404 ? err.message : err.stack+'\n\n');
  if(err.cause){
    logger.error(err.cause);
  }

  const status = err.cause?.status || err.status || 500;

  let message = status === 500 ? '요청하신 작업 처리에 실패했습니다. 잠시 후 다시 이용해 주시기 바랍니다.' : err.message;

  res.status(status);
  let result = { ok: 0, message };
  if(status === 401 || status === 422){
    result = { ...result, ...err };  
  }
  res.json(result);
});

export default app;
