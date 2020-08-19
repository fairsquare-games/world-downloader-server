import express from "express";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
import config from "./modules/secret-config";
import { createWorldDirectory, getWorlds, deleteWorld } from "./world-util";
import Router from "./router";
import WorldCache from "./world-cache";

/* Initialize app (middleware) */
const app = express();
const cache = new WorldCache();
const router = Router(cache);
app.use("/", router);

/* Clean-up functions */
const cleanup = async () => {
    const files = await getWorlds();
    for (const file of files) {
        await deleteWorld(file);
    }
};
const setCachePurger = () => {
    setInterval(async () => {
        const now = new Date().getTime();
        for (const cachedWorld of cache.worlds) {
            if (cachedWorld.timestamp + config.get("cacheTime") < now) {
                await deleteWorld(cachedWorld.fileName);
            }
        }
    }, 60 * 1000);
};

/* Start server */
if (process.env.CERT_NAME) {
    const start = async () => {
        await createWorldDirectory();
        const key = fs.readFile(`certs/${process.env.CERT_NAME}.key`, "utf8");
        const cert = fs.readFile(`certs/${process.env.CERT_NAME}.crt`, "utf8");
        Promise.all([key, cert])
            .then((results) => {
                const credentials = { key: results[0], cert: results[1] };

                http.createServer(app).listen(80);
                https.createServer(credentials, app).listen(443);
                setCachePurger();
            })
            .then(() => cleanup())
            .then(() => console.log("Ready for HTTP on port 80, ready for HTTPS on port 443"))
            .catch((err) => console.error(err));
    };
    start();
} else {
    app.listen(80, async () => {
        console.log("Ready on port 80");
        await createWorldDirectory();
        await cleanup();
        setCachePurger();
    });
}
