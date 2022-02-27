import chalk from 'chalk'

export default function badName(name, validation) {
  const {errors, warnings} = validation
  const redName = chalk.red(`"${name}"`)

  return [
    `Could not create a project called ${redName} because of npm naming restrictions:`,
    errors?.map(msg => chalk.red(`   * ${msg}`)).join('\n'),
    warnings?.map(msg => chalk.yellow(`   * ${msg}`)),
    '',
    chalk.gray.italic('   (try adjusting the name)'),
  ]
    .filter(Boolean)
    .join('\n')
}
