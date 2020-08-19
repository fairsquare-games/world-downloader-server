import config from "config";
import { promises as fs } from "fs";

export const createWorldDirectory = async () => {
    await fs.mkdir(config.get("uploadDirectory"))
        .catch(err => {
            if (err.code !== 'EEXIST') {
                console.log(`Could not create archive directory: ${config.get("uploadDirectory")}:\n ${err}`);
            }
        });
}

export const getWorlds = async (): Promise<string[]> => {
    return await fs.readdir(config.get("uploadDirectory")).catch(() => []);
};

export const hasWorld = async (fileName: string): Promise<boolean> => {
    const files = (await getWorlds()).filter((file) => file == fileName);
    return files.length != 0;
};

export const deleteWorld = async (fileName: string) => {
    await fs.unlink(`${config.get("uploadDirectory")}${fileName}`);
};
