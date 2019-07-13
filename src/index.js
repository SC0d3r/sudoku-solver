const WIDTH = HEIGHT = 500;
const GLOBAL = { table: {}, solve: false, emptyCells: [] }
const solveBtn = document.querySelector('#solve-btn');
const resetBtn = document.querySelector('#reset-btn');
solveBtn.addEventListener('click', onClick.bind(null, solveBtn, resetBtn));
resetBtn.addEventListener('click', onReset.bind(null, resetBtn));

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
    GLOBAL.table = sudokuTable;
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
  if (!isSolved(table, emptyCells) && GLOBAL.solve)
    [table, emptyCells] = guess(GLOBAL.table, GLOBAL.emptyCells)
  else
    onFinished(solveBtn, resetBtn);
  GLOBAL.table = table;
  GLOBAL.emptyCells = emptyCells;
  drawTable(table);
}

function isWithin(lower , upper){
  return R.both(R.gte(R.__ , lower) , R.lte(R.__ , upper));
}

function mouseClicked() {
  const [clickedRow, clickedCol] = calculateCellRowCol(mouseX, mouseY);
  const within0to8 = isWithin(0,8);
  if(!within0to8(clickedRow) || !within0to8(clickedCol)) return;

  const number = +prompt('Enter Number : ');
  if (Number.isNaN(number)) return alert('Enter a number!');
  GLOBAL.table = setCell(number, clickedRow, clickedCol, GLOBAL.table);
}

function calculateCellRowCol(mouseX, mouseY) {
  const cellWidth = cellDim(GLOBAL.table);
  const clickedCol = Math.floor((mouseX - 10) / cellWidth);
  const clickedRow = Math.floor((mouseY - 10) / cellWidth);
  return [clickedRow, clickedCol];
}

function onReset() {
  GLOBAL.table = createSudokuTable(9, 600);
}

function onClick(btn, resetBtn) {
  GLOBAL.emptyCells = emptyCells(GLOBAL.table);
  
  btn.textContent = 'Solving ...';
  btn.disabled = true;
  resetBtn.disabled = true;
  GLOBAL.solve = true;
}

function onFinished(btn, resetBtn) {
  btn.textContent = 'Solve';
  GLOBAL.solve = false;
  btn.disabled = false;
  resetBtn.disabled = false;
}