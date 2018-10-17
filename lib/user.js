const models = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const saltRounds = 10;

async function emailExists(email) {
    try {
        const userInstance = await models.User.findOne({
            where: {
                email: email
            }
        });
        if (userInstance) {
            return userInstance;
        } else {
            return false;
        }
    } catch (e) {
        return Promise.reject(e);
    }
}
async function createUser(email, plainTextPass) {
    try {
        const hash = await bcrypt.hash(plainTextPass, saltRounds);
        const userInstance = await models.User.create({
            email: email,
            password: hash
        });
        return userInstance.get({plain: true});
    } catch (e) {
        return Promise.reject(e);
    }
}

async function authorizeUser(email, plainTextPass) {
    try {
        const userInstance = await models.User.findOne({
            where: {
                email: email
            }
        });
        const isPasswordCorrect = await bcrypt.compare(plainTextPass, userInstance.password);
        if (isPasswordCorrect) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

async function createAccessToken(userId) {
    try {
        const token = crypto.randomBytes(20).toString("hex");
        const accessTokenInstance = await models.AccessToken.create({
            userId: userId,
            token: token
        });
        return accessTokenInstance.get({plain: true});
    } catch (e) {
        return Promise.reject(e);
    }
}

async function isAccessTokenValid(token) {
    try {
        const tokenInstance = await models.AccessToken.findOne({
            where: {
                token: token
            }
        });
        if (tokenInstance) {
            return tokenInstance;
        } else {
            return false;
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = {
    emailExists,
    createUser,
    createAccessToken,
    authorizeUser,
    isAccessTokenValid
};
