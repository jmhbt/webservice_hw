const express = require('express');
const { User, RefreshToken } = require('../db/models');
const {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/auth');
const { authenticate } = require('../middlewares/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.post('/register', async (req, res, next) => {
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

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 409,
        code: 'DUPLICATE_EMAIL',
        message: 'Email already exists',
      });
    }

  
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'USER',   
      isActive: true, 
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login and issue tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: test1@test.com }
 *               password: { type: string, example: 1234 }
 *     responses:
 *       200:
 *         description: Tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */


router.post('/login', async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'request body is required',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'email and password are required',
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const decodedRefresh = verifyRefreshToken(refreshToken);

    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(decodedRefresh.exp * 1000),
    });

    return res.json({
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'refreshToken is required',
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Refresh token is invalid or expired',
      });
    }

    const tokenRow = await RefreshToken.findOne({
      where: {
        userId: payload.userId,
        token: refreshToken,
        revoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRow) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Refresh token not found or revoked',
      });
    }

    const accessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
    });

    return res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.update(
        { revoked: true },
        { where: { userId: req.user.id, token: refreshToken } }
      );
    } else {
      await RefreshToken.update(
        { revoked: true },
        { where: { userId: req.user.id } }
      );
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'currentPassword and newPassword are required',
      });
    }

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

    const ok = await comparePassword(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await RefreshToken.update(
      { revoked: true },
      { where: { userId: user.id } }
    );

    return res.status(200).json({ message: 'Password changed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
