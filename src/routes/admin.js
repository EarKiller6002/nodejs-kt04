import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../config/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('USER', 'MODERATOR', 'ADMIN').required(),
});

router.patch(
  '/users/:id/role',
  authenticate,
  authorize('ADMIN'),
  validate(updateRoleSchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

      const user = await prisma.user.update({
        where: { id },
        data: { role: req.body.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
