function conflictsInRow(row, col, table) {
  const value = R.path(['values', row, col], table);
  return R.compose(
    R.dec,
    R.prop(value),
    R.countBy(R.identity),
    t => entireRow(row, t)
  )(table)
}

function zeroConfVals(row, col, table) {
  const isZero = R.equals(0);
  return R.compose(
    R.map(R.head),
    R.filter(R.compose(isZero, R.last)),
    valsWithLeastConflict
  )(row, col, table);
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
  const removeOwnRow = R.remove(row % 3, 1);

  const removeOwnCol = R.map(R.remove(col % 3, 1));
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


// returns [[row , col , value]]
function emptyCells({ values }) {
  const isValZero = R.compose(R.equals(0), R.last);
  const chainIndexed = R.addIndex(R.chain);
  const mapIndexed = R.addIndex(R.map);
  const mapToRowColVal = (arr, i) => mapIndexed((y, j) => [i, j, y], arr);
  return R.compose(
    R.filter(isValZero),
    chainIndexed(mapToRowColVal)
  )(values)

}

function emptyCellSetter(row, col, val) {
  const atRowCol = R.lensPath([row, col])
  if (R.is(Array, val))
    return R.set(atRowCol, R.ifElse(R.compose(R.isNil, R.head), R.always(0), R.head)(val))
  else
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

function mergeEmptyCells(cells, dest) {
  const rowCol = R.init;
  const sortByRowCol = R.sortWith([
    R.ascend(R.head),
    R.ascend(R.nth(1))
  ]);
  return R.compose(
    sortByRowCol,
    R.concat(cells),
    R.differenceWith(R.useWith(R.equals, [rowCol, rowCol]))
  )(dest, cells);
}
function changeAllPrevOneItemArraysToZero(emptyCells) {
  const index = R.findLastIndex(R.compose(R.gt(R.__, 1), R.length, R.last));
  const range = index => R.range(index + 1, emptyCells.length)
  const lens = i => R.lensPath([i, 2])
  const shiftValues = R.adjust(2, R.tail);
  const zeroValueEmptyCells = index => R.reduce((accum, i) => R.set(lens(i), 0, accum), emptyCells, range(index));
  const updateThisEmptyCell = index => R.compose(R.of, shiftValues, R.applyTo(emptyCells), R.nth)(index);

  const found = R.gte(R.__, 0);

  return R.compose(
    R.when(found, R.converge(mergeEmptyCells,
      [updateThisEmptyCell, zeroValueEmptyCells])),
    index,
  )(emptyCells);
}

function emptyCellsHaveValue(emptyCells) {
  return R.none(R.compose(R.equals(0), R.last))(emptyCells)
}

function backtrack(cell, emptyCells) {
  const emptyCellIndex = R.findIndex(R.compose(R.equals(cell), R.init))(emptyCells);

  const isZero = R.equals(0);
  const prevEmptyCell = index => emptyCells[index - 1];

  const hasOneValueLeft = R.unless(R.isNil, R.compose(R.equals(1), R.length, R.last));

  const shiftValues = R.adjust(2, R.tail);
  const updatePrevEmptyCell = R.compose(shiftValues, prevEmptyCell);

  return R.cond([
    [isZero, () => { throw new Error('WRONG TABLE') }],
    [R.compose(hasOneValueLeft, prevEmptyCell), R.always(changeAllPrevOneItemArraysToZero(emptyCells))],
    [R.T, R.compose(R.of, updatePrevEmptyCell)]
  ])(emptyCellIndex)
}

function guess(table, emptyCells) {
  const zeroValue = R.compose(R.equals(0), R.last);
  const zeroValueEmptyCellIndex = R.findIndex(zeroValue, emptyCells);
  const [row, col, val] = emptyCells[zeroValueEmptyCellIndex];
  const vals = zeroConfVals(row, col, table);
  const updateEmptyCell = values => [[row, col, values]];
  const newEmptyCells =
    R.ifElse(R.isEmpty, R.partial(backtrack, [[row, col], emptyCells]), updateEmptyCell)(vals);
  const updatedEmptyCells = mergeEmptyCells(newEmptyCells, emptyCells);
  const updatedTable = updateEmptyCellsValues(updatedEmptyCells, table);

  return [updatedTable, updatedEmptyCells];
}

function isSolved(table, emptyCells) {
  // console.log(table, emptyCells)
  const hasNoConflicts = allConflicts(emptyCells, table) === 0;
  return hasNoConflicts && emptyCellsHaveValue(emptyCells);
}

function solveBruteForce(table, emptyCells) {
  if (isSolved(table, emptyCells)) {
    return [table, emptyCells];
  }
  const [newT, newEmptyCells] = guess(table, emptyCells);
  return solveBruteForce(newT, newEmptyCells);
}