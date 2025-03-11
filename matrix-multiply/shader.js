export function getShaderNaive(WORKGROUSIZE_X, WORKGROUSIZE_Y) {
  return `
struct Matrix {
  size : vec2<f32>,
  numbers: array<f32>,
}

@group(0) @binding(0) var<storage, read> firstMatrix : Matrix;
@group(0) @binding(1) var<storage, read> secondMatrix : Matrix;
@group(0) @binding(2) var<storage, read_write> resultMatrix : Matrix;

@compute @workgroup_size(${WORKGROUSIZE_X}, ${WORKGROUSIZE_Y})
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  // Guard against out-of-bounds work group sizes
  if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {
    return;
  }
  resultMatrix.size = vec2(firstMatrix.size.x, secondMatrix.size.y);

  let resultCell = vec2(global_id.x, global_id.y);
  let globalRow = global_id.x;
  let globalCol = global_id.y;
  var acc = 0.0;
  var M: u32 = u32(firstMatrix.size.x);
  var K: u32 = u32(firstMatrix.size.y);
  var N: u32 = u32(secondMatrix.size.y);

  for (var k = 0u; k < K; k = k + 1u) {
    let a = k*M + globalRow;
    let b = globalCol *K  + k;
    acc = acc + firstMatrix.numbers[a] * secondMatrix.numbers[b];
  }

  let index = globalCol *M + globalRow;
  resultMatrix.numbers[index] = acc;
}
`;
}

export function getShaderTiledK2(WORKGROUSIZE_X, WORKGROUSIZE_Y, TILE_SIZE) {
  if (WORKGROUSIZE_Y != TILE_SIZE) {
    throw new Error('WORKGROUSIZE_Y!= TILE_SIZE!');
  }
  return `
        struct Matrix {
          size : vec2<f32>,
          numbers: array<f32>,
        }
  
        @group(0) @binding(0) var<storage, read> firstMatrix : Matrix;
        @group(0) @binding(1) var<storage, read> secondMatrix : Matrix;
        @group(0) @binding(2) var<storage, read_write> resultMatrix : Matrix;
  
        // Local memory to fit a tile of TS*TS elements of A and B
        var<workgroup> Asub : array<array<f32, ${TILE_SIZE}>,${TILE_SIZE}>;
        var<workgroup> Bsub : array<array<f32, ${TILE_SIZE}>,${TILE_SIZE}>;

        @compute @workgroup_size(${WORKGROUSIZE_X}, ${WORKGROUSIZE_Y})
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>,
          @builtin(local_invocation_id) local_id : vec3<u32>,
          @builtin(workgroup_id) workgroup_id : vec3<u32>
        ) { 
          resultMatrix.size = vec2(firstMatrix.size.x, secondMatrix.size.y);
  
          // let resultCell = vec2(global_id.x, global_id.y);
          // let globalRow = global_id.x;
          // let globalCol = global_id.y;
          
          var M: u32 = u32(firstMatrix.size.x);
          var K: u32 = u32(firstMatrix.size.y);
          var N: u32 = u32(secondMatrix.size.y);

          // Thread identifiers
          let row = local_id.x; // Local row ID (max: TS)
          let col = local_id.y; // Local col ID (max: TS)
          let TS = u32(${TILE_SIZE});
          // Equals below.
          // let globalRow = TS*workgroup_id.x + row; // Row ID of C (0..M)
          // let globalCol = TS*workgroup_id.y + col; // Col ID of C (0..N)

          let globalRow = global_id.x;
          let globalCol = global_id.y;

          // Initialise the accumulation register
          var acc = 0.0f;
          
          // Loop over all tiles
          let numTiles = u32(ceil(f32(K)/f32(TS)));
          for (var t = 0u; t < numTiles; t++) {
              // Load one tile of A and B into local memory
              let tiledRow = TS*t + row;
              let tiledCol = TS*t + col;
              Asub[col][row] = firstMatrix.numbers[tiledCol*M + globalRow];
              Bsub[col][row] = secondMatrix.numbers[globalCol*K + tiledRow];
      
              // Synchronise to make sure the tile is loaded
              workgroupBarrier();
      
              // Perform the computation for a single tile
              for (var k=0u; k<TS; k++) {
                  acc += Asub[k][row] * Bsub[col][k];
              }
              // Synchronise before loading the next tile
              workgroupBarrier();
          }
          if (global_id.x >= u32(firstMatrix.size.x) || global_id.y >= u32(secondMatrix.size.y)) {
            return;
          }
          
          // Store the final result in C
          resultMatrix.numbers[globalCol*M + globalRow] = acc;
        }
`
}


export function getShaderSubgroupMatrix(M, N, K) {
  return `
enable chromium_experimental_subgroup_matrix;
enable f16;

alias ComponentType = f16;
alias ResultComponentType = f32;

const M = ${M};//8;
const N = ${N};//16;
const K = ${K};//16;
const SubgroupMaxSize = 32;

@group(0) @binding(0) var<storage, read>       inputs : array<ComponentType, K*M + N*K>;
@group(0) @binding(1) var<storage, read_write> output : array<ResultComponentType, M*N>;

@compute @workgroup_size(SubgroupMaxSize)
fn main() {
    let lhs = subgroupMatrixLoad<subgroup_matrix_left<ComponentType, K, M>>(&inputs,  0, true, M);
    let rhs = subgroupMatrixLoad<subgroup_matrix_right<ComponentType, N, K>>(&inputs, K*M, true, K);
let zero = subgroup_matrix_result<ResultComponentType, N, M>();
var result = subgroupMatrixMultiplyAccumulate(lhs, rhs, zero);
result = subgroupMatrixMultiplyAccumulate(lhs, rhs, result);

    subgroupMatrixStore(&output, 0, result, true, M);
}
`
}
