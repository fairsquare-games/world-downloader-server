import express from "express";
import fss, { promises as fs } from "fs";
import http from "http";
import https from "https";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
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
let httpTerminator: HttpTerminator, httpsTerminator: HttpTerminator;
const stopServers = async () => {
    if (httpTerminator) {
        await httpTerminator.terminate();
    }
    if (httpsTerminator) {
        await httpsTerminator.terminate();
    }
};
const startHttp = async () => {
    createHttpTerminator({
        server: http.createServer(app).listen(80),
    });
    await createWorldDirectory();
    await cleanup();
    setCachePurger();
    console.log("Ready on port 80");
};
const startHttps = async () => {
    await createWorldDirectory();

    /* Retrieve the key and cert files */
    const key = fs.readFile(`certs/${process.env.CERT_NAME}.key`, "utf8");
    const cert = fs.readFile(`certs/${process.env.CERT_NAME}.crt`, "utf8");

    /* Retrieve both files and start the HTTP and HTTPS servers if they exist, retry otherwise */
    Promise.all([key, cert])
        .then((results) => {
            const credentials = { key: results[0], cert: results[1] };

            httpTerminator = createHttpTerminator({ server: http.createServer(app).listen(80) });
            httpsTerminator = createHttpTerminator({ server: https.createServer(credentials, app).listen(443) });
            setCachePurger();
        })
        .then(() => cleanup())
        .then(() => console.log("Ready for HTTP on port 80, ready for HTTPS on port 443"))
        .catch((err) => {
            if (err.code == "ENOENT") {
                console.log(
                    "Could not locate CERT files, starting with HTTP instead. Will attempt to migrate to HTTPS in 30 seconds..."
                );
                startHttp();
                setTimeout(async () => {
                    await stopServers();
                    await startHttps();
                }, 30 * 1000);
            }
        });
};

if (process.env.CERT_NAME) {
    // /* Listeners for when the cert files change / get updated automatically */
    // const keyFile = `certs/${process.env.CERT_NAME}.key`;
    // const certFile = `certs/${process.env.CERT_NAME}.crt`;
    // let filesUpdated = true;
    // fss.watchFile(keyFile, async () => {
    //     filesUpdated = true;
    // });
    // fss.watchFile(certFile, async () => {
    //     filesUpdated = true;
    // });

    /* Start HTTPS */
    // if (filesUpdated) {
        startHttps();
    // }
} else {
    /* Start HTTP */
    startHttp();
}
