
function initialize(rowsCols) {
  const zero = R.always(0);
  return R.compose(
    R.map(R.times(zero)),
    R.converge(R.times, [R.always, R.identity])
  )(rowsCols);
}

function createSudokuTable(rows, width) {
  const values = initialize(rows);
  return { rows, width, values }
}

function setValues(values, table) {
  return R.assoc('values', values, table);
}



function cellDim({ width, rows }) {
  const divByRows = R.divide(R.__, rows);
  const offset = x => R.subtract(R.__, x);
  const divAndOffset = R.compose(offset(15), divByRows);
  return divAndOffset(width);
}


function setCell(value, row, col, table) {
  const valueLens = R.lensPath(['values', row, col]);
  return R.set(valueLens, value, table)
}

function value(row, col, { values }) {
  return R.path([row, col])(values);
}

function entireRow(whichRow, { values }) {
  return R.prop(whichRow, values)
}

function entireColumn(whichCol, { values }) {
  return R.pluck(whichCol, values);
}


/**
 * @returns all homes with index [
 * firstCol secondCol thirdCol
 *    0         3        6
 *    1         4        7
 *    2         5        8
 * ]
 */

function homes({ values }) {
  const splitted = R.map(R.splitEvery(3), values);
  const firstCol = R.splitEvery(3, R.pluck(0, splitted))
  const secondCol = R.splitEvery(3, R.pluck(1, splitted))
  const thirdCol = R.splitEvery(3, R.pluck(2, splitted))
  return [...firstCol, ...secondCol, ...thirdCol]
}
function calculateHomeIndex(row, col) {
  const within = R.useWith(R.both, [
    R.flip(R.gte), R.flip(R.lte)]);
    
  const fromRow = R.cond([
    [within(0, 2), R.always([0, 3, 6])],
    [within(3, 5), R.always([1, 4, 7])],
    [within(6, 8), R.always([2, 5, 8])]
  ])(row);
  const fromCol = R.cond([
    [within(0, 2), R.always(0)],
    [within(3, 5), R.always(1)],
    [within(6, 8), R.always(2)]
  ])(col);
  // console.log(fromRow , fromCol)
  // console.log(fromRow[fromCol])
  // process.exit();
  return fromRow[fromCol];
}

// home is 3x3 cells
function home(row, col, table) {
  return homes(table)[calculateHomeIndex(row, col)];
}









function drawTable({ rows, width, values }) {
  const cellWidth = cellDim({ rows, width })
  const tableWidth = rows * cellWidth;

  // line(10 , 10 , tableWidth , 10);
  stroke(0);
  strokeWeight(2);
  // strokeWidth(5);
  rect(10, 10, tableWidth, tableWidth);

  //drawing rows
  for (let i = 0; i < rows; i++) {
    const beginY = i * cellWidth + 10;
    if (i % 3 === 0 && i !== 0) {
      stroke(200, 20, 20);
      strokeWeight(4);
    } else {
      stroke(0);
      strokeWeight(2);
    }
    line(10, beginY, tableWidth + 10, beginY);
  }

  //drawing columns
  for (let i = 0; i < rows; i++) {
    const beginX = i * cellWidth + 10;
    if (i % 3 === 0 && i !== 0) {
      stroke(200, 20, 20);
      strokeWeight(4);
    } else {
      stroke(0);
      strokeWeight(2);
    }
    line(beginX, 10, beginX, tableWidth + 10);
  }

  //drawing numbers in cells 
  stroke(145, 145, 0);
  strokeWeight(2);
  textSize(35);
  for (let i = 0; i < rows; i++) {
    const beginY = i * cellWidth + 10;
    for (let j = 0; j < rows; j++) {
      const beginX = j * cellWidth + 10;
      const cellMiddleX = beginX + cellWidth / 2 - 10;
      const cellMiddleY = beginY + cellWidth / 2 + 10;
      let cellInfo = values[i][j];
      if(cellInfo === 0) cellInfo = ""
      stroke(145, 145, 0);
      text(cellInfo, cellMiddleX, cellMiddleY);
    }
  }
}