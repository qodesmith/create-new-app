const thinTable = { h: '─', v: '│', tl: '┌', t: '┬', tr: '┐', l: '├', m: '┼', r: '┤', bl: '└', b: '┴', br: '┘' }
const thickTable = { h: '━', v: '┃', tl: '┏', t: '┳', tr: '┓', l: '┣', m: '╋', r: '┫', bl: '┗', b: '┻', br: '┛' }
const curveCorners = { tl: '╭', tr: '╮', bl: '╰', br: '╯' }

// For each column, find the widest length item.
function getColumnWidths(rows) {
  const columnWidths = []

  // Iterate through each of the rows.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Iterate through each item for the current row.
    for (let j = 0; j < row.length; j++) {
      const existingColWidth = columnWidths[j] || 0
      const currentColWidth = row[j].length

      if (currentColWidth > existingColWidth) columnWidths[j] = currentColWidth
    }
  }

  return columnWidths
}

function createTableRow({ row, columnWidths, centered, colors, padding, tableType, makeTop }) {
  const cells = row.map(r => Array.isArray(r) ? r : r.split('\n'))
  const cellHeight = Math.max(...cells.map(line => line.length))
  const { l, m, r, h, v } = tableType
  const results = []

  // Cells may be multi-line.
  // Iterate through each line for this single row of cells.
  for (let i = 0; i < cellHeight; i++) {
    const line = cells.map((cell, j) => {
      const colorizer = colors[j] || (x => x)
      const colWidth = columnWidths[j]
      const currentLine = cell[i] || ''
      const lineLength = currentLine.length
      const lengthDiff = colWidth - lineLength
      const leftPad = ' '.repeat(centered ? Math.floor((lengthDiff / 2) + padding) : padding)
      const rightPad = ' '.repeat(centered ? Math.ceil((lengthDiff / 2) + padding) : padding + lengthDiff)

      return  leftPad + colorizer(currentLine) + rightPad
    })

    results.push(v + line.join(v) + v)
  }

  // Conditionally add the top border of the row.
  if (makeTop) {
    const top = l + columnWidths.map(w => h.repeat((padding * 2) + w)).join(m) + r
    results.unshift(top)
  }

  return results
}

// Because `.flat()` isn't widely supported yet :/
function flatten(arr) {
  return arr
    .reduce((acc, item) => (
      Array.isArray(item)
        ? [...acc, ...flatten(item)]
        : [...acc, item]
    ), [])
}

function makeTable(rows, options = {}) {
  const columnWidths = getColumnWidths(rows)
  const { rounded, thick, centered, colors = [], padding = 1 } = options
  const tableType = rounded ? { ...thinTable, ...curveCorners } : thick ? thickTable : thinTable
  const { h, tl, t, tr, bl, b, br } = tableType
  const createTableTop = () => tl + columnWidths.map(w => h.repeat(w + (padding * 2))).join(t) + tr
  const createTableBottom = () => bl + columnWidths.map(w => h.repeat(w + (padding * 2))).join(b) + br

  return [
    createTableTop(),
    ...flatten(rows.map((row, i) => createTableRow({
      row,
      columnWidths,
      centered,
      colors,
      padding,
      tableType,
      makeTop: !!i
    }))),
    createTableBottom()
  ].join('\n')
}

module.exports = makeTable
