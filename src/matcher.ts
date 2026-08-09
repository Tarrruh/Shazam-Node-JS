import { HashInfo } from './fingerprint';
import { LocalDatabase } from './database';

export interface MatchResult {
    songId: string | null;
    metadata: any;
    confidenceScore: number;
}

export function recognizeAudio(queryHashes: HashInfo[], db: LocalDatabase): MatchResult {
    const matchScores: Record<string, Record<number, number>> = {};
    
    for (const query of queryHashes) {
        const matchesInDb = db.getMatches(query.hash);
        
        for (const dbEntry of matchesInDb) {
            const timeDelta = dbEntry.timeOffset - query.timeOffset;
            
            if (!matchScores[dbEntry.songId]) {
                matchScores[dbEntry.songId] = {};
            }
            
            matchScores[dbEntry.songId][timeDelta] = (matchScores[dbEntry.songId][timeDelta] || 0) + 1;
        }
    }
    
    let bestMatchId: string | null = null;
    let maxScore = 0;
    
    for (const [songId, histogram] of Object.entries(matchScores)) {
        for (const [delta, score] of Object.entries(histogram)) {
            if (score > maxScore) {
                maxScore = score;
                bestMatchId = songId;
            }
        }
    }
    
    return {
        songId: bestMatchId,
        metadata: bestMatchId ? db.getMetadata(bestMatchId) : null,
        confidenceScore: maxScore
    };
}