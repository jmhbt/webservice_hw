require('dotenv').config();
const express = require('express');

const { testConnection, sequelize } = require('./db');
require('./db/models');

const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const todoRouter = require('./routes/todo');
const statsRouter = require('./routes/stats');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');


const app = express();

app.use(express.json());
app.use(logger);
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/todos', todoRouter);
app.use('/stats', statsRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: OK }
 *                 version: { type: string, example: 1.0.0 }
 *                 env: { type: string, example: development }
 */


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
async function startServer() {
  await testConnection();
  await sequelize.sync({ alter: false });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = app;
