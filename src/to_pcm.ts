import { spawn } from 'child_process';
import * as fs from 'fs';

export function toPCM(filePath: string, targetSampleRate: number = 44100): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File not found: ${filePath}`));
        }

        const ffmpeg = spawn('ffmpeg', [
            '-i', filePath,
            '-f', 's16le',
            '-ac', '1',
            '-ar', targetSampleRate.toString(),
            'pipe:1'
        ]);

        const chunks: Buffer[] = [];

        ffmpeg.stdout.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg process failed to start: ${err.message}`));
        });

        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`FFmpeg exited with error code ${code}`));
            }

            const pcmBuffer = Buffer.concat(chunks);
            const int16Samples = new Int16Array(
                pcmBuffer.buffer,
                pcmBuffer.byteOffset,
                pcmBuffer.byteLength / 2
            );

            const float32Samples = new Float32Array(int16Samples.length);
            for (let i = 0; i < int16Samples.length; i++) {
                float32Samples[i] = int16Samples[i] / 32768.0;
            }

            resolve(float32Samples);
        });
    });
}