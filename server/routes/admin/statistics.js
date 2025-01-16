import express from 'express';
import moment from 'moment';
import { query } from 'express-validator';
import validator from '#middlewares/validator.js';

const router = express.Router();

// 주문량 조회
router.get('/orders', [
  query('by').optional().isIn(['seller', 'product', 'day']).withMessage('by 값은 seller, product, day 중 하나여야 합니다.'),
  query('start').optional().default(() => moment().subtract(1, 'weeks').format('YYYY.MM.DD')).matches(/^\d{4}\.\d{2}\.\d{2}$/).withMessage('start 값은 yyyy.mm.dd 형태로 전달해야 합니다.'),
  query('finish').optional().default(() => moment().format('YYYY.MM.DD')).matches(/^\d{4}\.\d{2}\.\d{2}$/).withMessage('finish 값은 yyyy.mm.dd 형태로 전달해야 합니다.').custom((finish, { req }) => {
    const start = req.query.start;
    if (moment(finish, 'YYYY.MM.DD').diff(moment(start, 'YYYY.MM.DD'), 'years', true) > 1) { // true는 소수이하까지 반환(1.001 년, 0.9932 년)
      throw new Error('start와 finish의 차이는 1년을 넘을 수 없습니다.');
    }
    return true;
  }),
  query('custom').optional().isJSON().withMessage('custom 값은 JSON 형식의 문자열이어야 합니다.'),
], validator.checkResult, async function(req, res, next) {
  /*
    #swagger.tags = ['통계 조회']
    #swagger.summary  = '주문량 조회'
    #swagger.description = "기간내의 주문 수량과 주문 금액을 조회합니다."

    #swagger.security = [{
      "Access Token": []
    }]

    #swagger.parameters['by'] = {
      description: `그룹 기준<br>
        seller: 판매자별 주문량 조회<br>
        product: 상품별 주문량 조회<br>
        day: 일별 주문량 조회<br>
        지정하지 않으면 전체 주문량 조회`,
      in: 'query',
      type: 'string',
      example: 'seller'
    }

    #swagger.parameters['start'] = {
      description: "조회 시작일. 생략시 1주일 전",
      in: 'query',
      type: 'string',
      example: '2025.01.02'
    }
    #swagger.parameters['finish'] = {
      description: "조회 종료일. 생략시 오늘",
      in: 'query',
      type: 'string',
      example: '2025.01.11'
    }
    #swagger.parameters['custom'] = {
      description: "custom 검색 조건",
      in: 'query',
      type: 'string',
      example: '{\"cost.total\":{\"$gte\":40000}}'
    }

    #swagger.responses[200] = {
      description: '성공',
      content: {
        "application/json": {
          examples: {
            "전체 주문량 조회": { $ref: "#/components/examples/orderStaticsRes" },
            "판매자별 주문량 조회": { $ref: "#/components/examples/orderStaticsResBySeller" },
            "상품별 주문량 조회": { $ref: "#/components/examples/orderStaticsResByProduct" },
            "일별 주문량 조회": { $ref: "#/components/examples/orderStaticsResByDay" },
          }
        }
      }
    }

    #swagger.responses[422] = {
      description: '입력값 검증 오류',
      content: {
        "application/json": {
          schema: { $ref: '#/components/schemas/error422' }
        }
      }
    }
    #swagger.responses[500] = {
      description: '서버 에러',
      content: {
        "application/json": {
          schema: { $ref: '#/components/schemas/error500' }
        }
      }
    }
  */

    try {
      const statisticsModel = req.model.statistics;
      let search = {};
      let { by, start, finish, custom } = req.query;
      
      search['createdAt'] = {};
      if (start) search['createdAt']['$gte'] = start;
      if (finish) search['createdAt']['$lte'] = finish;
  
      if (custom) {
        search = { ...search, ...JSON.parse(custom) };
      }
    
      let result = [];
      switch (by) {
        case 'seller':
          result = await statisticsModel.ordersBySeller(search);
          break;
        case 'product':
          result = await statisticsModel.ordersByProduct(search);
          break;
        case 'day':
          result = await statisticsModel.ordersByDay(search);
          break;
        default:
          result = await statisticsModel.orders(search);
          break;
      }

      res.json({ ok: 1, ...result });
    } catch (err) {
      next(err);
    }
});


export default router;
