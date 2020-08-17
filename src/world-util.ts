import config from "config";
import { promises as fs } from "fs";

export const getWorlds = async () => {
    return await fs.readdir(config.get("uploadDirectory"));
};

export const hasWorld = async (fileName: string) => {
    const files = (await getWorlds()).filter((file) => file == fileName);
    return files.length != 0;
};

export const deleteWorld = async (fileName: string) => {
    await fs.unlink(`${config.get("uploadDirectory")}${fileName}`);
};
