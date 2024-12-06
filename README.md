<a href="https://github.com/imssyang/formatui">
  <h1 align="center">
    <picture>
	  <img alt="Formatui" src="https://github.com/imssyang/formatui/blob/main/src/img/formatui.svg" width="100" />
    </picture>
    <p>Formatui</p>
  </h1>
</a>

[![npm version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)](https://www.npmjs.com/package/@imssyang/formatui)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/imssyang/formatui/blob/main/LICENSE)

Formatui is a text-formatted view used on browser. It aims to convert various text formats in place, such as json to python-dict.
<img align="center" width="1147px" src="https://github.com/imssyang/formatui/blob/main/snapshot/layout-3.png">

## Feature

- Adaptive browser window size.
- Multiple window layout styles, which can be switched freely.
- Support search and replace windows.
- Support swapping editor content.

## Dependencies

* [W2UI](https://github.com/vitmalina/w2ui): A modern JavaScript UI library for building rich web applications.
* [codemirror6](https://codemirror.net/): A code editor component for the web.
* [bootstrap-icons](https://icons.getbootstrap.com/): Free, high quality, open source icon library with over 2,000 icons.
* [json5](https://json5.org/): An extension to the popular JSON file format that aims to be easier to write and maintain by hand.
* [clipboard](https://clipboardjs.com): A modern approach to copy text to clipboard.

### Commands

For Node.js:

```bash
# Compile to ES6 module
npm run build[:dev]

# Run simple server (hot-reload), and open http://localhost:5015 in browser
npm run serve

# Run by docker, and open http://localhost:5015 in browser
docker run -it -p 5015:5015 --rm ghcr.io/imssyang/formatui:latest
```

## Why

Various texts in the development and debugging environment exist either in machine reading form or in human reading form, and often need to be converted into forms. Online conversion can often only meet some scenarios, and has a single function and is not user-friendly. Therefore, it is necessary to leverage the power of the open source community to create a universal text converter that is easy to use and can be continuously optimized.

## Todo

- Vertical multi-window layout
- History list
- Indent control
- Clipboard
