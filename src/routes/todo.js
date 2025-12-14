const express = require('express');
const { Todo } = require('../db/models');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @openapi
 * /todos:
 *   post:
 *     summary: Create todo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TodoCreateRequest' }
 *     responses:
 *       201: { description: Created }
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
 *   get:
 *     summary: List todos (pagination/sort)
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
 *         schema: { type: string, default: "createdAt,DESC" }
 *     responses:
 *       200: { description: OK }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */


router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 400,
        code: 'VALIDATION_FAILED',
        message: 'title is required',
      });
    }

    const todo = await Todo.create({
      userId: req.user.id,
      title,
      completed: false,
    });

    res.set('Location', `/todos/${todo.id}`);
    return res.status(201).json({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: todo.createdAt,
    });
  } catch (err) {
    next(err);
  }
});


router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? '0', 10), 0);
    const size = Math.min(Math.max(parseInt(req.query.size ?? '20', 10), 1), 50);

    const sortRaw = String(req.query.sort ?? 'createdAt,DESC');
    const [sortFieldRaw, sortDirRaw] = sortRaw.split(',');
    const sortField = ['createdAt', 'updatedAt', 'title'].includes(sortFieldRaw) ? sortFieldRaw : 'createdAt';
    const sortDir = (sortDirRaw ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows, count } = await Todo.findAndCountAll({
      where: { userId: req.user.id },
      offset: page * size,
      limit: size,
      order: [[sortField, sortDir]],
    });

    return res.json({
      content: rows.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      page,
      size,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      sort: `${sortField},${sortDir}`,
    });
  } catch (err) {
    next(err);
  }
});


/**
 * @openapi
 * /todos/{id}:
 *   get:
 *     summary: Get todo detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
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
 *   patch:
 *     summary: Update todo
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
 *               completed: { type: boolean }
 *     responses:
 *       200: { description: OK }
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
 *   delete:
 *     summary: Delete todo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: No content }
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

    const todo = await Todo.findOne({ where: { id, userId: req.user.id } });
    if (!todo) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Todo not found',
      });
    }

    return res.json({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /todos/:id  (+ maintenance 503 테스트: title === "maintenance")
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, completed } = req.body;

    const todo = await Todo.findOne({ where: { id, userId: req.user.id } });
    if (!todo) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Todo not found',
      });
    }

    if (title === 'maintenance') {
      return res.status(503).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Todo service is under maintenance',
      });
    }

    if (typeof title === 'string') todo.title = title;
    if (typeof completed === 'boolean') todo.completed = completed;

    await todo.save();

    return res.json({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      updatedAt: todo.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /todos/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const todo = await Todo.findOne({ where: { id, userId: req.user.id } });
    if (!todo) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Todo not found',
      });
    }

    await todo.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
