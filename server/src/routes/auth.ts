import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';

export const authRouter = Router();

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});