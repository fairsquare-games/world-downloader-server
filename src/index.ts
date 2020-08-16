import express from "express";
import multer from "multer";
import { promises as fs } from "fs";

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

app.post("/world", upload.single("world"), (req, res, next) => {
    res.json({ url: req.file.filename });
});

app.get("/world/:id", async (req, res) => {
    const files = (await fs.readdir("uploads")).filter((file) => file == req.params.id);
    if (files.length == 0) {
        res.send("file not found");
        return;
    }
    const file = await fs.readFile(`uploads/${files[0]}`);

    res.set("Content-Type", "application/zip");
    res.send(file);
});

app.listen(3000, () => {
    console.log("Ready on 3000");
});
