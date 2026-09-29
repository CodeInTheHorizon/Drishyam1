const { Jimp } = require("jimp");
const CrimeRepository = require("../datathon-chatbot/functions/chat/datastore.js");

// Build uniform LBP mapping table (maps 256 byte patterns to 59 uniform pattern bins)
function buildUniformLbpTable() {
    const table = new Uint8Array(256);
    let uniformCount = 0;
    for (let i = 0; i < 256; i++) {
        let transitions = 0;
        for (let b = 0; b < 8; b++) {
            const currentBit = (i >> b) & 1;
            const nextBit = (i >> ((b + 1) % 8)) & 1;
            if (currentBit !== nextBit) transitions++;
        }
        if (transitions <= 2) {
            table[i] = uniformCount++;
        } else {
            table[i] = 58;
        }
    }
    return table;
}

const UNIFORM_LBP_TABLE = buildUniformLbpTable();

class OptimizedFaceEngine {
    constructor() {
        this.cache = new Map();
    }

    async extractDescriptor(imageSource) {
        if (!imageSource) return null;
        try {
            let img = null;
            if (typeof imageSource === "string" && imageSource.startsWith("data:")) {
                const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");
                img = await Jimp.read(buffer);
            } else if (Buffer.isBuffer(imageSource)) {
                img = await Jimp.read(imageSource);
            } else {
                img = await Jimp.read(imageSource);
            }

            const origW = img.width;
            const origH = img.height;

            // Crop central 78% height and width biased towards upper face
            if (origW > 32 && origH > 32) {
                const cropW = Math.max(16, Math.floor(origW * 0.78));
                const cropH = Math.max(16, Math.floor(origH * 0.78));
                const cropX = Math.floor((origW - cropW) / 2);
                const cropY = Math.floor((origH - cropH) * 0.25);
                img.crop({ x: cropX, y: cropY, w: cropW, h: cropH });
            }

            img.resize({ w: 96, h: 96 }).greyscale();
            const data = img.bitmap.data;
            const W = 96, H = 96;
            const N = W * H;

            const pixels = new Float32Array(N);
            let sum = 0;
            for (let i = 0; i < N; i++) {
                const val = data[i * 4];
                pixels[i] = val;
                sum += val;
            }

            const mean = sum / N;
            let varSum = 0;
            for (let i = 0; i < N; i++) {
                const d = pixels[i] - mean;
                varSum += d * d;
            }
            const stdDev = Math.sqrt(varSum / N) || 1;

            // 1. Normalized Pixels
            const normalized = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                normalized[i] = (pixels[i] - mean) / stdDev;
            }

            // 2. Uniform LBP Histograms across 4x4 spatial grid (16 blocks)
            const GRID_X = 4;
            const GRID_Y = 4;
            const BLOCK_W = Math.floor(W / GRID_X);
            const BLOCK_H = Math.floor(H / GRID_Y);
            const NUM_BINS = 59;
            const lbpHistograms = new Float32Array(GRID_X * GRID_Y * NUM_BINS);

            for (let gy = 0; gy < GRID_Y; gy++) {
                for (let gx = 0; gx < GRID_X; gx++) {
                    const histOffset = (gy * GRID_X + gx) * NUM_BINS;
                    let blockPixelCount = 0;

                    const startY = Math.max(1, gy * BLOCK_H);
                    const endY = Math.min(H - 1, (gy + 1) * BLOCK_H);
                    const startX = Math.max(1, gx * BLOCK_W);
                    const endX = Math.min(W - 1, (gx + 1) * BLOCK_W);

                    for (let y = startY; y < endY; y++) {
                        for (let x = startX; x < endX; x++) {
                            const center = pixels[y * W + x];
                            let code = 0;
                            if (pixels[(y - 1) * W + (x - 1)] >= center) code |= 1;
                            if (pixels[(y - 1) * W + x] >= center) code |= 2;
                            if (pixels[(y - 1) * W + (x + 1)] >= center) code |= 4;
                            if (pixels[y * W + (x + 1)] >= center) code |= 8;
                            if (pixels[(y + 1) * W + (x + 1)] >= center) code |= 16;
                            if (pixels[(y + 1) * W + x] >= center) code |= 32;
                            if (pixels[(y + 1) * W + (x - 1)] >= center) code |= 64;
                            if (pixels[y * W + (x - 1)] >= center) code |= 128;

                            const bin = UNIFORM_LBP_TABLE[code];
                            lbpHistograms[histOffset + bin]++;
                            blockPixelCount++;
                        }
                    }

                    // L2 normalize
                    if (blockPixelCount > 0) {
                        let normSum = 0;
                        for (let b = 0; b < NUM_BINS; b++) {
                            const val = lbpHistograms[histOffset + b];
                            normSum += val * val;
                        }
                        const blockNorm = Math.sqrt(normSum) || 1;
                        for (let b = 0; b < NUM_BINS; b++) {
                            lbpHistograms[histOffset + b] /= blockNorm;
                        }
                    }
                }
            }

            // 3. Sobel Edge Gradient Magnitude
            const gradients = new Float32Array(N);
            for (let y = 1; y < H - 1; y++) {
                for (let x = 1; x < W - 1; x++) {
                    const gx = 
                        -pixels[(y - 1) * W + (x - 1)] + pixels[(y - 1) * W + (x + 1)]
                        - 2 * pixels[y * W + (x - 1)] + 2 * pixels[y * W + (x + 1)]
                        - pixels[(y + 1) * W + (x - 1)] + pixels[(y + 1) * W + (x + 1)];
                    const gy = 
                        -pixels[(y - 1) * W + (x - 1)] - 2 * pixels[(y - 1) * W + x] - pixels[(y - 1) * W + (x + 1)]
                        + pixels[(y + 1) * W + (x - 1)] + 2 * pixels[(y + 1) * W + x] + pixels[(y + 1) * W + (x + 1)];
                    gradients[y * W + x] = Math.sqrt(gx * gx + gy * gy);
                }
            }

            return {
                width: W,
                height: H,
                normalized,
                lbpHistograms,
                gradients
            };
        } catch (e) {
            console.warn("[OptimizedFaceEngine] Extract error:", e.message);
            return null;
        }
    }

    flipDescriptor(desc) {
        if (!desc) return null;
        const W = desc.width, H = desc.height;
        const N = W * H;
        const flippedNorm = new Float32Array(N);
        const flippedGrad = new Float32Array(N);

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const srcIdx = y * W + x;
                const dstIdx = y * W + (W - 1 - x);
                flippedNorm[dstIdx] = desc.normalized[srcIdx];
                flippedGrad[dstIdx] = desc.gradients[srcIdx];
            }
        }

        const GRID_X = 4, GRID_Y = 4, NUM_BINS = 59;
        const flippedLbp = new Float32Array(GRID_X * GRID_Y * NUM_BINS);
        for (let gy = 0; gy < GRID_Y; gy++) {
            for (let gx = 0; gx < GRID_X; gx++) {
                const srcOffset = (gy * GRID_X + gx) * NUM_BINS;
                const dstOffset = (gy * GRID_X + (GRID_X - 1 - gx)) * NUM_BINS;
                for (let b = 0; b < NUM_BINS; b++) {
                    flippedLbp[dstOffset + b] = desc.lbpHistograms[srcOffset + b];
                }
            }
        }

        return {
            width: W,
            height: H,
            normalized: flippedNorm,
            lbpHistograms: flippedLbp,
            gradients: flippedGrad
        };
    }

    compareLbp(lbp1, lbp2) {
        const totalBins = lbp1.length;
        let chiSquare = 0;
        for (let i = 0; i < totalBins; i++) {
            const h1 = lbp1[i];
            const h2 = lbp2[i];
            const sum = h1 + h2;
            if (sum > 1e-6) {
                const diff = h1 - h2;
                chiSquare += (diff * diff) / sum;
            }
        }
        const maxDist = 32;
        return Math.max(0, Math.min(1, 1 - (chiSquare / maxDist)));
    }

    computeMultiOffsetPearson(d1, d2) {
        const W = 96, H = 96;
        const offsets = [
            [0, 0], [0, -3], [0, 3], [-3, 0], [3, 0],
            [-3, -3], [3, -3], [-3, 3], [3, 3]
        ];

        let bestScore = -1;

        for (const [dx, dy] of offsets) {
            let numTotal = 0, den1Total = 0, den2Total = 0;

            for (let y = 18; y < 88; y++) {
                const ty = y + dy;
                if (ty < 0 || ty >= H) continue;

                for (let x = 15; x < 81; x++) {
                    const tx = x + dx;
                    if (tx < 0 || tx >= W) continue;

                    const p1 = d1.normalized[y * W + x];
                    const p2 = d2.normalized[ty * W + tx];

                    let weight = 1.0;
                    if (y >= 18 && y <= 48) weight = 1.5;
                    else if (y >= 49 && y <= 68) weight = 1.2;
                    else if (y >= 69 && y <= 88) weight = 1.0;

                    numTotal += p1 * p2 * weight;
                    den1Total += p1 * p1 * weight;
                    den2Total += p2 * p2 * weight;
                }
            }

            const den = Math.sqrt(den1Total * den2Total);
            const r = den > 0 ? (numTotal / den) : 0;
            if (r > bestScore) bestScore = r;
        }

        return Math.max(0, Math.min(1, (bestScore + 1) / 2));
    }

    compareGradients(d1, d2) {
        const W = 96, H = 96;
        let dot = 0, norm1 = 0, norm2 = 0;
        for (let y = 18; y < 88; y++) {
            for (let x = 15; x < 81; x++) {
                const idx = y * W + x;
                const g1 = d1.gradients[idx];
                const g2 = d2.gradients[idx];
                dot += g1 * g2;
                norm1 += g1 * g1;
                norm2 += g2 * g2;
            }
        }
        const den = Math.sqrt(norm1 * norm2);
        return den > 0 ? Math.max(0, Math.min(1, dot / den)) : 0;
    }

    compareSingle(probeDesc, targetDesc) {
        const sCorr = this.computeMultiOffsetPearson(probeDesc, targetDesc);
        const sLbp = this.compareLbp(probeDesc.lbpHistograms, targetDesc.lbpHistograms);
        const sGrad = this.compareGradients(probeDesc, targetDesc);

        const fused = (sCorr * 0.35) + (sLbp * 0.35) + (sGrad * 0.30);
        return {
            score: fused * 100,
            sCorr: Math.round(sCorr * 100),
            sLbp: Math.round(sLbp * 100),
            sGrad: Math.round(sGrad * 100)
        };
    }

    compareDescriptors(probeDesc, targetDesc) {
        if (!probeDesc || !targetDesc) return { similarity: 0, sCorr: 0, sLbp: 0, sGrad: 0 };
        const normalMatch = this.compareSingle(probeDesc, targetDesc);
        const probeFlipped = this.flipDescriptor(probeDesc);
        const flippedMatch = this.compareSingle(probeFlipped, targetDesc);

        const best = normalMatch.score >= flippedMatch.score ? normalMatch : flippedMatch;
        return {
            similarity: Math.round(best.score * 10) / 10,
            sCorr: best.sCorr,
            sLbp: best.sLbp,
            sGrad: best.sGrad,
            isMirrored: flippedMatch.score > normalMatch.score
        };
    }
}

async function testWithDatabaseOfficers() {
    console.log("Fetching live officers from Catalyst Data Store...");
    const repo = new CrimeRepository();
    const officers = await repo.getAllOfficerRecords();
    console.log(`Loaded ${officers.length} officers.`);

    const engine = new OptimizedFaceEngine();

    console.log("\nPre-extracting descriptors for all officers...");
    const cachedOfficers = [];
    for (const officer of officers) {
        const t0 = Date.now();
        const desc = await engine.extractDescriptor(officer.photoUrl);
        console.log(`[Cache] Officer ${officer.name} (${officer.badgeNumber}): ${Date.now() - t0}ms, Desc: ${!!desc}`);
        if (desc) cachedOfficers.push({ officer, desc });
    }

    console.log("\nRunning pairwise 1:1 cross-matching matrix in RAM...");
    for (let i = 0; i < cachedOfficers.length; i++) {
        for (let j = 0; j < cachedOfficers.length; j++) {
            const o1 = cachedOfficers[i];
            const o2 = cachedOfficers[j];
            const t0 = process.hrtime.bigint();
            const result = engine.compareDescriptors(o1.desc, o2.desc);
            const nanos = Number(process.hrtime.bigint() - t0);
            const micros = (nanos / 1000).toFixed(1);
            console.log(
                `Match [${o1.officer.name.padEnd(16)}] vs [${o2.officer.name.padEnd(16)}]: ` +
                `Sim = ${String(result.similarity).padStart(5)}% (Corr:${result.sCorr}%, LBP:${result.sLbp}%, Grad:${result.sGrad}%) in ${micros} µs`
            );
        }
    }
}

module.exports = { OptimizedFaceEngine };

if (require.main === module) {
    testWithDatabaseOfficers();
}
