const express = require('express');
const { User } = require('../db/models');
const { hashPassword } = require('../utils/auth');
const { authenticate, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'email, password, name are required',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 409,
        code: 'DUPLICATE_RESOURCE',
        message: 'Email already in use',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      name,
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    if (name) {
      user.name = name;
    }
    await user.save();

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (ADMIN only)
 */

router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page ?? '0', 10);
    const size = Math.min(parseInt(req.query.size ?? '20', 10), 50);
    const offset = page * size;

    const { rows, count } = await User.findAndCountAll({
      offset,
      limit: size,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      content: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
      })),
      page,
      size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user detail (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (ADMIN only)
 *       404:
 *         description: User not found
 */

router.get('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deactivated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

router.patch('/:id/deactivate', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      id: user.id,
      isActive: user.isActive,
      message: 'User deactivated',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'role must be USER or ADMIN',
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      id: user.id,
      role: user.role,
      message: 'Role updated',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
