import { HashInfo } from './fingerprint';

export interface DatabaseEntry {
    songId: string;
    timeOffset: number;
}

export class LocalDatabase {
    private hashStore: Record<string, DatabaseEntry[]> = {};
    private trackMetadata: Record<string, any> = {};

    public addTrack(songId: string, metadata: any, hashes: HashInfo[]) {
        this.trackMetadata[songId] = metadata;
        
        for (const { hash, timeOffset } of hashes) {
            if (!this.hashStore[hash]) {
                this.hashStore[hash] = [];
            }
            this.hashStore[hash].push({ songId, timeOffset });
        }
        console.log(`Indexed track: ${songId} with ${hashes.length} hashes.`);
    }

    public getMatches(hash: string): DatabaseEntry[] {
        return this.hashStore[hash] || [];
    }

    public getMetadata(songId: string) {
        return this.trackMetadata[songId];
    }
}