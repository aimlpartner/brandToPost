import express from 'express';
import {
  handleAdminLockUser,
  handleAdminLockAllUsers,
  handleAdminDeleteUser,
  handleAdminGetUserGenerations,
  handleAdminGetProducts,
  handleGetScalabilityMetrics,
  handleGetAdminLogs,
  handleGetDebugEnv
} from '../controllers/adminController';
import { requireAuth } from '../middlewares/auth';

export const adminRouter = express.Router();

adminRouter.post('/api/admin/users/lock', handleAdminLockUser);
adminRouter.post('/api/admin/users/lock-all', handleAdminLockAllUsers);
adminRouter.post('/api/admin/users/delete', handleAdminDeleteUser);
adminRouter.get('/api/admin/users/:userId/generations', handleAdminGetUserGenerations);
adminRouter.get('/api/admin/products', handleAdminGetProducts);
adminRouter.get('/api/scalability/metrics', requireAuth, handleGetScalabilityMetrics);
adminRouter.get('/api/admin/logs', handleGetAdminLogs);
adminRouter.get('/api/debug/env', handleGetDebugEnv);
