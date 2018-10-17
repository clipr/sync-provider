"use strict";
module.exports = (sequelize, DataTypes) => {
    const SyncUser = sequelize.define("SyncUser", {
        userId: DataTypes.INTEGER,
        database: DataTypes.STRING,
        name: DataTypes.STRING,
        password: DataTypes.STRING
    }, {});
    SyncUser.associate = function(models) {
    // associations can be defined here
    };
    return SyncUser;
};
