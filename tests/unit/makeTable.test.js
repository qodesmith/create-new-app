const makeTable = require('../../modules/makeTable')
const chalk = require('chalk')

const thinTable = { h: '─', v: '│', tl: '┌', t: '┬', tr: '┐', l: '├', m: '┼', r: '┤', bl: '└', b: '┴', br: '┘' }
const thickTable = { h: '━', v: '┃', tl: '┏', t: '┳', tr: '┓', l: '┣', m: '╋', r: '┫', bl: '┗', b: '┻', br: '┛' }
const curveCorners = { tl: '╭', tr: '╮', bl: '╰', br: '╯' }
const table1Rows = [['A', 'B'], ['C', 'D']]
const table2Rows = [['A', `B\nb'`, 'C'], ['D', 'E', `F\nf'\nf''`]]

const table1Results = `┌───┬───┐
│ A │ B │
├───┼───┤
│ C │ D │
└───┴───┘`
const table1PadResults = `┌───────┬───────┐
│   A   │   B   │
├───────┼───────┤
│   C   │   D   │
└───────┴───────┘`

const table2Results = `┌───┬────┬─────┐
│ A │ B  │ C   │
│   │ b' │     │
├───┼────┼─────┤
│ D │ E  │ F   │
│   │    │ f'  │
│   │    │ f'' │
└───┴────┴─────┘`
const table2PadResults = `┌───────┬────────┬─────────┐
│   A   │   B    │   C     │
│       │   b'   │         │
├───────┼────────┼─────────┤
│   D   │   E    │   F     │
│       │        │   f'    │
│       │        │   f''   │
└───────┴────────┴─────────┘`

function transformTable(originalTable, legend, newLegend) {
  return Object.keys(legend).reduce((newTable, key) => {
    const newKey = newLegend[key]
    const regex = new RegExp(legend[key], 'g')
    return newTable.replace(regex, newKey)
  }, originalTable)
}


describe('makeTable', () => {
  it('should render a table correctly', () => {
    expect(makeTable(table1Rows)).toBe(table1Results)
    expect(makeTable(table2Rows)).toBe(table2Results)
  })

  describe('options', () => {
    describe('thick', () => {
      it('should render correctly', () => {
        const results1 = transformTable(table1Results, thinTable, thickTable)
        const results2 = transformTable(table2Results, thinTable, thickTable)

        expect(makeTable(table1Rows, { thick: true })).toBe(results1)
        expect(makeTable(table2Rows, { thick: true })).toBe(results2)
      })
    })

    describe('rounded', () => {
      it('should render correctly', () => {
        const results1 = transformTable(table1Results, thinTable, {...thinTable, ...curveCorners})
        const results2 = transformTable(table2Results, thinTable, {...thinTable, ...curveCorners})

        expect(makeTable(table1Rows, { rounded: true })).toBe(results1)
        expect(makeTable(table2Rows, { rounded: true })).toBe(results2)
      })
    })

    describe('rounded + thick', () => {
      it('should prioritize `rounded` and ignore `thick`, rendering correctly', () => {
        const results1 = transformTable(table1Results, thinTable, {...thinTable, ...curveCorners})
        const results2 = transformTable(table2Results, thinTable, {...thinTable, ...curveCorners})

        expect(makeTable(table1Rows, { rounded: true, thick: true })).toBe(results1)
        expect(makeTable(table2Rows, { rounded: true, thick: true })).toBe(results2)
      })
    })

    describe('centered', () => {
      it('should center the contents of each cell', () => {
        const table2Centered = table2Results
          .replace('C  ', ' C ')
          .replace('F  ', ' F ')

        expect(makeTable(table1Rows, { centered: true })).toBe(table1Results)
        expect(makeTable(table2Rows, { centered: true })).toBe(table2Centered)
      })
    })

    describe('colors', () => {
      const c1 = [chalk.red, chalk.blue]
      const c2 = [chalk.green]
      const c3 = [undefined, chalk.cyan]
      const table1Colored1 = table1Results
        .replace('A', chalk.red('A'))
        .replace('B', chalk.blue('B'))
        .replace('C', chalk.red('C'))
        .replace('D', chalk.blue('D'))
      const table1Colored2 = table1Results
        .replace('A', chalk.green('A'))
        .replace('C', chalk.green('C'))
      const table1Colored3 = table1Results
        .replace('B', chalk.cyan('B'))
        .replace('D', chalk.cyan('D'))
      const c4 = [undefined, chalk.red, chalk.blue]
      const table2Colored1 = table2Results
        .replace('B', chalk.red('B'))
        .replace(`b'`, chalk.red(`b'`))
        .replace('E', chalk.red('E'))
        .replace('C', chalk.blue('C'))
        .replace('F', chalk.blue('F'))
        .replace(`f''`, chalk.blue(`f''`))
        .replace(`f'`, chalk.blue(`f'`))
      const table2Colored2 = table2Results
        .replace('B', chalk.red('B'))
        .replace(`b'`, chalk.red(`b'`))
        .replace('E', chalk.red('E'))
        .replace('C ', ' C')
        .replace('C', chalk.blue('C'))
        .replace('F ', ' F')
        .replace('F', chalk.blue('F'))
        .replace(`f''`, chalk.blue(`f''`))
        .replace(`f'`, chalk.blue(`f'`))

      it('should color text when color functions are provided', () => {
        expect(makeTable(table1Rows, { colors: c1 })).toBe(table1Colored1)
        expect(makeTable(table1Rows, { colors: c2 })).toBe(table1Colored2)
        expect(makeTable(table1Rows, { colors: c3 })).toBe(table1Colored3)
        expect(makeTable(table2Rows, { colors: c4 })).toBe(table2Colored1)
      })

      it('should color text & center correctly when color functions are provided', () => {
        expect(makeTable(table2Rows, { colors: c4, centered: true })).toBe(table2Colored2)
      })
    })

    describe('padding', () => {
      it('should pad cells correctly', () => {
        expect(makeTable(table1Rows, { padding: 3 })).toBe(table1PadResults)
        expect(makeTable(table2Rows, { padding: 3 })).toBe(table2PadResults)
      })
    })

    describe('padding + center', () => {
      const results = table2PadResults
        .replace('C ', ' C')
        .replace('F ', ' F')

      it('should padd cells correctly and center them', () => {
        expect(makeTable(table2Rows, { padding: 3, centered: true })).toBe(results)
      })
    })
  })
})
