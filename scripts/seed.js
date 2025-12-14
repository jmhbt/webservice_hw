require('dotenv').config();

const { sequelize } = require('../src/db');
const { User, Post, Comment, Todo } = require('../src/db/models');
const { hashPassword } = require('../src/utils/auth');

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await sequelize.authenticate();

  // 안전: 기존 데이터 일부 삭제(원하면 주석처리)
  await Comment.destroy({ where: {}, truncate: true });
  await Todo.destroy({ where: {}, truncate: true });
  await Post.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });

  const roles = ['USER', 'ADMIN'];

  // 1) Users 30명 (admin 2명 포함)
  const users = [];
  for (let i = 1; i <= 30; i++) {
    const role = i <= 2 ? 'ADMIN' : 'USER';
    const email = role === 'ADMIN' ? `admin${i}@test.com` : `user${i}@test.com`;
    const passwordHash = await hashPassword('1234');

    users.push(
      await User.create({
        email,
        passwordHash,
        name: role === 'ADMIN' ? `관리자${i}` : `유저${i}`,
        role,
        isActive: true,
      })
    );
  }

  // 2) Posts 100개
  const posts = [];
  for (let i = 1; i <= 100; i++) {
    const author = pick(users);
    posts.push(
      await Post.create({
        authorId: author.id,
        title: `seed post ${i}`,
        content: `seed content ${i}`,
        isDeleted: false,
      })
    );
  }

  // 3) Comments 60개
  for (let i = 1; i <= 60; i++) {
    const author = pick(users);
    const post = pick(posts);
    await Comment.create({
      postId: post.id,
      authorId: author.id,
      content: `seed comment ${i}`,
      isDeleted: false,
    });
  }

  // 4) Todos 40개
  for (let i = 1; i <= 40; i++) {
    const owner = pick(users);
    await Todo.create({
      userId: owner.id,
      title: `seed todo ${i}`,
      completed: i % 3 === 0,
      isDeleted: false,
    });
  }


  console.log('Seed completed: users=30 posts=100 comments=60 todos=40 (total 230)');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
  });
