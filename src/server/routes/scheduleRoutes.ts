import express from 'express';
import {
  handleGetSchedule,
  handlePostSchedule,
  handlePostScheduleQueue,
  handleDeleteScheduleQueueItem,
  handleRemoveScheduleQueue,
  handleGetAutomationConfig,
  handlePostAutomationConfig,
  handlePostAutomationTrigger
} from '../controllers/scheduleController';
import { requireAuth } from '../middlewares/auth';

export const scheduleRouter = express.Router();

scheduleRouter.get('/api/schedule', requireAuth, handleGetSchedule);
scheduleRouter.post('/api/schedule', requireAuth, handlePostSchedule);
scheduleRouter.post('/api/schedule/queue', requireAuth, handlePostScheduleQueue);
scheduleRouter.delete('/api/schedule/queue/:id', requireAuth, handleDeleteScheduleQueueItem);
scheduleRouter.post('/api/schedule/queue/remove', requireAuth, handleRemoveScheduleQueue);

scheduleRouter.get('/api/automation/config', requireAuth, handleGetAutomationConfig);
scheduleRouter.post('/api/automation/config', requireAuth, handlePostAutomationConfig);
scheduleRouter.post('/api/automation/trigger', requireAuth, handlePostAutomationTrigger);
