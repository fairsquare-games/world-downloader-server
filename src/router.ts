import express from "express";
import { promises as fs } from "fs";
import multer from "multer";
import { v4 as uuid } from "uuid";
import config from "./modules/secret-config";
import WorldCache from "./world-cache";
import { deleteWorld, hasWorld } from "./world-util";

const Router = (cache: WorldCache) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, config.get("uploadDirectory"));
        },
        filename: (req, file, cb) => {
            cb(null, `${uuid()}.zip`);
        },
    });
    const upload = multer({ storage });
    const router = express.Router();

    router.post("/", upload.single("world"), (req, res) => {
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
        cache.worlds.push({ timestamp: new Date().getTime(), fileName: req.file.filename });
    });

    router.get("/:file", async (req, res) => {
        if (!(await hasWorld(req.params.file))) {
            res.json({ error: "file not found" });
            return;
        }

        const fileBuffer = await fs.readFile(`uploads/${req.params.file}`);
        res.set("Content-Type", "application/zip");
        res.send(fileBuffer);

        await deleteWorld(req.params.file);
    });

    return router;
};

export default Router;
