import { getShaderNaive, getShaderTiledK2} from './shader.js';
import { arraysEqual} from './util.js';

const TEST_SIZE = 16;
const WORKGROUSIZE_X = TEST_SIZE;
const WORKGROUSIZE_Y = TEST_SIZE;
const TILE_SIZE_X = 4;
const TILE_SIZE_Y = 4;
const TILE_SIZE = TEST_SIZE;

function runCPUColumnMajor(firstMatrix, secondMatrix) {
    var M = firstMatrix[0];
    var K = firstMatrix[1];
    var N = secondMatrix[1];
    var dataOffset = 2;
    const result = new Float32Array(dataOffset + M*N);
    result[0] = M;
    result[1] = N;
    for (var m=0; m<M; m++) { // 
        for (var n=0; n<N; n++) {
            var acc = 0.0;
            for (var k=0; k<K; k++) {
                // console.log(firstMatrix[k*M + m + dataOffset]);
                acc += firstMatrix[k*M + m + dataOffset] * secondMatrix[n*K + k + dataOffset];
                // m=0, n= 0, acc += firstMatrix[k*M] * secondMatrix[k];
            }
            // when m = 0, offset = 0, M, 2M, row 0
            result[n*M + m + dataOffset] = acc;
        }
    }
    return result;
}

function runBasic() {
    let array = [
        [1, 2, 3],
        [4, 5, 6]
    ];
    
    // Accessing elements in row-major order
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
            // console.log(array[i][j]);
        }
    }

    // Outputs row 0.
    var i=0;
    for (let j = 0; j < array[i].length; j++) {
        //console.log(array[i][j]);
    }
    // Outputs column 0.
    var j=0;
    for (let i = 0; i < array.length; i++) {
        //console.log(array[i][j]);
    }
}

async function runAll(firstMatrix, secondMatrix) {
    var shaderStrNaive = getShaderNaive(WORKGROUSIZE_X, WORKGROUSIZE_Y);
    var shaderStrTiledK2 = getShaderTiledK2(WORKGROUSIZE_X, WORKGROUSIZE_Y, TILE_SIZE);
    var dataRef, data1, data2, data3;
    //dataRef = runCPUColumnMajor(firstMatrix, secondMatrix);
    //console.log("dataRef                : " + dataRef);
    data1 = await runAndReadback(firstMatrix, secondMatrix, shaderStrNaive);
    console.log("shaderStrNaive         : " + data1);
    data2 = await runAndReadback(firstMatrix, secondMatrix, shaderStrTiledK2);
    console.log("shaderStrTiledK2       : " + data2);
    //data3 = await runAndReadback(firstMatrix, secondMatrix, shaderStrNaiveRowMajor);
    //console.log("shaderStrNaiveRowMajor : " + data3);
    console.log(arraysEqual(data1, data2));
    // console.log(arraysEqual(dataRef, data1) + ", " + arraysEqual(dataRef, data2) + ", " + arraysEqual(dataRef, data3));
}

(async () => {
    runBasic();
    var firstMatrix, secondMatrix;

    // First Matrix
    firstMatrix = new Float32Array([
        1 /* columns */,
        1 /* rows */,
        1
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        1 /* columns */,
        1 /* rows */,
        1
    ]);
    await runAll(firstMatrix, secondMatrix);

    // First Matrix
    firstMatrix = new Float32Array([
        3 /* columns */,
        2 /* rows */,
        1, 2, 3, 4, 5,6
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        2 /* columns */,
        2 /* rows */,
        1, 2, 3, 4
    ]);
    await runAll(firstMatrix, secondMatrix);

    // First Matrix
    firstMatrix = new Float32Array([
        2 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5,6
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        3 /* rows */,
        2 /* columns */,
        1, 2, 3, 4, 5,6
    ]);
    await runAll(firstMatrix, secondMatrix);

    // First Matrix
    firstMatrix = new Float32Array([
        3 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8, 9
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        3 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8, 9
    ]);
    await runAll(firstMatrix, secondMatrix);


    // First Matrix
    firstMatrix = new Float32Array([
        2 /* rows */,
        2 /* columns */,
        1, 2, 3, 4
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        2 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5,6
    ]);
    await runAll(firstMatrix, secondMatrix);


    // First Matrix
    firstMatrix = new Float32Array([
        4 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        3 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9
    ]);
    await runAll(firstMatrix, secondMatrix);


    // First Matrix
    firstMatrix = new Float32Array([
        2 /* rows */,
        4 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8
    ]);

    // Second Matrix
    secondMatrix = new Float32Array([
        4 /* rows */,
        3 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12
    ]);

    await runAll(firstMatrix, secondMatrix);

    firstMatrix = new Float32Array([
        4 /* rows */,
        4 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    secondMatrix = new Float32Array([
        4 /* rows */,
        4 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16,
    ]);

    await runAll(firstMatrix, secondMatrix);

    firstMatrix = new Float32Array([
        6 /* rows */,
        4 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16,
        17, 18, 19, 20, 21, 22, 23, 24
    ]);

    secondMatrix = new Float32Array([
        4 /* rows */,
        5 /* columns */,
        1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15, 16,
        17, 18, 19, 20
    ]);

    await runAll(firstMatrix, secondMatrix);

})();

async function runAndReadback(firstMatrix, secondMatrix, shaderStr) {
    const padLength = firstMatrix.byteLength < 16 ? 4 : 0;
    // Pipeline setup
    const device = await getDevice();
    const gpuBufferFirstMatrix = device.createBuffer({
        mappedAtCreation: true,
        size: firstMatrix.byteLength + padLength,
        usage: GPUBufferUsage.STORAGE
    });
    const arrayBufferFirstMatrix = gpuBufferFirstMatrix.getMappedRange();
    new Float32Array(arrayBufferFirstMatrix).set(firstMatrix);
    gpuBufferFirstMatrix.unmap();

    const gpuBufferSecondMatrix = device.createBuffer({
        mappedAtCreation: true,
        size: secondMatrix.byteLength + padLength,
        usage: GPUBufferUsage.STORAGE
    });
    const arrayBufferSecondMatrix = gpuBufferSecondMatrix.getMappedRange();
    new Float32Array(arrayBufferSecondMatrix).set(secondMatrix);
    gpuBufferSecondMatrix.unmap();

    // Result Matrix
    const resultMatrixBufferSize =
        Float32Array.BYTES_PER_ELEMENT * (2 + firstMatrix[0] * secondMatrix[1]);
    const resultMatrixBuffer = device.createBuffer({
        size: resultMatrixBufferSize + padLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    // Bind group layout and bind group
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "read-only-storage"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "read-only-storage"
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage"
                }
            }
        ]
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: gpuBufferFirstMatrix
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: gpuBufferSecondMatrix
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: resultMatrixBuffer
                }
            }
        ]
    });

    const shaderModule = device.createShaderModule({
        code: shaderStr
    });
    const computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
            module: shaderModule,
            entryPoint: "main"
        }
    });

    // Commands submission
    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    const workgroupCountX = Math.ceil(firstMatrix[0] / WORKGROUSIZE_X);
    const workgroupCountY = Math.ceil(secondMatrix[1] / WORKGROUSIZE_Y);
    passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
    passEncoder.end();

    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
        size: resultMatrixBufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Encode commands for copying buffer to buffer.
    commandEncoder.copyBufferToBuffer(
        resultMatrixBuffer /* source buffer */,
        0 /* source offset */,
        gpuReadBuffer /* destination buffer */,
        0 /* destination offset */,
        resultMatrixBufferSize /* size */
    );

    // Submit GPU commands.
    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);

    // Read buffer.
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    // console.log(new Float32Array(arrayBuffer));
    return new Float32Array(arrayBuffer);
}

async function getDevice() {
    if (!("gpu" in navigator)) {
        console.log(
            "WebGPU is not supported. Enable chrome://flags/#enable-unsafe-webgpu flag."
        );
        return null;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.log("Failed to get GPU adapter.");
        return null;
    }
    const device = await adapter.requestDevice();
    return device;
}


