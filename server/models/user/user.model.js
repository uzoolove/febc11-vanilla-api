import _ from 'lodash';
import moment from 'moment-timezone';

import logger from '#utils/logger.js';

class UserModel {
  constructor(db, model) {
    this.db = db;
    this.model = model;
  }

  // 회원 가입
  async create(userInfo) {
    logger.trace(arguments);
    userInfo._id = await this.db.nextSeq('user');
    userInfo.updatedAt = userInfo.createdAt = moment().tz('Asia/Seoul').format('YYYY.MM.DD HH:mm:ss');
    if (!userInfo.dryRun) {
      await this.db.user.insertOne(userInfo);
    }
    delete userInfo.password;
    return userInfo;
  }

  // 회원 정보 조회(단일 속성)
  async findAttrById(_id, attr) {
    logger.trace(arguments);
    const item = await this.db.user.findOne({ _id }, { projection: { [attr]: 1, _id: 0 } });
    logger.debug(item);
    return item;
  }

  // 지정한 속성으로 회원 정보 조회
  async findBy(query) {
    logger.trace(arguments);
    const item = await this.db.user.findOne(query);
    if (item) {
      const notificationModel = this.model.notification;
      item.notifications = await notificationModel.find({ userId: item._id });
    }

    logger.debug(item);
    return item;
  }

  // 회원 정보 조회(여러 속성)
  async findAttrListById(_id, projection) {
    logger.trace(arguments);
    const item = await this.db.user.findOne({ _id }, { projection: { ...projection, _id: 0 } });
    logger.debug(item);
    return item;
  }

  // 회원 정보 조회(모든 속성)
  async findById(_id) {
    logger.trace(arguments);

    const pipeline = [
      // Match stage to filter documents based on query
      { $match: { _id } },

      // 게시글 목록
      {
        $lookup: {
          from: "post",
          localField: "_id",
          foreignField: "user._id",
          as: "postItems"
        }
      },

      // 게시글 수
      {
        $addFields: {
          posts: { $size: "$postItems" }
        }
      },

      // 북마크 목록(상품)
      {
        $lookup: {
          from: "bookmark",
          let: { userId: "$_id" }, // let userId = user._id
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$type", "product"] } // 상품에 대한 북마크는 type이 product로 지정됨
                  ]
                }
              }
            }
          ],
          as: "bookmark.productItems"
        }
      },

      // 북마크 목록(사용자)
      {
        $lookup: {
          from: "bookmark",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$type", "user"] } // 사용자에 대한 북마크는 type이 user로 지정됨
                  ]
                }
              }
            }
          ],
          as: "bookmark.userItems"
        }
      },

      // 북마크 목록(게시글)
      {
        $lookup: {
          from: "bookmark",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$type", "post"] } // 게시물에 대한 북마크는 type이 post로 지정됨
                  ]
                }
              }
            }
          ],
          as: "bookmark.postItems"
        }
      },

      // 대상 회원을 북마크한 사람들
      {
        $lookup: {
          from: "bookmark",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$target_id", "$$userId"] },
                    { $eq: ["$type", "user"] } // 사용자에 대한 북마크는 type이 user로 지정됨
                  ]
                }
              }
            }
          ],
          as: "bookmarkedBy.userItems"
        }
      },


      // 북마크 수
      {
        $addFields: {
          'bookmark.products': { $size: "$bookmark.productItems" },
          'bookmark.users': { $size: "$bookmark.userItems" },
          'bookmark.posts': { $size: "$bookmark.postItems" },
          'bookmarkedBy.users': { $size: "$bookmarkedBy.userItems" },
        }
      },

      // 게시글 전체 조회수
      {
        $unwind: {
          path: "$postItems",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          postViews: { $sum: "$postItems.views" },
          user: { $first: "$$ROOT" }
        }
      },

      {
        $project: {
          'user.password': 0,
          'user.refreshToken': 0,
          'user.private': 0,
          'user.postItems': 0,
          'user.bookmark.productItems': 0,
          'user.bookmark.userItems': 0,
          'user.bookmark.postItems': 0,
          'user.bookmarkedBy.userItems': 0,
        }
      },

    ];

    const item = await this.db.user.aggregate(pipeline).next();


    // const item = await this.db.user.findOne({ _id }, { projection: { password: 0, refreshToken: 0, }});

    let user = null;
    if (item) {
      user = { ...item.user, postViews: item.postViews };
    }
    logger.debug(user);
    return user;
  }

  // 회원 정보 수정
  async update(_id, userInfo) {
    logger.trace(arguments);
    userInfo.updatedAt = moment().tz('Asia/Seoul').format('YYYY.MM.DD HH:mm:ss');
    const result = await this.db.user.updateOne({ _id }, { $set: userInfo });
    logger.debug(result);
    const item = await this.findAttrListById(_id, _.mapValues(userInfo, () => 1));
    return item;
  }

  // refreshToken 수정
  async updateRefreshToken(_id, refreshToken) {
    logger.trace(arguments);
    const result = await this.db.user.updateOne({ _id }, { $set: { refreshToken } });
    logger.debug(result);
    return true;
  }

  // 회원 목록 조회
  async find({ search = {}, sortBy = {}, page = 1, limit = 0 }) {
    logger.trace(arguments);
    const query = { ...search };

    const skip = (page - 1) * limit;
    logger.debug(query);

    const totalCount = await this.db.user.countDocuments(query);


    const pipeline = [
      { $match: query },

      // 게시글 목록 조회
      {
        $lookup: {
          from: "post",
          localField: "_id",
          foreignField: "user._id",
          as: "postItems"
        }
      },

      // 게시글 수
      {
        $addFields: {
          posts: { $size: "$postItems" }
        }
      },

      // 대상 회원을 북마크한 사람들
      {
        $lookup: {
          from: "bookmark",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$target_id", "$$userId"] },
                    { $eq: ["$type", "user"] } // 사용자에 대한 북마크는 type이 user로 지정됨
                  ]
                }
              }
            }
          ],
          as: "bookmarkedBy.userItems"
        }
      },


      // 북마크 수
      {
        $addFields: {
          'bookmarkedBy.users': { $size: "$bookmarkedBy.userItems" },
        }
      },

      // 게시글 전체 조회수
      {
        $unwind: {
          path: "$postItems",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          postViews: { $sum: "$postItems.views" },
          user: { $first: "$$ROOT" }
        }
      },

      // user 속성을 최상위로 이동
      { $replaceRoot: { newRoot: { $mergeObjects: ["$user", { postViews: "$postViews" }] } } },

      // 주문 데이터에서 사용자별 판매수 계산
      {
        $lookup: {
          from: "order",
          let: { sellerId: "$_id" }, // 현재 사용자를 판매자로 매핑
          pipeline: [
            { $unwind: "$products" }, // products 배열 펼치기
            {
              $match: {
                $expr: { $eq: ["$products.seller_id", "$$sellerId"] } // 현재 사용자와 판매자 ID 일치 확인
              }
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$products.quantity" } // 판매수량 합산
              }
            }
          ],
          as: "salesData"
        }
      },

      // 판매 수량 필드를 추가
      {
        $addFields: {
          totalSales: {
            $ifNull: [{ $arrayElemAt: ["$salesData.totalSales", 0] }, 0] // 판매량이 없으면 0
          }
        }
      },

      { $sort: sortBy },
      { $skip: skip },
    ];
    if (limit > 0) { // aggregate에서 limit는 양수로 지정해야 함
      pipeline.push({ $limit: limit });
    }

    pipeline.push({
      $project: {
        'password': 0,
        'refreshToken': 0,
        'private': 0,
        'postItems': 0,
        'bookmark.postItems': 0,
        'bookmarkedBy.userItems': 0,
        'salesData': 0,
      }
    });

    const list = await this.db.user.aggregate(pipeline).toArray();

    // const list = await this.db.user.find(query).project({
    //   password: 0,
    //   refreshToken: 0,
    //   private: 0,
    // }).skip(skip).limit(limit).sort(sortBy).toArray();
    const result = { item: list };

    result.pagination = {
      page,
      limit,
      total: totalCount,
      totalPages: (limit === 0) ? 1 : Math.ceil(totalCount / limit)
    };

    logger.debug(list.length);
    return result;
  }
}

export default UserModel;