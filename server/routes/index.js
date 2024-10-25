import adminRouter from '#routes/admin/index.js';
import userRouter from '#routes/user/index.js';
import sellerRouter from '#routes/seller/index.js';
import systemRouter from '#routes/system/index.js';
import setModel from '#middlewares/setModel.js';

import express from 'express';
const router = express.Router({ mergeParams: true });

// /files로 시작하는 파일 링크일 경우 client-id 체크 안함(url이 /files인 파일 업로드는 체크함)
router.use(/^\/files\/?$|^(?!\/files).*$/, setModel);
// router.use('/', setModel);
router.use('/', adminRouter);
router.use('/', userRouter);
router.use('/', sellerRouter);
router.use('/', systemRouter);

export default router;