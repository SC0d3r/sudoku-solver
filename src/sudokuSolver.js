function conflictsInRow(row, col, table) {
  const value = R.path(['values', row, col], table);
  return R.compose(
    R.dec,
    R.prop(value),
    R.countBy(R.identity),
    t => entireRow(row, t)
  )(table)
}


function conflictsInCol(row, col, table) {
  const value = R.path(['values', row, col], table);
  return R.compose(
    R.dec,
    R.prop(value),
    R.countBy(R.identity),
    t => entireColumn(col, t)
  )(table)
}

function homeWithoutOwnRowCol(row, col, table) {
  const removeOwnRow = R.remove(row, 1);
  const removeOwnCol = R.map(R.remove(col, 1));
  return R.compose(
    removeOwnCol,
    removeOwnRow,
    home
  )(row, col, table);
}

function conflictsInHome(row, col, table) {
  const value = R.path(['values', row, col], table);
  return R.compose(
    R.defaultTo(0),
    R.prop(value),
    R.countBy(R.identity),
    R.flatten,
    homeWithoutOwnRowCol
  )(row, col, table);
}


function conflicts(row, col, table) {
  return R.compose(
    R.sum,
    R.juxt([
      conflictsInHome,
      conflictsInCol,
      conflictsInRow
    ])
  )(row, col, table);
}

function allConflicts(emptyCells, table) {
  return R.compose(R.sum,
    R.map(
      rowColVal => conflicts(rowColVal[0], rowColVal[1], table))
  )(emptyCells)
}

function randInt(from, to) {
  return from + Math.floor(Math.random() * (to - from))
}

// returns [[row , col , value]]
//TODO : make this Functional
function emptyCells({ values }) {
  const res = [];
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length; j++) {
      if (values[i][j] === 0) res.push([i, j, 0]);
    }
  }
  return res;
}

function randomizeEmptyCells(emptyCells) {
  const rand1to9 = R.partial(randInt, [1, 10]);
  const setRandomValue = (arr) => R.update(2, rand1to9())(arr);
  return R.map(setRandomValue)(emptyCells);
}

function emptyCellSetter(row, col, val) {
  const atRowCol = R.lensPath([row, col])
  return R.set(atRowCol, val)
}
function updateEmptyCellsValues(emptyCells, table) {
  const fs = R.map(R.apply(emptyCellSetter))(emptyCells)

  return setValues(R.reduce((accum, setter) => setter(accum), table.values, fs), table)
}


function conflictForEveryChoice(row, col, table) {
  const allValues = R.range(1, 10);
  const setValueInTable = val => setCell(val, row, col, table);
  const allTables = R.map(setValueInTable)(allValues)
  return R.map(R.partial(conflicts, [row, col]), allTables);
}
function valsWithLeastConflict(row, col, table) {
  const lteOwnConflicts = R.lte(R.__, conflicts(row, col, table));
  return R.compose(
    R.sort(R.ascend(R.last)),
    R.filter(R.compose(lteOwnConflicts, R.last)),
    R.zip(R.range(1, 10)),
    conflictForEveryChoice
  )(row, col, table)
}
function leastConfVal(row, col, table) {
  const value = R.path(['values', row, col], table);
  return R.compose(
    R.ifElse(R.isEmpty, R.always(value), R.compose(R.head, R.head)),
    valsWithLeastConflict)(row, col, table);
}

function improveValue(row, col, values) {
  const betterValue = leastConfVal(row, col, { values })
  return setCell(betterValue, row, col, { values }).values;
}

function emptyCellFromTable(emptyCells, table) {
  const valFromTable = (row, col) => value(row, col, table);
  const rowColPair = R.apply(R.pair);
  return R.map(R.converge((f, v) => f(v), [
    rowColVal => R.update(2, R.__, rowColVal),
    R.compose(R.apply(valFromTable), rowColPair)
  ]))(emptyCells);
}

function isSolved(emptyCells, table) {
  return R.equals(0, allConflicts(emptyCells, table));
}
function algorithm(table, randomizedEmptyCells) {
  // we should use reduce and apply each randomizedEmptyCells 
  // to get a better less conf table
    const betterValues = R.reduce((accum, rowColVal) =>
      improveValue(rowColVal[0], rowColVal[1], accum), table.values, randomizedEmptyCells);
  return setValues(betterValues, table);
} 