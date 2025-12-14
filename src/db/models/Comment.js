const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const Comment = sequelize.define(
  'Comment',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    postId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'comments',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Comment;
