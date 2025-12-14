const express = require('express');
const { Comment, Post, User } = require('../db/models');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @openapi
 * /comments/{id}:
 *   get:
 *     summary: Get comment detail
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
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const comment = await Comment.findOne({
      where: { id, isDeleted: false },
      include: [
        { model: User, attributes: ['id', 'email', 'name'] },
        { model: Post, attributes: ['id', 'title'], required: false },
      ],
    });

    if (!comment) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Comment not found',
      });
    }

    return res.json({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      author: comment.User ? { id: comment.User.id, email: comment.User.email, name: comment.User.name } : null,
      post: comment.Post ? { id: comment.Post.id, title: comment.Post.title } : null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /comments/{id}:
 *   patch:
 *     summary: Update comment (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "updated" }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'content is required',
      });
    }

    const comment = await Comment.findOne({ where: { id, isDeleted: false } });
    if (!comment) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Comment not found',
      });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not the author of this comment',
      });
    }

    comment.content = content;
    await comment.save();

    return res.json({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      updatedAt: comment.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /comments/{id}:
 *   delete:
 *     summary: Delete comment (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: No content
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const comment = await Comment.findOne({ where: { id, isDeleted: false } });
    if (!comment) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Comment not found',
      });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not the author of this comment',
      });
    }

    comment.isDeleted = true;
    await comment.save();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
