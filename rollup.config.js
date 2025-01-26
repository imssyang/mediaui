import fs from 'fs'
import path from 'path'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import copy from 'rollup-plugin-copy'
import del from 'rollup-plugin-delete'
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'

const isProd = process.env.NODE_ENV === 'production'
const isServe = process.env.NODE_ENV === 'server'

const APP = {
  name: 'mediaui',
  host: '0.0.0.0',
  port: 5015,
}

const PATHS = {
  src: 'src',
  dist: 'dist',
  modules: 'node_modules',
}

const FILES = {
  src: {
    img: [
      { name: 'mediaui.svg', to: 'img', when: [ 'prod', 'serve' ] },
    ],
    html: [
      { name: 'index.html', when: [ 'serve' ] },
      { name: 'video.html', when: [ 'serve' ] },
    ]
  },
  'video.js': {
    dir: 'dist',
    js: 'video.es.js',
    css: isProd ? 'video-js.min.css' : 'video-js.css',
    extras: [
      'alt',
      'font',
      'lang',
    ]
  },
  'pixi.js': {
    dir: 'dist',
    js: isProd ? 'pixi.min.mjs' : 'pixi.mjs',
    extras: [
      isProd ? 'webworker.min.mjs' : 'webworker.mjs',
      isProd ?
        path.join('packages', 'advanced-blend-modes.min.js') :
        path.join('packages', 'advanced-blend-modes.js'),
      isProd ?
        path.join('packages', 'math-extras.min.js') :
        path.join('packages', 'math-extras.js'),
      isProd ?
        path.join('packages', 'unsafe-eval.min.js') :
        path.join('packages', 'unsafe-eval.js'),
    ],
  },
  url(name) {
    const info = this[name]
    const realName = this.realName(name)
    const realVersion = this.realVersion(name)
    return `/plugins/${realName}@${realVersion}/${info.js}`
  },
  copySrc() {
    let items = []
    for (const [dir, files] of Object.entries(this.src)) {
      for (const file of files) {
        const okProd = isProd && file.when.includes('prod')
        const okServe = isServe && file.when.includes('serve')
        if (okProd || okServe) {
          const src = path.join(PATHS.src, dir, file.name)
          if (this.checkPath(src)) {
            const dest = path.join(...[PATHS.dist, file?.to].filter(Boolean))
            items.push({ src: src, dest: dest })
          } else {
            throw new Error(`No valid src: ${src}`)
          }
        }
      }
    }
    return items
  },
  copyModules() {
    let items = []
    for (const [name, info] of Object.entries(this)) {
      if (typeof info !== 'function' && name !== 'src') {
        const realName = this.realName(name)
        const realVersion = this.realVersion(name)
        for (const tail of [info?.js, info?.css, info?.extras]) {
          if (tail) {
            const tailings = typeof tail == 'string' ? [ tail ] : tail
            for (const tailing of tailings) {
              const src = path.join(...[PATHS.modules, realName, info?.dir, tailing].filter(Boolean))
              if (this.checkPath(src)) {
                const destDir = path.dirname(tailing)
                const dest = path.join(PATHS.dist, 'plugins', `${realName}@${realVersion}`, destDir)
                items.push({ src: src, dest: dest })
                const srcMap = `${src}.map`
                if (this.checkPath(srcMap)) {
                  items.push({ src: srcMap, dest: dest })
                }
              } else {
                throw new Error(`No valid src: ${src}`)
              }
            }
          }
        }
      }
    }
    return items
  },
  realVersion(name) {
    const realName = this.realName(name)
    const pkgPath = path.join(PATHS.modules, realName, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(new URL(pkgPath, import.meta.url), 'utf8'))
    return pkg.version
  },
  realName(name) {
    if (this.checkName(name)) { return name }
    const linkName = name.replace(/([a-z0-9])([A-Z])/g, (_m, p1, p2) => `${p1}-${p2.toLowerCase()}`)
    if (this.checkName(linkName)) { return linkName }
    const atName = `@${linkName}`
    if (this.checkName(atName)) { return atName }
    throw new Error(`No valid path: ${name}`)
  },
  checkName(name) {
    return this.checkPath(path.join(PATHS.modules, name))
  },
  checkPath(path) {
    try {
      fs.accessSync(path)
      return true
    } catch (error) {
      return false
    }
  }
}

export default {
  input: path.join(PATHS.src, 'index.js'),
  output: {
    file: path.join(PATHS.dist, isProd ? 'index.min.js' : 'index.js'),
    format: 'es',
    sourcemap: isProd ? false : true,
    paths: {
      'pixi': FILES.url('pixi.js'),
    }
  },
  external: [
    'pixi',
  ],
  plugins: [
    del({
      targets: path.join(PATHS.dist, '*'),
    }),
    alias({
      entries: {}
    }),
    nodeResolve(),
    commonjs(),
    json(),
    postcss({
      extract: true,
      minimize: isProd,
    }),
    copy({
      verbose: true,
      targets: [
        ...FILES.copySrc(),
        ...FILES.copyModules(),
      ]
    }),
    isProd && terser(),
    isServe && serve({
      verbose: true,
      host: APP.host,
      port: APP.port,
      contentBase: [ PATHS.dist ],
    }),
    isServe && livereload({
      verbose: true,
      watch: [
        PATHS.dist,
        path.join(PATHS.src, 'html'),
        path.join(PATHS.src, 'css'),
      ]
    })
  ]
}
