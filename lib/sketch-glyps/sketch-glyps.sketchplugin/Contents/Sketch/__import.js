var globalThis = this;
var global = this;
function __skpm_run (key, context) {
  globalThis.context = context;
  try {

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/import.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/@skpm/child_process/index.js":
/*!***************************************************!*\
  !*** ./node_modules/@skpm/child_process/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports.exec = __webpack_require__(/*! ./utils/exec */ "./node_modules/@skpm/child_process/lib/exec.js")
module.exports.execFile = __webpack_require__(/*! ./utils/execFile */ "./node_modules/@skpm/child_process/lib/execFile.js")
module.exports.spawn = __webpack_require__(/*! ./utils/spawn */ "./node_modules/@skpm/child_process/lib/spawn.js")
module.exports.spawnSync = __webpack_require__(/*! ./utils/spawnSync */ "./node_modules/@skpm/child_process/lib/spawnSync.js")
module.exports.execFileSync = __webpack_require__(/*! ./utils/execFileSync */ "./node_modules/@skpm/child_process/lib/execFileSync.js")
module.exports.execSync = __webpack_require__(/*! ./utils/execSync */ "./node_modules/@skpm/child_process/lib/execSync.js")


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/exec.js":
/*!******************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/exec.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var execFile = __webpack_require__(/*! ./execFile */ "./node_modules/@skpm/child_process/lib/execFile.js")

function normalizeExecArgs(command, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }

  // Make a shallow copy so we don't clobber the user's options object.
  options = Object.assign({}, options)
  options.shell = typeof options.shell === 'string' ? options.shell : true

  return {
    file: command,
    options: options,
    callback: callback
  }
}

module.exports = function exec(command, options, callback) {
  var opts = normalizeExecArgs(command, options, callback)
  return execFile(opts.file, opts.options, opts.callback)
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/execFile.js":
/*!**********************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/execFile.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* globals NSMutableData, NSData */
var spawn = __webpack_require__(/*! ./spawn */ "./node_modules/@skpm/child_process/lib/spawn.js")
var handleData = __webpack_require__(/*! ./handleData */ "./node_modules/@skpm/child_process/lib/handleData.js")

function validateTimeout(timeout) {
  if (timeout != null && !(Number.isInteger(timeout) && timeout >= 0)) {
    throw new Error('ERR_OUT_OF_RANGE options.timeout')
  }
}

function validateMaxBuffer(maxBuffer) {
  if (maxBuffer != null && !(typeof maxBuffer === 'number' && maxBuffer >= 0)) {
    throw new Error('ERR_OUT_OF_RANGE options.maxBuffer')
  }
}

function concatData(prev, data) {
  prev.appendData(data)
  return prev
}

module.exports = function execFile(file, args, options, callback) {
  var defaultOptions = {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: 200 * 1024,
    killSignal: 'SIGTERM',
    cwd: undefined,
    env: undefined,
    shell: false
  }

  if (typeof args === 'function') {
    // function (file, callback)
    callback = args
    args = []
    options = defaultOptions
  } else if (typeof args === 'object' && !Array.isArray(args)) {
    // function (file, options, callback)
    callback = options
    options = Object.assign(defaultOptions, args)
    args = []
  } else {
    // function (file, args, options, callback)
    options = Object.assign(defaultOptions, options)
  }

  // Validate the timeout, if present.
  validateTimeout(options.timeout)

  // Validate maxBuffer, if present.
  validateMaxBuffer(options.maxBuffer)

  var child = spawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    uid: options.uid,
    shell: options.shell
  })

  var encoding = options.encoding
  var _stdout = []
  var _stderr = []

  var stdoutLen = 0
  var stderrLen = 0
  var killed = false
  var exited = false
  var timeoutId

  var ex = null

  var cmd = file

  function exithandler(code, signal) {
    if (exited) return
    exited = true

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (!callback) return

    // merge chunks
    var stdout = handleData(
      NSData.dataWithData(_stdout.reduce(concatData, NSMutableData.data())),
      encoding
    )
    var stderr = handleData(
      NSData.dataWithData(_stderr.reduce(concatData, NSMutableData.data())),
      encoding
    )

    if (!ex && code === 0 && signal === null) {
      callback(null, stdout, stderr)
      return
    }

    if (args.length !== 0) {
      cmd += ' ' + args.join(' ')
    }

    if (!ex) {
      ex = new Error('Command failed: ' + cmd + '\n' + stderr)
      ex.killed = child.killed || killed
      ex.code = code
      ex.signal = signal
    }

    ex.cmd = cmd
    callback(ex, stdout, stderr)
  }

  function errorhandler(e) {
    ex = e

    exithandler()
  }

  function kill() {
    killed = true
    try {
      child.kill(options.killSignal)
    } catch (e) {
      ex = e
      exithandler()
    }
  }

  if (options.timeout > 0) {
    timeoutId = setTimeout(function delayedKill() {
      kill()
      timeoutId = null
    }, options.timeout)
  }

  if (child.stdout) {
    child.stdout.setEncoding('NSData')
    child.stdout.on('data', function onChildStdout(chunk) {
      stdoutLen += chunk.length()
      if (stdoutLen > options.maxBuffer) {
        ex = new Error('ERR_CHILD_PROCESS_STDIO_MAXBUFFER stdout')
        kill()
      } else {
        _stdout.push(chunk)
      }
    })
  }

  if (child.stderr) {
    child.stderr.setEncoding('NSData')
    child.stderr.on('data', function onChildStderr(chunk) {
      stderrLen += chunk.length()

      if (stderrLen > options.maxBuffer) {
        ex = new Error('ERR_CHILD_PROCESS_STDIO_MAXBUFFER stderr')
        kill()
      } else {
        _stderr.push(chunk)
      }
    })
  }

  child.addListener('close', exithandler)
  child.addListener('error', errorhandler)

  return child
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/execFileSync.js":
/*!**************************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/execFileSync.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var spawnSync = __webpack_require__(/*! ./spawnSync */ "./node_modules/@skpm/child_process/lib/spawnSync.js")

function validateTimeout(timeout) {
  if (timeout != null && !(Number.isInteger(timeout) && timeout >= 0)) {
    throw new Error('ERR_OUT_OF_RANGE options.timeout')
  }
}

function validateMaxBuffer(maxBuffer) {
  if (maxBuffer != null && !(typeof maxBuffer === 'number' && maxBuffer >= 0)) {
    throw new Error('ERR_OUT_OF_RANGE options.maxBuffer')
  }
}

module.exports = function execFileSync(file, args, options) {
  var defaultOptions = {
    encoding: 'buffer',
    timeout: 0,
    maxBuffer: 200 * 1024,
    killSignal: 'SIGTERM',
    cwd: null,
    env: null,
    shell: false
  }

  if (typeof args === 'object' && !Array.isArray(args)) {
    // function (file, options)
    options = Object.assign(defaultOptions, args)
    args = []
  } else {
    // function (file)
    options = Object.assign(defaultOptions, options || {})
  }

  // Validate the timeout, if present.
  validateTimeout(options.timeout)

  // Validate maxBuffer, if present.
  validateMaxBuffer(options.maxBuffer)

  var child = spawnSync(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    uid: options.uid,
    shell: options.shell,
    encoding: options.encoding,
    stdio: ['pipe', 'pipe', 'inherit']
  })

  if (child.status !== 0) {
    var error = new Error('Failed to run: ' + String(child.stderr))
    error.pid = child.pid
    error.status = child.status
    error.stdout = child.stdout
    error.stderr = child.stderr
    throw error
  }

  return child.stdout
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/execSync.js":
/*!**********************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/execSync.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var execFileSync = __webpack_require__(/*! ./execFileSync */ "./node_modules/@skpm/child_process/lib/execFileSync.js")

function normalizeExecArgs(command, options) {
  // Make a shallow copy so we don't clobber the user's options object.
  options = Object.assign({}, options)
  options.shell = typeof options.shell === 'string' ? options.shell : true

  return {
    file: command,
    options: options
  }
}

module.exports = function execSync(command, options) {
  var opts = normalizeExecArgs(command, options)
  return execFileSync(opts.file, opts.options)
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/handleData.js":
/*!************************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/handleData.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(/*! buffer */ "buffer").Buffer

function handleBuffer(buffer, encoding) {
  if (encoding === 'buffer') {
    return buffer
  }
  if (encoding === 'NSData') {
    return buffer.toNSData()
  }
  return buffer.toString(encoding)
}

module.exports = function handleData(data, encoding) {
  var buffer = Buffer.from(data)

  return handleBuffer(buffer, encoding)
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/normalizeSpawnArguments.js":
/*!*************************************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/normalizeSpawnArguments.js ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function normalizeSpawnArguments(file, args, options) {
  if (typeof file !== 'string' || file.length === 0) {
    throw new Error('ERR_INVALID_ARG_TYPE')
  }

  if (Array.isArray(args)) {
    args = args.slice(0)
  } else if (
    args !== undefined &&
    (args === null || typeof args !== 'object')
  ) {
    throw new Error('ERR_INVALID_ARG_TYPE args')
  } else {
    options = args
    args = []
  }

  if (options === undefined) {
    options = {}
  } else if (options === null || typeof options !== 'object') {
    throw new Error('ERR_INVALID_ARG_TYPE options')
  }

  // Validate the cwd, if present.
  if (options.cwd != null && typeof options.cwd !== 'string') {
    throw new Error('ERR_INVALID_ARG_TYPE options.cwd')
  }

  // Validate detached, if present.
  if (options.detached != null && typeof options.detached !== 'boolean') {
    throw new Error('ERR_INVALID_ARG_TYPE options.detached')
  }

  // Validate the uid, if present.
  if (options.uid != null && !Number.isInteger(options.uid)) {
    throw new Error('ERR_INVALID_ARG_TYPE options.uid')
  }

  // Validate the gid, if present.
  if (options.gid != null && !Number.isInteger(options.gid)) {
    throw new Error('ERR_INVALID_ARG_TYPE options.gid')
  }

  // Validate the shell, if present.
  if (
    options.shell != null &&
    typeof options.shell !== 'boolean' &&
    typeof options.shell !== 'string'
  ) {
    throw new Error('ERR_INVALID_ARG_TYPE options.shell')
  }

  // Validate argv0, if present.
  if (options.argv0 != null && typeof options.argv0 !== 'string') {
    throw new Error('ERR_INVALID_ARG_TYPE options.argv0')
  }

  // Make a shallow copy so we don't clobber the user's options object.
  options = Object.assign({}, options)

  if (options.shell) {
    var command = [file].concat(args).join(' ')

    if (typeof options.shell === 'string') {
      file = options.shell
    } else {
      file = '/bin/bash'
    }
    args = ['-l', '-c', command]
  }

  if (typeof options.argv0 === 'string') {
    args.unshift(options.argv0)
  }

  var stdio = ['pipe', 'pipe', 'pipe']

  if (typeof options.stdio === 'string') {
    if (options.stdio === 'inherit') {
      stdio = [0, 1, 2]
    } else {
      stdio = [options.stdio, options.stdio, options.stdio]
    }
  } else if (Array.isArray(options.stdio)) {
    if (options.stdio[0] || options.stdio[0] === 0) {
      if (options.stdio[0] === 'inherit') {
        stdio[0] = 0
      } else {
        stdio[0] = options.stdio[0]
      }
    }
    if (options.stdio[1] || options.stdio[1] === 0) {
      if (options.stdio[1] === 'inherit') {
        stdio[1] = 1
      } else {
        stdio[1] = options.stdio[1]
      }
    }
    if (options.stdio[2] || options.stdio[2] === 0) {
      if (options.stdio[2] === 'inherit') {
        stdio[2] = 2
      } else {
        stdio[2] = options.stdio[2]
      }
    }
  }

  var env = options.env

  return {
    file: file,
    args: args,
    options: options,
    envPairs: env,
    stdio: stdio
  }
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/spawn.js":
/*!*******************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/spawn.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* globals NSPipe, NSTask, NSArray, NSString, coscript, __mocha__ */
var Buffer = __webpack_require__(/*! buffer */ "buffer").Buffer
var EventEmitter = __webpack_require__(/*! events */ "events")
var Readable = __webpack_require__(/*! stream */ "stream").Readable
var Writable = __webpack_require__(/*! stream */ "stream").Writable

var spawnSync = __webpack_require__(/*! ./spawnSync */ "./node_modules/@skpm/child_process/lib/spawnSync.js")
var normalizeSpawnArguments = __webpack_require__(/*! ./normalizeSpawnArguments */ "./node_modules/@skpm/child_process/lib/normalizeSpawnArguments.js")

module.exports = function spawn(_command, _args, _options) {
  var opts = normalizeSpawnArguments(_command, _args, _options)

  var result = new EventEmitter()

  if (opts.file[0] !== '.' && opts.file[0] !== '/' && opts.file[0] !== '~') {
    // means that someone refered to an executable that might be in the path, let's find it
    var whichChild = spawnSync(
      '/bin/bash',
      ['-l', '-c', 'which ' + opts.file],
      { encoding: 'utf8' }
    )
    var resolvedCommand = String(whichChild.stdout || '').trim()
    if (whichChild.err || !resolvedCommand.length) {
      result.stderr = new EventEmitter()
      result.stdout = new EventEmitter()

      result.pid = '-1'

      result.stderr.setEncoding = function setEncoding(encoding) {
        result.stderr.encoding = encoding
      }
      result.stdout.setEncoding = function setEncoding(encoding) {
        result.stdout.encoding = encoding
      }
      if (!resolvedCommand.length) {
        result.emit('error', new Error(String(opts.file) + ' ENOENT'))
      } else {
        result.emit('error', whichChild.err)
      }
      return result
    }
    return spawn(resolvedCommand, _args, _options)
  }

  var options = opts.options

  result.killed = false

  var fiber = coscript.createFiber()

  var task
  var signal = null

  var readingStderr = false
  var readingStdout = false

  result.stderr = new Readable({
    read: function read() {
      readingStderr = true
    }
  })
  result.stdout = new Readable({
    read: function read() {
      readingStdout = true
    }
  })

  function onStdout(data) {
    if (data && data.length() && readingStdout) {
      if (!result.stdout.push(Buffer.from(data))) {
        readingStdout = false
        task
          .standardOutput()
          .fileHandleForReading()
          .setReadabilityHandler(null)
      }
    }
  }
  function onStderr(data) {
    if (data && data.length() && readingStderr) {
      if (!result.stderr.push(Buffer.from(data))) {
        readingStderr = false
        task
          .standardError()
          .fileHandleForReading()
          .setReadabilityHandler(null)
      }
    }
  }

  result.sdtin = new Writable({
    write: function write(chunk, encoding, callback) {
      task
        .standardInput()
        .fileHandleForWriting()
        .writeData(chunk.toNSData())
      callback()
    },
    final: function finish(callback) {
      task
        .standardInput()
        .fileHandleForWriting()
        .closeFile()
      callback()
    }
  })

  result.sdtio = [result.sdtin, result.sdtout, result.sdterr]

  try {
    task = NSTask.alloc().init()

    var inPipe = NSPipe.pipe()
    var pipe = NSPipe.pipe()
    var errPipe = NSPipe.pipe()

    task.setStandardInput(inPipe)
    task.setStandardOutput(pipe)
    task.setStandardError(errPipe)

    task
      .standardOutput()
      .fileHandleForReading()
      .setReadabilityHandler(
        __mocha__.createBlock_function(
          'v16@?0@"NSFileHandle"8',
          function readStdOut(fileHandle) {
            try {
              onStdout(fileHandle.availableData())
            } catch (err) {
              if (
                typeof process !== 'undefined' &&
                process.listenerCount &&
                process.listenerCount('uncaughtException')
              ) {
                process.emit('uncaughtException', err, 'uncaughtException')
              } else {
                console.error(err)
              }
            }
          }
        )
      )
    task
      .standardError()
      .fileHandleForReading()
      .setReadabilityHandler(
        __mocha__.createBlock_function(
          'v16@?0@"NSFileHandle"8',
          function readStdOut(fileHandle) {
            try {
              onStderr(fileHandle.availableData())
            } catch (err) {
              if (
                typeof process !== 'undefined' &&
                process.listenerCount &&
                process.listenerCount('uncaughtException')
              ) {
                process.emit('uncaughtException', err, 'uncaughtException')
              } else {
                console.error(err)
              }
            }
          }
        )
      )

    task.setLaunchPath(
      NSString.stringWithString(opts.file).stringByExpandingTildeInPath()
    )
    task.arguments = NSArray.arrayWithArray(opts.args || [])
    if (opts.envPairs) {
      task.environment = opts.envPairs
    }
    if (options.cwd) {
      task.setCurrentDirectoryPath(
        NSString.stringWithString(options.cwd).stringByExpandingTildeInPath()
      )
    }

    task.setTerminationHandler(
      __mocha__.createBlock_function(
        'v16@?0@"NSTask"8',
        function handleTermination(_task) {
          try {
            _task
              .standardError()
              .fileHandleForReading()
              .setReadabilityHandler(null)
            _task
              .standardOutput()
              .fileHandleForReading()
              .setReadabilityHandler(null)
            result.stderr.emit('close')
            result.stdout.emit('close')

            result.killed = true

            result.emit('close', Number(_task.terminationStatus()), signal)
          } catch (err) {
            if (
              typeof process !== 'undefined' &&
              process.listenerCount &&
              process.listenerCount('uncaughtException')
            ) {
              process.emit('uncaughtException', err, 'uncaughtException')
            } else {
              console.error(err)
            }
          }
          fiber.cleanup()
        }
      )
    )

    task.launch()
  } catch (err) {
    fiber.cleanup()
    setImmediate(function() {
      result.emit('error', err)
    })
    return result
  }

  result.kill = function kill(_signal) {
    if (!result.killed) {
      signal = _signal
      task.terminate()
    }
  }

  result.pid = String(task.processIdentifier())

  return result
}


/***/ }),

/***/ "./node_modules/@skpm/child_process/lib/spawnSync.js":
/*!***********************************************************!*\
  !*** ./node_modules/@skpm/child_process/utils/spawnSync.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* globals NSPipe, NSTask, NSArray, NSString */
var handleData = __webpack_require__(/*! ./handleData */ "./node_modules/@skpm/child_process/lib/handleData.js")
var normalizeSpawnArguments = __webpack_require__(/*! ./normalizeSpawnArguments */ "./node_modules/@skpm/child_process/lib/normalizeSpawnArguments.js")

function spawnSync(_command, _args, _options) {
  var opts = normalizeSpawnArguments(_command, _args, _options)

  if (opts.file[0] !== '.' && opts.file[0] !== '/' && opts.file[0] !== '~') {
    // means that someone refered to an executable that might be in the path, let's find it
    var whichChild = spawnSync(
      '/bin/bash',
      ['-l', '-c', 'which ' + opts.file],
      { encoding: 'utf8' }
    )
    if (whichChild.err) {
      return whichChild
    }
    var resolvedCommand = String(whichChild.stdout).trim()
    if (!resolvedCommand.length) {
      return {
        err: new Error(String(opts.file) + ' ENOENT')
      }
    }
    return spawnSync(resolvedCommand, _args, _options)
  }

  var options = opts.options

  var pipe = NSPipe.pipe()
  var errPipe = NSPipe.pipe()

  try {
    var task = NSTask.alloc().init()
    task.setLaunchPath(
      NSString.stringWithString(opts.file).stringByExpandingTildeInPath()
    )
    task.arguments = NSArray.arrayWithArray(opts.args || [])
    if (opts.envPairs) {
      task.environment = opts.envPairs
    }

    if (options.cwd) {
      task.setCurrentDirectoryPath(
        NSString.stringWithString(options.cwd).stringByExpandingTildeInPath()
      )
    }

    task.setStandardOutput(pipe)
    task.setStandardError(errPipe)

    task.launch()
    task.waitUntilExit()

    var stdoutIgnored = false
    var stderrIgnored = false

    var data
    var stdoutValue
    var stderrValue

    if (opts.stdio[1] === 'ignored') {
      stdoutIgnored = true
    } else if (opts.stdio[1] === 1) {
      data = pipe.fileHandleForReading().readDataToEndOfFile()
      stdoutValue = handleData(data, options.encoding || 'buffer')
      console.log(stdoutValue)
    } else if (opts.stdio[1] === 2) {
      data = pipe.fileHandleForReading().readDataToEndOfFile()
      stdoutValue = handleData(data, options.encoding || 'buffer')
      console.error(stdoutValue)
    }

    if (opts.stdio[2] === 'ignored') {
      stderrIgnored = true
    } else if (opts.stdio[2] === 1) {
      data = errPipe.fileHandleForReading().readDataToEndOfFile()
      stderrValue = handleData(data, options.encoding || 'buffer')
      console.log(stderrValue)
    } else if (opts.stdio[2] === 2) {
      data = errPipe.fileHandleForReading().readDataToEndOfFile()
      stderrValue = handleData(data, options.encoding || 'buffer')
      console.error(stderrValue)
    }

    return {
      pid: String(task.processIdentifier()),
      status: Number(task.terminationStatus()),
      get stdout() {
        if (stdoutIgnored) {
          return null
        }
        if (stdoutValue) {
          return stdoutValue
        }
        data = pipe.fileHandleForReading().readDataToEndOfFile()
        return handleData(data, options.encoding || 'buffer')
      },
      get stderr() {
        if (stderrIgnored) {
          return null
        }
        if (stderrValue) {
          return stdoutValue
        }
        data = errPipe.fileHandleForReading().readDataToEndOfFile()
        return handleData(data, options.encoding || 'buffer')
      }
    }
  } catch (err) {
    return {
      err: err
    }
  }
}

module.exports = spawnSync


/***/ }),

/***/ "./node_modules/@skpm/fs/index.js":
/*!****************************************!*\
  !*** ./node_modules/@skpm/fs/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// TODO: async. Should probably be done with NSFileHandle and some notifications
// TODO: file descriptor. Needs to be done with NSFileHandle
var Buffer = __webpack_require__(/*! buffer */ "buffer").Buffer;
var utils = __webpack_require__(/*! ./utils */ "./node_modules/@skpm/fs/utils.js");
var parseStat = utils.parseStat;
var fsError = utils.fsError;
var fsErrorForPath = utils.fsErrorForPath;
var encodingFromOptions = utils.encodingFromOptions;
var NOT_IMPLEMENTED = utils.NOT_IMPLEMENTED;

module.exports.constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
};

module.exports.access = NOT_IMPLEMENTED("access");

module.exports.accessSync = function (path, mode) {
  mode = mode | 0;
  var fileManager = NSFileManager.defaultManager();

  switch (mode) {
    case 0:
      canAccess = module.exports.existsSync(path);
      break;
    case 1:
      canAccess = Boolean(Number(fileManager.isExecutableFileAtPath(path)));
      break;
    case 2:
      canAccess = Boolean(Number(fileManager.isWritableFileAtPath(path)));
      break;
    case 3:
      canAccess =
        Boolean(Number(fileManager.isExecutableFileAtPath(path))) &&
        Boolean(Number(fileManager.isWritableFileAtPath(path)));
      break;
    case 4:
      canAccess = Boolean(Number(fileManager.isReadableFileAtPath(path)));
      break;
    case 5:
      canAccess =
        Boolean(Number(fileManager.isReadableFileAtPath(path))) &&
        Boolean(Number(fileManager.isExecutableFileAtPath(path)));
      break;
    case 6:
      canAccess =
        Boolean(Number(fileManager.isReadableFileAtPath(path))) &&
        Boolean(Number(fileManager.isWritableFileAtPath(path)));
      break;
    case 7:
      canAccess =
        Boolean(Number(fileManager.isReadableFileAtPath(path))) &&
        Boolean(Number(fileManager.isWritableFileAtPath(path))) &&
        Boolean(Number(fileManager.isExecutableFileAtPath(path)));
      break;
  }

  if (!canAccess) {
    throw new Error("Can't access " + String(path));
  }
};

module.exports.appendFile = NOT_IMPLEMENTED("appendFile");

module.exports.appendFileSync = function (file, data, options) {
  if (!module.exports.existsSync(file)) {
    return module.exports.writeFileSync(file, data, options);
  }

  var handle = NSFileHandle.fileHandleForWritingAtPath(file);
  handle.seekToEndOfFile();

  var encoding = encodingFromOptions(options, "utf8");

  var nsdata = Buffer.from(
    data,
    encoding === "NSData" || encoding === "buffer" ? undefined : encoding
  ).toNSData();

  handle.writeData(nsdata);
};

module.exports.chmod = NOT_IMPLEMENTED("chmod");

module.exports.chmodSync = function (path, mode) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  fileManager.setAttributes_ofItemAtPath_error(
    {
      NSFilePosixPermissions: mode,
    },
    path,
    err
  );

  if (err.value() !== null) {
    throw fsErrorForPath(path, undefined, err.value());
  }
};

module.exports.chown = NOT_IMPLEMENTED("chown");
module.exports.chownSync = NOT_IMPLEMENTED("chownSync");

module.exports.close = NOT_IMPLEMENTED("close");
module.exports.closeSync = NOT_IMPLEMENTED("closeSync");

module.exports.copyFile = NOT_IMPLEMENTED("copyFile");

module.exports.copyFileSync = function (path, dest, flags) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  fileManager.copyItemAtPath_toPath_error(path, dest, err);

  if (err.value() !== null) {
    throw fsErrorForPath(path, false, err.value());
  }
};

module.exports.createReadStream = NOT_IMPLEMENTED("createReadStream");
module.exports.createWriteStream = NOT_IMPLEMENTED("createWriteStream");

module.exports.exists = NOT_IMPLEMENTED("exists");

module.exports.existsSync = function (path) {
  var fileManager = NSFileManager.defaultManager();
  return Boolean(Number(fileManager.fileExistsAtPath(path)));
};

module.exports.fchmod = NOT_IMPLEMENTED("fchmod");
module.exports.fchmodSync = NOT_IMPLEMENTED("fchmodSync");
module.exports.fchown = NOT_IMPLEMENTED("fchown");
module.exports.fchownSync = NOT_IMPLEMENTED("fchownSync");
module.exports.fdatasync = NOT_IMPLEMENTED("fdatasync");
module.exports.fdatasyncSync = NOT_IMPLEMENTED("fdatasyncSync");
module.exports.fstat = NOT_IMPLEMENTED("fstat");
module.exports.fstatSync = NOT_IMPLEMENTED("fstatSync");
module.exports.fsync = NOT_IMPLEMENTED("fsync");
module.exports.fsyncSync = NOT_IMPLEMENTED("fsyncSync");
module.exports.ftruncate = NOT_IMPLEMENTED("ftruncate");
module.exports.ftruncateSync = NOT_IMPLEMENTED("ftruncateSync");
module.exports.futimes = NOT_IMPLEMENTED("futimes");
module.exports.futimesSync = NOT_IMPLEMENTED("futimesSync");

module.exports.lchmod = NOT_IMPLEMENTED("lchmod");
module.exports.lchmodSync = NOT_IMPLEMENTED("lchmodSync");
module.exports.lchown = NOT_IMPLEMENTED("lchown");
module.exports.lchownSync = NOT_IMPLEMENTED("lchownSync");

module.exports.link = NOT_IMPLEMENTED("link");

module.exports.linkSync = function (existingPath, newPath) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  fileManager.linkItemAtPath_toPath_error(existingPath, newPath, err);

  if (err.value() !== null) {
    throw fsErrorForPath(existingPath, undefined, err.value());
  }
};

module.exports.lstat = NOT_IMPLEMENTED("lstat");

module.exports.lstatSync = function (path) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var result = fileManager.attributesOfItemAtPath_error(path, err);

  if (err.value() !== null) {
    throw fsErrorForPath(path, undefined, err.value());
  }

  return parseStat(result);
};

module.exports.mkdir = NOT_IMPLEMENTED("mkdir");

module.exports.mkdirSync = function (path, options) {
  var mode = 0o777;
  var recursive = false;
  if (options && options.mode) {
    mode = options.mode;
  }
  if (options && options.recursive) {
    recursive = options.recursive;
  }
  if (typeof options === "number") {
    mode = options;
  }
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(
    path,
    recursive,
    {
      NSFilePosixPermissions: mode,
    },
    err
  );

  if (err.value() !== null) {
    throw new Error(err.value());
  }
};

module.exports.mkdtemp = NOT_IMPLEMENTED("mkdtemp");

module.exports.mkdtempSync = function (path) {
  function makeid() {
    var text = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  var tempPath = path + makeid();
  module.exports.mkdirSync(tempPath);
  return tempPath;
};

module.exports.open = NOT_IMPLEMENTED("open");
module.exports.openSync = NOT_IMPLEMENTED("openSync");

module.exports.read = NOT_IMPLEMENTED("read");

module.exports.readdir = NOT_IMPLEMENTED("readdir");

module.exports.readdirSync = function (path, options) {
  var encoding = encodingFromOptions(options, "utf8");
  var fileManager = NSFileManager.defaultManager();
  var paths = fileManager.subpathsAtPath(path);
  var arr = [];
  for (var i = 0; i < paths.length; i++) {
    var pathName = paths[i];
    arr.push(encoding === "buffer" ? Buffer.from(pathName) : String(pathName));
  }
  return arr;
};

module.exports.readFile = NOT_IMPLEMENTED("readFile");

module.exports.readFileSync = function (path, options) {
  var encoding = encodingFromOptions(options, "buffer");
  var fileManager = NSFileManager.defaultManager();
  var data = fileManager.contentsAtPath(path);
  if (!data) {
    throw fsErrorForPath(path, false);
  }

  var buffer = Buffer.from(data);

  if (encoding === "buffer") {
    return buffer;
  } else if (encoding === "NSData") {
    return buffer.toNSData();
  } else {
    return buffer.toString(encoding);
  }
};

module.exports.readlink = NOT_IMPLEMENTED("readlink");

module.exports.readlinkSync = function (path) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var result = fileManager.destinationOfSymbolicLinkAtPath_error(path, err);

  if (err.value() !== null) {
    throw fsErrorForPath(path, undefined, err.value());
  }

  return String(result);
};

module.exports.readSync = NOT_IMPLEMENTED("readSync");

module.exports.realpath = NOT_IMPLEMENTED("realpath");
module.exports.realpath.native = NOT_IMPLEMENTED("realpath.native");

module.exports.realpathSync = function (path) {
  return String(
    NSString.stringWithString(path).stringByResolvingSymlinksInPath()
  );
};

module.exports.realpathSync.native = NOT_IMPLEMENTED("realpathSync.native");

module.exports.rename = NOT_IMPLEMENTED("rename");

module.exports.renameSync = function (oldPath, newPath) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  fileManager.moveItemAtPath_toPath_error(oldPath, newPath, err);

  var error = err.value();

  if (error !== null) {
    // if there is already a file, we need to overwrite it
    if (
      String(error.domain()) === "NSCocoaErrorDomain" &&
      Number(error.code()) === 516
    ) {
      var err2 = MOPointer.alloc().init();
      fileManager.replaceItemAtURL_withItemAtURL_backupItemName_options_resultingItemURL_error(
        NSURL.fileURLWithPath(newPath),
        NSURL.fileURLWithPath(oldPath),
        null,
        NSFileManagerItemReplacementUsingNewMetadataOnly,
        null,
        err2
      );
      if (err2.value() !== null) {
        throw fsErrorForPath(oldPath, undefined, err2.value());
      }
    } else {
      throw fsErrorForPath(oldPath, undefined, error);
    }
  }
};

module.exports.rmdir = NOT_IMPLEMENTED("rmdir");

module.exports.rmdirSync = function (path) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var isDirectory = module.exports.lstatSync(path).isDirectory();
  if (!isDirectory) {
    throw fsError("ENOTDIR", {
      path: path,
      syscall: "rmdir",
    });
  }
  fileManager.removeItemAtPath_error(path, err);

  if (err.value() !== null) {
    throw fsErrorForPath(path, true, err.value(), "rmdir");
  }
};

module.exports.stat = NOT_IMPLEMENTED("stat");

// the only difference with lstat is that we resolve symlinks
//
// > lstat() is identical to stat(), except that if pathname is a symbolic
// > link, then it returns information about the link itself, not the file
// > that it refers to.
// http://man7.org/linux/man-pages/man2/lstat.2.html
module.exports.statSync = function (path) {
  return module.exports.lstatSync(module.exports.realpathSync(path));
};

module.exports.symlink = NOT_IMPLEMENTED("symlink");

module.exports.symlinkSync = function (target, path) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var result = fileManager.createSymbolicLinkAtPath_withDestinationPath_error(
    path,
    target,
    err
  );

  if (err.value() !== null) {
    throw new Error(err.value());
  }
};

module.exports.truncate = NOT_IMPLEMENTED("truncate");

module.exports.truncateSync = function (path, len) {
  var hFile = NSFileHandle.fileHandleForUpdatingAtPath(sFilePath);
  hFile.truncateFileAtOffset(len || 0);
  hFile.closeFile();
};

module.exports.unlink = NOT_IMPLEMENTED("unlink");

module.exports.unlinkSync = function (path) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var isDirectory = module.exports.lstatSync(path).isDirectory();
  if (isDirectory) {
    throw fsError("EPERM", {
      path: path,
      syscall: "unlink",
    });
  }
  var result = fileManager.removeItemAtPath_error(path, err);

  if (err.value() !== null) {
    throw fsErrorForPath(path, false, err.value());
  }
};

module.exports.unwatchFile = NOT_IMPLEMENTED("unwatchFile");

module.exports.utimes = NOT_IMPLEMENTED("utimes");

module.exports.utimesSync = function (path, aTime, mTime) {
  var err = MOPointer.alloc().init();
  var fileManager = NSFileManager.defaultManager();
  var result = fileManager.setAttributes_ofItemAtPath_error(
    {
      NSFileModificationDate: aTime,
    },
    path,
    err
  );

  if (err.value() !== null) {
    throw fsErrorForPath(path, undefined, err.value());
  }
};

module.exports.watch = NOT_IMPLEMENTED("watch");
module.exports.watchFile = NOT_IMPLEMENTED("watchFile");

module.exports.write = NOT_IMPLEMENTED("write");

module.exports.writeFile = NOT_IMPLEMENTED("writeFile");

module.exports.writeFileSync = function (path, data, options) {
  var encoding = encodingFromOptions(options, "utf8");

  var nsdata = Buffer.from(
    data,
    encoding === "NSData" || encoding === "buffer" ? undefined : encoding
  ).toNSData();

  nsdata.writeToFile_atomically(path, true);
};

module.exports.writeSync = NOT_IMPLEMENTED("writeSync");


/***/ }),

/***/ "./node_modules/@skpm/fs/utils.js":
/*!****************************************!*\
  !*** ./node_modules/@skpm/fs/utils.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports.parseStat = function parseStat(result) {
  return {
    dev: String(result.NSFileDeviceIdentifier),
    // ino: 48064969, The file system specific "Inode" number for the file.
    mode: result.NSFileType | result.NSFilePosixPermissions,
    nlink: Number(result.NSFileReferenceCount),
    uid: String(result.NSFileOwnerAccountID),
    gid: String(result.NSFileGroupOwnerAccountID),
    // rdev: 0, A numeric device identifier if the file is considered "special".
    size: Number(result.NSFileSize),
    // blksize: 4096, The file system block size for i/o operations.
    // blocks: 8, The number of blocks allocated for this file.
    atimeMs:
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    mtimeMs:
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    ctimeMs:
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    birthtimeMs:
      Number(result.NSFileCreationDate.timeIntervalSince1970()) * 1000,
    atime: new Date(
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5
    ), // the 0.5 comes from the node source. Not sure why it's added but in doubt...
    mtime: new Date(
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5
    ),
    ctime: new Date(
      Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5
    ),
    birthtime: new Date(
      Number(result.NSFileCreationDate.timeIntervalSince1970()) * 1000 + 0.5
    ),
    isBlockDevice: function () {
      return result.NSFileType === NSFileTypeBlockSpecial;
    },
    isCharacterDevice: function () {
      return result.NSFileType === NSFileTypeCharacterSpecial;
    },
    isDirectory: function () {
      return result.NSFileType === NSFileTypeDirectory;
    },
    isFIFO: function () {
      return false;
    },
    isFile: function () {
      return result.NSFileType === NSFileTypeRegular;
    },
    isSocket: function () {
      return result.NSFileType === NSFileTypeSocket;
    },
    isSymbolicLink: function () {
      return result.NSFileType === NSFileTypeSymbolicLink;
    },
  };
};

var ERRORS = {
  EPERM: {
    message: "operation not permitted",
    errno: -1,
  },
  ENOENT: {
    message: "no such file or directory",
    errno: -2,
  },
  EACCES: {
    message: "permission denied",
    errno: -13,
  },
  ENOTDIR: {
    message: "not a directory",
    errno: -20,
  },
  EISDIR: {
    message: "illegal operation on a directory",
    errno: -21,
  },
};

function fsError(code, options) {
  var error = new Error(
    code +
      ": " +
      ERRORS[code].message +
      ", " +
      (options.syscall || "") +
      (options.path ? " '" + options.path + "'" : "")
  );

  Object.keys(options).forEach(function (k) {
    error[k] = options[k];
  });

  error.code = code;
  error.errno = ERRORS[code].errno;

  return error;
}

module.exports.fsError = fsError;

module.exports.fsErrorForPath = function fsErrorForPath(
  path,
  shouldBeDir,
  err,
  syscall
) {
  var fileManager = NSFileManager.defaultManager();
  var doesExist = fileManager.fileExistsAtPath(path);
  if (!doesExist) {
    return fsError("ENOENT", {
      path: path,
      syscall: syscall || "open",
    });
  }
  var isReadable = fileManager.isReadableFileAtPath(path);
  if (!isReadable) {
    return fsError("EACCES", {
      path: path,
      syscall: syscall || "open",
    });
  }
  if (typeof shouldBeDir !== "undefined") {
    var isDirectory = __webpack_require__(/*! ./index */ "./node_modules/@skpm/fs/index.js").lstatSync(path).isDirectory();
    if (isDirectory && !shouldBeDir) {
      return fsError("EISDIR", {
        path: path,
        syscall: syscall || "read",
      });
    } else if (!isDirectory && shouldBeDir) {
      return fsError("ENOTDIR", {
        path: path,
        syscall: syscall || "read",
      });
    }
  }
  return new Error(err || "Unknown error while manipulating " + path);
};

module.exports.encodingFromOptions = function encodingFromOptions(
  options,
  defaultValue
) {
  return options && options.encoding
    ? String(options.encoding)
    : options
    ? String(options)
    : defaultValue;
};

module.exports.NOT_IMPLEMENTED = function NOT_IMPLEMENTED(name) {
  return function () {
    throw new Error(
      "fs." +
        name +
        " is not implemented yet. If you feel like implementing it, any contribution will be gladly accepted on https://github.com/skpm/fs"
    );
  };
};


/***/ }),

/***/ "./src/import.js":
/*!***********************!*\
  !*** ./src/import.js ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var sketch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! sketch */ "sketch");
/* harmony import */ var sketch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(sketch__WEBPACK_IMPORTED_MODULE_0__);
function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var fs = __webpack_require__(/*! @skpm/fs */ "./node_modules/@skpm/fs/index.js");

var childProcess = __webpack_require__(/*! @skpm/child_process */ "./node_modules/@skpm/child_process/index.js");

var numCols = 16;
var artboardSize = 64;
var padding = 32;
var cellSpan = artboardSize + padding;

/* harmony default export */ __webpack_exports__["default"] = (function (context) {
  // determine the location of the clypboard-server directory from puma-dev
  var pumaDir = "~/.puma-dev/clypboard-server";
  var clypboardDir = childProcess.execSync("readlink ".concat(pumaDir)).toString();

  if (clypboardDir.indexOf('clypboard-server') > -1) {
    clypboardDir = clypboardDir.trim();
    console.log("Clypboard directory: ".concat(clypboardDir));
  } else {
    UI.alert('No Clypboard Directory!', "The Glyp plugin assumes that you have a local Clypboard instance that's linked to at ".concat(pumaDir));
    return;
  }

  var document = sketch__WEBPACK_IMPORTED_MODULE_0___default.a.Document.getSelectedDocument();
  var page = document.selectedPage;

  if (page) {
    page.name = 'Glyps';

    var _iterator = _createForOfIteratorHelper(page.layers),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var child = _step.value;
        child.remove();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } else {
    page = new sketch__WEBPACK_IMPORTED_MODULE_0___default.a.Page({
      parent: document,
      name: "Glyps"
    });
  }

  var rootDir = "".concat(clypboardDir, "/public/glyp");
  var files = fs.readdirSync(rootDir);
  var col = 0;
  var row = 0;
  var names = [];

  var _iterator2 = _createForOfIteratorHelper(files),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var file = _step2.value;

      if (file.endsWith('.svg')) {
        names.push(file);
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  var _iterator3 = _createForOfIteratorHelper(names.sort()),
      _step3;

  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _file = _step3.value;
      var x = col * cellSpan;
      var y = row * cellSpan;
      console.log("Adding ".concat(_file, " at ").concat(x, ",").concat(y)); // create the artboard

      var artboard = new sketch__WEBPACK_IMPORTED_MODULE_0___default.a.Artboard({
        parent: page,
        name: _file.replace('.svg', ''),
        frame: {
          x: x,
          y: y,
          width: artboardSize,
          height: artboardSize
        },
        exportFormats: [{
          fileFormat: 'svg'
        }]
      }); // load the svg file

      var svg = fs.readFileSync("".concat(rootDir, "/").concat(_file));
      var group = sketch__WEBPACK_IMPORTED_MODULE_0___default.a.createLayerFromData(svg, 'svg');

      var _iterator4 = _createForOfIteratorHelper(group.layers),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var layer = _step4.value;
          layer.frame.x += group.frame.x;
          layer.frame.y += group.frame.y;
          layer.parent = artboard;
        } // set the grid

      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      var grid = MSDefaultGrid.defaultGrid();
      grid.setGridSize(4);
      grid.setThickGridTimes(2);
      grid.setIsEnabled(true);
      artboard.sketchObject.setGrid(grid);
      col += 1;

      if (col >= numCols) {
        col = 0;
        row += 1;
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }

  sketch__WEBPACK_IMPORTED_MODULE_0___default.a.UI.message("Imported ".concat(names.length, " Glyps!"));
});

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "sketch":
/*!*************************!*\
  !*** external "sketch" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sketch");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ })

/******/ });
    if (key === 'default' && typeof exports === 'function') {
      exports(context);
    } else if (typeof exports[key] !== 'function') {
      throw new Error('Missing export named "' + key + '". Your command should contain something like `export function " + key +"() {}`.');
    } else {
      exports[key](context);
    }
  } catch (err) {
    if (typeof process !== 'undefined' && process.listenerCount && process.listenerCount('uncaughtException')) {
      process.emit("uncaughtException", err, "uncaughtException");
    } else {
      throw err
    }
  }
}
globalThis['onRun'] = __skpm_run.bind(this, 'default')

//# sourceMappingURL=__import.js.map