const WIDTH = HEIGHT = 600;
const GLOBAL = { table: {} }
var loadedValues;
function preload() {
  loadJSON('./table.easy.json', data => {
    loadedValues = data.table;
  });
}


function setup_world() {
  let sudokuTable = createSudokuTable(9, 600);
  if (loadedValues) {
    sudokuTable = setValues(loadedValues, sudokuTable);
    const emptCells = R.compose(
      randomizeEmptyCells,
      emptyCells
    )(sudokuTable);

    // sudokuTable = updateEmptyCellsValues(emptCells, sudokuTable);
    GLOBAL.table = sudokuTable;
    loop_({
      table: sudokuTable,
      emptyCells: emptCells
    });
  } else
    console.error('initialize table')

}

function update({ table, emptyCells }) {
  if (isSolved(emptyCells, table)) return { table, emptyCells };
  const newTable = algorithm(table, emptyCells);
  // console.log(newTable.values)
  // console.log(table.values)
  if (R.equals(newTable.values, table.values)) {
    console.log('::CHANGING RANDOM VALUES::')
    const newRandomizedEmptyCells = randomizeEmptyCells(emptyCells)
    const newT = updateEmptyCellsValues(newRandomizedEmptyCells, table);
    return update({ table: newT, emptyCells: newRandomizedEmptyCells })
  }
  const newEmptyCells = emptyCellFromTable(emptyCells, newTable);
  return { table: newTable, emptyCells: newEmptyCells }
}

function setup() {
  createCanvas(WIDTH, HEIGHT);
  setup_world();
}

// function draw() {
//   console.log('here')
//   background(255);
//   noLoop();
// }

function loop_({ table, emptyCells }) {
  loop();
  background(255);
  // console.log(table.values);
  // console.log('Before improvement conflicts are = ' + allConflicts(emptyCells, table))
  // console.log(emptyCells)
  const { table: newT, emptyCells: newEmptyCells } = update({ table, emptyCells });
  // console.log('new values')
  // console.log(newT.values);
  // console.log('After improvement conflicts are = ' + allConflicts(newEmptyCells, newT))
  // console.log(newEmptyCells)
  drawTable(table);
  noLoop();

  if (isSolved(emptyCells, table)) {
    console.log("::SOLVED::")
  } else
    setTimeout(() => loop_({ table: newT, emptyCells: newEmptyCells }), 1);
}

// function draw() {
// }


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