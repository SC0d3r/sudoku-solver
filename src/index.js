const WIDTH = HEIGHT = 600;
const GLOBAL = { table: {} }
var loadedValues;
function preload() {
  loadJSON('./table.hard.json', data => {
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
    GLOBAL.emptyCells = emptCells;
  } else
    console.error('initialize table')

}

function setup() {
  createCanvas(WIDTH, HEIGHT);
  setup_world();
}

function draw() {
  background(255);
  let { table, emptyCells } = GLOBAL;
  const hasNoConflicts = allConflicts(emptyCells, table) === 0;
  if (hasNoConflicts && emptyCellsHaveValue(emptyCells)) {
  } else
    [table, emptyCells] = guess(GLOBAL.table, GLOBAL.emptyCells)
  GLOBAL.table = table;
  GLOBAL.emptyCells = emptyCells;
  drawTable(table);
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