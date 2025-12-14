const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    token: { type: DataTypes.STRING(500), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revoked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'refresh_tokens',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = RefreshToken;
