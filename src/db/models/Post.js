const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const Post = sequelize.define(
  'Post',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    authorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(100), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'posts',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Post;
