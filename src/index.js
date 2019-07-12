const WIDTH = HEIGHT = 600;
const GLOBAL = { table: {} }
var loadedValues;
function preload() {
  loadJSON('./table.hard2.json', data => {
    loadedValues = data.table;
  });
}


function setup_world() {
  let sudokuTable = createSudokuTable(9, 600);
  if (loadedValues) {
    sudokuTable = setValues(loadedValues, sudokuTable);
    const emptCells = R.compose(
      emptyCells
    )(sudokuTable);

    GLOBAL.table = sudokuTable;
    solveBruteForce(sudokuTable, emptCells);
  } else
    console.error('initialize table')

}

function setup() {
  createCanvas(WIDTH, HEIGHT);
  setup_world();
}

function draw() {
  background(255);
  drawTable(GLOBAL.table);
}


function mouseClicked() {
  // const [clickedCellRow, clickedCellColumn] =
  //   sudokuTable.onClickCell(mouseX, mouseY);
  // const number = +prompt('Enter Number : ');
  // let cellOwnNumber = sudokuTable.getCell(clickedCellRow, clickedCellColumn);
  // cellOwnNumber = typeof cellOwnNumber === 'number' ? cellOwnNumber : cellOwnNumber.num;
  // const finalNum = typeof number === 'number' && !isNaN(number) ? number : cellOwnNumber;
  // // console.log(finalNum);
  // sudokuTable.setCell(finalNum, clickedCellRow, clickedCellColumn);

}

function beginSolve() {
  // const solver = new SudokuSolver(sudokuTable);
  // (function solve() {
  //   setTimeout(() => {
  //     solver.sweep();
  //     if (solver.isDone()) {
  //       alert('Hurray done!');
  //       return;
  //     } else solve();
  //   }, 1000);
  // }());
}


function keyPressed() {
  // console.log(keyCode);
  if (keyCode === 18) {//alt
    // sudokuTable.empty();
  }
  if (keyCode === 32) {//spacebar
    beginSolve();
  }
  if (keyCode === 17) {//ctrl
    // const jsonTable = { table: sudokuTable.getTable() };
    // saveJSON(jsonTable, `table.${Date.now()}.json`);
  }
}