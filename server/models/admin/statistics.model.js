import logger from '#utils/logger.js';

class StatisticsModel{
  constructor(db, model){
    this.db = db;
    this.model = model;
  }

  // 전체 판매량 조회
  async orders(search) {
    logger.trace(arguments);
    const query = search;

    const list = await this.db.order.aggregate([
      { $match: query }, // 필터 조건 적용
      { $unwind: "$products" }, // products 배열을 분리
      {
        $group: {
          _id: null, // 전체를 하나의 그룹으로 묶음
          totalQuantity: { $sum: "$products.quantity" }, // 판매 수량 합산
          totalSales: { $sum: "$products.price" }, // 판매 금액 합산
        },
      },
      {
        $project: {
          _id: 0,
        }
      },
    ]).toArray();

    const result = { item: list };

    logger.debug(list);
    return result;
  }
  
  // 판매자별 판매량 조회
  async ordersBySeller(search) {
    logger.trace(arguments);
    const query = search;

    const list = await this.db.order.aggregate([
      { $match: query }, // 필터 조건 적용
      { $unwind: "$products" }, // products 배열을 분리
      {
        $group: {
          _id: "$products.seller_id", // seller_id로 그룹화
          totalQuantity: { $sum: "$products.quantity" }, // 판매 수량 합산
          // totalSales: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }, // 판매 금액 합산
          totalSales: { $sum: "$products.price" }, // 판매 금액 합산
        },
      },
      { $sort: { totalSales: -1 } }, // 총 판매 금액 내림차순 정렬
      {
        $lookup: {
          from: 'user', // 조인할 컬렉션 이름
          localField: '_id', // order의 seller_id
          foreignField: '_id', // user 컬렉션의 _id
          as: 'seller' // 결과에 추가될 필드 이름
        }
      },
      { $unwind: "$seller" }, // seller_info 배열을 분리
      {
        $project: {
          totalQuantity: 1,
          totalSales: 1,
          "seller._id": 1,
          "seller.name": 1,
          "seller.image": 1,
        }
      },
    ]).toArray();

    const result = { item: list };

    logger.debug(list);
    return result;
  }

  // 상품별 판매량 조회
  async ordersByProduct(search) {
    logger.trace(arguments);
    const query = search;

    const list = await this.db.order.aggregate([
      { $match: query }, // 필터 조건 적용
      { $unwind: "$products" }, // products 배열을 분리
      {
        $group: {
          _id: "$products._id", // 상품 id로 그룹화
          totalQuantity: { $sum: "$products.quantity" }, // 판매 수량 합산
          // totalSales: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }, // 판매 금액 합산
          totalSales: { $sum: "$products.price" }, // 판매 금액 합산
          productName: { $first: "$products.name" }, // 상품 이름
          productImage: { $first: "$products.image" }, // 상품 이미지
          productPrice: { $first: { $divide: ["$products.price", "$products.quantity"] } }, // 상품 가격
        },
      },
      { $sort: { totalSales: -1 } }, // 총 판매 금액 내림차순 정렬
      {
        $project: {
          totalQuantity: 1,
          totalSales: 1,
          product: {
            _id: "$_id",
            name: "$productName",
            price: "$productPrice",
            image: "$productImage",
          }
        }
      },
    ]).toArray();

    const result = { item: list };

    logger.debug(list);
    return result;
  }
}  

export default StatisticsModel;