import { FFT } from './fft';

export interface Peak {
    time: number;
    freq: number;
}

export interface HashInfo {
    hash: string;
    timeOffset: number;
}

const WINDOW_SIZE = 2048;
const OVERLAP = 1024;

export function generateSpectrogram(samples: Float32Array): number[][] {
    const spectrogram: number[][] = [];
    const fft = new FFT(WINDOW_SIZE);
    
    for (let i = 0; i < samples.length - WINDOW_SIZE; i += OVERLAP) {
        const window = samples.slice(i, i + WINDOW_SIZE);
        
        for (let j = 0; j < WINDOW_SIZE; j++) {
            window[j] *= 0.5 * (1 - Math.cos((2 * Math.PI * j) / (WINDOW_SIZE - 1)));
        }
        
        spectrogram.push(fft.transform(window));
    }
    return spectrogram;
}

export function extractPeaks(spectrogram: number[][]): Peak[] {
    const peaks: Peak[] = [];
    const TIME_RADIUS = 10;
    const FREQ_RADIUS = 10;
    const THRESHOLD = 5.0; 
    
    for (let t = 0; t < spectrogram.length; t++) {
        for (let f = 0; f < spectrogram[t].length; f++) {
            const amplitude = spectrogram[t][f];
            if (amplitude < THRESHOLD) continue;
            
            let isMax = true;
            for (let dt = -TIME_RADIUS; dt <= TIME_RADIUS; dt++) {
                for (let df = -FREQ_RADIUS; df <= FREQ_RADIUS; df++) {
                    if (dt === 0 && df === 0) continue;
                    
                    const checkT = t + dt;
                    const checkF = f + df;
                    
                    if (checkT >= 0 && checkT < spectrogram.length && checkF >= 0 && checkF < spectrogram[t].length) {
                        if (spectrogram[checkT][checkF] >= amplitude) {
                            isMax = false;
                            break;
                        }
                    }
                }
                if (!isMax) break;
            }
            
            if (isMax) peaks.push({ time: t, freq: f });
        }
    }
    return peaks.sort((a, b) => a.time - b.time);
}

export function generateHashes(peaks: Peak[]): HashInfo[] {
    const hashes: HashInfo[] = [];
    const FAN_VALUE = 15;
    const TARGET_ZONE_START = 3;
    
    for (let i = 0; i < peaks.length; i++) {
        const anchor = peaks[i];
        
        for (let j = TARGET_ZONE_START; j < TARGET_ZONE_START + FAN_VALUE; j++) {
            if (i + j < peaks.length) {
                const target = peaks[i + j];
                const deltaT = target.time - anchor.time;
                
                const hashStr = `${anchor.freq}|${target.freq}|${deltaT}`;
                hashes.push({
                    hash: hashStr,
                    timeOffset: anchor.time
                });
            }
        }
    }
    return hashes;
}

export function fingerprintAudio(pcmData: Float32Array): HashInfo[] {
    const spectrogram = generateSpectrogram(pcmData);
    const peaks = extractPeaks(spectrogram);
    return generateHashes(peaks);
}