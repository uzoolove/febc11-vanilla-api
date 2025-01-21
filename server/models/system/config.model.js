import createError from 'http-errors';

import logger from '#utils/logger.js';

class ConfigModel {
  constructor(db, model){
    this.db = db;
    this.model = model;
  }
  
  // 설정 등록
  async create(configInfo){
    logger.trace(arguments);

    try{
      if(!configInfo.dryRun){
        await this.db.config.insertOne(configInfo);
        return configInfo;
      }
    }catch(err){
      logger.error(err);
      if(err.code === 11000){
        throw createError(409, '이미 등록된 설정값입니다.', { cause: err });
      }else{
        throw err;
      }
    }
  }

  // 전체 설정 목록 조회
  async find(){
    logger.trace(arguments);

    const list = await this.db.config.find().toArray();    

    return list;
  }

  // 설정 상세 조회
  async findById(_id){
    logger.trace(arguments);
    let item = await this.db.config.findOne({ _id });  
    logger.debug(item);
    return item;
  }

  // 설정 수정
  async update(_id, config){
    logger.trace(arguments);
    const result = await this.db.config.updateOne({ _id }, { $set: config });
    logger.debug(result);
    const item = { _id, ...config };
    return item;
  }

  // 설정 삭제
  async delete(_id){
    logger.trace(arguments);
    const result = await this.db.config.deleteOne({ _id });
    logger.debug(result);
    return result;
  }
}

export default ConfigModel;