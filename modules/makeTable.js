const thinTable = { h: '─', v: '│', tl: '┌', t: '┬', tr: '┐', l: '├', m: '┼', r: '┤', bl: '└', b: '┴', br: '┘' }
const thickTable = { h: '━', v: '┃', tl: '┏', t: '┳', tr: '┓', l: '┣', m: '╋', r: '┫', bl: '┗', b: '┻', br: '┛' }
const curveCorners = { tl: '╭', tr: '╮', bl: '╰', br: '╯' }

function getColumnWidths(rows) {
  // For each column, find the widest length item.
  const colWidths = []
  for (let col = 0; col < rows[0].length; col++) {
    for (let row = 0; row < rows.length; row++) {
      const currentWidth = colWidths[col] || 0
      const item = rows[row][col]
      if (currentWidth < item.length) colWidths[col] = item.length
    }
  }

  return colWidths
}

  function makeRowContents(row, columnWidths, options) {
  const { tableType, centered, colors = [] } = options
  const { v } = tableType

  return v + columnWidths.map((w, j) => {
    const colorizer = colors[j] || (x => x)
    const item = row[j]
    const coloredItem = colorizer(item)
    const leftOver = w - item.length + 2
    const leftPad = Math.floor(leftOver / 2)
    const rightPad = Math.ceil(leftOver / 2)

    if (centered) {
      return ' '.repeat(leftPad) + coloredItem + ' '.repeat(rightPad)
    } else {
      return ' ' + coloredItem + ' '.repeat(leftPad + rightPad - 1)
    }
  }).join(v) + v
}

function makeTable(rows, options = {}) {
  const columnWidths = getColumnWidths(rows)
  const { rounded, thick } = options
  const tableType = rounded ? { ...thinTable, ...curveCorners } : thick ? thickTable : thinTable
  const { h, tl, t, tr, l, m, r, bl, b, br } = tableType

  return rows
    .map((row, i) => {
      const contents = makeRowContents(row, columnWidths, { tableType, ...options })
      const top = l + columnWidths.map(w => h.repeat(w + 2)).join(m) + r

      // 1st row.
      if (!i) {
        const top2 = tl + columnWidths.map(w => h.repeat(w + 2)).join(t) + tr
        return ['', top2, contents].join('\n')

      // Last row.
      } else if (i === rows.length - 1) {
        const bottom = bl + columnWidths.map(w => h.repeat(w + 2)).join(b) + br
        return [top, contents, bottom].join('\n')
      } else {
        return [top, contents].join('\n')
      }
    })
    .join('\n')
}

var rows = [
  ['MONGO_URI', 'mongodb://localhost:<mongoPort>/<appName>'],
  ['MONGO_URI_PROD', 'mongodb://localhost:<mongoPortProd>/<appName>'],
  ['MONGO_USER', '<mongoUser>'],
  ['MONGO_USER_PASSWORD', '<mongoUserPassword>'],
  ['MONGO_SESSION_COLLECTION', '<appName>Sessions']
]

module.exports = makeTable
