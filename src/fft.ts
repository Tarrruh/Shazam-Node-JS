export class FFT {
    private size: number;
    private cosTable: Float32Array;
    private sinTable: Float32Array;

    constructor(size: number) {
        if ((size & (size - 1)) !== 0) {
            throw new Error("FFT size must be a power of 2 (e.g., 512, 1024, 2048).");
        }
        this.size = size;
        this.cosTable = new Float32Array(size / 2);
        this.sinTable = new Float32Array(size / 2);

        for (let i = 0; i < size / 2; i++) {
            this.cosTable[i] = Math.cos((-2 * Math.PI * i) / size);
            this.sinTable[i] = Math.sin((-2 * Math.PI * i) / size);
        }
    }

    public transform(realInput: Float32Array): number[] {
        const n = this.size;
        const real = new Float32Array(realInput);
        const imag = new Float32Array(n);

        let j = 0;
        for (let i = 0; i < n - 1; i++) {
            if (i < j) {
                const tempR = real[i];
                real[i] = real[j];
                real[j] = tempR;

                const tempI = imag[i];
                imag[i] = imag[j];
                imag[j] = tempI;
            }
            let k = n >> 1;
            while (k <= j) {
                j -= k;
                k >>= 1;
            }
            j += k;
        }

        for (let len = 2; len <= n; len <<= 1) {
            const halfLen = len >> 1;
            const step = n / len;

            for (let i = 0; i < n; i += len) {
                for (let k = 0; k < halfLen; k++) {
                    const tableIdx = k * step;
                    const cos = this.cosTable[tableIdx];
                    const sin = this.sinTable[tableIdx];

                    const uR = real[i + k];
                    const uI = imag[i + k];

                    const vR = real[i + k + halfLen] * cos - imag[i + k + halfLen] * sin;
                    const vI = real[i + k + halfLen] * sin + imag[i + k + halfLen] * cos;

                    real[i + k] = uR + vR;
                    imag[i + k] = uI + vI;

                    real[i + k + halfLen] = uR - vR;
                    imag[i + k + halfLen] = uI - vI;
                }
            }
        }

        const magnitudes: number[] = new Array(n / 2);
        for (let i = 0; i < n / 2; i++) {
            magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }
        return magnitudes;
    }
}