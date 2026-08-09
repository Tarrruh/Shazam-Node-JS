import { fingerprintAudio } from './fingerprint';
import { LocalDatabase } from './database';
import { recognizeAudio } from './matcher';
import { toPCM } from './to_pcm';

async function runLocalShazam() {
    const db = new LocalDatabase();

    console.log("Indexing library...");
    
    try {
        const track1Audio: Float32Array = await toPCM('./library/song1.mp3');
        const track1Hashes = fingerprintAudio(track1Audio);
        db.addTrack('song_001', { title: 'Local Track 1', artist: 'Artist A' }, track1Hashes);

        const track2Audio: Float32Array = await toPCM('./library/song2.mp3');
        const track2Hashes = fingerprintAudio(track2Audio);
        db.addTrack('song_002', { title: 'Local Track 2', artist: 'Artist B' }, track2Hashes);
    } catch (err) {
        console.error("Error generating database tracks. Ensure paths and FFmpeg are correct.", err);
    }

    console.log("Recognizing uploaded audio snippet...");
    try {
        const queryAudio: Float32Array = await toPCM('./uploads/unknown_snippet.mp3');
        const queryHashes = fingerprintAudio(queryAudio);
        
        const result = recognizeAudio(queryHashes, db);

        if (result.confidenceScore > 10) { 
            console.log(`\n--- Match Found! ---`);
            console.log(`Song: ${result.metadata.title} by ${result.metadata.artist}`);
            console.log(`Confidence Score: ${result.confidenceScore}`);
        } else {
            console.log(`\nNo confident match found. Highest score: ${result.confidenceScore}`);
        }
    } catch (err) {
        console.error("Error recognizing audio.", err);
    }
}

runLocalShazam();