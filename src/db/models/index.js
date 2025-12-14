const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Todo = require('./Todo');
const RefreshToken = require('./RefreshToken');


User.hasMany(Post, { foreignKey: { name: 'authorId', allowNull: false }, onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: { name: 'authorId', allowNull: false }, onDelete: 'CASCADE' });


User.hasMany(Comment, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });


Post.hasMany(Comment, { foreignKey: { name: 'postId', allowNull: false }, onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: { name: 'postId', allowNull: false }, onDelete: 'CASCADE' });


User.hasMany(Todo, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Todo.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });


User.hasMany(RefreshToken, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });

module.exports = { User, Post, Comment, Todo, RefreshToken };
