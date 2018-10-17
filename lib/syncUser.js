const models = require("../models");
const crypto = require("crypto");
const request = require("request-promise-native");

const COUCHDB_USER = process.env.COUCHDB_USER;
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD;
const COUCH_URL = `http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984`;

async function createSyncUser(userId) {
    try {
        const database = "db-" + crypto.randomBytes(20).toString("hex");
        const name = "user-" + crypto.randomBytes(20).toString("hex");
        const password = "pass-" + crypto.randomBytes(20).toString("hex");
        const syncUserInstance = await models.SyncUser.create({
            userId,
            database,
            name,
            password
        });
        return syncUserInstance.get({plain: true});
    } catch (e) {
        return Promise.reject(e);
    }
}

async function createCouchUser(name, password) {
    try {
        const body = await request(`${COUCH_URL}/_users/org.couchdb.user:${name}`, {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json: {
                name: name,
                password: password,
                roles: [],
                type: "user"
            }
        });
        console.log(body);
        return body;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function createCouchDatabase(database) {
    try {
        const body = await request(`${COUCH_URL}/${database}`, {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json: {
                db: database
            }
        });
        console.log(body);
        return body;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function authorizeCouchUser(database, name) {
    try {
        const body = await request(`${COUCH_URL}/${database}/_security`, {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json: {
                "admins": {
                    "names": [],
                    "roles": []
                }, "members": {
                    "names": [name],
                    "roles": []
                }
            }
        });
        console.log(body);
        return body;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getCookie(userId) {
    try {
        const syncUserInstance = await models.SyncUser.findOne({
            where: {
                userId: userId
            }
        });
        const res = await request(`${COUCH_URL}/_session`, {
            method: "POST",
            resolveWithFullResponse: true,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            form: {
                name: syncUserInstance.get("name"),
                password: syncUserInstance.get("password")
            }
        });
        const cookie = res.headers["set-cookie"].find(cookie => {
            return cookie.indexOf("AuthSession") > -1;
        }).split(";")[0];
        return {
            cookie: cookie,
            database: syncUserInstance.database
        };
    } catch (e) {
        return Promise.reject(e);
    }
}

module.exports = {
    createSyncUser,
    createCouchUser,
    createCouchDatabase,
    authorizeCouchUser,
    getCookie
};
