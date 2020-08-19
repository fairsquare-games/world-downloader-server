interface CachedFile {
    timestamp: number;
    fileName: string;
}

class WorldCache {
    worlds: CachedFile[];

    constructor() {
        this.worlds = [];
    }

    removeWorld(fileName: string) {
        this.worlds = this.worlds.filter((cachedFile) => cachedFile.fileName != fileName);
    }
}

export default WorldCache;
