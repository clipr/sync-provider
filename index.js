const Sentry = require("@sentry/node");
let sentryEnabled = false;
if (process.env.NODE_ENV === "production") {
    Sentry.init({dsn: "https://15fad228e4b3456e90360327ef3c2364@sentry.io/1296711"});
    sentryEnabled = true;
}
const reportError = function(err) {
    if (!err instanceof Error) {
        const tmp = new Error();
        tmp.name = err.name || "GenericError";
        tmp.message = err.message || "no message";
        err = tmp;
    }
    if (sentryEnabled) {
        Sentry.captureException(err);
        console.error(err);
    } else {
        console.error(err);
    }
};

const express = require("express");
const bodyParser = require("body-parser");

const {
    emailExists,
    createUser,
    createAccessToken,
    authorizeUser,
    isAccessTokenValid
} = require("./lib/user");
const {
    createSyncUser,
    createCouchUser,
    createCouchDatabase,
    authorizeCouchUser,
    getCookie
} = require("./lib/syncUser");

const app = express();
const cors = require("cors");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.post("/login", async function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }
    if (!req.body.email) {
        return res.status(400).json({
            message: "An email is required"
        });
    }
    if (!req.body.password) {
        return res.status(400).json({
            message: "A password is required"
        });
    }
    try {
        const userInstance = await emailExists(req.body.email);
        if (!userInstance) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        const isUserAuthorized = await authorizeUser(req.body.email, req.body.password);
        if (!isUserAuthorized) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }
        const accessTokenInstance = await createAccessToken(userInstance.id);
        res.json({token: accessTokenInstance.token});
    } catch (e) {
        reportError(e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/register", async function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }
    if (!req.body.email) {
        return res.status(400).json({
            message: "An email is required"
        });
    }
    if (!req.body.password) {
        return res.status(400).json({
            message: "A password is required"
        });
    }
    try {
        const userExists = await emailExists(req.body.email);
        if (userExists) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const userInstance = await createUser(req.body.email, req.body.password);
        const accessTokenInstance = await createAccessToken(userInstance.id);
        const syncUserInstance = await createSyncUser(userInstance.id);
        await createCouchUser(syncUserInstance.name, syncUserInstance.password);
        await createCouchDatabase(syncUserInstance.database);
        await authorizeCouchUser(syncUserInstance.database, syncUserInstance.name);
        res.json({token: accessTokenInstance.token});
    } catch (e) {
        reportError(e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.get("/sync-token", async function(req, res) {
    if (!req.query) {
        return res.status(400).json({
            message: "Invalid request"
        });
    }
    if (!req.query.access_token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
    try {
        const validToken = await isAccessTokenValid(req.query.access_token);
        if (!validToken) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const {cookie, database} = await getCookie(validToken.userId);
        res.json({cookie: cookie, database: database});
    } catch (e) {
        reportError(e);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.listen(3000);
