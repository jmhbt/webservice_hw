const request = require('supertest');
const { sequelize } = require('../src/db');
require('../src/db/models');

const { User } = require('../src/db/models');
const { hashPassword } = require('../src/utils/auth');

const app = require('../src/app');

async function resetDatabase() {
  // 테스트 DB는 매번 초기화 (테스트 실행 시 테이블 밀고 다시 생성)
  await sequelize.sync({ force: true });
}

async function createUser({ email, password = '1234', name = '테스트', role = 'USER' }) {
  const passwordHash = await hashPassword(password);
  return User.create({
    email,
    passwordHash,
    name,
    role,
    isActive: true,
  });
}

async function login(email, password = '1234') {
  return request(app)
    .post('/auth/login')
    .set('Content-Type', 'application/json')
    .send({ email, password });
}

module.exports = {
  app,
  request,
  sequelize,
  resetDatabase,
  createUser,
  login,
};
