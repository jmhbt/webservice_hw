const express = require('express');
const { requireRole, authenticate } = require('../middlewares/auth');
const { Post } = require('../db/models');
const { sequelize } = require('../db');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// 오늘 포함 최근 7일치 게시글 생성 수
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
