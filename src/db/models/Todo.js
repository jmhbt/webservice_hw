const { DataTypes } = require('sequelize');
const { sequelize } = require('../index');

const Todo = sequelize.define(
  'Todo',
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'todos',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Todo;
