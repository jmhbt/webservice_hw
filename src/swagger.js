const swaggerJSDoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Webservice HW API',
    version: '1.0.0',
    description: 'Express + Sequelize + MySQL API Server',
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', example: '2025-12-14T00:00:00.000Z' },
          path: { type: 'string', example: '/posts' },
          status: { type: 'integer', example: 400 },
          code: { type: 'string', example: 'VALIDATION_FAILED' },
          message: { type: 'string', example: 'Bad Request' },
          details: { type: 'object', additionalProperties: true },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      PostCreateRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', example: 'hello' },
          content: { type: 'string', example: 'world' },
        },
      },
      TodoCreateRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'study' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/app.js', './src/routes/*.js'], 
};

module.exports = swaggerJSDoc(options);
