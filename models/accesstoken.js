"use strict";
module.exports = (sequelize, DataTypes) => {
    const AccessToken = sequelize.define("AccessToken", {
        userId: DataTypes.INTEGER,
        token: DataTypes.STRING
    }, {});
    AccessToken.associate = function(models) {
    // associations can be defined here
    };
    return AccessToken;
};
