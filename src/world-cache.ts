interface CachedFile {
    timestamp: number;
    fileName: string;
}

class WorldCache {
    readonly worlds: CachedFile[];

    constructor() {
        this.worlds = [];
    }
}

export default WorldCache;
