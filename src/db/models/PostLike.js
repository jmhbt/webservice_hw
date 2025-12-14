const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const PostLike = sequelize.define(
  'PostLike',
  {
    postId: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    tableName: 'post_likes',
    underscored: true,
    timestamps: true, // created_at만 쓰면 됨
    updatedAt: false,
  }
);

module.exports = PostLike;
