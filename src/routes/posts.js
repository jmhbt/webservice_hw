const express = require('express');
const { Op } = require('sequelize');
const { Post, Comment, User } = require('../db/models');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: List posts (pagination/sort/search)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0, minimum: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 50 }
 *       - in: query
 *         name: sort
 *         description: "e.g. createdAt,DESC"
 *         schema: { type: string, default: "createdAt,DESC" }
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   post:
 *     summary: Create post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PostCreateRequest' }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: List posts (pagination/search/sort)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "createdAt,DESC" }
 *       - in: query
 *         name: keyword
 *         schema: { type: string, example: "hello" }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? '0', 10), 0);
    const size = Math.min(Math.max(parseInt(req.query.size ?? '20', 10), 1), 50);

    const sortRaw = String(req.query.sort ?? 'createdAt,DESC');
    const [sortFieldRaw, sortDirRaw] = sortRaw.split(',');
    const sortField = ['createdAt', 'updatedAt', 'title'].includes(sortFieldRaw) ? sortFieldRaw : 'createdAt';
    const sortDir = (sortDirRaw ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const keyword = (req.query.keyword ?? '').toString().trim();
    const where = { isDeleted: false };

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await Post.findAndCountAll({
      where,
      offset: page * size,
      limit: size,
      order: [[sortField, sortDir]],
      include: [
        { model: User, attributes: ['id', 'email', 'name', 'role'] },
      ],
    });

    return res.json({
      content: rows.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        author: p.User ? { id: p.User.id, email: p.User.email, name: p.User.name, role: p.User.role } : null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      page,
      size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      sort: `${sortField},${sortDir}`,
      keyword,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Create post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PostCreateRequest' }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */


router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'title and content are required',
      });
    }

    const post = await Post.create({
      authorId: req.user.id,
      title,
      content,
      isDeleted: false,
    });

    res.set('Location', `/posts/${post.id}`);
    return res.status(201).json({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     summary: Get post detail
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   patch:
 *     summary: Update post (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Forbidden (not author)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Unprocessable entity
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     summary: Delete post (author only)
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
 *         description: Forbidden (not author)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const post = await Post.findOne({
      where: { id, isDeleted: false },
      include: [{ model: User, attributes: ['id', 'email', 'name', 'role'] }],
    });

    if (!post) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Post not found',
      });
    }

    return res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.User ? { id: post.User.id, email: post.User.email, name: post.User.name, role: post.User.role } : null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, content } = req.body;

    const post = await Post.findOne({ where: { id, isDeleted: false } });
    if (!post) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Post not found',
      });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not the author of this post',
      });
    }

    if (typeof title === 'string') post.title = title;
    if (typeof content === 'string') post.content = content;
    await post.save();

    return res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      updatedAt: post.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const post = await Post.findOne({ where: { id, isDeleted: false } });
    if (!post) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Post not found',
      });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 403,
        code: 'FORBIDDEN',
        message: 'You are not the author of this post',
      });
    }

    post.isDeleted = true;
    await post.save();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /posts/{id}/comments:
 *   get:
 *     summary: List comments of a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0, minimum: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   post:
 *     summary: Create comment on a post
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
 *               content: { type: string, example: "nice post" }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.get('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const postId = Number(req.params.id);

    const post = await Post.findOne({ where: { id: postId, isDeleted: false } });
    if (!post) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Post not found',
      });
    }

    const page = Math.max(parseInt(req.query.page ?? '0', 10), 0);
    const size = Math.min(Math.max(parseInt(req.query.size ?? '20', 10), 1), 50);

    const { rows, count } = await Comment.findAndCountAll({
      where: { postId, isDeleted: false },
      offset: page * size,
      limit: size,
      order: [['createdAt', 'ASC']],
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
    });

    return res.json({
      content: rows.map((c) => ({
        id: c.id,
        postId: c.postId,
        content: c.content,
        author: c.User ? { id: c.User.id, email: c.User.email, name: c.User.name } : null,
        createdAt: c.createdAt,
      })),
      page,
      size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      sort: 'createdAt,ASC',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *   delete:
 *     summary: Unlike a post
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: No Content }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */


router.post('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
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

    const post = await Post.findOne({ where: { id: postId, isDeleted: false } });
    if (!post) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Post not found',
      });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      content,
      isDeleted: false,
    });

    res.set('Location', `/comments/${comment.id}`);
    return res.status(201).json({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
