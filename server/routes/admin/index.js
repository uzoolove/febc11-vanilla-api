import jwtAuth from '#middlewares/jwtAuth.js';
import codeRouter from './codes.js';
import userRouter from './users.js';
import statisticsRouter from './statistics.js';

import express from 'express';
const router = express.Router({mergeParams: true});

router.use('/admin/codes', jwtAuth.auth('admin'), codeRouter);
router.use('/admin/users', jwtAuth.auth('admin'), userRouter);
router.use('/admin/statistics', jwtAuth.auth('admin'), statisticsRouter);


export default router;