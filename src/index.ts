import express from "express";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
import multer from "multer";
import { v4 as uuid } from "uuid";
import config from "./modules/secret-config";
import { createWorldDirectory, getWorlds, hasWorld, deleteWorld } from "./world-util";

/* Keep track of files as we need to delete them after x time */
interface CachedFile {
    timestamp: number;
    fileName: string;
}
const fileCache: CachedFile[] = [];

/* Initialize app (middleware) */
const app = express();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.get("uploadDirectory"));
    },
    filename: (req, file, cb) => {
        cb(null, `${uuid()}.zip`);
    },
});
const upload = multer({ storage });

/* Routes */
app.post("/", upload.single("world"), (req, res) => {
    if ((config.get("whitelistedIps") as string[]).length > 0) {
        const whitelistedIps = config.get("whitelistedIps") as string[];
        const whitelisted = whitelistedIps.some((whitelistedIp) => whitelistedIp == req.ip);
        if (!whitelisted) {
            res.send({ error: "IP not whitelisted" });
            console.log("Blocked POST from non-whitelisted IP:", req.ip);
            return;
        }
    }

    if (!req.file || !req.file.filename) {
        res.json({ error: "invalid request body" });
        return;
    }

    res.json({ file: req.file.filename });
    fileCache.push({ timestamp: new Date().getTime(), fileName: req.file.filename });
});

app.get("/:file", async (req, res) => {
    if (!(await hasWorld(req.params.file))) {
        res.json({ error: "file not found" });
        return;
    }

    const fileBuffer = await fs.readFile(`uploads/${req.params.file}`);
    res.set("Content-Type", "application/zip");
    res.send(fileBuffer);

    await deleteWorld(req.params.file);
});

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
        for (const cachedFile of fileCache) {
            if (cachedFile.timestamp + config.get("cacheTime") < now) {
                await deleteWorld(cachedFile.fileName);
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
