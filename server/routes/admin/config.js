import express from 'express';
import validator from '#middlewares/validator.js';
import { body } from 'express-validator';

const router = express.Router();

// 설정 등록
router.post('/', [
  body('_id').notEmpty().withMessage('설정 id는 필수입니다.'),
  body('title').notEmpty().withMessage('설정명은 필수입니다.'),
  body('value').notEmpty().withMessage('설정값은 필수입니다.'),
], validator.checkResult, async function(req, res, next) {
  /*
    #swagger.tags = ['설정 관리']
    #swagger.summary  = '설정값 등록'
    #swagger.description = '설정값을 등록합니다.<br>설정값 등록을 완료한 후 설정값 정보를 반환합니다.'

    #swagger.security = [{
      "Access Token": []
    }]

    #swagger.requestBody = {
      description: "등록할 설정값 정보",
      required: true,
      content: {
        "application/json": {
          schema: { $ref: '#components/schemas/createConfig' },
          examples: {
            "페이지당 출력할 항목수 등록": { $ref: "#/components/examples/createConfigBody" },
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: '성공',
      content: {
        "application/json": {
          examples: {
            "페이지당 출력할 항목수 등록 응답": { $ref: "#/components/examples/createConfigRes" }
          }
        }
      }
    }
    #swagger.responses[401] = {
      description: '인증 실패',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/error401" }
        }
      }
    }
    #swagger.responses[409] = {
      description: '이미 등록된 리소스',
      content: {
        "application/json": {
          schema: { $ref: '#/components/schemas/error409' }
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

  try{
    const configModel = req.model.config;
    const item = await configModel.create(req.body);    
    res.status(201).json({ok: 1, item});
  }catch(err){
    next(err);
  }
});

// 설정 수정
router.put('/:_id', async function(req, res, next) {
  /*
    #swagger.tags = ['설정 관리']
    #swagger.summary  = '설정 수정'
    #swagger.description = '설정을 수정합니다.'

    #swagger.security = [{
      "Access Token": []
    }]

    #swagger.parameters['_id'] = {
      description: "설정 id",
      in: 'path',
      type: 'string',
      example: 'itemPerPage'
    }

    #swagger.requestBody = {
      description: "수정할 설정값 정보",
      required: true,
      content: {
        "application/json": {
          examples: {
            "페이지당 출력할 항목수 수정": { $ref: "#/components/examples/updateConfigBody" }
          }
        }
      }
    }
    #swagger.responses[200] = {
      description: '성공',
      content: {
        "application/json": {
          examples: {
            "페이지당 출력할 항목수 수정 응답": { $ref: "#/components/examples/updateConfigBodyRes" }
          }
        }
      }
    },
    #swagger.responses[401] = {
      description: '인증 실패',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/error401" }
        }
      }
    },
    #swagger.responses[404] = {
      description: '설정값이 존재하지 않음',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/error404" }
        }
      }
    },
    #swagger.responses[500] = {
      description: '서버 에러',
      content: {
        "application/json": {
          schema: { $ref: '#/components/schemas/error500' }
        }
      }
    }
  */
  try{
    const configModel = req.model.config;
    const result = await configModel.update(req.params._id, req.body);
    if(result){
      res.json({ok: 1, updated: result});  
    }else{
      next();
    }
  }catch(err){
    next(err);
  }
});

// 설정 삭제
router.delete('/:_id', async function(req, res, next) {
  /*
    #swagger.tags = ['설정 관리']
    #swagger.summary  = '설정값 삭제'
    #swagger.description = '설정값을 삭제합니다.'

    #swagger.security = [{
      "Access Token": []
    }]

    #swagger.parameters['_id'] = {
      description: "설정값 id",
      in: 'path',
      type: 'string',
      example: 'itemPerPage'
    }

    #swagger.responses[200] = {
      description: '성공',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/simpleOK" }
        }
      }
    }
    #swagger.responses[401] = {
      description: '인증 실패',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/error401" }
        }
      }
    }
    #swagger.responses[404] = {
      description: '설정값이 존재하지 않음',
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/error404" }
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
  try{
    const configModel = req.model.config;
    const result = await configModel.delete(req.params._id);
    if(result.deletedCount){
      res.json({ok: 1});
    }else{
      next();
    }
  }catch(err){
    next(err);
  }
});

export default router;
