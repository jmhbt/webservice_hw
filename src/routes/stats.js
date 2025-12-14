const express = require('express');
const { requireRole, authenticate } = require('../middlewares/auth');
const { Post } = require('../db/models');
const { sequelize } = require('../db');
const { QueryTypes } = require('sequelize');

const router = express.Router();

/**
 * @openapi
 * /stats/daily:
 *   get:
 *     summary: Daily stats (ADMIN)
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Forbidden, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */

/**
 * @openapi
 * /stats/top-authors:
 *   get:
 *     summary: Top authors stats (ADMIN)
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Forbidden, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */

router.get('/posts/daily', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const rows = await sequelize.query(
      `
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM posts
      WHERE is_deleted = 0
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json({
      rangeDays: 7,
      data: rows.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
