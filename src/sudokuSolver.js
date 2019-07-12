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

function randomizeMostConfVals(howMany, emptyCells, table) {
  const emptyCellsZippedWithConfVals = R.sort(R.descend(R.last),
    R.converge(R.zip, [R.identity,
    R.map(
      rowColVal => conflicts(rowColVal[0], rowColVal[1], table))
    ])(emptyCells));

  const randomized = R.compose(
    randomizeEmptyCells,
    R.map(R.head),
    R.take(howMany)
  )(emptyCellsZippedWithConfVals);

  const replaced = R.compose(
    R.concat(randomized),
    R.drop(howMany),
    R.map(R.head)
  )(emptyCellsZippedWithConfVals);

  return replaced;
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

function changeAllPrevOneItemArraysToZero(emptyCells) {
  const index = R.findLastIndex(R.compose(R.gt(R.__, 1), R.length, R.last), emptyCells);

  if (index === -1) {
    console.log('no match')
    return emptyCells
  }
  const range = R.range(index + 1, emptyCells.length)
  range.forEach(x => emptyCells[x][2] = 0);
  emptyCells[index][2] = R.tail(emptyCells[index][2])
  return emptyCells;
}
function emptyCellsDoesnotContainsZero(emptyCells) {
  return R.none(R.compose(R.equals(0), R.last))(emptyCells)
}
function solveBruteForce(table, emptyCells, count = 0) {
  count++;

  if (allConflicts(emptyCells, table) === 0 &&
    emptyCellsDoesnotContainsZero(emptyCells)) {
    return table;
  }
  let processed = false;
  // let result;
  emptyCells.forEach(([row, col, val], i) => {
    if (processed) return;
    if (val === 0) {
      processed = true;
      const vals = zeroConfVals(row, col, table);
      // if(row === 7 && col === 2) {
      //   console.log(table.values)
      // }
      if (R.isEmpty(vals)) {
        if (i === 0) return console.error('WRONG TABLE');
        if (emptyCells[i - 1][2].length === 1) changeAllPrevOneItemArraysToZero(emptyCells);
        else {
          emptyCells[i - 1][2] = R.tail(emptyCells[i - 1][2])
        }
      } else {
        emptyCells[i] = [row, col, vals];
      }
      table = updateEmptyCellsValues(emptyCells, table);
      GLOBAL.table = table;
      // return solveBruteForce(table, emptyCells, count);
      // process.nextTick(() => {result = solveBruteForce(table, emptyCells,table, count)})
      // return result;
    }
  });
  // console.log('wassaup')
  // console.log(table)
  // if (allConflicts(emptyCells, table) === 0) {
  //   console.log('also here')
  //   return emptyCells;
  // }

  setTimeout(() => solveBruteForce(table, emptyCells, count),20);
  // table = updateEmptyCellsValues(emptyCells, table);
  // return table
}