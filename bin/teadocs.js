#!/usr/bin/env node

const chalk = require('chalk')
const semver = require('semver')
const requiredVersion = require('../package.json').engines.node

if (!semver.satisfies(process.version, requiredVersion)) {
    console.log(chalk.red(
        `\n[teadocs] minimum Node version not met:` +
        `\nYou are using Node ${process.version}, but Teadocs ` +
        `requires Node ${requiredVersion}.\nPlease upgrade your Node version.\n`
    ))
    process.exit(1)
}

const path = require('path')
const dev = require('../lib/dev')
const build = require('../lib/build')
const init = require('../lib/init')

const program = require('commander')

program
    .version(require('../package.json').version)
    .usage('<command> [options]')

program
    .command('dev [targetDir]')
    .description('start development server and listen for file changes automatically compiled.')
    .option('-p, --port <port>', 'use specified port (default: 3210)')
    .option('-h, --host <host>', 'use specified host (default: 0.0.0.0)')
    .action((dir = '.', { host, port }) => {
        new dev.Dev({ host, port }).start()
    })

program
    .command('build [targetDir]')
    .description('build dir as static site')
    .option('-d, --dest <outDir>', 'specify build output dir (default: ./build)')
    .action((dir = '.', { dest }) => {
        const outDir = dest ? path.resolve(dest) : null
        new build.Build({ outDir }).build()
    })

program
    .command('init [targetDir]')
    .description('generate documents required in an empty directory')
    .action((dir = '.') => {
        console.log(dir);
        init(path.resolve(dir))
    })

// output help information on unknown commands
program
    .arguments('<command>')
    .action((cmd) => {
        program.outputHelp()
        console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
        console.log()
    })

// add some useful info on help
program.on('--help', () => {
    console.log()
    console.log(`  Run ${chalk.cyan(`teadocs <command> --help`)} for detailed usage of given command.`)
    console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp()
    process.exit(1)
}

function wrapCommand(fn) {
    return (...args) => {
        return fn(...args).catch(err => {
            console.error(chalk.red(err.stack))
        })
    }
}