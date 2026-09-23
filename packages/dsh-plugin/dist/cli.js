#!/usr/bin/env node

// src/doctor/setup.ts
import { existsSync as existsSync3, readFileSync as readFileSync3, rmSync as rmSync2 } from "node:fs";

// ../../node_modules/.bun/js-yaml@4.3.2/node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon)
    return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence))
      return sequence;
    else if (isNothing(sequence))
      return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length;index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0;cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException)
    return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark)
      return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += `

` + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet)
    return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
      pos: position - lineStart + head.length
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer)
      return null;
    if (!options.maxLength)
      options.maxLength = 79;
    if (typeof options.indent !== "number")
      options.indent = 1;
    if (typeof options.linesBefore !== "number")
      options.linesBefore = 3;
    if (typeof options.linesAfter !== "number")
      options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0)
      foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1;i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + `
` + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + `
`;
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + `^
`;
    for (let i = 1;i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + `
`;
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType)
    return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema)
    return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length;index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit)
        implicit = implicit.concat(definition.implicit);
      if (definition.explicit)
        explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr)
    return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq)
    return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap)
    return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe)
    return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null)
    return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null)
      return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool)
    return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null)
      return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt)
    return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null)
      return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max)
      return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max)
        return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (;index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1")
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (;index < max; index++) {
          if (!isHexCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (;index < max; index++) {
          if (!isOctCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (;index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits)
      return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-")
        sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0")
      return 0;
    if (ch === "0") {
      if (value[1] === "b")
        return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x")
        return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o")
        return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat)
    return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  function resolveYamlFloat(data) {
    if (data === null)
      return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson)
    return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore)
    return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp)
    return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
  const YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
  function resolveYamlTimestamp(data) {
    if (data === null)
      return false;
    if (YAML_DATE_REGEXP.exec(data) !== null)
      return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
      return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null)
      match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null)
      throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 60000;
      if (match[9] === "-")
        delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta)
      date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge)
    return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary)
    return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function resolveYamlBinary(data) {
    if (data === null)
      return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64)
        continue;
      if (code < 0)
        return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0;idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap)
    return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null)
      return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]")
        return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey)
            pairHasKey = true;
          else
            return false;
        }
      }
      if (!pairHasKey)
        return false;
      if (_hasOwnProperty.call(objectKeys, pairKey))
        return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs)
    return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null)
      return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]")
        return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1)
        return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null)
      return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet)
    return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null)
      return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null)
          return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default)
    return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader)
    return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\x00";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "\t";
      case 9:
        return "\t";
      case 110:
        return `
`;
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0;i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0)
      return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length;index < length; index += 1) {
      const name = names[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1;index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length;_position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function chargeMergeWork(state) {
    state.totalMergeKeys++;
    if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    chargeMergeWork(state);
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
      const key = sourceKeys[index];
      chargeMergeWork(state);
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length;index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        if (valueNode.length > 100) {
          throwError(state, "abnormal merge sequence size");
        }
        for (let index = 0, quantity = valueNode.length;index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat(`
`, count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (;hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += `
`;
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat(`
`, emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat(`
`, emptyLines);
        }
      } else {
        state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33)
      return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38)
      return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42)
      return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent)) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length;typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch))
          break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0)
        readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += `
`;
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\x00");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\x00";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length;index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper)
    return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = "\\\"";
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null)
      return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length;index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf(`
`, position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== `
`)
        result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return `
` + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length;index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === `
`;
    const keep = clip && (string[string.length - 2] === `
` || string === `
`);
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + `
`;
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === `
` ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = function() {
      let nextLF = string.indexOf(`
`);
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    let prevMoreIndented = string[0] === `
` || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? `
` : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ")
      return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += `
` + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += `
`;
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + `
` + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536)
          result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "")
          _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "")
        pairBuffer += ", ";
      if (state.condenseFlow)
        pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024)
        pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length;index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid)
          return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0;index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length;i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length;i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs)
      getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true))
      return state.dump + `
`;
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml)
    return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
var yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
var {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;

// ../../node_modules/.bun/@deepseek-ai+cordis-plugin-loader@1.0.5+47273ca21af64088/node_modules/@deepseek-ai/cordis-plugin-loader/lib/index.js
import { createRequire } from "node:module";
import { Context, Inject, Service, composeError, resolveConfig } from "@deepseek-ai/cordis";

// ../../node_modules/.bun/@deepseek-ai+cosmokit@1.8.5/node_modules/@deepseek-ai/cosmokit/lib/index.js
function isNullable(value) {
  return value === null || value === undefined;
}
function isNonNullable(value) {
  return !isNullable(value);
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, {
    writable: true,
    value,
    enumerable: false
  });
}
var write = Symbol.for("cosmokit.volatile.write");
function isVolatile(value) {
  return typeof value === "object" && value !== null && write in value;
}
function volatileEntries(value) {
  const ancestors = /* @__PURE__ */ new Set;
  function visit(value, path) {
    if (isVolatile(value))
      return [{
        path,
        ref: value
      }];
    if (!value || typeof value !== "object" || ancestors.has(value))
      return [];
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
      return [];
    ancestors.add(value);
    try {
      return Object.entries(value).flatMap(([key, child]) => visit(child, [...path, key]));
    } finally {
      ancestors.delete(value);
    }
  }
  return visit(value, []);
}
function updateVolatile(target, source) {
  target[write](source.get());
}
function is(type, value) {
  if (arguments.length === 1)
    return (value) => is(type, value);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary) {
  Binary.is = isArrayBufferLike;
  Binary.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source))
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else
      return source;
  }
  Binary.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined")
      return Buffer.from(source).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0;i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  Binary.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined")
      return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined")
      return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined")
      return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0;i < hex.length; i += 2)
      buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function deepEqual(a, b, strict) {
  const ancestors = /* @__PURE__ */ new Set;
  function compare(a, b) {
    if (a === b)
      return true;
    if (isVolatile(a) || isVolatile(b))
      return isVolatile(a) && isVolatile(b);
    if (!strict && isNullable(a) && isNullable(b))
      return true;
    if (typeof a !== typeof b || typeof a !== "object" || !a || !b)
      return false;
    if (ancestors.has(a))
      return false;
    function check(test, then) {
      return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : undefined;
    }
    ancestors.add(a);
    try {
      return check(Array.isArray, (a, b) => {
        if (a.length !== b.length)
          return false;
        for (let index = 0;index < a.length; index++)
          if (!compare(a[index], b[index]))
            return false;
        return true;
      }) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("URL"), (a, b) => a.href === b.href) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
        if (a.byteLength !== b.byteLength)
          return false;
        const viewA = new Uint8Array(a);
        const viewB = new Uint8Array(b);
        for (let i = 0;i < viewA.length; i++)
          if (viewA[i] !== viewB[i])
            return false;
        return true;
      }) ?? ((!strict || [a, b].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({
        ...a,
        ...b
      }).every((key) => compare(a[key], b[key])));
    } finally {
      ancestors.delete(a);
    }
  }
  return compare(a, b);
}
var Time;
(function(Time) {
  Time.millisecond = 1;
  Time.second = 1000;
  Time.minute = Time.second * 60;
  Time.hour = Time.minute * 60;
  Time.day = Time.hour * 24;
  Time.week = Time.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date = /* @__PURE__ */ new Date, offset) {
    if (typeof date === "number")
      date = new Date(date);
    if (offset === undefined)
      offset = timezoneOffset;
    return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
  }
  Time.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date = new Date(value * Time.day);
    if (offset === undefined)
      offset = timezoneOffset;
    return new Date(+date + offset * Time.minute);
  }
  Time.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture)
      return 0;
    return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
  }
  Time.parseTime = parseTime;
  function parseDate(date) {
    const parsed = parseTime(date);
    if (parsed)
      date = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date))
      date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date))
      date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
    return date ? new Date(date) : /* @__PURE__ */ new Date;
  }
  Time.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time.day - Time.hour / 2)
      return Math.round(ms / Time.day) + "d";
    else if (abs >= Time.hour - Time.minute / 2)
      return Math.round(ms / Time.hour) + "h";
    else if (abs >= Time.minute - Time.second / 2)
      return Math.round(ms / Time.minute) + "m";
    else if (abs >= Time.second)
      return Math.round(ms / Time.second) + "s";
    return ms + "ms";
  }
  Time.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time.toDigits = toDigits;
  function template(template, time = /* @__PURE__ */ new Date) {
    return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time.template = template;
})(Time || (Time = {}));

// ../../node_modules/.bun/@deepseek-ai+cordis-plugin-loader@1.0.5+47273ca21af64088/node_modules/@deepseek-ai/cordis-plugin-loader/lib/index.js
var ModuleLoader;
(function(ModuleLoader) {
  let _cachedLoader;
  function requireInternal(id) {
    const require2 = createRequire(import.meta.url);
    if (process.execArgv.includes("--expose-internals"))
      try {
        return require2(id);
      } catch {}
    try {
      return require2("node-addon-require-builtin").requireBuiltin(id);
    } catch {}
  }
  function fromInternal() {
    if (_cachedLoader)
      return _cachedLoader;
    const [major] = process.versions.node.split(".").map(Number);
    if (major < 22)
      return;
    const raw = requireInternal("internal/modules/esm/loader")?.getOrInitializeCascadedLoader();
    if (!raw)
      return;
    const version = typeof raw.getOrCreateModuleJob === "function" ? "v2" : typeof raw.getModuleJobForImport === "function" ? "v1" : undefined;
    if (!version)
      return;
    return _cachedLoader = Object.assign(raw, { version });
  }
  ModuleLoader.fromInternal = fromInternal;
})(ModuleLoader || (ModuleLoader = {}));
var EntryGroup = class {
  ctx;
  tree;
  static key = Symbol.for("cordis.group");
  data = [];
  constructor(ctx, tree) {
    this.ctx = ctx;
    this.tree = tree;
    const entry = ctx.fiber.entry;
    if (entry)
      entry.subgroup = this;
  }
  get context() {
    return this.ctx;
  }
  async create(options) {
    const id = this.tree.ensureId(options);
    const entry = this.tree.store[id] ??= new Entry(this.ctx.loader);
    entry.parent = this;
    await entry.update(options, true, true);
    return entry.id;
  }
  unlink(options) {
    const config = this.data;
    const index = config.indexOf(options);
    if (index >= 0)
      config.splice(index, 1);
  }
  remove(id, isDispose = false) {
    const entry = this.tree.store[id];
    if (!entry)
      return;
    entry.fiber?.dispose();
    if (!isDispose)
      this.unlink(entry.options);
    delete this.tree.store[id];
    this.context.emit("loader/partial-dispose", entry, entry.options, false);
  }
  async update(config) {
    const oldConfig = this.data;
    this.data = config;
    const oldMap = Object.fromEntries(oldConfig.map((options) => [options.id, options]));
    const newMap = Object.fromEntries(config.map((options) => [options.id ?? Symbol("anonymous"), options]));
    const ids = Reflect.ownKeys({
      ...oldMap,
      ...newMap
    });
    await Promise.all(ids.map(async (id) => {
      if (newMap[id])
        await this.create(newMap[id]).catch((error) => {
          this.ctx.logger.error(error);
        });
      else
        this.remove(id);
    }));
  }
  stop() {
    for (const options of this.data)
      this.remove(options.id, true);
  }
};
var Group = class extends EntryGroup {
  ctx;
  config;
  static initial = [];
  static [EntryGroup.key] = true;
  constructor(ctx, config) {
    super(ctx, ctx.fiber.entry.parent.tree);
    this.ctx = ctx;
    this.config = config;
    ctx.on("internal/update", (config) => {
      this.update(config);
    });
  }
  async* [Service.init]() {
    yield () => this.stop();
    await this.update(this.config);
  }
};
var __rewriteRelativeImportExtension = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path))
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  return path;
};
var EntryTree = class EntryTree {
  static sep = ":";
  ctx;
  enableLogs;
  root;
  store = Object.create(null);
  constructor(ctx) {
    this.ctx = ctx.extend({ baseUrl: ctx.baseUrl });
    this.root = new EntryGroup(this.ctx, this);
    const entry = this.ctx.fiber.entry;
    if (entry)
      entry.subtree = this;
  }
  get context() {
    return this.ctx;
  }
  *entries() {
    for (const entry of Object.values(this.store)) {
      yield entry;
      if (!entry.subtree)
        continue;
      yield* entry.subtree.entries();
    }
  }
  getTasks() {
    return [...this.entries()].map((entry) => entry._initTask || entry.fiber?.inertia).filter(isNonNullable);
  }
  async await() {
    while (true) {
      const tasks = this.getTasks();
      if (!tasks.length)
        return;
      await Promise.allSettled(tasks);
    }
  }
  ensureId(options) {
    if (!options.id)
      do
        options.id = Math.random().toString(16).slice(2, 10);
      while (this.store[options.id]);
    return options.id;
  }
  resolve(id) {
    const parts = id.split(EntryTree.sep);
    let tree = this;
    const final = parts.pop();
    for (const part of parts) {
      tree = tree.store[part]?.subtree;
      if (!tree)
        throw new Error(`cannot resolve entry ${id}`);
    }
    const entry = tree.store[final];
    if (!entry)
      throw new Error(`cannot resolve entry ${id}`);
    return entry;
  }
  resolveGroup(id) {
    if (!id)
      return this.root;
    const entry = this.resolve(id);
    if (!entry.subgroup)
      throw new Error(`entry ${id} is not a group`);
    return entry.subgroup;
  }
  async create(options, parent = null, position = Infinity) {
    const group = this.resolveGroup(parent);
    group.data.splice(position, 0, options);
    group.tree.write();
    return group.create(options);
  }
  remove(id) {
    const entry = this.resolve(id);
    entry.parent.remove(id);
    entry.parent.tree.write();
  }
  async update(id, options, parent, position) {
    const entry = this.resolve(id);
    const source = entry.parent;
    if (parent !== undefined) {
      const target = this.resolveGroup(parent);
      source.unlink(entry.options);
      target.data.splice(position ?? Infinity, 0, entry.options);
      target.tree.write();
      entry.parent = target;
    }
    source.tree.write();
    return entry.update(options, false, true);
  }
  import(name, getOuterStack) {
    if (name.startsWith("cordis:"))
      return this.ctx.loader.builtins[name.slice(7)];
    return composeError(async (info) => {
      info.offset += 3;
      if (this.ctx.loader.internal)
        return await this.ctx.loader.internal.import(name, this.ctx.baseUrl, {});
      else if (name.startsWith("."))
        return await import(__rewriteRelativeImportExtension(new URL(name, this.ctx.baseUrl).href));
      else
        return await import(__rewriteRelativeImportExtension(name));
    }, getOuterStack);
  }
};
var evaluate = new Function("ctx", "expr", `
  with (ctx) {
    return eval(expr)
  }
`);
function interpolate(ctx, value) {
  if (isJsExpr(value))
    return evaluate(ctx, value.__jsExpr);
  else if (!value || typeof value !== "object")
    return value;
  else if (Array.isArray(value))
    return value.map((item) => interpolate(ctx, item));
  else
    return mapValues(value, (item) => interpolate(ctx, item));
}
function isJsExpr(value) {
  return value instanceof Object && "__jsExpr" in value;
}
function isSchemastery(schema) {
  return schema?.["~standard"].vendor === "schemastery";
}
function isRecord(value) {
  if (!value || typeof value !== "object" || isJsExpr(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function equal(a, b, schema, ancestors) {
  if (schema?.meta?.volatile)
    return true;
  if (schema?.type !== "object" || !schema.dict || ancestors.has(schema))
    return deepEqual(a, b, true);
  const left = a ?? schema.meta?.default;
  const right = b ?? schema.meta?.default;
  if (!isRecord(left) || !isRecord(right))
    return deepEqual(left, right, true);
  const { dict } = schema;
  ancestors.add(schema);
  try {
    return Object.keys({
      ...left,
      ...right
    }).every((key) => equal(left[key], right[key], Object.hasOwn(dict, key) ? dict[key] : undefined, ancestors));
  } finally {
    ancestors.delete(schema);
  }
}
function equalExceptVolatile(previous, next, schema) {
  return isSchemastery(schema) ? equal(previous, next, schema, /* @__PURE__ */ new Set) : deepEqual(previous, next, true);
}
function takeEntries(object, keys) {
  const result = [];
  for (const key of keys) {
    if (!(key in object))
      continue;
    result.push([key, object[key]]);
    delete object[key];
  }
  return result;
}
function sortKeys(object, prepend = ["id", "name"], append = ["config"]) {
  const part1 = takeEntries(object, prepend);
  const part2 = takeEntries(object, append);
  const rest = takeEntries(object, Object.keys(object)).sort(([a], [b]) => a.localeCompare(b));
  return Object.assign(object, Object.fromEntries([
    ...part1,
    ...rest,
    ...part2
  ]));
}
var Entry = class Entry {
  loader;
  static key = Symbol.for("cordis.entry");
  ctx;
  fiber;
  parent;
  options = {};
  subgroup;
  subtree;
  _initTask;
  constructor(loader) {
    this.loader = loader;
    this.ctx = loader.ctx.extend({ [Entry.key]: this });
    this.context.emit("loader/entry-init", this);
  }
  get context() {
    return this.ctx;
  }
  get id() {
    let id = this.options.id;
    if (this.parent.tree.ctx.fiber.entry)
      id = this.parent.tree.ctx.fiber.entry.id + EntryTree.sep + id;
    return id;
  }
  get disabled() {
    if (this.options.group)
      return false;
    let entry = this;
    do {
      if (this.disabledOf(entry.options))
        return true;
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
    return false;
  }
  disabledOf(options) {
    return isJsExpr(options.disabled) ? Boolean(this.evaluate(options.disabled.__jsExpr)) : Boolean(options.disabled);
  }
  evaluate(expr) {
    return evaluate(this.ctx, expr);
  }
  _patchContext(diff) {
    this.context.waterfall("loader/patch-context", this, () => {
      Object.setPrototypeOf(this.ctx, this.parent.ctx);
      if (this.fiber?.uid && (diff.includes("config") || this.options.group))
        this.fiber.update(this.options.config, true);
    });
  }
  async refresh() {
    if (this.fiber)
      return;
    if (this.disabled)
      return;
    await this.init();
  }
  async update(options, create = false, force = false) {
    const legacy = { ...this.options };
    if (create)
      this.options = options;
    else
      for (const [key, value] of Object.entries(options))
        if (isNullable(value))
          delete this.options[key];
        else
          this.options[key] = value;
    sortKeys(this.options);
    if (this.disabled) {
      this.fiber?.dispose();
      return;
    }
    if (this.fiber?.uid) {
      const changes = Object.keys({
        ...this.options,
        ...legacy
      }).filter((key) => !deepEqual(this.options[key], legacy[key], key === "config"));
      const volatileOnly = changes.length === 1 && changes[0] === "config" && this.fiber.state === 2 && Object.getPrototypeOf(this.ctx) === this.parent.ctx && equalExceptVolatile(legacy.config, this.options.config, this.fiber.runtime?.Config);
      if (volatileOnly)
        this.fiber._config = this.options.config;
      const pending = volatileOnly && this._commitVolatile() ? [] : changes;
      if (!pending.length && !force)
        return;
      this.context.emit("loader/partial-dispose", this, legacy, true);
      this._patchContext(pending);
    } else
      await this.init();
  }
  _commitVolatile() {
    const fiber = this.fiber;
    const refs = volatileEntries(fiber.config);
    if (!refs.length)
      return true;
    const raw = this.options.config;
    let candidate;
    try {
      candidate = resolveConfig(fiber.runtime, fiber.ctx.waterfall(fiber, "internal/config", raw, () => raw));
    } catch (error) {
      this.ctx.logger.warn("volatile config update failed for %C", this.options.id);
      this.ctx.logger.warn(error);
      return true;
    }
    if (!deepEqual(fiber.config, candidate, true)) {
      this.ctx.logger.debug("ordinary config values of %C changed with its volatile values; applying the ordinary update", this.options.id);
      return false;
    }
    const paths = refs.flatMap(({ path, ref }) => {
      const source = path.reduce((value, key) => Reflect.get(value, key), candidate);
      if (deepEqual(ref.get(), source.get(), true))
        return [];
      updateVolatile(ref, source);
      return [path];
    });
    if (!paths.length)
      return true;
    const self = Object.create(fiber.ctx);
    self[Context.filter] = (owner) => owner.fiber === fiber;
    try {
      fiber.ctx.emit(self, "loader/volatile-update", paths);
    } catch (error) {
      this.ctx.logger.warn(error);
    }
    return true;
  }
  getOuterStack = () => {
    let entry = this;
    const result = [];
    do {
      result.push(`    at ${entry.parent.tree.ctx.baseUrl}#${entry.options.id}`);
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
    return result;
  };
  async init() {
    try {
      await (this._initTask ??= this._init());
    } finally {
      this._initTask = undefined;
    }
    const notify = () => {
      if (this.loader.getTasks().length)
        return;
      this.ctx.reflect.notify(["loader"]);
    };
    this.fiber?.await().then(notify, notify);
  }
  async _init() {
    let exports;
    try {
      exports = await this.parent.tree.import(this.options.name, this.getOuterStack);
    } catch (error) {
      this.ctx.logger.error(error);
      return;
    } finally {
      this._initTask = undefined;
    }
    const plugin = this.loader.unwrapExports(exports);
    this._patchContext([]);
    this.loader.showLog(this, "apply");
    this.fiber = this.ctx.registry.plugin(plugin, this.options.config, this.getOuterStack).ctx.fiber;
  }
};
function swap(target, source) {
  for (const key of Reflect.ownKeys(target))
    Reflect.deleteProperty(target, key);
  for (const key of Reflect.ownKeys(source || {}))
    Reflect.defineProperty(target, key, Reflect.getOwnPropertyDescriptor(source, key));
}
var Realm = class {
  store = Object.create(null);
  access(key, create = false) {
    if (create)
      return this.store[key] ??= Symbol(`${key}${this.suffix}`);
    else
      return this.store[key] ?? Symbol(`${key}${this.suffix}`);
  }
  delete(key) {
    delete this.store[key];
  }
  get size() {
    return Object.keys(this.store).length;
  }
};
var LocalRealm = class extends Realm {
  entry;
  constructor(entry) {
    super();
    this.entry = entry;
  }
  get suffix() {
    return "#" + this.entry.options.id;
  }
};
var GlobalRealm = class extends Realm {
  label;
  constructor(label) {
    super();
    this.label = label;
  }
  get suffix() {
    return "@" + this.label;
  }
};
function isolate(ctx) {
  const realms = Object.create(null);
  const delims = Object.create(null);
  function access(entry, name, create = false) {
    let realm;
    const label = entry.options.isolate?.[name];
    if (!label)
      return;
    if (label === true)
      realm = entry.realm ??= new LocalRealm(entry);
    else if (create)
      realm = realms[label] ??= new GlobalRealm(label);
    else
      realm = realms[label];
    return realm?.access(name, create);
  }
  ctx.on("loader/entry-init", (entry) => {
    entry.ctx[Context.intercept] = Object.create(entry.ctx[Context.intercept]);
    entry.ctx[Context.isolate] = Object.create(entry.ctx[Context.isolate]);
  });
  ctx.on("loader/patch-context", (entry, next) => {
    const newMap = Object.create(entry.parent.ctx[Context.isolate]);
    for (const name of Object.keys(entry.options.isolate ?? {}))
      newMap[name] = access(entry, name, true);
    const diff = Object.create(null);
    const oldMap = entry.ctx[Context.isolate];
    for (const name in {
      ...newMap,
      ...delims
    }) {
      if (newMap[name] === oldMap[name])
        continue;
      const delim = delims[name] ??= Symbol(`delim:${name}`);
      entry.ctx[delim] = Symbol(`${name}#${entry.id}`);
      for (const symbol of [oldMap[name], newMap[name]]) {
        const impl = symbol && entry.ctx.reflect.store[symbol];
        if (!impl)
          continue;
        if (!impl.fiber) {
          entry.ctx.logger.warn(/* @__PURE__ */ new Error(`expected service ${name} to be implemented`));
          continue;
        }
        diff[name] = [
          oldMap[name],
          newMap[name],
          entry.ctx[delim],
          impl.fiber.ctx[delim]
        ];
        if (entry.ctx[delim] !== impl.fiber.ctx[delim])
          break;
      }
    }
    Object.setPrototypeOf(entry.ctx[Context.isolate], entry.parent.ctx[Context.isolate]);
    Object.setPrototypeOf(entry.ctx[Context.intercept], entry.parent.ctx[Context.intercept]);
    swap(entry.ctx[Context.isolate], newMap);
    swap(entry.ctx[Context.intercept], entry.options.intercept);
    next();
    for (const [symbol1, symbol2, flag1, flag2] of Object.values(diff))
      if (flag1 === flag2 && entry.ctx.reflect.store[symbol1] && !entry.ctx.reflect.store[symbol2]) {
        entry.ctx.reflect.store[symbol2] = entry.ctx.reflect.store[symbol1];
        delete entry.ctx.reflect.store[symbol1];
      }
    ctx.reflect.notify(Object.keys(diff), (ctx, name) => {
      const [symbol1, symbol2, flag1, flag2] = diff[name];
      const symbol3 = ctx[Context.isolate][name];
      const flag3 = ctx[delims[name]];
      return (symbol1 === symbol3 || symbol2 === symbol3) && flag1 === flag3 !== (flag1 === flag2);
    });
    for (const name in delims)
      if (!Reflect.ownKeys(newMap).includes(name))
        delete entry.ctx[delims[name]];
  });
  ctx.on("loader/partial-dispose", (entry, legacy, active) => {
    for (const [name, label] of Object.entries(legacy.isolate ?? {})) {
      if (label === true)
        continue;
      if (active && entry.options.isolate?.[name] === label)
        continue;
      const realm = realms[label];
      if (!realm)
        continue;
      for (const entry of ctx.loader.entries())
        if (entry.options.isolate?.[name] === realm.label)
          return;
      realm.delete(name);
      if (!realm.size)
        delete realms[realm.label];
    }
  });
}
var Loader = class extends EntryTree {
  config;
  envData = process.env.CORDIS_SHARED ? JSON.parse(process.env.CORDIS_SHARED) : { startTime: Date.now() };
  name = "loader";
  internal = ModuleLoader.fromInternal();
  builtins = Object.create(null);
  constructor(ctx, config = {}) {
    super(ctx);
    this.config = config;
    if (config.baseUrl)
      this.ctx.baseUrl = config.baseUrl;
    const self = this;
    defineProperty(this, Service.tracker, {
      associate: "loader",
      property: "ctx",
      noShadow: true
    });
    ctx.reflect.provide("loader", this, this[Service.check]);
    ctx.on("internal/config", function(_config, next) {
      const config = next();
      if (!this.entry || this.parent.fiber?.entry === this.entry)
        return config;
      if (this.runtime?.callback?.[EntryGroup.key])
        return config;
      return interpolate(this.ctx, config);
    }, { global: true });
    ctx.on("internal/update", function(config, noSave, next) {
      if (!this.entry || noSave || this.parent.fiber?.entry === this.entry)
        return next();
      const unparse = this.runtime?.Config?.["simplify"];
      this.entry.options.config = unparse ? unparse.call(this.runtime.Config, config) : config;
      this.entry.parent.tree.write();
      return next();
    }, {
      global: true,
      prepend: true
    });
    ctx.on("internal/update", function(config, _, next) {
      if (!this.entry || this.parent.fiber?.entry === this.entry)
        return next();
      self.showLog(this.entry, "reload");
      return next();
    }, { global: true });
    ctx.on("internal/plugin", (fiber) => {
      if (fiber.parent[Entry.key] && !fiber.entry) {
        fiber.entry = fiber.parent[Entry.key];
        Inject.resolve(fiber.entry.options.inject, fiber.inject);
      }
      if (fiber.uid)
        return;
      if (!fiber.entry)
        return;
      if (fiber.parent.fiber?.entry === fiber.entry)
        return;
      if (!ctx.registry.has(fiber.runtime.callback))
        return;
      const treeOwner = fiber.entry.parent.tree.ctx.fiber;
      if (!treeOwner.uid || treeOwner.state === 5)
        return;
      this.showLog(fiber.entry, "unload");
      if (fiber.entry.disabled)
        return;
      fiber.entry.options.disabled = true;
      fiber.entry.parent.tree.write();
    });
    ctx.plugin(isolate);
  }
  write() {}
  [Service.check]() {
    if (Service.prototype[Service.resolveConfig].call(this).await && this.getTasks().length)
      return false;
    return true;
  }
  showLog(entry, type) {
    if (entry.options.group || !entry.parent.tree.enableLogs)
      return;
    this.ctx.root.logger?.("loader").info("%s plugin %C", type, entry.options.name);
  }
  locate(fiber = this.ctx.fiber) {
    while (true) {
      if (fiber.entry)
        return fiber.entry.id;
      const next = fiber.parent.fiber;
      if (fiber === next)
        return;
      fiber = next;
    }
  }
  exit() {}
  unwrapExports(exports) {
    if (isNullable(exports))
      return exports;
    exports = exports.default ?? exports;
    if (!exports.__esModule)
      return exports;
    return exports.default ?? exports;
  }
};

// ../../node_modules/.bun/@deepseek-ai+cordis-plugin-include@1.0.9+d5948656e09941b7/node_modules/@deepseek-ai/cordis-plugin-include/lib/index.js
import { Service as Service2 } from "@deepseek-ai/cordis";
import { extname } from "node:path";
import { access, constants, readFile, rename, writeFile } from "node:fs/promises";
import { setTimeout as setTimeout$1 } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
var __rewriteRelativeImportExtension2 = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path))
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  return path;
};
var JsExpr = new Type("tag:yaml.org,2002:js", {
  kind: "scalar",
  resolve: (data) => typeof data === "string",
  construct: (data) => ({ __jsExpr: data }),
  predicate: isJsExpr,
  represent: (data) => data["__jsExpr"]
});
var entryListSchema = JSON_SCHEMA.extend(JsExpr);
var schema2 = entryListSchema;
var writable = {
  ".json": "application/json",
  ".yaml": "application/yaml",
  ".yml": "application/yaml"
};
var supported = new Set(Object.keys(writable));
var WRITE_RETRY_LIMIT = 10;
var WRITE_RETRY_DELAY_MS = 50;
function retryableWriteError(error) {
  const code = error?.code;
  return code === "EACCES" || code === "EBUSY" || code === "EPERM";
}
function applyEntryPatches(data, patches, warn) {
  if (!patches?.length)
    return [...data];
  data = structuredClone(data);
  const entryMap = /* @__PURE__ */ new Map;
  const buildMap = (entries) => {
    for (const entry of entries) {
      if (entry.id)
        entryMap.set(entry.id, entry);
      if (entry.group && Array.isArray(entry.config))
        buildMap(entry.config);
    }
  };
  buildMap(data);
  for (const patch of patches) {
    const { id, insert, name, ...overrides } = patch;
    if (insert) {
      if (id) {
        const target = entryMap.get(id);
        if (!target) {
          warn("patch insert: entry %C not found", id);
          continue;
        }
        if (!target.group) {
          warn("patch insert: entry %C is not a group", id);
          continue;
        }
        if (!Array.isArray(target.config))
          target.config = [];
        target.config.push(...insert);
      } else
        data.push(...insert);
      buildMap(insert);
      continue;
    }
    if (!id) {
      warn("patch: id is required for non-insert patches");
      continue;
    }
    const target = entryMap.get(id);
    if (!target) {
      warn("patch: entry %C not found", id);
      continue;
    }
    if (name && name !== target.name) {
      warn("patch: name mismatch for %C (expected %C, got %C), skipping", id, target.name, name);
      continue;
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (key === "id")
        continue;
      target[key] = value;
    }
  }
  return data;
}
var Include = class extends EntryTree {
  config;
  static inject = ["loader"];
  static [EntryGroup.key] = true;
  filename;
  type;
  readonly;
  content;
  data;
  writeTask;
  pendingWrite;
  writeQueue = Promise.resolve();
  constructor(ctx, config) {
    super(ctx);
    this.config = config;
    this.enableLogs = config.enableLogs ?? ctx.fiber.entry?.parent.tree.enableLogs ?? false;
    this.filename = fileURLToPath(new URL(this.config.path, this.ctx.baseUrl));
    const ext = extname(this.filename);
    if (!supported.has(ext))
      throw new Error(`extension "${ext}" not supported`);
    this.type = writable[ext];
    this.readonly = !this.type;
    this.ctx.baseUrl = new URL(".", pathToFileURL(this.filename)).href;
    ctx.on("internal/update", (config, _, next) => {
      if (config.path !== this.config.path)
        return next();
      this.config = config;
      this.root.update(this.applyPatches(this.data, config.patches)).catch((error) => {
        this.ctx.logger.warn("config update at %C failed", this.filename);
        this.ctx.logger.warn(error);
      });
    });
  }
  async checkAccess() {
    if (!this.type)
      return;
    try {
      await access(this.filename, constants.W_OK);
    } catch {
      this.readonly = true;
    }
  }
  async read(forced = false) {
    const content = await readFile(this.filename, "utf8");
    if (!forced && this.content === content)
      return false;
    let data;
    if (this.type === "application/yaml")
      data = load(content, { schema: entryListSchema });
    else if (this.type === "application/json")
      data = JSON.parse(content);
    else {
      const module = await import(__rewriteRelativeImportExtension2(this.filename));
      data = module.default || module;
    }
    if (!Array.isArray(data))
      throw new TypeError(`config file must be a top-level array of entries: ${this.filename}`);
    this.content = content;
    this.data = data;
    await this.checkAccess();
    return true;
  }
  applyPatches(data, patches = this.config.patches) {
    return applyEntryPatches(data, patches, (message, ...args) => {
      this.ctx.root.logger?.("loader").warn(message, ...args);
    });
  }
  async* [Service2.init]() {
    try {
      await this.read();
    } catch (error) {
      if (error?.code !== "ENOENT")
        throw error;
      if (this.config.initial) {
        await this._writeFile(this.config.initial);
        await this.read(true);
      } else
        throw new Error(`config file not found: ${this.filename}`);
    }
    yield () => this.stop();
    await this.root.update(this.applyPatches(this.data));
  }
  async stop() {
    try {
      await this.flushWrite();
    } finally {
      this.root.stop();
      await this.flushWrite();
    }
  }
  async refresh() {
    try {
      if (!await this.read())
        return;
      await this.root.update(this.applyPatches(this.data));
    } catch (error) {
      this.ctx.logger.warn("config reload at %C failed; keeping the running tree", this.filename);
      this.ctx.logger.warn(error);
    }
  }
  async _writeFile(config) {
    if (this.readonly)
      throw new Error(`cannot overwrite readonly config`);
    if (this.type === "application/yaml")
      this.content = dump(config, { schema: schema2 });
    else if (this.type === "application/json")
      this.content = JSON.stringify(config, null, 2);
    await writeFile(this.filename + ".tmp", this.content);
    for (let retry = 0;; retry++)
      try {
        await rename(this.filename + ".tmp", this.filename);
        return;
      } catch (error) {
        if (!retryableWriteError(error) || retry >= WRITE_RETRY_LIMIT)
          throw error;
        await setTimeout$1((retry + 1) * WRITE_RETRY_DELAY_MS);
      }
  }
  writeFile(config) {
    clearTimeout(this.writeTask);
    this.pendingWrite = config;
    this.writeTask = setTimeout(() => {
      this.flushWrite();
    }, 0);
  }
  flushWrite() {
    clearTimeout(this.writeTask);
    this.writeTask = undefined;
    const config = this.pendingWrite;
    this.pendingWrite = undefined;
    if (config === undefined)
      return this.writeQueue;
    const run = this.writeQueue.then(() => this._writeFile(config), () => this._writeFile(config));
    this.writeQueue = run;
    run.catch((error) => {
      this.ctx.root.logger?.("loader").warn("failed to write config file %C", this.filename);
      this.ctx.root.logger?.("loader").warn(error);
    });
    return run;
  }
  write() {
    this.context.emit("loader/config-update");
    return this.writeFile(this.root.data);
  }
};

// ../plugin/src/config/migrate-config-location.ts
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value = value * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value = value * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value = value * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value = -1;
    }
    return value;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start, pos);
      }
    }
    let end = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start, end);
  }
  function scanString() {
    let result = "", start = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += `
`;
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "\t";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += `
`;
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      case 47:
        const start = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes) {
  CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
  CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes[CharacterCodes["space"] = 32] = "space";
  CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
  CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
  CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
  CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
  CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
  CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
  CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
  CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
  CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
  CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
  CharacterCodes[CharacterCodes["a"] = 97] = "a";
  CharacterCodes[CharacterCodes["b"] = 98] = "b";
  CharacterCodes[CharacterCodes["c"] = 99] = "c";
  CharacterCodes[CharacterCodes["d"] = 100] = "d";
  CharacterCodes[CharacterCodes["e"] = 101] = "e";
  CharacterCodes[CharacterCodes["f"] = 102] = "f";
  CharacterCodes[CharacterCodes["g"] = 103] = "g";
  CharacterCodes[CharacterCodes["h"] = 104] = "h";
  CharacterCodes[CharacterCodes["i"] = 105] = "i";
  CharacterCodes[CharacterCodes["j"] = 106] = "j";
  CharacterCodes[CharacterCodes["k"] = 107] = "k";
  CharacterCodes[CharacterCodes["l"] = 108] = "l";
  CharacterCodes[CharacterCodes["m"] = 109] = "m";
  CharacterCodes[CharacterCodes["n"] = 110] = "n";
  CharacterCodes[CharacterCodes["o"] = 111] = "o";
  CharacterCodes[CharacterCodes["p"] = 112] = "p";
  CharacterCodes[CharacterCodes["q"] = 113] = "q";
  CharacterCodes[CharacterCodes["r"] = 114] = "r";
  CharacterCodes[CharacterCodes["s"] = 115] = "s";
  CharacterCodes[CharacterCodes["t"] = 116] = "t";
  CharacterCodes[CharacterCodes["u"] = 117] = "u";
  CharacterCodes[CharacterCodes["v"] = 118] = "v";
  CharacterCodes[CharacterCodes["w"] = 119] = "w";
  CharacterCodes[CharacterCodes["x"] = 120] = "x";
  CharacterCodes[CharacterCodes["y"] = 121] = "y";
  CharacterCodes[CharacterCodes["z"] = 122] = "z";
  CharacterCodes[CharacterCodes["A"] = 65] = "A";
  CharacterCodes[CharacterCodes["B"] = 66] = "B";
  CharacterCodes[CharacterCodes["C"] = 67] = "C";
  CharacterCodes[CharacterCodes["D"] = 68] = "D";
  CharacterCodes[CharacterCodes["E"] = 69] = "E";
  CharacterCodes[CharacterCodes["F"] = 70] = "F";
  CharacterCodes[CharacterCodes["G"] = 71] = "G";
  CharacterCodes[CharacterCodes["H"] = 72] = "H";
  CharacterCodes[CharacterCodes["I"] = 73] = "I";
  CharacterCodes[CharacterCodes["J"] = 74] = "J";
  CharacterCodes[CharacterCodes["K"] = 75] = "K";
  CharacterCodes[CharacterCodes["L"] = 76] = "L";
  CharacterCodes[CharacterCodes["M"] = 77] = "M";
  CharacterCodes[CharacterCodes["N"] = 78] = "N";
  CharacterCodes[CharacterCodes["O"] = 79] = "O";
  CharacterCodes[CharacterCodes["P"] = 80] = "P";
  CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
  CharacterCodes[CharacterCodes["R"] = 82] = "R";
  CharacterCodes[CharacterCodes["S"] = 83] = "S";
  CharacterCodes[CharacterCodes["T"] = 84] = "T";
  CharacterCodes[CharacterCodes["U"] = 85] = "U";
  CharacterCodes[CharacterCodes["V"] = 86] = "V";
  CharacterCodes[CharacterCodes["W"] = 87] = "W";
  CharacterCodes[CharacterCodes["X"] = 88] = "X";
  CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
  CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
  CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
  CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
  CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
  CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
  CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
  CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
  CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
  CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
  CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
  CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
  CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
  CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
  CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
  CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + " ".repeat(index);
    })
  },
  "\t": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + "\t".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "\t".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + "\t".repeat(index);
    })
  }
};
var supportedEols = [`
`, "\r", `\r
`];

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/format.js
function format(documentText, range, options) {
  let initialIndentLevel;
  let formatText;
  let formatTextStart;
  let rangeStart;
  let rangeEnd;
  if (range) {
    rangeStart = range.offset;
    rangeEnd = rangeStart + range.length;
    formatTextStart = rangeStart;
    while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
      formatTextStart--;
    }
    let endOffset = rangeEnd;
    while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
      endOffset++;
    }
    formatText = documentText.substring(formatTextStart, endOffset);
    initialIndentLevel = computeIndentLevel(formatText, options);
  } else {
    formatText = documentText;
    initialIndentLevel = 0;
    formatTextStart = 0;
    rangeStart = 0;
    rangeEnd = documentText.length;
  }
  const eol = getEOL(options, documentText);
  const eolFastPathSupported = supportedEols.includes(eol);
  let numberLineBreaks = 0;
  let indentLevel = 0;
  let indentValue;
  if (options.insertSpaces) {
    indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
  } else {
    indentValue = "\t";
  }
  const indentType = indentValue === "\t" ? "\t" : " ";
  let scanner = createScanner(formatText, false);
  let hasError = false;
  function newLinesAndIndent() {
    if (numberLineBreaks > 1) {
      return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
    if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) {
      return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    if (amountOfSpaces <= 0) {
      return eol;
    }
    return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
  }
  function scanNext() {
    let token = scanner.scan();
    numberLineBreaks = 0;
    while (token === 15 || token === 14) {
      if (token === 14 && options.keepLines) {
        numberLineBreaks += 1;
      } else if (token === 14) {
        numberLineBreaks = 1;
      }
      token = scanner.scan();
    }
    hasError = token === 16 || scanner.getTokenError() !== 0;
    return token;
  }
  const editOperations = [];
  function addEdit(text, startOffset, endOffset) {
    if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) {
      editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
    }
  }
  let firstToken = scanNext();
  if (options.keepLines && numberLineBreaks > 0) {
    addEdit(repeat(eol, numberLineBreaks), 0, 0);
  }
  if (firstToken !== 17) {
    let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
    let initialIndent = indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel);
    addEdit(initialIndent, formatTextStart, firstTokenStart);
  }
  while (firstToken !== 17) {
    let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
    let secondToken = scanNext();
    let replaceContent = "";
    let needsLineBreak = false;
    while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
      let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
      addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
      firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
      needsLineBreak = secondToken === 12;
      replaceContent = needsLineBreak ? newLinesAndIndent() : "";
      secondToken = scanNext();
    }
    if (secondToken === 2) {
      if (firstToken !== 1) {
        indentLevel--;
      }
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else if (secondToken === 4) {
      if (firstToken !== 3) {
        indentLevel--;
      }
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else {
      switch (firstToken) {
        case 3:
        case 1:
          indentLevel++;
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 5:
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 12:
          replaceContent = newLinesAndIndent();
          break;
        case 13:
          if (numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 6:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 10:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (secondToken === 6 && !needsLineBreak) {
            replaceContent = "";
          }
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else {
            if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) {
              replaceContent = cachedSpaces[1];
            } else if (secondToken !== 5 && secondToken !== 17) {
              hasError = true;
            }
          }
          break;
        case 16:
          hasError = true;
          break;
      }
      if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) {
        replaceContent = newLinesAndIndent();
      }
    }
    if (secondToken === 17) {
      if (options.keepLines && numberLineBreaks > 0) {
        replaceContent = newLinesAndIndent();
      } else {
        replaceContent = options.insertFinalNewline ? eol : "";
      }
    }
    const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
    addEdit(replaceContent, firstTokenEnd, secondTokenStart);
    firstToken = secondToken;
  }
  return editOperations;
}
function repeat(s, count) {
  let result = "";
  for (let i = 0;i < count; i++) {
    result += s;
  }
  return result;
}
function computeIndentLevel(content, options) {
  let i = 0;
  let nChars = 0;
  const tabSize = options.tabSize || 4;
  while (i < content.length) {
    let ch = content.charAt(i);
    if (ch === cachedSpaces[1]) {
      nChars++;
    } else if (ch === "\t") {
      nChars += tabSize;
    } else {
      break;
    }
    i++;
  }
  return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
  for (let i = 0;i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === "\r") {
      if (i + 1 < text.length && text.charAt(i + 1) === `
`) {
        return `\r
`;
      }
      return "\r";
    } else if (ch === `
`) {
      return `
`;
    }
  }
  return options && options.eol || `
`;
}
function isEOL(text, offset) {
  return `\r
`.indexOf(text.charAt(offset)) !== -1;
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions) {
  ParseOptions.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentParent = { type: "array", offset: -1, length: -1, children: [], parent: undefined };
  function ensurePropertyComplete(endOffset) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent;
    }
  }
  function onValue(valueNode) {
    currentParent.children.push(valueNode);
    return valueNode;
  }
  const visitor = {
    onObjectBegin: (offset) => {
      currentParent = onValue({ type: "object", offset, length: -1, parent: currentParent, children: [] });
    },
    onObjectProperty: (name, offset, length) => {
      currentParent = onValue({ type: "property", offset, length: -1, parent: currentParent, children: [] });
      currentParent.children.push({ type: "string", value: name, offset, length, parent: currentParent });
    },
    onObjectEnd: (offset, length) => {
      ensurePropertyComplete(offset + length);
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset, length) => {
      currentParent = onValue({ type: "array", offset, length: -1, parent: currentParent, children: [] });
    },
    onArrayEnd: (offset, length) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value, offset, length) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep, offset, length) => {
      if (currentParent.type === "property") {
        if (sep === ":") {
          currentParent.colonOffset = offset;
        } else if (sep === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  const result = currentParent.children[0];
  if (result) {
    delete result.parent;
  }
  return result;
}
function findNodeAtLocation(root, path) {
  if (!root) {
    return;
  }
  let node = root;
  for (let segment of path) {
    if (typeof segment === "string") {
      if (node.type !== "object" || !Array.isArray(node.children)) {
        return;
      }
      let found = false;
      for (const propertyNode of node.children) {
        if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment && propertyNode.children.length === 2) {
          node = propertyNode.children[1];
          found = true;
          break;
        }
      }
      if (!found) {
        return;
      }
    } else {
      const index = segment;
      if (node.type !== "array" || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
        return;
      }
      node = node.children[index];
    }
  }
  return node;
}
function getNodeValue(node) {
  switch (node.type) {
    case "array":
      return node.children.map(getNodeValue);
    case "object":
      const obj = Object.create(null);
      for (let prop of node.children) {
        const valueNode = prop.children[1];
        if (valueNode) {
          obj[prop.children[0].value] = getNodeValue(valueNode);
        }
      }
      return obj;
    case "null":
    case "string":
    case "number":
    case "boolean":
      return node.value;
    default:
      return;
  }
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(14);
          break;
        case 5:
          handleError(15);
          break;
        case 3:
          handleError(13);
          break;
        case 1:
          if (!disallowComments) {
            handleError(11);
          }
          break;
        case 2:
          handleError(12);
          break;
        case 6:
          handleError(16);
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(10);
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(1);
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(2);
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [2, 5]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [2, 5]);
      }
    } else {
      handleError(5, [], [2, 5]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [2, 5]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [2], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [4, 5]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [4], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}
function getNodeType(value) {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/edit.js
function setProperty(text, originalPath, value, options) {
  const path = originalPath.slice();
  const errors = [];
  const root = parseTree(text, errors);
  let parent = undefined;
  let lastSegment = undefined;
  while (path.length > 0) {
    lastSegment = path.pop();
    parent = findNodeAtLocation(root, path);
    if (parent === undefined && value !== undefined) {
      if (typeof lastSegment === "string") {
        value = { [lastSegment]: value };
      } else {
        value = [value];
      }
    } else {
      break;
    }
  }
  if (!parent) {
    if (value === undefined) {
      throw new Error("Can not delete in empty document");
    }
    return withFormatting(text, { offset: root ? root.offset : 0, length: root ? root.length : 0, content: JSON.stringify(value) }, options);
  } else if (parent.type === "object" && typeof lastSegment === "string" && Array.isArray(parent.children)) {
    const existing = findNodeAtLocation(parent, [lastSegment]);
    if (existing !== undefined) {
      if (value === undefined) {
        if (!existing.parent) {
          throw new Error("Malformed AST");
        }
        const propertyIndex = parent.children.indexOf(existing.parent);
        let removeBegin;
        let removeEnd = existing.parent.offset + existing.parent.length;
        if (propertyIndex > 0) {
          let previous = parent.children[propertyIndex - 1];
          removeBegin = previous.offset + previous.length;
        } else {
          removeBegin = parent.offset + 1;
          if (parent.children.length > 1) {
            let next = parent.children[1];
            removeEnd = next.offset;
          }
        }
        return withFormatting(text, { offset: removeBegin, length: removeEnd - removeBegin, content: "" }, options);
      } else {
        return withFormatting(text, { offset: existing.offset, length: existing.length, content: JSON.stringify(value) }, options);
      }
    } else {
      if (value === undefined) {
        return [];
      }
      const newProperty = `${JSON.stringify(lastSegment)}: ${JSON.stringify(value)}`;
      const index = options.getInsertionIndex ? options.getInsertionIndex(parent.children.map((p) => p.children[0].value)) : parent.children.length;
      let edit;
      if (index > 0) {
        let previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      } else if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty + "," };
      }
      return withFormatting(text, edit, options);
    }
  } else if (parent.type === "array" && typeof lastSegment === "number" && Array.isArray(parent.children)) {
    const insertIndex = lastSegment;
    if (insertIndex === -1) {
      const newProperty = `${JSON.stringify(value)}`;
      let edit;
      if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        const previous = parent.children[parent.children.length - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else if (value === undefined && parent.children.length >= 0) {
      const removalIndex = lastSegment;
      const toRemove = parent.children[removalIndex];
      let edit;
      if (parent.children.length === 1) {
        edit = { offset: parent.offset + 1, length: parent.length - 2, content: "" };
      } else if (parent.children.length - 1 === removalIndex) {
        let previous = parent.children[removalIndex - 1];
        let offset = previous.offset + previous.length;
        let parentEndOffset = parent.offset + parent.length;
        edit = { offset, length: parentEndOffset - 2 - offset, content: "" };
      } else {
        edit = { offset: toRemove.offset, length: parent.children[removalIndex + 1].offset - toRemove.offset, content: "" };
      }
      return withFormatting(text, edit, options);
    } else if (value !== undefined) {
      let edit;
      const newProperty = `${JSON.stringify(value)}`;
      if (!options.isArrayInsertion && parent.children.length > lastSegment) {
        const toModify = parent.children[lastSegment];
        edit = { offset: toModify.offset, length: toModify.length, content: newProperty };
      } else if (parent.children.length === 0 || lastSegment === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: parent.children.length === 0 ? newProperty : newProperty + "," };
      } else {
        const index = lastSegment > parent.children.length ? parent.children.length : lastSegment;
        const previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else {
      throw new Error(`Can not ${value === undefined ? "remove" : options.isArrayInsertion ? "insert" : "modify"} Array index ${insertIndex} as length is not sufficient`);
    }
  } else {
    throw new Error(`Can not add ${typeof lastSegment !== "number" ? "index" : "property"} to parent of type ${parent.type}`);
  }
}
function withFormatting(text, edit, options) {
  if (!options.formattingOptions) {
    return [edit];
  }
  let newText = applyEdit(text, edit);
  let begin = edit.offset;
  let end = edit.offset + edit.content.length;
  if (edit.length === 0 || edit.content.length === 0) {
    while (begin > 0 && !isEOL(newText, begin - 1)) {
      begin--;
    }
    while (end < newText.length && !isEOL(newText, end)) {
      end++;
    }
  }
  const edits = format(newText, { offset: begin, length: end - begin }, { ...options.formattingOptions, keepLines: false });
  for (let i = edits.length - 1;i >= 0; i--) {
    const edit = edits[i];
    newText = applyEdit(newText, edit);
    begin = Math.min(begin, edit.offset);
    end = Math.max(end, edit.offset + edit.length);
    end += edit.content.length - edit.length;
  }
  const editLength = text.length - (newText.length - end) - begin;
  return [{ offset: begin, length: editLength, content: newText.substring(begin, end) }];
}
function applyEdit(text, edit) {
  return text.substring(0, edit.offset) + edit.content + text.substring(edit.offset + edit.length);
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/main.js
var createScanner2 = createScanner;
var ScanError;
(function(ScanError) {
  ScanError[ScanError["None"] = 0] = "None";
  ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind) {
  SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
  SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
  SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
  SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
  SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse2 = parse;
var parseTree2 = parseTree;
var findNodeAtLocation2 = findNodeAtLocation;
var getNodeValue2 = getNodeValue;
var ParseErrorCode;
(function(ParseErrorCode) {
  ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function printParseErrorCode(code) {
  switch (code) {
    case 1:
      return "InvalidSymbol";
    case 2:
      return "InvalidNumberFormat";
    case 3:
      return "PropertyNameExpected";
    case 4:
      return "ValueExpected";
    case 5:
      return "ColonExpected";
    case 6:
      return "CommaExpected";
    case 7:
      return "CloseBraceExpected";
    case 8:
      return "CloseBracketExpected";
    case 9:
      return "EndOfFileExpected";
    case 10:
      return "InvalidCommentToken";
    case 11:
      return "UnexpectedEndOfComment";
    case 12:
      return "UnexpectedEndOfString";
    case 13:
      return "UnexpectedEndOfNumber";
    case 14:
      return "InvalidUnicode";
    case 15:
      return "InvalidEscapeCharacter";
    case 16:
      return "InvalidCharacter";
  }
  return "<unknown ParseErrorCode>";
}
function modify(text, path, value, options) {
  return setProperty(text, path, value, options);
}
function applyEdits(text, edits) {
  let sortedEdits = edits.slice(0).sort((a, b) => {
    const diff = a.offset - b.offset;
    if (diff === 0) {
      return a.length - b.length;
    }
    return diff;
  });
  let lastModifiedOffset = text.length;
  for (let i = sortedEdits.length - 1;i >= 0; i--) {
    let e = sortedEdits[i];
    if (e.offset + e.length <= lastModifiedOffset) {
      text = applyEdit(text, e);
    } else {
      throw new Error("Overlapping edit");
    }
    lastModifiedOffset = e.offset;
  }
  return text;
}

// ../plugin/src/shared/jsonc-edit.ts
var TOKEN_COMMA = 5;
var TOKEN_EOF = 17;
function parseDocument(text) {
  const errors = [];
  const root = parseTree2(text, errors, { allowTrailingComma: true });
  if (!root || errors.length > 0) {
    throw new Error("Cannot edit invalid JSONC");
  }
  return root;
}
function findNode(text, path) {
  return findNodeAtLocation2(parseDocument(text), path);
}
function findComma(text, start, end) {
  const scanner = createScanner2(text, false);
  scanner.setPosition(start);
  for (;; ) {
    const kind = scanner.scan();
    const offset = scanner.getTokenOffset();
    if (kind === TOKEN_EOF || offset >= end)
      return;
    if (kind === TOKEN_COMMA) {
      return {
        offset,
        length: scanner.getTokenLength(),
        line: scanner.getTokenStartLine()
      };
    }
  }
}
function setJsoncValue(text, path, value) {
  const node = findNode(text, path);
  if (node) {
    if (Object.is(getNodeValue2(node), value))
      return text;
    const serialized = JSON.stringify(value);
    return text.slice(0, node.offset) + serialized + text.slice(node.offset + node.length);
  }
  return applyEdits(text, modify(text, path, value, {}));
}
function removeObjectProperty(text, object, key) {
  const properties = object.children ?? [];
  const index = properties.findIndex((property) => {
    const propertyKey = property.children?.[0];
    return propertyKey !== undefined && getNodeValue2(propertyKey) === key;
  });
  if (index === -1)
    return text;
  const property = properties[index];
  if (!property)
    return text;
  const closingBrace = object.offset + object.length - 1;
  const next = properties[index + 1];
  if (next) {
    const followingComma = findComma(text, property.offset + property.length, next.offset);
    if (!followingComma)
      return text;
    return text.slice(0, property.offset) + text.slice(followingComma.offset + followingComma.length);
  }
  const previous = properties[index - 1];
  const trailingComma = findComma(text, property.offset + property.length, closingBrace);
  if (!previous) {
    const afterProperty = property.offset + property.length;
    if (!trailingComma)
      return text.slice(0, property.offset) + text.slice(afterProperty);
    return text.slice(0, property.offset) + text.slice(afterProperty, trailingComma.offset) + text.slice(trailingComma.offset + trailingComma.length);
  }
  const precedingComma = findComma(text, previous.offset + previous.length, property.offset);
  if (!precedingComma)
    return text;
  const afterProperty = property.offset + property.length;
  const withoutProperty = text.slice(0, precedingComma.offset) + text.slice(precedingComma.offset + precedingComma.length, property.offset) + text.slice(afterProperty);
  if (!trailingComma)
    return withoutProperty;
  const shiftedTrailingComma = trailingComma.offset - 1;
  return withoutProperty.slice(0, shiftedTrailingComma) + withoutProperty.slice(shiftedTrailingComma + trailingComma.length);
}
function removeJsoncValue(text, path) {
  const key = path.at(-1);
  if (typeof key !== "string")
    return text;
  const parent = findNode(text, path.slice(0, -1));
  if (parent?.type !== "object")
    return text;
  return removeObjectProperty(text, parent, key);
}

// ../plugin/src/config/migrate-config-location.ts
var CONFIG_FILE_BASENAME = "magic-context";
function homeDir() {
  if (process.platform === "win32") {
    return process.env.USERPROFILE || process.env.HOME || homedir();
  }
  return process.env.HOME || homedir();
}
function configHome() {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && isAbsolute(xdg))
    return xdg;
  return join(homeDir(), ".config");
}
function cortexKitUserConfigBasePath() {
  return join(configHome(), "cortexkit", CONFIG_FILE_BASENAME);
}
function cortexKitProjectConfigBasePath(directory) {
  return join(directory, ".cortexkit", CONFIG_FILE_BASENAME);
}
function resolveCortexKitUserConfigPath() {
  return `${cortexKitUserConfigBasePath()}.jsonc`;
}
function legacySourcesForBase(basePath, label) {
  return [
    { path: `${basePath}.jsonc`, label: `${label} magic-context.jsonc` },
    { path: `${basePath}.json`, label: `${label} magic-context.json` }
  ];
}
function userScopeConfigPaths() {
  return new Set([
    `${cortexKitUserConfigBasePath()}.jsonc`,
    `${cortexKitUserConfigBasePath()}.json`,
    join(configHome(), "opencode", `${CONFIG_FILE_BASENAME}.jsonc`),
    join(configHome(), "opencode", `${CONFIG_FILE_BASENAME}.json`),
    join(homeDir(), ".pi", "agent", `${CONFIG_FILE_BASENAME}.jsonc`),
    join(homeDir(), ".pi", "agent", `${CONFIG_FILE_BASENAME}.json`)
  ]);
}
function resolveLegacyConfigSources(directory) {
  const userPaths = userScopeConfigPaths();
  return {
    user: [
      ...legacySourcesForBase(join(configHome(), "opencode", CONFIG_FILE_BASENAME), "OpenCode user"),
      ...legacySourcesForBase(join(homeDir(), ".pi", "agent", CONFIG_FILE_BASENAME), "Pi user")
    ],
    project: [
      ...legacySourcesForBase(join(directory, CONFIG_FILE_BASENAME), "project root"),
      ...legacySourcesForBase(join(directory, ".opencode", CONFIG_FILE_BASENAME), "OpenCode project"),
      ...legacySourcesForBase(join(directory, ".pi", CONFIG_FILE_BASENAME), "Pi project")
    ].filter((source) => !userPaths.has(source.path))
  };
}
function resolveLegacyConfigSourcesForHarness(directory, harness) {
  if (harness === "pi") {
    return {
      user: legacySourcesForBase(join(homeDir(), ".pi", "agent", CONFIG_FILE_BASENAME), "Pi user"),
      project: legacySourcesForBase(join(directory, ".pi", CONFIG_FILE_BASENAME), "Pi project")
    };
  }
  return {
    user: legacySourcesForBase(join(configHome(), "opencode", CONFIG_FILE_BASENAME), "OpenCode user"),
    project: [
      ...legacySourcesForBase(join(directory, CONFIG_FILE_BASENAME), "project root"),
      ...legacySourcesForBase(join(directory, ".opencode", CONFIG_FILE_BASENAME), "OpenCode project")
    ]
  };
}

// ../plugin/src/shared/jsonc-parser.ts
import { existsSync, readFileSync } from "node:fs";
function stripJsonComments(content) {
  let result = "";
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let index = 0;index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (inLineComment) {
      if (char === `
`) {
        inLineComment = false;
        result += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }
    result += char;
  }
  return result;
}
function stripTrailingCommas(content) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let index = 0;index < content.length; index += 1) {
    const char = content[index];
    if (inString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }
    if (char === ",") {
      let lookahead = index + 1;
      while (lookahead < content.length && /\s/.test(content[lookahead] ?? "")) {
        lookahead += 1;
      }
      const next = content[lookahead];
      if (next === "}" || next === "]") {
        continue;
      }
    }
    result += char;
  }
  return result;
}
var PROTOTYPE_POLLUTION_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function isPrototypePollutionKey(key) {
  return PROTOTYPE_POLLUTION_KEYS.has(key);
}
function sanitizeParsedJson(value, options = {}, path = []) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeParsedJson(entry, options, [...path, index]));
  }
  if (value === null || typeof value !== "object")
    return value;
  const source = value;
  const sourcePrototype = Object.getPrototypeOf(source);
  if (sourcePrototype !== null && sourcePrototype !== Object.prototype) {
    options.onRejectedKey?.([...path, "__proto__"]);
  }
  const sanitized = {};
  for (const key of Object.keys(source)) {
    if (isPrototypePollutionKey(key)) {
      options.onRejectedKey?.([...path, key]);
      continue;
    }
    Object.defineProperty(sanitized, key, {
      value: sanitizeParsedJson(source[key], options, [...path, key]),
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  return sanitized;
}
function lineAndColumnAt(content, offset) {
  const before = content.slice(0, Math.max(0, offset));
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}
function parseIssue(content, error) {
  const location = lineAndColumnAt(content, error.offset);
  const code = printParseErrorCode(error.error);
  const message = code.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return {
    ...location,
    offset: error.offset,
    length: error.length,
    message
  };
}
function normalizeJsoncParserObjects(value, options, path = []) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => normalizeJsoncParserObjects(entry, options, [...path, String(index)]));
  }
  if (value === null || typeof value !== "object")
    return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    options.onRejectedKey?.([...path, "__proto__"]);
  }
  const normalized = {};
  for (const [key, entry] of Object.entries(value)) {
    Object.defineProperty(normalized, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: normalizeJsoncParserObjects(entry, options, [...path, key])
    });
  }
  return normalized;
}
function parseJsoncRecovering(content, options = {}) {
  const errors = [];
  const parsed = parse2(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
    allowEmptyContent: false
  });
  return {
    value: sanitizeParsedJson(normalizeJsoncParserObjects(parsed, options), options),
    issues: errors.map((error) => parseIssue(content, error))
  };
}
function parseJsonc(content, options = {}) {
  const normalized = stripTrailingCommas(stripJsonComments(content));
  return sanitizeParsedJson(JSON.parse(normalized), options);
}
function readJsoncFile(filePath) {
  try {
    return parseJsonc(readFileSync(filePath, "utf-8"));
  } catch (_error) {
    return null;
  }
}
function detectConfigFile(basePath) {
  const jsoncPath = `${basePath}.jsonc`;
  const jsonPath = `${basePath}.json`;
  if (existsSync(jsoncPath)) {
    return { format: "jsonc", path: jsoncPath };
  }
  if (existsSync(jsonPath)) {
    return { format: "json", path: jsonPath };
  }
  return { format: "none", path: jsoncPath };
}

// src/compat/dsh-0.1/preset.ts
var STOCK_PRESET_ROW_ID = "preset-standard";
var STOCK_PRESET_CONFIG_ID = "standard";
var STOCK_COMPACTION_GROUP = {
  id: "compaction",
  name: "cordis:group",
  isolate: { compaction: true, toolResultPruner: true }
};
var STOCK_COMPACTION_BASIC_ROW = {
  id: "compaction-basic",
  name: "@deepseek-ai/dsh-compaction-basic"
};
var MAGIC_AGENT_ROW_ID = "magic-agent";
var MAGIC_COMPACTION_ROW_ID = "magic-compaction";
function findPresetRow(plugins, rowId) {
  for (const row of plugins) {
    if (row.id === rowId)
      return row;
    if (row.group === true && Array.isArray(row.config)) {
      const nested = findPresetRow(row.config, rowId);
      if (nested !== undefined)
        return nested;
    }
  }
  return;
}

// src/doctor/env.ts
import { homedir as homedir2 } from "node:os";
import { dirname as dirname2, join as join2 } from "node:path";
import {
  existsSync as existsSync2,
  mkdirSync,
  readFileSync as readFileSync2,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { randomBytes } from "node:crypto";
var MAGIC_CONTEXT_PACKAGE = "dsh-magic-context";
var DSH_COMPAT_EXPECTED_VERSION = "0.1.7";
var DSH_PACKAGE = "@deepseek-ai/dsh";
var DSH_WEB_APP_PACKAGE = "@deepseek-ai/dsh-web-app";
var STOCK_PRESET_REL = join2("presets", "standard.patch.yml");
function isSupportedDshVersion(version) {
  return version.split("-")[0] === DSH_COMPAT_EXPECTED_VERSION;
}
function resolveDshHome(env = process.env) {
  const explicit = env.DSH_HOME;
  if (explicit !== undefined && explicit.trim() !== "")
    return explicit;
  return join2(homedir2(), ".dsh");
}
function locateDshInstall(opts) {
  if (opts.stockPresetPath !== undefined) {
    return { stockPresetPath: opts.stockPresetPath, tried: [opts.stockPresetPath] };
  }
  const env = opts.env ?? process.env;
  const tried = [];
  const installCandidates = [];
  if (opts.dshInstallDir !== undefined)
    installCandidates.push(opts.dshInstallDir);
  const envInstall = env.DSH_INSTALL_DIR;
  if (envInstall !== undefined && envInstall.trim() !== "") {
    installCandidates.push(envInstall);
  }
  installCandidates.push(join2(opts.dshHome, "profiles", "node_modules", DSH_PACKAGE));
  try {
    const profilesRoot = join2(opts.dshHome, "profiles");
    if (existsSync2(profilesRoot)) {
      for (const entry of readdirSync(profilesRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === "node_modules")
          continue;
        installCandidates.push(join2(profilesRoot, entry.name, "node_modules", DSH_PACKAGE));
      }
    }
  } catch {}
  installCandidates.push(...findDshInstallOnPath(env));
  for (const candidate of installCandidates) {
    tried.push(candidate);
    if (!isDshInstallRoot(candidate))
      continue;
    const stock = findStockPresetPatch(candidate);
    if (stock !== undefined) {
      return { dshInstallDir: candidate, stockPresetPath: stock, tried };
    }
  }
  return { tried };
}
function findStockPresetPatch(dshInstallDir) {
  const rel = join2(DSH_WEB_APP_PACKAGE, STOCK_PRESET_REL);
  const candidates = [
    join2(dshInstallDir, "node_modules", rel),
    join2(dshInstallDir, "..", rel),
    join2(dshInstallDir, "..", "..", rel),
    join2(dshInstallDir, "..", "..", "..", rel)
  ];
  for (const candidate of candidates) {
    if (existsSync2(candidate))
      return candidate;
  }
  return;
}
function isDshInstallRoot(dir) {
  const manifest = join2(dir, "package.json");
  if (!existsSync2(manifest))
    return false;
  try {
    const parsed = JSON.parse(readFileSync2(manifest, "utf8"));
    return parsed.name === DSH_PACKAGE;
  } catch {
    return false;
  }
}
function findDshInstallOnPath(env) {
  const pathVar = env.PATH ?? "";
  const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat", ".ps1"] : [""];
  for (const segment of pathVar.split(";").concat(process.platform === "win32" ? [] : pathVar.split(":"))) {
    const dir = segment.trim();
    if (dir === "")
      continue;
    for (const ext of exts) {
      const bin = join2(dir, `dsh${ext}`);
      if (!existsSync2(bin))
        continue;
      const resolved = resolvePackageRoot(bin);
      if (resolved !== undefined)
        return [resolved];
    }
  }
  return [];
}
function resolvePackageRoot(binPath) {
  let current;
  try {
    current = realpathSync(binPath);
  } catch {
    current = binPath;
  }
  let dir = dirname2(current);
  for (let depth = 0;depth < 10 && dir !== dirname2(dir); depth += 1) {
    if (isDshInstallRoot(dir))
      return dir;
    dir = dirname2(dir);
  }
  return;
}
function legacyAgentPresetsRoot(dshHome) {
  return join2(dshHome, ".agent-presets");
}
function legacyMagicStandardDir(dshHome) {
  return join2(legacyAgentPresetsRoot(dshHome), "magic-standard");
}
function writeFileAtomic(target, content, mode = 384) {
  const dir = dirname2(target);
  mkdirSync(dir, { recursive: true });
  const tmp = join2(dir, `.${target.split(/[\\/]/).pop()}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
  writeFileSync(tmp, content, { encoding: "utf8", mode });
  try {
    renameSync(tmp, target);
  } catch (error) {
    rmSync(tmp, { force: true });
    throw error;
  }
}
function parseFlags(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0;i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq >= 0) {
        flags[token.slice(2, eq)] = token.slice(eq + 1);
        continue;
      }
      const name = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        flags[name] = next;
        i += 1;
      } else {
        flags[name] = true;
      }
      continue;
    }
    positionals.push(token);
  }
  return { flags, positionals };
}
function errorMessage(error) {
  if (error instanceof Error)
    return error.message;
  return String(error);
}
function stringFlag(flags, name) {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

// src/doctor/setup.ts
var MAGIC_PRESET = {
  rowId: STOCK_PRESET_ROW_ID,
  configId: STOCK_PRESET_CONFIG_ID,
  name: "Magic Context standard",
  description: "The shipped `standard` preset with the Magic Context compaction engine " + "enabled (compaction-basic disabled) and the Magic agent rows mounted."
};
var RECOMMENDED_CONFIG_KEYS = [
  "enabled",
  "transform_mode",
  "sqlite",
  "embedding",
  "compaction"
];
function defaultMagicConfigJsonc() {
  return [
    "// Magic Context — generated by `dsh-magic-context setup`.",
    "// Edit this file with your editor: the DSH settings card is read-only on",
    "// purpose, so this file stays the single source of truth.",
    "// Full schema: packages/plugin/src/config/schema/magic-context.ts",
    "{",
    '  "enabled": true,',
    '  "transform_mode": "ts",',
    '  "sqlite": { "cache_size_mb": 64, "mmap_size_mb": 0 },',
    '  "embedding": { "provider": "local", "model": "Xenova/all-MiniLM-L6-v2" },',
    '  "compaction": { "enabled": true }',
    "}",
    ""
  ].join(`
`);
}
function presentTopLevelKeys(configPath) {
  const parsed = readJsoncFile(configPath);
  if (parsed === null || typeof parsed !== "object")
    return new Set;
  return new Set(Object.keys(parsed));
}
function parseEntryListYaml(text) {
  return load(text, { schema: entryListSchema });
}
function readPresetDeclaration(patch, rowId) {
  const row = patch.find((entry) => entry.id === rowId);
  if (row === undefined)
    return `patch layer declares no row "${rowId}"`;
  const config = row.config;
  if (config === undefined)
    return `row "${rowId}" carries no config`;
  if (config.id !== STOCK_PRESET_CONFIG_ID) {
    return `row "${rowId}" declares config.id "${String(config.id)}", expected "${STOCK_PRESET_CONFIG_ID}"`;
  }
  if (!Array.isArray(config.plugins))
    return `row "${rowId}" carries no config.plugins list`;
  return { plugins: config.plugins };
}
async function runDshSetup(argv, options = {}) {
  const { flags } = parseFlags(argv);
  const env = options.env ?? process.env;
  const dshHome = options.dshHome ?? stringFlag(flags, "dsh-home") ?? resolveDshHome(env);
  const dshInstallDir = options.dshInstallDir ?? stringFlag(flags, "dsh-install");
  const stockPresetPath = options.stockPresetPath ?? stringFlag(flags, "stock-preset");
  const dryRun = options.dryRun ?? flags["dry-run"] === true;
  const profile = options.profile ?? stringFlag(flags, "profile");
  const steps = [];
  const generatedFiles = [];
  let failed = false;
  steps.push({ status: "ok", title: "DSH home", detail: dshHome });
  const located = locateDshInstall({ dshHome, dshInstallDir, stockPresetPath, env });
  if (located.stockPresetPath === undefined) {
    steps.push({
      status: "fail",
      title: "DSH install / shipped standard preset",
      detail: `Could not locate the shipped standard preset patch ` + `(${DSH_COMPAT_EXPECTED_VERSION} expected). Probed:
` + located.tried.map((candidate) => `  - ${candidate}`).join(`
`) + `
Fix: install DSH ${DSH_COMPAT_EXPECTED_VERSION}, or pass ` + `--dsh-install <dir> / --stock-preset <file>.`
    });
    failed = true;
  } else {
    steps.push({
      status: "ok",
      title: "DSH install / shipped standard preset",
      detail: located.stockPresetPath
    });
    if (located.dshInstallDir !== undefined) {
      try {
        const manifest = JSON.parse(readFileSync3(`${located.dshInstallDir}/package.json`, "utf8"));
        const version = manifest.version ?? "";
        if (!isSupportedDshVersion(version)) {
          steps.push({
            status: "warn",
            title: "DSH version",
            detail: `found ${version}; this adapter targets ${DSH_COMPAT_EXPECTED_VERSION}.x. ` + `The preset layout may have changed — re-check after upgrading.`
          });
        } else {
          steps.push({ status: "ok", title: "DSH version", detail: version });
        }
      } catch (error) {
        steps.push({
          status: "warn",
          title: "DSH version",
          detail: `could not read the install manifest: ${errorMessage(error)}`
        });
      }
    }
  }
  let stockPlugins;
  if (!failed && located.stockPresetPath !== undefined) {
    try {
      const patch = parseEntryListYaml(readFileSync3(located.stockPresetPath, "utf8"));
      const declared = readPresetDeclaration(patch, STOCK_PRESET_ROW_ID);
      if (typeof declared === "string") {
        steps.push({
          status: "fail",
          title: "Stock preset contract scan",
          detail: `${located.stockPresetPath}: ${declared}. This adapter overrides that ` + `row, so it cannot proceed (fail closed). ` + `Fix: check that the DSH install matches ${DSH_COMPAT_EXPECTED_VERSION}.`
        });
        failed = true;
      } else if (declared.plugins === undefined) {
        steps.push({
          status: "fail",
          title: "Stock preset contract scan",
          detail: `${located.stockPresetPath}: no plugin list.`
        });
        failed = true;
      } else {
        stockPlugins = declared.plugins;
        const group = stockPlugins.find((row) => row.id === STOCK_COMPACTION_GROUP.id);
        const basic = group === undefined ? undefined : findPresetRow(stockPlugins, STOCK_COMPACTION_BASIC_ROW.id);
        if (group === undefined || basic === undefined) {
          steps.push({
            status: "fail",
            title: "Stock preset contract scan",
            detail: `${located.stockPresetPath}: the compaction group or its ` + `compaction-basic row is missing. The Magic engine is inserted into ` + `that group and replaces that row; without them the override cannot ` + `be written (fail closed).`
          });
          failed = true;
        } else if (basic.name !== STOCK_COMPACTION_BASIC_ROW.name) {
          steps.push({
            status: "fail",
            title: "Stock preset contract scan",
            detail: `${located.stockPresetPath}: compaction-basic is bound to ` + `"${String(basic.name)}", expected "${STOCK_COMPACTION_BASIC_ROW.name}" ` + `(fail closed — the override would disable an unknown plugin).`
          });
          failed = true;
        } else {
          steps.push({
            status: "ok",
            title: "Stock preset contract scan",
            detail: `${located.stockPresetPath}: ${String(stockPlugins.length)} plugin rows; ` + `compaction group + compaction-basic match the expected layout.`
          });
        }
      }
    } catch (error) {
      steps.push({
        status: "fail",
        title: "Stock preset contract scan",
        detail: `${located.stockPresetPath}: ${errorMessage(error)}`
      });
      failed = true;
    }
  }
  if (!failed && stockPlugins !== undefined) {
    try {
      const ownPatchPath = new URL("../../cordis.patch.yml", import.meta.url);
      const ownPatch = parseEntryListYaml(readFileSync3(ownPatchPath, "utf8"));
      const own = readPresetDeclaration(ownPatch, STOCK_PRESET_ROW_ID);
      if (typeof own === "string") {
        steps.push({
          status: "fail",
          title: "Bundle preset override",
          detail: `${ownPatchPath.pathname}: ${own}`
        });
        failed = true;
      } else {
        const plugins = own.plugins ?? [];
        const problems = [];
        const stockIds = new Set(stockPlugins.map((row) => row.id));
        for (const row of plugins) {
          if (row.id === MAGIC_AGENT_ROW_ID || row.id === MAGIC_COMPACTION_ROW_ID)
            continue;
          if (!stockIds.has(row.id)) {
            problems.push(`row "${String(row.id)}" is not in the shipped preset`);
          }
        }
        const missing = [...stockIds].filter((id) => id !== undefined && !plugins.some((row) => row.id === id));
        if (missing.length > 0) {
          problems.push(`shipped rows dropped by the override: ${missing.join(", ")}`);
        }
        const engine = findPresetRow(plugins, MAGIC_COMPACTION_ROW_ID);
        const agent = findPresetRow(plugins, MAGIC_AGENT_ROW_ID);
        if (engine === undefined)
          problems.push(`missing "${MAGIC_COMPACTION_ROW_ID}" row`);
        if (agent === undefined)
          problems.push(`missing "${MAGIC_AGENT_ROW_ID}" row`);
        const basicRow = findPresetRow(plugins, STOCK_COMPACTION_BASIC_ROW.id);
        if (basicRow !== undefined && basicRow.disabled !== true) {
          problems.push("compaction-basic is not disabled (would double-compress)");
        }
        if (problems.length > 0) {
          steps.push({
            status: "fail",
            title: "Bundle preset override",
            detail: problems.join("; ")
          });
          failed = true;
        } else {
          steps.push({
            status: "ok",
            title: "Bundle preset override",
            detail: `restates all ${String(stockIds.size)} shipped rows plus ` + `${MAGIC_COMPACTION_ROW_ID} and ${MAGIC_AGENT_ROW_ID}.`
          });
        }
      }
    } catch (error) {
      steps.push({
        status: "fail",
        title: "Bundle preset override",
        detail: errorMessage(error)
      });
      failed = true;
    }
  }
  const legacyDir = legacyMagicStandardDir(dshHome);
  if (existsSync3(legacyDir)) {
    if (dryRun) {
      steps.push({
        status: "warn",
        title: "Legacy preset directory",
        detail: `${legacyDir} exists but nothing reads it any more; would be removed.`
      });
    } else {
      try {
        rmSync2(legacyDir, { recursive: true, force: true });
        steps.push({
          status: "ok",
          title: "Legacy preset directory",
          detail: `removed stale ${legacyDir} (presets are inline declarations since 0.1.7).`
        });
      } catch (error) {
        steps.push({
          status: "warn",
          title: "Legacy preset directory",
          detail: `${legacyDir} is stale but could not be removed: ${errorMessage(error)}`
        });
      }
    }
  } else {
    steps.push({
      status: "ok",
      title: "Legacy preset directory",
      detail: `none at ${legacyDir} (expected).`
    });
  }
  const configPath = resolveCortexKitUserConfigPath();
  if (existsSync3(configPath)) {
    let missing = [];
    try {
      parseJsonc(readFileSync3(configPath, "utf8"));
      const present = presentTopLevelKeys(configPath);
      missing = RECOMMENDED_CONFIG_KEYS.filter((key) => !present.has(key));
    } catch (error) {
      steps.push({
        status: "warn",
        title: "Magic Context user config",
        detail: `${configPath} exists but is not valid JSONC (${errorMessage(error)}); leaving untouched.`
      });
      missing = [];
    }
    if (missing.length === 0) {
      steps.push({
        status: "ok",
        title: "Magic Context user config",
        detail: `${configPath} exists and carries the recommended keys; not overwritten.`
      });
    } else {
      steps.push({
        status: "warn",
        title: "Magic Context user config",
        detail: `${configPath} exists; not overwritten. Missing recommended keys: ` + `${missing.join(", ")} (defaults apply).`
      });
    }
  } else {
    if (failed) {
      steps.push({
        status: "warn",
        title: "Magic Context user config",
        detail: `${configPath} does not exist; not created because earlier steps ` + `failed (fail closed — nothing partial is written).`
      });
    } else if (dryRun) {
      steps.push({
        status: "ok",
        title: "Magic Context user config (dry run)",
        detail: `${configPath} would be created from defaults.`
      });
    } else {
      try {
        writeFileAtomic(configPath, defaultMagicConfigJsonc());
        generatedFiles.push(configPath);
        steps.push({
          status: "ok",
          title: "Magic Context user config",
          detail: `created ${configPath} from defaults.`
        });
      } catch (error) {
        steps.push({
          status: "fail",
          title: "Magic Context user config",
          detail: `could not create ${configPath}: ${errorMessage(error)}`
        });
        failed = true;
      }
    }
  }
  const nextSteps = [];
  if (failed) {
    nextSteps.push("Fix the failing steps above, then re-run `dsh-magic-context setup`.");
  } else {
    const where = profile === undefined ? "<name>" : profile;
    nextSteps.push(`Install the bundle into the profile: add "${MAGIC_CONTEXT_PACKAGE}" to ` + `dsh.profile.bundles in $DSH_HOME/profiles/${where}/package.json and run ` + `pnpm install there (the desktop profile has no working \`dsh plugin\` path).`);
    nextSteps.push(`The bundle override applies to the "${STOCK_PRESET_CONFIG_ID}" preset, so ` + `sessions already using it pick Magic up on their next start.`);
    nextSteps.push("Verify with: dsh-magic-context doctor");
  }
  return {
    exitCode: failed ? 1 : 0,
    steps,
    generatedFiles,
    nextSteps
  };
}

// src/doctor/doctor.ts
import { existsSync as existsSync10, readFileSync as readFileSync8, readdirSync as readdirSync4 } from "node:fs";
import { join as join7 } from "node:path";

// ../plugin/src/config/index.ts
import { existsSync as existsSync6 } from "node:fs";

// ../plugin/src/shared/config-diagnostics.ts
var CONFIG_WARNING_CLASS = {
  FILE_PARSE: "file-parse",
  FILE_IO: "file-io",
  INVALID_LEAF: "invalid-leaf"
};
var claimedFailures = new Set;

// ../plugin/src/shared/data-path.ts
import * as os from "node:os";
import * as path from "node:path";

// ../plugin/src/shared/harness.ts
var currentHarness = "opencode";
function getHarness() {
  return currentHarness;
}

// ../plugin/src/shared/data-path.ts
function getDataDir() {
  return process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
}
function getMagicContextTempDir(harness = getHarness()) {
  return path.join(os.tmpdir(), harness, "magic-context");
}
function getMagicContextLogPath(harness = getHarness()) {
  const envPath = process.env.MAGIC_CONTEXT_LOG_PATH?.trim();
  if (envPath)
    return envPath;
  return path.join(getMagicContextTempDir(harness), "magic-context.log");
}
function getOpenCodeStorageDir() {
  return path.join(getDataDir(), "opencode", "storage");
}
function getMagicContextStorageResolution() {
  const testDataDir = process.env.MAGIC_CONTEXT_TEST_DATA_DIR?.trim();
  if (testDataDir) {
    const perTestDataHome = process.env.XDG_DATA_HOME?.trim();
    if (perTestDataHome && path.resolve(perTestDataHome) !== path.resolve(testDataDir)) {
      return {
        path: path.join(perTestDataHome, "cortexkit", "magic-context"),
        source: "test isolation"
      };
    }
    return {
      path: path.join(testDataDir, "cortexkit", "magic-context"),
      source: "test isolation"
    };
  }
  if (false) {}
  const explicitStorageDir = process.env.MAGIC_CONTEXT_STORAGE_DIR?.trim();
  if (explicitStorageDir) {
    if (!path.isAbsolute(explicitStorageDir)) {
      throw new Error("MAGIC_CONTEXT_STORAGE_DIR must be an absolute path");
    }
    return { path: explicitStorageDir, source: "environment override" };
  }
  const xdgDataHome = process.env.XDG_DATA_HOME?.trim();
  if (xdgDataHome) {
    return {
      path: path.join(xdgDataHome, "cortexkit", "magic-context"),
      source: "XDG_DATA_HOME"
    };
  }
  return {
    path: path.join(os.homedir(), ".local", "share", "cortexkit", "magic-context"),
    source: "platform default"
  };
}
function getMagicContextStorageDir() {
  return getMagicContextStorageResolution().path;
}
function getLegacyOpenCodeMagicContextStorageDir() {
  return path.join(getOpenCodeStorageDir(), "plugin", "magic-context");
}

// ../plugin/src/shared/logger.ts
import * as fs from "node:fs";
import * as path2 from "node:path";

// ../plugin/src/shared/redaction.ts
import { homedir as homedir4, userInfo } from "node:os";
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var SECRET_WORDS = [
  "key",
  "token",
  "secret",
  "password",
  "auth",
  "authorization",
  "bearer",
  "credential"
];
var SECRET_SEGMENT_PATTERN = new RegExp(`^(?:${SECRET_WORDS.map((w) => `${w}s?`).join("|")})$`, "i");
var TRAILING_DESCRIPTORS = new Set(["id", "ids", "value", "values", "header", "headers"]);
function redactionTypeForKey(key) {
  const normalized = key.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "_");
  const suffix = normalized.split(".").filter(Boolean).at(-1) ?? normalized;
  return suffix || "secret";
}
function isNonSecretScalarValue(value) {
  const v = value.trim();
  if (v === "true" || v === "false" || v === "null" || v === "undefined")
    return true;
  return /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v);
}
var SECRET_QUALIFIERS = new Set([
  "api",
  "access",
  "private",
  "client",
  "auth",
  "authorization",
  "secret",
  "bearer",
  "session",
  "refresh",
  "service",
  "x",
  "openai",
  "anthropic",
  "google",
  "github",
  "huggingface",
  "aws",
  "azure"
]);
function isSecretKey(key) {
  const segments = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().split(/[._-]+/).filter(Boolean);
  if (segments.length === 0)
    return false;
  if (segments.length === 1) {
    const first = segments[0];
    return Boolean(first && SECRET_SEGMENT_PATTERN.test(first));
  }
  for (let i = 0;i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || !SECRET_SEGMENT_PATTERN.test(seg))
      continue;
    let trailingOk = true;
    for (let j = i + 1;j < segments.length; j++) {
      const tail = segments[j];
      if (!tail)
        continue;
      if (TRAILING_DESCRIPTORS.has(tail))
        continue;
      if (SECRET_SEGMENT_PATTERN.test(tail))
        continue;
      trailingOk = false;
      break;
    }
    if (!trailingOk)
      continue;
    for (let k = i - 1;k >= 0; k--) {
      const lead = segments[k];
      if (lead && SECRET_QUALIFIERS.has(lead))
        return true;
    }
  }
  return false;
}
function sanitizePathString(value) {
  const home = process.env.HOME || process.env.USERPROFILE || homedir4();
  const username = userInfo().username;
  let sanitized = value;
  if (home) {
    sanitized = sanitized.replace(new RegExp(escapeRegex(home), "g"), "~");
  }
  sanitized = sanitized.replace(/\/Users\/[^/]+\//g, "/Users/<USER>/");
  sanitized = sanitized.replace(/\/home\/[^/]+\//g, "/home/<USER>/");
  sanitized = sanitized.replace(/C:\\Users\\[^\\]+\\/g, "C:\\Users\\<USER>\\");
  if (username) {
    sanitized = sanitized.replace(new RegExp(escapeRegex(username), "g"), "<USER>");
  }
  return sanitized;
}
var SECRET_TEXT_PATTERNS = [
  {
    pattern: /\bsk-ant-(?:api03-)?[A-Za-z0-9_-]{32,}/g,
    replacement: "<ANTHROPIC_API_KEY_REDACTED>"
  },
  {
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}/g,
    replacement: "<OPENAI_API_KEY_REDACTED>"
  },
  {
    pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
    replacement: "<GITHUB_PAT_REDACTED>"
  },
  {
    pattern: /\b(?:gh[opsu]|ghr)_[A-Za-z0-9]{30,}/g,
    replacement: "<GITHUB_TOKEN_REDACTED>"
  },
  {
    pattern: /\bhf_[A-Za-z0-9]{30,}/g,
    replacement: "<HUGGINGFACE_TOKEN_REDACTED>"
  },
  {
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: "<AWS_ACCESS_KEY_ID_REDACTED>"
  },
  {
    pattern: /\bxox[abprsuvc]-[A-Za-z0-9-]{10,}/g,
    replacement: "<SLACK_TOKEN_REDACTED>"
  },
  {
    pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g,
    replacement: "<GOOGLE_API_KEY_REDACTED>"
  },
  {
    pattern: /\b(Authorization\s*:\s*Bearer\s+)([A-Za-z0-9._~+/=-]{8,})/gi,
    replacement: (_full, prefix) => `${prefix}<REDACTED:bearer>`
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    replacement: "<JWT_REDACTED>"
  },
  {
    pattern: /(["'])([^"']*(?:key|token|secret|password|auth|bearer|credential)[^"']*)\1(\s*:\s*)(["'])([^"']*)\4/gi,
    replacement: (full, quote, key, separator, valueQuote, value) => isNonSecretScalarValue(value) ? full : `${quote}${key}${quote}${separator}${valueQuote}<REDACTED:${redactionTypeForKey(key)}>${valueQuote}`
  },
  {
    pattern: /\b([A-Za-z0-9_.-]*(?:key|token|secret|password|auth|bearer|credential)[A-Za-z0-9_.-]*)\s*=\s*([^\s'"`]+)/gi,
    replacement: (full, key, value) => isNonSecretScalarValue(value) ? full : `${key}=<REDACTED:${redactionTypeForKey(key)}>`
  }
];
function redactSecretText(value) {
  let redacted = value;
  for (const { pattern, replacement } of SECRET_TEXT_PATTERNS) {
    if (typeof replacement === "string") {
      redacted = redacted.replace(pattern, replacement);
    } else {
      redacted = redacted.replace(pattern, replacement);
    }
  }
  return redacted;
}
function sanitizeDiagnosticText(value) {
  return redactSecretText(sanitizePathString(value));
}
function sanitizeConfigValue(value, keyPath = []) {
  if (value === null || typeof value === "number" || typeof value === "boolean")
    return value;
  const key = keyPath.at(-1) ?? "";
  if (key && isSecretKey(key)) {
    return `<REDACTED:${redactionTypeForKey(key)}>`;
  }
  if (typeof value === "string")
    return sanitizeDiagnosticText(value);
  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeConfigValue(entry, [...keyPath, String(index)]));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entry]) => [
      entryKey,
      sanitizeConfigValue(entry, [...keyPath, entryKey])
    ]));
  }
  return value;
}

// ../plugin/src/shared/logger.ts
var isTestEnv = false;
var buffer = [];
var flushTimer = null;
var FLUSH_INTERVAL_MS = 500;
var BUFFER_SIZE_LIMIT = 50;
var MAX_LOG_FILE_BYTES = 32 * 1024 * 1024;
var SIZE_CHECK_INTERVAL_FLUSHES = 64;
var activeLogFile = null;
var activeLogSize = null;
var flushesSinceSizeCheck = 0;
var swallowedWriteCount = 0;
var lastErrorMessage = null;
var lastErrorTime = null;
function recordSwallowedWrite(error) {
  try {
    swallowedWriteCount++;
    lastErrorMessage = sanitizeDiagnosticText(error instanceof Error ? error.message : String(error));
    lastErrorTime = new Date().toISOString();
  } catch {}
}
function ensureDir(filePath) {
  fs.mkdirSync(path2.dirname(filePath), { recursive: true });
}
function isMissingFile(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function getCurrentLogSize(logFile) {
  if (activeLogFile === logFile && activeLogSize !== null && flushesSinceSizeCheck < SIZE_CHECK_INTERVAL_FLUSHES) {
    return activeLogSize;
  }
  try {
    const stat = fs.statSync(logFile);
    if (!stat.isFile()) {
      throw new Error(`Magic Context log path is not a regular file: ${logFile}`);
    }
    fs.chmodSync(logFile, 384);
    activeLogFile = logFile;
    activeLogSize = stat.size;
    flushesSinceSizeCheck = 0;
    return stat.size;
  } catch (error) {
    if (!isMissingFile(error))
      throw error;
    activeLogFile = logFile;
    activeLogSize = 0;
    flushesSinceSizeCheck = 0;
    return 0;
  }
}
function capLogData(data) {
  if (Buffer.byteLength(data) <= MAX_LOG_FILE_BYTES)
    return data;
  let bounded = Buffer.from(data).subarray(0, MAX_LOG_FILE_BYTES).toString("utf8");
  while (Buffer.byteLength(bounded) > MAX_LOG_FILE_BYTES) {
    bounded = bounded.slice(0, -1);
  }
  return bounded;
}
function writeBoundedPredecessor(logFile, predecessorPath, size) {
  const predecessorFd = fs.openSync(predecessorPath, "w", 384);
  try {
    fs.fchmodSync(predecessorFd, 384);
    const bytesToCopy = Math.min(size, MAX_LOG_FILE_BYTES);
    const sourceFd = fs.openSync(logFile, "r");
    try {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, bytesToCopy));
      let remaining = bytesToCopy;
      let position = Math.max(0, size - bytesToCopy);
      while (remaining > 0) {
        const bytesRead = fs.readSync(sourceFd, chunk, 0, Math.min(chunk.length, remaining), position);
        if (bytesRead === 0)
          break;
        fs.writeSync(predecessorFd, chunk, 0, bytesRead);
        remaining -= bytesRead;
        position += bytesRead;
      }
    } finally {
      fs.closeSync(sourceFd);
    }
  } finally {
    fs.closeSync(predecessorFd);
  }
}
function rotateLogFile(logFile, size) {
  const predecessorPath = `${logFile}.1`;
  writeBoundedPredecessor(logFile, predecessorPath, size);
  fs.truncateSync(logFile, 0);
  activeLogSize = 0;
  flushesSinceSizeCheck = 0;
}
function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0)
    return;
  const bufferedData = buffer.join("");
  buffer = [];
  try {
    const data = capLogData(bufferedData);
    const logFile = getMagicContextLogPath();
    ensureDir(logFile);
    let currentSize = getCurrentLogSize(logFile);
    const dataSize = Buffer.byteLength(data);
    if (currentSize > 0 && currentSize + dataSize > MAX_LOG_FILE_BYTES) {
      rotateLogFile(logFile, currentSize);
      currentSize = 0;
    }
    fs.appendFileSync(logFile, data, { encoding: "utf8", mode: 384 });
    activeLogFile = logFile;
    activeLogSize = currentSize + dataSize;
    flushesSinceSizeCheck++;
  } catch (error) {
    activeLogFile = null;
    activeLogSize = null;
    flushesSinceSizeCheck = 0;
    recordSwallowedWrite(error);
  }
}
function scheduleFlush() {
  if (flushTimer)
    return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}
function log(message, data) {
  if (isTestEnv)
    return;
  try {
    const timestamp = new Date().toISOString();
    const serialized = data === undefined ? "" : data instanceof Error ? ` ${sanitizeDiagnosticText(`${data.message}${data.stack ? `
${data.stack}` : ""}`)}` : ` ${JSON.stringify(sanitizeConfigValue(data))}`;
    buffer.push(`[${timestamp}] ${sanitizeDiagnosticText(message)}${serialized}
`);
    if (buffer.length >= BUFFER_SIZE_LIMIT) {
      flush();
    } else {
      scheduleFlush();
    }
  } catch {}
}
if (!isTestEnv) {
  process.on("exit", flush);
}

// ../plugin/src/shared/storage-permissions.ts
var enforcePrivateStoragePermissions = true;
function shouldEnforcePrivateStoragePermissions() {
  return enforcePrivateStoragePermissions;
}

// ../plugin/src/shared/window-geometry.ts
var GRADES = new Set([
  "provider_asserted_runtime",
  "measured",
  "provider_asserted_doc",
  "catalog",
  "unknown"
]);
var UNITS = new Set(["provider", "estimate"]);
var BOUNDARIES = new Set(["Observed", "Asserted", "Corrected"]);
var UNKNOWN_REASONS = new Set([
  "placeholder_output_equals_context",
  "placeholder_zero",
  "never_measured",
  "not_single_valued_at_key",
  "retracted"
]);
var NUMERIC_FACT_KEYS = new Set([
  "window.advertised",
  "window.enforced",
  "output.advertised",
  "output.enforced",
  "output.default"
]);
var configuredOverlayPath;
var loadedOverlayPath;
var loadedOverlay;
var geometryClampLogSeen = new Set;
function setWindowOverlayPath(path) {
  if (configuredOverlayPath === path)
    return;
  reloadWindowOverlay(path);
}
function reloadWindowOverlay(path) {
  configuredOverlayPath = path;
  loadedOverlayPath = undefined;
  loadedOverlay = undefined;
}

// ../plugin/src/shared/models-dev-cache.ts
var SEPARATE_OUTPUT_QUOTA_PROVIDERS = new Set(["google", "google-antigravity"]);
var outputReserveConfig;
var reserveClampLogSeen = new Set;
function setOutputReserveConfig(config) {
  outputReserveConfig = config;
}

// ../plugin/src/config/agent-disable.ts
function isCompactionEnabled(config) {
  return config.compaction?.enabled !== false;
}
function clonePlainObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return;
  }
  return { ...value };
}
function migrateLegacyEnabledForAgent(args) {
  const agent = clonePlainObject(args.patched[args.agentName]);
  if (!agent || !("enabled" in agent))
    return;
  const enabled = agent.enabled;
  const disable = agent.disable;
  delete agent.enabled;
  if (args.agentName === "historian") {
    args.warnings.push('Removed invalid "historian.enabled" in-memory (run doctor to persist).');
    args.patched.historian = agent;
    return;
  }
  if (disable !== true && enabled === false) {
    agent.disable = true;
    args.warnings.push('Migrated "dreamer.enabled=false" → "dreamer.disable=true" in-memory (run doctor to persist). This now also disables manual /ctx-dream; for manual-only remove disable and set schedule="".');
  }
  args.patched.dreamer = agent;
}
function migrateLegacyAgentEnabledInMemory(rawConfig, warnings) {
  const shouldPatch = ["dreamer", "historian"].some((key) => {
    const agent = rawConfig[key];
    return typeof agent === "object" && agent !== null && !Array.isArray(agent) && "enabled" in agent;
  });
  if (!shouldPatch)
    return rawConfig;
  const patched = { ...rawConfig };
  migrateLegacyEnabledForAgent({ patched, agentName: "dreamer", warnings });
  migrateLegacyEnabledForAgent({ patched, agentName: "historian", warnings });
  return patched;
}

// ../plugin/src/config/migrate-dreamer-v2.ts
var OLD_VERIFY_TASK = "verify";
var OLD_CURATE_TASKS = ["consolidate", "archive-stale", "improve"];
var RETIRED_OBJECT_MEMORY_TASKS = ["maintain-memory", ...OLD_CURATE_TASKS];
var CANONICAL = [
  "map-memories",
  "verify",
  "verify-broad",
  "curate",
  "classify-memories",
  "retrospective",
  "maintain-docs",
  "evaluate-smart-notes",
  "review-user-memories",
  "promote-primers",
  "refresh-primers"
];
var DEFAULT_BASE_CRON = "0 2 * * *";
var DEFAULT_CLASSIFY_CRON = "0 6 * * *";
var DEFAULT_RETROSPECTIVE_CRON = "0 5 * * *";
var DEFAULT_VERIFY_BROAD_CRON = "0 4 * * 0";
function windowToCron(schedule) {
  if (typeof schedule !== "string")
    return DEFAULT_BASE_CRON;
  const m = /^(\d{1,2}):(\d{2})\s*-/.exec(schedule.trim());
  if (!m)
    return DEFAULT_BASE_CRON;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour >= 24 || minute >= 60)
    return DEFAULT_BASE_CRON;
  return `${minute} ${hour} * * *`;
}
function asObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : undefined;
}
function cronIntervalScore(schedule) {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5)
    return Number.POSITIVE_INFINITY;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (month !== "*")
    return 366 * 24 * 60;
  if (dayOfMonth !== "*")
    return 31 * 24 * 60;
  if (dayOfWeek !== "*")
    return 7 * 24 * 60;
  const everyHour = /^\*\/(\d+)$/.exec(hour ?? "");
  if (everyHour)
    return Math.max(1, Number(everyHour[1])) * 60;
  if (hour === "*") {
    const everyMinute = /^\*\/(\d+)$/.exec(minute ?? "");
    return everyMinute ? Math.max(1, Number(everyMinute[1])) : 60;
  }
  return 24 * 60;
}
function mostFrequentSchedule(schedules) {
  const enabled = schedules.map((s) => s.trim()).filter(Boolean);
  if (enabled.length === 0)
    return "";
  return enabled.sort((a, b) => cronIntervalScore(a) - cronIntervalScore(b))[0] ?? "";
}
function withoutBroadInterval(entry) {
  const { broad_interval_days: _broad, ...rest } = entry;
  return rest;
}
function reconcileV2TasksObject(rawConfig, dreamer, tasksObject) {
  const hasVerifyBroad = "verify-broad" in tasksObject;
  const hasBroadIntervalAnywhere = Object.values(tasksObject).some((v) => asObject(v) && ("broad_interval_days" in v));
  const hasStaleKeyFiles = "key-files" in tasksObject;
  if (hasVerifyBroad && !hasBroadIntervalAnywhere && !hasStaleKeyFiles)
    return rawConfig;
  const nextTasks = {};
  for (const [key, value] of Object.entries(tasksObject)) {
    if (key === "key-files")
      continue;
    const obj = asObject(value);
    nextTasks[key] = obj ? withoutBroadInterval(obj) : value;
  }
  if (!hasVerifyBroad) {
    const verify = asObject(tasksObject.verify);
    const verifyEnabled = typeof verify?.schedule === "string" && verify.schedule.trim() !== "";
    nextTasks["verify-broad"] = {
      schedule: verifyEnabled ? DEFAULT_VERIFY_BROAD_CRON : ""
    };
  }
  return { ...rawConfig, dreamer: { ...dreamer, tasks: nextTasks } };
}
function migrateDreamerV2(rawConfig, warnings) {
  const dreamer = asObject(rawConfig.dreamer);
  if (!dreamer)
    return rawConfig;
  const tasksObject = asObject(dreamer.tasks);
  const hasRetiredObjectTasks = tasksObject ? RETIRED_OBJECT_MEMORY_TASKS.some((task) => (task in tasksObject)) : false;
  if (tasksObject && !hasRetiredObjectTasks) {
    const hasLegacyOutsideTasks = "schedule" in dreamer || "user_memories" in dreamer || "pin_key_files" in dreamer || "task_timeout_minutes" in dreamer || "max_runtime_minutes" in dreamer;
    if (!hasLegacyOutsideTasks) {
      return reconcileV2TasksObject(rawConfig, dreamer, tasksObject);
    }
  }
  const hasLegacy = "schedule" in dreamer || Array.isArray(dreamer.tasks) || hasRetiredObjectTasks || "user_memories" in dreamer || "pin_key_files" in dreamer || "task_timeout_minutes" in dreamer || "max_runtime_minutes" in dreamer;
  if (!hasLegacy)
    return rawConfig;
  const baseCron = windowToCron(dreamer.schedule);
  const timeout = typeof dreamer.task_timeout_minutes === "number" ? dreamer.task_timeout_minutes : undefined;
  const withTimeout = (entry) => timeout !== undefined ? { ...entry, timeout_minutes: timeout } : entry;
  const classifySchedule = dreamer.disable === true ? "" : DEFAULT_CLASSIFY_CRON;
  const retrospectiveSchedule = dreamer.disable === true ? "" : DEFAULT_RETROSPECTIVE_CRON;
  const tasks = {};
  if (tasksObject) {
    for (const [key, value] of Object.entries(tasksObject)) {
      if (RETIRED_OBJECT_MEMORY_TASKS.includes(key))
        continue;
      if (asObject(value))
        tasks[key] = { ...value };
    }
    const maintainMemoryEntry = asObject(tasksObject["maintain-memory"]);
    if (maintainMemoryEntry) {
      const schedule = typeof maintainMemoryEntry.schedule === "string" ? maintainMemoryEntry.schedule : baseCron;
      tasks.verify = withTimeout({
        ...withoutBroadInterval(maintainMemoryEntry),
        ...tasks.verify ?? {},
        schedule: tasks.verify?.schedule ?? schedule
      });
      tasks.curate = withTimeout({
        ...withoutBroadInterval(maintainMemoryEntry),
        ...tasks.curate ?? {},
        schedule: tasks.curate?.schedule ?? schedule
      });
    }
    const oldVerifyEntry = asObject(tasksObject[OLD_VERIFY_TASK]);
    if (oldVerifyEntry) {
      tasks.verify = withTimeout({
        ...withoutBroadInterval(oldVerifyEntry),
        ...tasks.verify ?? {},
        schedule: tasks.verify?.schedule ?? (typeof oldVerifyEntry.schedule === "string" ? oldVerifyEntry.schedule : baseCron)
      });
    }
    if (!tasks["verify-broad"]) {
      const verifyEnabled = typeof tasks.verify?.schedule === "string" && tasks.verify.schedule.trim() !== "";
      tasks["verify-broad"] = withTimeout({
        schedule: verifyEnabled ? DEFAULT_VERIFY_BROAD_CRON : ""
      });
    }
    const oldCurateEntries = OLD_CURATE_TASKS.map((task) => asObject(tasksObject[task])).filter((entry) => Boolean(entry));
    if (oldCurateEntries.length > 0) {
      const oldSchedules = oldCurateEntries.map((entry) => typeof entry.schedule === "string" ? entry.schedule : baseCron);
      tasks.curate = withTimeout({
        ...tasks.curate ?? {},
        schedule: mostFrequentSchedule(oldSchedules)
      });
    }
    for (const task of CANONICAL) {
      if (!tasks[task]) {
        const schedule = task === "verify" || task === "curate" || task === "verify-broad" ? "" : task === "classify-memories" ? classifySchedule : task === "retrospective" ? retrospectiveSchedule : task === "maintain-docs" ? "" : baseCron;
        tasks[task] = withTimeout({ schedule });
      }
    }
  } else {
    const legacyArray = Array.isArray(dreamer.tasks) ? dreamer.tasks.filter((t) => typeof t === "string") : null;
    const verifySelected = legacyArray ? legacyArray.includes(OLD_VERIFY_TASK) : true;
    const curateSelected = legacyArray ? legacyArray.some((task) => OLD_CURATE_TASKS.includes(task)) : true;
    tasks.verify = withTimeout({
      schedule: verifySelected ? baseCron : ""
    });
    tasks["verify-broad"] = withTimeout({
      schedule: verifySelected ? DEFAULT_VERIFY_BROAD_CRON : ""
    });
    tasks.curate = withTimeout({
      schedule: curateSelected ? baseCron : ""
    });
    tasks["classify-memories"] = withTimeout({
      schedule: classifySchedule
    });
    tasks.retrospective = withTimeout({
      schedule: retrospectiveSchedule
    });
    tasks["maintain-docs"] = withTimeout({
      schedule: legacyArray?.includes("maintain-docs") ? baseCron : ""
    });
  }
  tasks["map-memories"] ??= withTimeout({ schedule: baseCron });
  tasks["evaluate-smart-notes"] ??= withTimeout({ schedule: baseCron });
  const um = asObject(dreamer.user_memories);
  const umEnabled = um ? um.enabled !== false : true;
  if (um || !tasks["review-user-memories"]) {
    tasks["review-user-memories"] = withTimeout({
      ...tasks["review-user-memories"] ?? {},
      schedule: umEnabled ? baseCron : "",
      ...um && typeof um.promotion_threshold === "number" ? { promotion_threshold: um.promotion_threshold } : {}
    });
  }
  const {
    schedule: _schedule,
    tasks: _tasks,
    task_timeout_minutes: _tto,
    max_runtime_minutes: _max,
    user_memories: _um,
    pin_key_files: _pkf,
    ...rest
  } = dreamer;
  warnings.push('Migrated legacy dreamer scheduling (schedule window / tasks array / user_memories / pin_key_files) → per-task "dreamer.tasks" in-memory (run `doctor` to persist).');
  return { ...rawConfig, dreamer: { ...rest, tasks } };
}

// ../plugin/src/config/migrate-experimental.ts
function migrateLegacyExperimental(rawConfig, warnings) {
  const experimental = rawConfig.experimental;
  if (typeof experimental !== "object" || experimental === null) {
    return rawConfig;
  }
  const exp = experimental;
  const hasUM = "user_memories" in exp;
  const hasPKF = "pin_key_files" in exp;
  const hasMural = "mural" in exp;
  const TOP_LEVEL_GRADUATED = ["temporal_awareness", "caveman_text_compression"];
  const MEMORY_GRADUATED = ["auto_search", "git_commit_indexing"];
  const hasGraduated = TOP_LEVEL_GRADUATED.some((k) => (k in exp)) || MEMORY_GRADUATED.some((k) => (k in exp)) || hasMural;
  if (!hasUM && !hasPKF && !hasGraduated) {
    return rawConfig;
  }
  const patched = { ...rawConfig };
  const dreamer = typeof patched.dreamer === "object" && patched.dreamer !== null ? { ...patched.dreamer } : {};
  const memory = typeof patched.memory === "object" && patched.memory !== null ? { ...patched.memory } : {};
  const newExperimental = { ...exp };
  const coerceToObject = (value) => {
    if (typeof value === "boolean") {
      return { enabled: value };
    }
    if (typeof value === "object" && value !== null) {
      return { ...value };
    }
    return;
  };
  const relocate = (key, dest, destLabel) => {
    if (!(key in exp))
      return;
    const oldValue = exp[key];
    const existing = dest[key];
    if (existing === undefined) {
      dest[key] = oldValue;
      warnings.push(`Migrated "experimental.${key}" → "${destLabel}${key}" in-memory (run \`doctor\` to persist).`);
    } else if (typeof oldValue === "object" && oldValue !== null && typeof existing === "object" && existing !== null) {
      dest[key] = {
        ...oldValue,
        ...existing
      };
    }
    delete newExperimental[key];
  };
  for (const key of TOP_LEVEL_GRADUATED)
    relocate(key, patched, "");
  for (const key of MEMORY_GRADUATED)
    relocate(key, memory, "memory.");
  if (hasMural) {
    const oldMural = coerceToObject(exp.mural);
    const existingMural = patched.mural;
    if (existingMural === undefined) {
      patched.mural = oldMural ?? exp.mural;
      warnings.push('Deprecated "experimental.mural"; use top-level "mural" instead (migrated in memory; run `doctor` to persist).');
    } else if (oldMural !== undefined && typeof existingMural === "object" && existingMural !== null && !Array.isArray(existingMural)) {
      patched.mural = {
        ...oldMural,
        ...existingMural
      };
    }
    delete newExperimental.mural;
  }
  if (hasUM) {
    const oldUM = coerceToObject(exp.user_memories);
    if (oldUM !== undefined) {
      if (dreamer.user_memories === undefined) {
        dreamer.user_memories = oldUM;
        warnings.push('Migrated "experimental.user_memories" → "dreamer.user_memories" in-memory (run `doctor` to persist).');
      } else if (typeof dreamer.user_memories === "object" && dreamer.user_memories !== null) {
        dreamer.user_memories = {
          ...oldUM,
          ...dreamer.user_memories
        };
      }
    }
    delete newExperimental.user_memories;
  }
  if (hasPKF) {
    const oldPKF = coerceToObject(exp.pin_key_files);
    if (oldPKF !== undefined) {
      if (dreamer.pin_key_files === undefined) {
        dreamer.pin_key_files = oldPKF;
        warnings.push('Migrated "experimental.pin_key_files" → "dreamer.pin_key_files" in-memory (run `doctor` to persist).');
      } else if (typeof dreamer.pin_key_files === "object" && dreamer.pin_key_files !== null) {
        dreamer.pin_key_files = {
          ...oldPKF,
          ...dreamer.pin_key_files
        };
      } else if (typeof dreamer.pin_key_files === "boolean") {
        dreamer.pin_key_files = { ...oldPKF, enabled: dreamer.pin_key_files };
      }
    }
    delete newExperimental.pin_key_files;
  }
  patched.experimental = newExperimental;
  patched.dreamer = dreamer;
  if (Object.keys(memory).length > 0) {
    patched.memory = memory;
  }
  return patched;
}

// ../plugin/src/config/schema/magic-context.ts
import { homedir as homedir5 } from "node:os";

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array, separator = "|") {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}

class Cached {
  constructor(getter) {
    this._getter = getter;
    this._value = undefined;
  }
  get value() {
    const getter = this._getter;
    if (getter !== undefined) {
      this._value = getter();
      this._getter = undefined;
    }
    return this._value;
  }
}
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex2(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== undefined && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge2(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value }));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a;
  for (let i = start;i < issues.length; i++) {
    (_a = issues[i]).schema ?? (_a.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config) {
  var _a;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a = iss).schema ?? (_a.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : undefined;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0;i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? undefined : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = undefined;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: undefined };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/core.js
var _a;
var _zodDesc = { value: undefined, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition;
      }
      try {
        return new Definition;
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition;
}
function $constructor(name, initializer, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = new Set;
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && new WeakSet;
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = undefined;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer(inst, def);
    if (initialized) {
      const own = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto = _.prototype;
    for (const k in proto) {
      if (!Object.prototype.hasOwnProperty.call(proto, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = undefined;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: undefined, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = undefined;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, undefined, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error, path = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node = curr[el];
            if (terminal) {
              node._errors.push(mapper(issue));
            }
            curr = node;
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError;
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = undefined;
        ctx = undefined;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = undefined;
      ctx = undefined;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = (schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== undefined) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === undefined)
      return false;
  }
  return validateFallback(schema, value, _ctx);
};
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _encodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== undefined;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex2(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex2(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex2(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join(`
`)}
};`);
    return factory(...Object.values(this.closed));
  }
}

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 5
};

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {}
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url = validateURL(trimmed, def);
      if (url === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== undefined && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === undefined ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== undefined && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === undefined) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key]
      });
    }
    return;
  }
  if (result.value === undefined) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, new Set);
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== undefined)
          propValues[key].add(undefined);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== undefined;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== undefined) ? "optional" : undefined);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = new Map;
  let unrecIssue;
  const keyIssues = new Map;
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = new Set;
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[outKey] = result.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result) => {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex2(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex2(o) : o ? escapeRegex2(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? undefined : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? new Set([...values, undefined]) : undefined;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === undefined) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result) => handleOptionalResult(payload, result));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleCatchResult(payload, result, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/memoizer.js
class $ZodCyclicError extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
}
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap;
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached = recursive.get(inst);
  if (cached !== undefined)
    return cached ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : undefined);
      merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    case "template_literal":
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check(value);
        else if (Array.isArray(value))
          for (const el of value)
            check(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = new WeakMap;
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = undefined;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError;
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === undefined) {
          const walked = isRecursive(inst, new Set, false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: new WeakMap, backEdges: undefined };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = new WeakSet);
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = undefined;
        const entry = open.length > depth ? open.pop() : undefined;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== undefined && isRef(value) && backEdges.has(value);
}
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/locales/en.js
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue) => {
    switch (issue.code) {
      case "invalid_type": {
        const expected = getTypeName(issue.expected);
        const receivedType = parsedType(issue.input);
        const received = getTypeName(receivedType, issue.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
      case "too_big": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
        const sizing = getSizing(issue.origin);
        if (sizing)
          return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue.origin}`;
      case "invalid_union":
        if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
          const opts = issue.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/registries.js
var _a2;
class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
function _string(Class, params) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _slugify() {
  return _overwrite((input) => slugify(input));
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn, params) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {}),
    io: params?.io ?? "output",
    counter: 0,
    seen: new Map,
    sharedDefsExtractedFor: undefined,
    sharedEmitDoneFor: undefined,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? undefined
  };
}
function handleUnrepresentable(schema, ctx, json, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === undefined || result === "throw")
    throw new Error(message);
  Object.assign(json, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = undefined;
  ctx.sharedEmitDoneFor = undefined;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    assignProps(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a = result.schema).default ?? (_a.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = new Map;
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id) => id);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema = seen.schema;
    for (const key in schema) {
      delete schema[key];
    }
    schema.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== undefined)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === undefined || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members) {
  const objects = [];
  for (const member of members) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required = new Set;
  for (const object of objects) {
    for (const key in object.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === undefined)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties, key, merged);
    }
    for (const key of object.required ?? [])
      required.add(key);
  }
  const folded = { type: "object", properties };
  if (required.size)
    folded.required = [...required];
  if (objects.every((object) => object.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object of objects) {
      const constraint = undeclaredConstraint(object);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json) {
  const allOf = json.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
    if (Object.keys(union).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union);
    const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json.allOf;
  assignProps(json, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema = seen.def ?? seen.schema;
    const _cached = { ...schema };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema.allOf = schema.allOf ?? [];
        schema.allOf.push(refSchema);
      } else {
        assignProps(schema, refSchema);
      }
      assignProps(schema, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = new Map;
      for (const seen of ctx.seen.values()) {
        for (const json of [seen.schema, seen.def]) {
          const allOf = json?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json);
          else
            carriers.set(allOf, [json]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json of carriers.get(allOf) ?? [])
          foldIntersection(json);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {}
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== undefined && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {} else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
  if (agg[key] === undefined || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === undefined || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = new Set);
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
  agg.format = format;
  if (format.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== undefined)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== undefined)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== undefined)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== undefined)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== undefined)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== undefined) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
};
var exactPatterns = new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time" || laxFormat) {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json.allOf = [
        ...patternList.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = new Set;
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== undefined)
      json.multipleOf = first;
    if (rest.length)
      json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === undefined) {
      if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {} else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var customProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json.type = "object";
  json.properties = {};
  for (const key in shape) {
    assignProp(json.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === undefined : field._zod.optout === undefined) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
  ctx.intersections.push(allOf);
};
function stringifyKeyNames(bySchema, json, visited) {
  if (json.$ref) {
    if (visited.has(json))
      return json;
    visited.add(json);
    const def = bySchema.get(json)?.def;
    if (!def)
      return json;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json = { ...json, [keyword]: mapped };
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json.enum ?? (json.const !== undefined ? [json.const] : undefined);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = new WeakMap;
function rewriteKeyNames(ctx) {
  const bySchema = new Map;
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = new Map;
  for (const record of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, new Set);
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== undefined;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(undefined);
  } catch {
    handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue) => {
    self.issues.push(issue);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues) => {
    self.issues.push(...issues);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, undefined, {
  Parent: Error
});

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/parse.js
var parse4 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// ../../node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta) {
    reg.add(this, meta);
    return this;
  },
  refine(check, params) {
    return this.check(refine(check, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default2(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(undefined).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  get "~standard"() {
    return hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  },
  parse: function _parse(data, params) {
    return parse4(this, data, params, { callee: _parse });
  },
  parseAsync: async function _parseAsync(data, params) {
    return await parseAsync(this, data, params, { callee: _parseAsync });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode(data, params) {
    return encode(this, data, params, { callee: _encode });
  },
  decode: function _decode(data, params) {
    return decode(this, data, params, { callee: _decode });
  },
  encodeAsync: async function _encodeAsync(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync });
  },
  decodeAsync: async function _decodeAsync(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync });
  },
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  get description() {
    return globalRegistry.get(this)?.description;
  },
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /* @__PURE__ */ derived({
  format: (inst) => aggregateChecks(inst).format ?? null,
  minLength: (inst) => aggregateChecks(inst).minimum ?? null,
  maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
  regex(...args) {
    return this.check(_regex(...args));
  },
  includes(...args) {
    return this.check(_includes(...args));
  },
  startsWith(...args) {
    return this.check(_startsWith(...args));
  },
  endsWith(...args) {
    return this.check(_endsWith(...args));
  },
  min(...args) {
    return this.check(_minLength(...args));
  },
  max(...args) {
    return this.check(_maxLength(...args));
  },
  length(...args) {
    return this.check(_length(...args));
  },
  nonempty(...args) {
    return this.check(_minLength(1, ...args));
  },
  lowercase(params) {
    return this.check(_lowercase(params));
  },
  uppercase(params) {
    return this.check(_uppercase(params));
  },
  trim() {
    return this.check(_trim());
  },
  normalize(...args) {
    return this.check(_normalize(...args));
  },
  toLowerCase() {
    return this.check(_toLowerCase());
  },
  toUpperCase() {
    return this.check(_toUpperCase());
  },
  slugify() {
    return this.check(_slugify());
  }
}));
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
  inst.isFinite = true;
}, /* @__PURE__ */ derived({
  minValue: (inst) => {
    const { minimum, exclusiveMinimum } = aggregateChecks(inst);
    return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
  },
  maxValue: (inst) => {
    const { maximum, exclusiveMaximum } = aggregateChecks(inst);
    return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
  },
  isInt: (inst) => {
    const { isInt, multipleOf } = aggregateChecks(inst);
    return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
  },
  format: (inst) => aggregateChecks(inst).format ?? null
}, {
  gt(value, params) {
    return this.check(_gt(value, params));
  },
  gte(value, params) {
    return this.check(_gte(value, params));
  },
  min(value, params) {
    return this.check(_gte(value, params));
  },
  lt(value, params) {
    return this.check(_lt(value, params));
  },
  lte(value, params) {
    return this.check(_lte(value, params));
  },
  max(value, params) {
    return this.check(_lte(value, params));
  },
  int(params) {
    return this.check(int2(params));
  },
  safe(params) {
    return this.check(int2(params));
  },
  positive(params) {
    return this.check(_gt(0, params));
  },
  nonnegative(params) {
    return this.check(_gte(0, params));
  },
  negative(params) {
    return this.check(_lt(0, params));
  },
  nonpositive(params) {
    return this.check(_lte(0, params));
  },
  multipleOf(value, params) {
    return this.check(_multipleOf(value, params));
  },
  step(value, params) {
    return this.check(_multipleOf(value, params));
  },
  finite() {
    return this;
  }
}));
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int2(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(mergeDefs(this._zod.def, { catchall: undefined }));
  },
  extend(incoming) {
    return extend(this, incoming);
  },
  safeExtend(incoming) {
    return safeExtend(this, incoming);
  },
  merge(other) {
    return merge2(this, other);
  },
  pick(mask) {
    return pick(this, mask);
  },
  omit(mask) {
    return omit(this, mask);
  },
  partial(...args) {
    return partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
// ../plugin/src/agents/language-directive.ts
var ENGLISH_LANGUAGE_NAMES = new Intl.DisplayNames(["en"], {
  type: "language",
  fallback: "none"
});
function resolveLanguageName(language) {
  const code = typeof language === "string" ? language.trim().toLowerCase() : "";
  if (!/^[a-z]{2}$/.test(code))
    return "";
  let english;
  try {
    english = ENGLISH_LANGUAGE_NAMES.of(code) ?? undefined;
  } catch {
    return "";
  }
  if (!english)
    return "";
  let endonym;
  try {
    endonym = new Intl.DisplayNames([code], { type: "language", fallback: "none" }).of(code) ?? undefined;
  } catch {
    endonym = undefined;
  }
  return endonym && endonym !== english ? `${english} (${endonym})` : english;
}
function isValidLanguageCode(language) {
  return resolveLanguageName(language) !== "";
}

// ../plugin/src/features/magic-context/dreamer/cron.ts
var FIELDS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day-of-month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "day-of-week", min: 0, max: 7 }
];
var MINUTE_MS = 60000;
var MAX_SEARCH_MS = 4 * 366 * 24 * 60 * MINUTE_MS;
function parseField(token, spec) {
  const values = new Set;
  const normalize = (n) => spec.name === "day-of-week" && n === 7 ? 0 : n;
  for (const part of token.split(",")) {
    const piece = part.trim();
    if (piece.length === 0)
      return null;
    const [rangePart, stepPart, ...extra] = piece.split("/");
    if (extra.length > 0)
      return null;
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart))
        return null;
      step = Number(stepPart);
      if (step < 1)
        return null;
    }
    let lo;
    let hi;
    if (rangePart === "*") {
      lo = spec.min;
      hi = spec.max;
    } else if (rangePart.includes("-")) {
      const [loStr, hiStr, ...rest] = rangePart.split("-");
      if (rest.length > 0)
        return null;
      if (!/^\d+$/.test(loStr) || !/^\d+$/.test(hiStr))
        return null;
      lo = Number(loStr);
      hi = Number(hiStr);
    } else {
      if (!/^\d+$/.test(rangePart))
        return null;
      lo = Number(rangePart);
      hi = stepPart !== undefined ? spec.max : lo;
    }
    if (lo < spec.min || lo > spec.max || hi < spec.min || hi > spec.max)
      return null;
    if (lo > hi)
      return null;
    for (let v = lo;v <= hi; v += step) {
      values.add(normalize(v));
    }
  }
  return values.size > 0 ? values : null;
}
function parseCron(expression) {
  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "empty cron expression" };
  }
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 5) {
    return {
      ok: false,
      error: `expected 5 fields (minute hour day-of-month month day-of-week), got ${tokens.length}`
    };
  }
  const sets = [];
  for (let i = 0;i < FIELDS.length; i++) {
    const parsed = parseField(tokens[i], FIELDS[i]);
    if (!parsed) {
      return {
        ok: false,
        error: `invalid ${FIELDS[i].name} field "${tokens[i]}" (allowed ${FIELDS[i].min}-${FIELDS[i].max})`
      };
    }
    sets.push(parsed);
  }
  return {
    ok: true,
    cron: {
      minute: sets[0],
      hour: sets[1],
      dom: sets[2],
      month: sets[3],
      dow: sets[4],
      domRestricted: tokens[2] !== "*",
      dowRestricted: tokens[4] !== "*"
    }
  };
}
function isValidCron(expression) {
  return parseCron(expression).ok;
}

// ../plugin/src/shared/prompt-surface.ts
function isValidPromptSurfaceModelKey(key) {
  if (key.length === 0 || key.trim() !== key)
    return false;
  const slash = key.indexOf("/");
  if (slash < 0)
    return !key.includes("*");
  if (slash === 0 || slash === key.length - 1)
    return false;
  const provider = key.slice(0, slash);
  const modelID = key.slice(slash + 1);
  if (provider.trim() !== provider || modelID.trim() !== modelID || provider.includes("*") || modelID.includes("*") && modelID !== "*") {
    return false;
  }
  if (modelID === "*")
    return true;
  return modelID.length > 0 && !modelID.startsWith("/") && !modelID.endsWith("/") && !modelID.includes("//");
}

// ../plugin/src/config/schema/agent-overrides.ts
var PermissionValueSchema = _enum(["ask", "allow", "deny"]);
var PermissionSchema = object({
  edit: PermissionValueSchema.optional(),
  bash: union([PermissionValueSchema, record(string2(), PermissionValueSchema)]).optional(),
  webfetch: PermissionValueSchema.optional(),
  doom_loop: PermissionValueSchema.optional(),
  external_directory: PermissionValueSchema.optional()
}).optional();
var AgentOverrideConfigSchema = object({
  model: string2().optional().describe("Primary model ID (e.g. 'claude-sonnet-4-6')"),
  temperature: number2().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
  top_p: number2().min(0).max(1).optional().describe("Nucleus sampling top_p (0-1)"),
  prompt: string2().optional().describe("Additional system prompt text"),
  tools: record(string2(), boolean2()).optional().describe("Tool enable/disable overrides"),
  disable: boolean2().optional().describe("Disable this agent"),
  description: string2().optional().describe("Agent description"),
  mode: _enum(["subagent", "primary", "all"]).optional().describe("Agent mode (subagent, primary, or all)"),
  color: string2().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe("Hex color for the agent (e.g. '#a1b2c3')"),
  maxSteps: number2().optional().describe("Maximum tool-call steps per invocation"),
  permission: PermissionSchema.describe("Per-tool permission overrides"),
  maxTokens: number2().optional().describe("Maximum output tokens"),
  variant: string2().optional().describe("OpenCode reasoning variant (e.g. for extended thinking)"),
  fallback_models: union([string2(), array(string2())]).optional().describe("Fallback model IDs if primary is unavailable")
});

// ../plugin/src/config/schema/magic-context.ts
var DEFAULT_EXECUTE_THRESHOLD_PERCENTAGE = 65;
var EXECUTE_THRESHOLD_CAP_MESSAGE = "execute_threshold is capped at 90% for cache safety: output capacity is reserved from the usable context window, and the remaining 10% absorbs mid-turn growth before the absolute 95% emergency wall. Use a value between 20 and 90.";
var DEFAULT_HISTORIAN_TIMEOUT_MS = 600000;
var DEFAULT_HISTORY_BUDGET_PERCENTAGE = 0.15;
var PROTECTED_TOKENS_MIN = 4000;
var DEFAULT_LOCAL_EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
var PiThinkingLevelSchema = _enum(["off", "minimal", "low", "medium", "high", "xhigh", "max"]).optional();
var OmpThinkingLevelSchema = _enum(["off", "minimal", "low", "medium", "high", "xhigh", "max", "inherit", "auto"]).optional();
var PiConfigSchema = object({
  subagent_extensions: array(string2().trim().min(1)).optional().describe("User-only allowlist of Pi extensions for Magic Context subagent children. When set, children use --no-extensions and load only these entries (plus Magic Context's scoped child extension where applicable). Relative paths resolve from ~/.pi/agent, matching Pi's settings.json package location. Unset preserves normal Pi extension discovery.")
}).optional();
var PromptSurfacePresetSchema = _enum(["full", "light"]);
var PromptSurfaceModelKeySchema = string2().refine(isValidPromptSurfaceModelKey, {
  message: "Use a non-empty bare model key, provider/model key, or the literal provider/* wildcard; model IDs may contain additional slashes and matching is case-sensitive."
});
var PromptSurfaceToolKeySchema = string2().refine((value) => value.trim().length > 0, {
  message: "tool description keys must not be empty or whitespace-only"
});
var PromptSurfaceConfigSchema = object({
  default: PromptSurfacePresetSchema.default("full").describe('Fallback prompt-surface preset ("full" or "light").'),
  models: record(PromptSurfaceModelKeySchema, PromptSurfacePresetSchema).optional().describe("Literal per-model routing. Keys are bare model IDs, provider/model, or provider/*; matching is case-sensitive and preserves additional slashes in model IDs."),
  guidance_override_path: string2().refine((value) => value.trim().length > 0, {
    message: "guidance_override_path must not be empty or whitespace-only"
  }).optional().describe("USER-LEVEL ONLY path to a complete primary guidance section. Relative paths resolve from the user config file."),
  tool_descriptions: record(PromptSurfaceToolKeySchema, string2().refine((value) => value.trim().length > 0, {
    message: "tool description values must not be empty or whitespace-only"
  })).optional().describe("USER-LEVEL ONLY top-level description overrides keyed by ctx_* tool ID; parameter schemas and descriptions are unchanged.")
}).describe("Prompt-surface preset routing. Project config may select default/models, while guidance_override_path and tool_descriptions are user-level only.");
var PER_HARNESS_MIGRATION_INVENTORY = {
  historian: {
    retained: [
      "temperature",
      "top_p",
      "prompt",
      "tools",
      "disable",
      "description",
      "mode",
      "color",
      "maxSteps",
      "permission",
      "maxTokens",
      "two_pass",
      "disallowed_tools"
    ],
    migrated_execution: ["model", "fallback_models", "variant", "thinking_level"]
  },
  dreamer: {
    retained: [
      "temperature",
      "top_p",
      "prompt",
      "tools",
      "disable",
      "description",
      "mode",
      "color",
      "maxSteps",
      "permission",
      "maxTokens",
      "inject_docs"
    ],
    migrated_execution: ["model", "fallback_models", "variant", "thinking_level"]
  },
  task: {
    retained: ["schedule", "promotion_threshold"],
    migrated_execution: [
      "model",
      "fallback_models",
      "variant",
      "thinking_level",
      "timeout_minutes"
    ]
  }
};
var PER_HARNESS_MODEL_KEYS = ["opencode", "pi", "omp"];
var OcEntryObjectSchema = object({
  model: string2().describe("OpenCode model ID (for example, provider/model)."),
  variant: string2().optional().describe("OpenCode reasoning variant for this entry.")
}).strict();
var OcEntrySchema = union([string2(), OcEntryObjectSchema]);
var PiEntryObjectSchema = object({
  model: string2().describe("Pi model ID (for example, provider/model)."),
  thinking_level: PiThinkingLevelSchema.describe("Pi thinking level for this entry.")
}).strict();
var PiEntrySchema = union([string2(), PiEntryObjectSchema]);
var OmpEntryObjectSchema = object({
  model: string2().describe("OMP model ID (for example, provider/model)."),
  thinking_level: OmpThinkingLevelSchema.describe("OMP thinking level for this entry.")
}).strict();
var OmpEntrySchema = union([string2(), OmpEntryObjectSchema]);
var OpenCodeHarnessBlockSchema = object({
  model: OcEntrySchema.optional().describe("Primary OpenCode model entry."),
  fallback_models: array(OcEntrySchema).optional().describe("Ordered fallback OpenCode entries. New-shape configuration requires an array; legacy singleton values migrate to a one-element array."),
  variant: string2().optional().describe("OpenCode reasoning variant for the primary entry when it declares none. Fallback entries declare variants per-entry.")
}).strict().describe("Strict OpenCode model-resolution block. It accepts no Pi vocabulary.");
var PiHarnessBlockSchema = object({
  model: PiEntrySchema.optional().describe("Primary Pi model entry."),
  fallback_models: array(PiEntrySchema).optional().describe("Ordered fallback Pi entries. New-shape configuration requires an array; legacy singleton values migrate to a one-element array."),
  thinking_level: PiThinkingLevelSchema.describe("Pi thinking level for the primary entry when it declares none. Fallback entries declare thinking levels per-entry.")
}).strict().describe("Strict Pi model-resolution block. It accepts no OpenCode vocabulary.");
var OmpHarnessBlockSchema = object({
  model: OmpEntrySchema.optional().describe("Primary OMP model entry."),
  fallback_models: array(OmpEntrySchema).optional().describe("Ordered fallback OMP entries."),
  thinking_level: OmpThinkingLevelSchema.describe("OMP thinking level for the primary entry when it declares none. Fallback entries declare thinking levels per-entry.")
}).strict().describe("Strict OMP model-resolution block. It accepts no OpenCode vocabulary.");
var OpenCodeTaskExecutionSchema = object({
  model: OcEntrySchema.optional().describe("OpenCode model entry for this task."),
  fallback_models: array(OcEntrySchema).optional().describe("Ordered OpenCode fallback entries for this task."),
  variant: string2().optional().describe("OpenCode reasoning variant for this task's primary entry when it declares none. Fallback entries declare variants per-entry."),
  timeout_minutes: number2().min(5).optional().describe("Minutes allowed for this task before it is aborted.")
}).strict();
var PiTaskExecutionSchema = object({
  model: PiEntrySchema.optional().describe("Pi model entry for this task."),
  fallback_models: array(PiEntrySchema).optional().describe("Ordered Pi fallback entries for this task."),
  thinking_level: PiThinkingLevelSchema.describe("Pi thinking level for this task's primary entry when it declares none. Fallback entries declare thinking levels per-entry."),
  timeout_minutes: number2().min(5).optional().describe("Minutes allowed for this task before it is aborted.")
}).strict();
var OmpTaskExecutionSchema = object({
  model: OmpEntrySchema.optional().describe("OMP model entry for this task."),
  fallback_models: array(OmpEntrySchema).optional().describe("Ordered OMP fallback entries for this task."),
  thinking_level: OmpThinkingLevelSchema.describe("OMP thinking level for this task's primary entry when it declares none. Fallback entries declare thinking levels per-entry."),
  timeout_minutes: number2().min(5).optional().describe("Minutes allowed for this task before it is aborted.")
}).strict();
var DreamerOpenCodeHarnessBlockSchema = object({
  model: OcEntrySchema.optional().describe("Primary OpenCode model entry."),
  fallback_models: array(OcEntrySchema).optional().describe("Ordered fallback OpenCode entries. New-shape configuration requires an array; legacy singleton values migrate to a one-element array."),
  variant: string2().optional().describe("OpenCode reasoning variant for the primary entry when it declares none. Fallback entries declare variants per-entry."),
  tasks: record(string2(), OpenCodeTaskExecutionSchema).optional().describe("OpenCode task execution overrides. Each named task accepts only model, fallback_models, variant, and timeout_minutes.")
}).strict().describe("Strict OpenCode dreamer model-resolution block. It accepts no Pi vocabulary.");
var DreamerPiHarnessBlockSchema = object({
  model: PiEntrySchema.optional().describe("Primary Pi model entry."),
  fallback_models: array(PiEntrySchema).optional().describe("Ordered fallback Pi entries. New-shape configuration requires an array; legacy singleton values migrate to a one-element array."),
  thinking_level: PiThinkingLevelSchema.describe("Pi thinking level for the primary entry when it declares none. Fallback entries declare thinking levels per-entry."),
  tasks: record(string2(), PiTaskExecutionSchema).optional().describe("Pi task execution overrides. Each named task accepts only model, fallback_models, thinking_level, and timeout_minutes.")
}).strict().describe("Strict Pi dreamer model-resolution block. It accepts no OpenCode vocabulary.");
var DreamerOmpHarnessBlockSchema = object({
  model: OmpEntrySchema.optional().describe("Primary OMP model entry."),
  fallback_models: array(OmpEntrySchema).optional().describe("Ordered fallback OMP entries."),
  thinking_level: OmpThinkingLevelSchema.describe("OMP thinking level for the primary entry when it declares none. Fallback entries declare thinking levels per-entry."),
  tasks: record(string2(), OmpTaskExecutionSchema).optional().describe("OMP task execution overrides. Each named task accepts only model, fallback_models, thinking_level, and timeout_minutes.")
}).strict().describe("Strict OMP dreamer model-resolution block. It accepts no OpenCode vocabulary.");
var ProfileOpenCodeModelBlockSchema = object({
  model: OcEntrySchema.optional().describe("Primary OpenCode model entry."),
  fallback_models: array(OcEntrySchema).optional().describe("Ordered fallback OpenCode model entries."),
  variant: string2().optional().describe("OpenCode reasoning variant for the primary model entry.")
}).strict().describe("Strict profile-only OpenCode model-selection block.");
var ProfilePiModelBlockSchema = object({
  model: PiEntrySchema.optional().describe("Primary Pi model entry."),
  fallback_models: array(PiEntrySchema).optional().describe("Ordered fallback Pi model entries."),
  thinking_level: PiThinkingLevelSchema.describe("Pi thinking level for the primary model entry.")
}).strict().describe("Strict profile-only Pi model-selection block.");
var ProfileOmpModelBlockSchema = object({
  model: OmpEntrySchema.optional().describe("Primary OMP model entry."),
  fallback_models: array(OmpEntrySchema).optional().describe("Ordered fallback OMP model entries."),
  thinking_level: OmpThinkingLevelSchema.describe("OMP thinking level for the primary model entry.")
}).strict().describe("Strict profile-only OMP model-selection block.");
var ProfileHistorianSchema = object({
  opencode: ProfileOpenCodeModelBlockSchema.optional(),
  pi: ProfilePiModelBlockSchema.optional(),
  omp: ProfileOmpModelBlockSchema.optional()
}).strict();
var ProfileDreamerSchema = object({
  opencode: ProfileOpenCodeModelBlockSchema.optional(),
  pi: ProfilePiModelBlockSchema.optional(),
  omp: ProfileOmpModelBlockSchema.optional()
}).strict();
var ConfigProfileSchema = object({
  historian: ProfileHistorianSchema.optional(),
  dreamer: ProfileDreamerSchema.optional()
}).strict().describe("User-owned model-selection overlay. Only historian/dreamer harness model blocks are allowed.");
var ConfigProfilesSchema = record(string2().trim().min(1, "Profile names must not be empty or whitespace-only."), ConfigProfileSchema);
var CronScheduleSchema = string2().refine((s) => s.trim() === "" || isValidCron(s), {
  message: 'Invalid schedule: use a 5-field cron expression (e.g. "0 3 * * *" for 3am daily, "0 3 * * 0" for Sunday 3am, "0 */6 * * *" every 6h) or "" to disable.'
}).describe('5-field cron schedule (e.g. "0 3 * * *"), or "" to disable this task.');
var DreamTaskBaseConfigSchema = object({
  schedule: CronScheduleSchema.default("")
}).strict();
var PromotionThresholdSchema = number2().min(2).max(20).optional().describe("review-user-memories: min candidate observations before promotion is considered (default: 3)");
var PrimerPromotionThresholdSchema = number2().min(2).max(20).optional().describe("promote-primers: min recurring source days before promotion is considered (default: 2)");
var DreamTaskConfigSchema = DreamTaskBaseConfigSchema.extend({
  promotion_threshold: PromotionThresholdSchema
});
var ReviewUserMemoriesTaskConfigSchema = DreamTaskBaseConfigSchema.extend({
  promotion_threshold: PromotionThresholdSchema
});
var PromotePrimersTaskConfigSchema = DreamTaskBaseConfigSchema.extend({
  promotion_threshold: PrimerPromotionThresholdSchema
});
var DEFAULT_TASK_SCHEDULES = {
  "map-memories": "0 2 * * *",
  verify: "0 3 * * *",
  "verify-broad": "0 4 * * 0",
  curate: "0 4 * * 0",
  "compress-cues": "0 4 * * *",
  "classify-memories": "0 6 * * *",
  retrospective: "0 5 * * *",
  "maintain-docs": "",
  "evaluate-smart-notes": "0 3 * * *",
  "review-user-memories": "0 3 * * *",
  "promote-primers": "0 3 * * *",
  "refresh-primers": "0 3 * * *"
};
function defaultTaskConfig(task) {
  const base = { schedule: DEFAULT_TASK_SCHEDULES[task] };
  if (task === "review-user-memories")
    base.promotion_threshold = 3;
  if (task === "promote-primers")
    base.promotion_threshold = 2;
  return base;
}
var DreamTasksSchema = object({
  "map-memories": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("map-memories"))),
  verify: DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("verify"))),
  "verify-broad": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("verify-broad"))),
  curate: DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("curate"))),
  "compress-cues": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("compress-cues"))),
  "classify-memories": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("classify-memories"))),
  retrospective: DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("retrospective"))),
  "maintain-docs": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("maintain-docs"))),
  "evaluate-smart-notes": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("evaluate-smart-notes"))),
  "review-user-memories": ReviewUserMemoriesTaskConfigSchema.default(() => ReviewUserMemoriesTaskConfigSchema.parse(defaultTaskConfig("review-user-memories"))),
  "promote-primers": PromotePrimersTaskConfigSchema.default(() => PromotePrimersTaskConfigSchema.parse(defaultTaskConfig("promote-primers"))),
  "refresh-primers": DreamTaskBaseConfigSchema.default(() => DreamTaskBaseConfigSchema.parse(defaultTaskConfig("refresh-primers")))
}).describe("Harness-independent task metadata. schedule, promotion_threshold, and other task metadata remain here; execution settings live under dreamer.opencode.tasks, dreamer.pi.tasks, or dreamer.omp.tasks.");
var AgentMetadataSchema = AgentOverrideConfigSchema.pick({
  temperature: true,
  top_p: true,
  prompt: true,
  tools: true,
  disable: true,
  description: true,
  mode: true,
  color: true,
  maxSteps: true,
  permission: true,
  maxTokens: true
});
var DreamerConfigSchema = AgentMetadataSchema.extend({
  opencode: DreamerOpenCodeHarnessBlockSchema.optional(),
  pi: DreamerPiHarnessBlockSchema.optional(),
  omp: DreamerOmpHarnessBlockSchema.optional(),
  tasks: DreamTasksSchema.default(() => DreamTasksSchema.parse({})),
  inject_docs: boolean2().default(true).describe("Inject ARCHITECTURE.md and STRUCTURE.md into the m[0] `<project-docs>` block (default true)")
});
var HistorianConfigSchema = AgentMetadataSchema.extend({
  opencode: OpenCodeHarnessBlockSchema.optional(),
  pi: PiHarnessBlockSchema.optional(),
  omp: OmpHarnessBlockSchema.optional(),
  two_pass: boolean2().default(false).describe("Run a second editor pass over historian output to clean low-signal U: lines and cross-compartment duplicates. Adds ~1 extra API call and ~1.3x cost per historian run. Useful for models without extended thinking support. (default: false)"),
  disallowed_tools: array(_enum(["*", "read", "aft_outline", "aft_zoom", "aft_search"])).default([]).describe(`OpenCode only. Tools to REMOVE from the historian's default allow-list [read, aft_outline, aft_zoom, aft_search]. Applies to both historian and historian-editor agents. Use ["*"] to strip all tool definitions from the model request — this prevents weak instruction-following models (e.g. mistral-small-latest) from entering tool-calling loops. Individual tool names remove just that tool. Note: a user-supplied historian.permission override can re-allow a tool that disallowed_tools removed — disallowed_tools sets the baseline, permission overrides take precedence. (default: [])`)
}).optional();
var EmbeddingFallbackProviderSchema = _enum(["local", "openai-compatible", "off"]);
function expandConfigPath(value) {
  const trimmed = value.trim();
  if (trimmed === "~")
    return homedir5();
  if (trimmed.startsWith("~/"))
    return `${homedir5()}/${trimmed.slice(2)}`;
  return trimmed;
}
var BaseEmbeddingConfigSchema = object({
  provider: _enum(["local", "openai-compatible", "off", "synapse"]).default("local").describe("Embedding provider. 'local' uses Xenova/all-MiniLM-L6-v2, 'openai-compatible' requires endpoint and model, 'synapse' uses the certified local Synapse lane with an explicit fallback provider, and 'off' disables embeddings."),
  fallback_provider: EmbeddingFallbackProviderSchema.optional().describe("Fallback provider for the Synapse lane. Required when provider is 'synapse'; local, openai-compatible, and off are valid."),
  model: string2().optional().describe("Embedding model name. Required for openai-compatible, ignored for local."),
  endpoint: string2().optional().describe("API endpoint URL. Required when provider is openai-compatible."),
  api_key: string2().optional().describe("API key for remote embedding provider (optional)"),
  input_type: string2().optional().describe("Default input_type for stored/indexed (passage) embeddings in the request body. Required by some openai-compatible providers (e.g. NVIDIA NIM). Omitted from the request when unset."),
  query_input_type: string2().optional().describe("Optional input_type for query (search) embeddings on asymmetric models (e.g. NVIDIA NIM 'query'). When unset, query embeddings use embedding.input_type. Passage/stored content always uses embedding.input_type."),
  query_instruction: union([string2(), literal(false)]).optional().describe("OpenAI-compatible query prefix override. A string is prepended verbatim to search queries; false disables the built-in model-family instruction. Qwen3-Embedding, gte-Qwen instruct, e5 instruct, and Nomic families have built-in recipes. Query-only changes do not re-embed stored content. User-level only; project values are ignored."),
  document_prefix: string2().optional().describe("OpenAI-compatible stored-document prefix override, prepended verbatim. Defaults to the model-family recipe (empty for Qwen3/gte/e5 instruct; 'search_document: ' for Nomic). Changing it changes stored vectors and triggers re-embedding. User-level only; project values are ignored."),
  truncate: string2().optional().describe("Optional truncate mode sent in the embedding request body (e.g. NVIDIA NIM accepts 'NONE' | 'START' | 'END'). Omitted from the request when unset."),
  max_input_tokens: number2().int().positive().optional().describe("Optional maximum input tokens for chunk embeddings. Defaults conservatively to 512 when omitted."),
  local_runtime: _enum(["auto", "native", "wasm"]).default("auto").describe("Local provider only: ONNX runtime selection. 'auto' uses native under Node and uses WASM under Bun versions before 1.4.0, where Bun's NAPI teardown race can panic on quit; native is restored automatically on Bun 1.4.0+. Set 'native' only to prefer speed while accepting that pre-1.4.0 Bun crash risk, or 'wasm' to avoid loading the native addon."),
  local_dtype: _enum([
    "auto",
    "fp32",
    "fp16",
    "q8",
    "int8",
    "uint8",
    "q4",
    "bnb4",
    "q4f16",
    "q2",
    "q2f16",
    "q1",
    "q1f16"
  ]).optional().describe("Local provider only: ONNX model dtype passed to the transformers.js feature-extraction pipeline. Accepts the @huggingface/transformers DataType strings (auto, fp32, fp16, q8, int8, uint8, q4, bnb4, q4f16, q2, q2f16, q1, q1f16). Omitted keeps today's behavior (fp32). A non-default value changes the produced vectors and folds into the embedding model identity, so switching dtype re-embeds rather than mixing vector spaces. Useful for selecting a quantized variant (e.g. q8) of a larger multilingual model to cut memory and CPU cost; see issue #259.")
}).superRefine((data, ctx) => {
  const validationProvider = data.provider === "synapse" ? data.fallback_provider : data.provider;
  if (validationProvider === "openai-compatible" && !data.endpoint?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["endpoint"],
      message: "endpoint is required when embedding.provider is openai-compatible"
    });
  }
  if (validationProvider === "openai-compatible" && !data.model?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["model"],
      message: "model is required when embedding.provider is openai-compatible"
    });
  }
});
var EmbeddingConfigSchema = BaseEmbeddingConfigSchema.transform((data) => {
  if (data.provider === "synapse") {
    const model = data.model?.trim();
    const endpoint = data.endpoint?.trim();
    const apiKey = data.api_key?.trim();
    const inputType = data.input_type?.trim();
    const queryInputType = data.query_input_type?.trim();
    const truncate = data.truncate?.trim();
    return {
      provider: "synapse",
      ...data.fallback_provider ? { fallback_provider: data.fallback_provider } : {},
      ...model ? { model } : {},
      ...endpoint ? { endpoint } : {},
      ...apiKey ? { api_key: apiKey } : {},
      ...inputType ? { input_type: inputType } : {},
      ...queryInputType ? { query_input_type: queryInputType } : {},
      ...data.query_instruction !== undefined ? { query_instruction: data.query_instruction } : {},
      ...data.document_prefix !== undefined ? { document_prefix: data.document_prefix } : {},
      ...truncate ? { truncate } : {},
      ...data.max_input_tokens ? { max_input_tokens: data.max_input_tokens } : {}
    };
  }
  if (data.provider === "local") {
    return {
      provider: "local",
      model: data.model?.trim() || DEFAULT_LOCAL_EMBEDDING_MODEL,
      local_runtime: data.local_runtime,
      ...data.max_input_tokens ? { max_input_tokens: data.max_input_tokens } : {},
      ...data.local_dtype ? { local_dtype: data.local_dtype } : {}
    };
  }
  if (data.provider === "openai-compatible") {
    const apiKey = data.api_key?.trim();
    const inputType = data.input_type?.trim();
    const queryInputType = data.query_input_type?.trim();
    const truncate = data.truncate?.trim();
    return {
      provider: "openai-compatible",
      model: data.model?.trim() ?? "",
      endpoint: data.endpoint?.trim() ?? "",
      ...apiKey ? { api_key: apiKey } : {},
      ...inputType ? { input_type: inputType } : {},
      ...queryInputType ? { query_input_type: queryInputType } : {},
      ...data.query_instruction !== undefined ? { query_instruction: data.query_instruction } : {},
      ...data.document_prefix !== undefined ? { document_prefix: data.document_prefix } : {},
      ...truncate ? { truncate } : {},
      ...data.max_input_tokens ? { max_input_tokens: data.max_input_tokens } : {}
    };
  }
  return { provider: "off" };
});
var MagicContextConfigSchema = object({
  enabled: boolean2().default(true).describe("Enable magic context (default: true)"),
  allow_home_project: boolean2().default(false).describe("Allow Magic Context sessions launched from the exact canonical home directory. The home session uses its deterministic dir: identity so pre-gate memories reconnect. USER-LEVEL ONLY: project config is ignored. The home identity is excluded from registry seed exports, never resolves descendants by containment, and cannot join a workspace."),
  mural: object({
    enabled: boolean2().default(false),
    model: string2().trim().min(1).optional().describe("Model for the compress-cues task that compresses each memory into a mural cue. The mural image itself is rendered deterministically (no author model).")
  }).default({ enabled: false }).describe("Experimental mural: a single deterministically-rendered image of project memories that did not fit the context budget. Cues are compressed per-memory by the compress-cues dreamer task."),
  transform_mode: _enum(["ts", "rust"]).default("ts").describe('Experimental: routes the entire Magic Context runtime for the project through the ck-mc Rust module over subc (requires user-level `subc` config); "ts" is the current TypeScript pipeline.'),
  auto_update: boolean2().optional().describe("Enable automatic npm self-update checks for the OpenCode plugin. Security: USER-only in config loader, so hostile project configs cannot suppress updates."),
  language: string2().trim().toLowerCase().refine((s) => isValidLanguageCode(s), 'language must be a 2-letter ISO 639-1 code (e.g. "tr", "es", "de")').optional().describe("Output language for Magic Context's generated content and guidance, as a " + '2-letter ISO 639-1 code (e.g. "tr", "es", "de", "ja", "pt"). When set, the ' + "historian, dreamer, and the agent-guidance block instruct the model to " + "write its PROSE in this language while keeping all structural tokens (XML tags, " + "the five memory category names, code identifiers, file paths) in English. " + "USER-LEVEL ONLY (ignored in project config for security). Unset = today's " + "behavior (model mirrors the conversation; English scaffolding). Changing it " + "triggers one cache re-materialization; existing compartments/memories keep their " + "original language until naturally rewritten."),
  profile: string2().trim().min(1).optional().describe("Select a named user-owned model profile. A valid project name overrides this user default; an empty string, null, or other non-string project value is ignored with a warning so the user selection still applies. Unknown names warn and use the base configuration."),
  profiles: ConfigProfilesSchema.optional().describe("User-level named model profiles. A profile may contain only historian/dreamer model, fallback_models, OpenCode variant, and Pi/OMP thinking_level fields; task execution policy (including timeout_minutes) is excluded. Project configs may select a name but cannot define profiles."),
  historian: HistorianConfigSchema.describe("Historian metadata plus independent strict OpenCode, Pi, and OMP execution blocks. Retained metadata stays at historian; model, fallback_models, variant, and thinking_level belong only in historian.opencode, historian.pi, or historian.omp."),
  dreamer: DreamerConfigSchema.optional().describe("Dreamer metadata and scheduling plus independent strict OpenCode, Pi, and OMP execution blocks. schedule and promotion_threshold stay at dreamer.tasks; model, fallback_models, variant, thinking_level, and timeout_minutes belong only in the matching harness block."),
  smart_notes: object({
    retina_handoff: boolean2().default(false).describe("When true, dreamer skips smart notes whose surface conditions compiled to retina provider configs at authoring time. Default false keeps both paths active until the retina consumer is deployed.")
  }).default({ retina_handoff: false }).describe("Smart-note ownership transition controls."),
  cache_ttl: union([string2(), object({ default: string2() }).catchall(string2())]).default("5m").describe(`How long Magic Context assumes the provider's cached prefix stays valid. This is MC's own deferral gate — it does not change the provider's actual cache lifetime. String (e.g. "5m", "1h", "30s") or per-model object ({ default: "5m", "provider/model": "1h", "provider/*": "never" }); keys resolve most-specific first (exact provider/model, bare model ID, shorter dash-prefixes, then the provider/* wildcard, then default). Set to "never" to mean MC never assumes expiry (for lanes kept warm externally by a cache-keep tool) — disables the idle-TTL heuristic so MC never initiates a rebuild based on elapsed time. Provider-side extended TTL is a separate request-level concern (cache_control: { ttl } in the request body).`),
  prompt_surface: PromptSurfaceConfigSchema.default({ default: "full" }).describe("Prompt-surface presets: default is full; models use bare model IDs, provider/model, or provider/* routing keys. Guidance and tool-description overrides are user-level only. OpenCode 1.x, Pi, and OMP register tool descriptions once per process (they follow the default preset). OpenCode 2 rewrites the five ctx_* descriptions per request from the draft model."),
  output_reserve: union([
    number2().min(0),
    object({ default: number2().min(0) }).catchall(number2().min(0))
  ]).optional().describe('User-only output-token reservation override. Number or per-model object ({ default: 16384, "provider/model": 8192 }); 0 disables reservation. Takes precedence over every derived source: an explicit value here always wins against catalog output limits, provider window-geometry facts, and the 25%-of-context fallback (usable window = context window minus this reserve). When unset, Magic Context reserves the catalog output limit (capped at 25% of context) for shared-window providers and keeps proven separate-quota Google/Gemini windows unchanged.'),
  models: object({
    window_overlay_path: string2().trim().min(1).optional()
  }).optional().describe("User-only Fusiform window-overlay settings. The path defaults to <dataDir>/fusiform/window-overlay.json."),
  toast_duration_ms: number2().min(0).max(60000).default(5000).describe("TUI toast lifetime in milliseconds for Magic Context notifications. Set to 0 to disable Magic Context toasts entirely (min: 0, max: 60000, default: 5000)"),
  execute_threshold_percentage: union([
    number2().min(20).max(90, EXECUTE_THRESHOLD_CAP_MESSAGE),
    object({ default: number2().min(20).max(90, EXECUTE_THRESHOLD_CAP_MESSAGE) }).catchall(number2().min(20).max(90, EXECUTE_THRESHOLD_CAP_MESSAGE))
  ]).default(DEFAULT_EXECUTE_THRESHOLD_PERCENTAGE).describe('Context percentage that forces queued operations to execute. Number or per-model object ({ default: 65, "provider/model": 45 }). Values above 90 are rejected because the runtime caps at 90% of the output-reserved safe window (MAX_EXECUTE_THRESHOLD). Default: DEFAULT_EXECUTE_THRESHOLD_PERCENTAGE'),
  execute_threshold_tokens: object({
    default: number2().min(5000).max(2000000).optional()
  }).catchall(number2().min(5000).max(2000000)).optional().describe("Absolute token thresholds per model. When matched, overrides execute_threshold_percentage for that model. Accepts `default` for all models or per-model keys. Values above 90% × context_limit are clamped with a warning log. Min 5_000, max 2_000_000."),
  protected_tokens: number2().int().min(PROTECTED_TOKENS_MIN).max(1e6).optional().describe("Positive integer token floor to protect from automatic reclaim (min: 4_000, max: 1_000_000). When omitted, the derived default is clamp(round(0.05 × usableSoft), min(16_000, round(0.08 × usableSoft)), 64_000)."),
  protected_tags: unknown().optional().describe("Deprecated: number of recent tags to protect. Ignored for behaviour; use protected_tokens instead.").meta({ deprecated: true }),
  clear_reasoning_age: number2().min(10).default(50).describe("Clear reasoning/thinking blocks older than N tags (default: 50)"),
  history_budget_percentage: number2().min(0.05).max(0.5).default(DEFAULT_HISTORY_BUDGET_PERCENTAGE).describe("Fraction of usable context (context_limit × execute_threshold) reserved for the session history block (default: 0.15)"),
  historian_timeout_ms: number2().min(60000).default(DEFAULT_HISTORIAN_TIMEOUT_MS).describe("Timeout for each historian prompt call in milliseconds (default: 600000)"),
  commit_cluster_trigger: object({
    enabled: boolean2().default(true).describe("Enable commit-cluster based historian triggering (default: true)"),
    min_clusters: number2().min(1).default(3).describe("Minimum commit clusters required to trigger historian (min: 1, default: 3)")
  }).default({ enabled: true, min_clusters: 3 }).describe("Commit-cluster trigger: fire historian when enough commit clusters accumulate in the unsummarized tail"),
  system_prompt_injection: object({
    enabled: boolean2().default(true).describe("When false, NO injection happens for ANY agent — global escape hatch. (default: true)"),
    skip_signatures: array(string2()).default(["<!-- magic-context: skip -->"]).describe(`Substring opt-out list. If the agent's system prompt contains any of these strings, skip ALL Magic Context injection for that call. Default "<!-- magic-context: skip -->" is meant to be added inside a user's custom agent prompt to opt that agent out.`)
  }).default({
    enabled: true,
    skip_signatures: ["<!-- magic-context: skip -->"]
  }).describe("Controls whether and where Magic Context augments the system prompt. Lets users opt specific agents out of the Magic Context guidance and the surrounding project-docs / user-profile blocks. OpenCode's internal hidden agents — title, summary, and compaction — are always skipped automatically."),
  sqlite: object({
    cache_size_mb: number2().min(2).max(2048).default(64).describe("Page-cache size in MiB per connection (PRAGMA cache_size). Larger keeps more hot pages resident, cutting re-reads on repeated full-table scans. (min 2, max 2048, default 64)"),
    mmap_size_mb: number2().min(0).max(8192).default(0).describe("Memory-mapped I/O size in MiB (PRAGMA mmap_size). 0 disables mmap (SQLite default). Raising it can cut read overhead on large DBs at the cost of address space. (min 0, max 8192, default 0)")
  }).default({ cache_size_mb: 64, mmap_size_mb: 0 }).describe("SQLite connection tuning for Magic Context's own context.db. These are per-connection PRAGMAs applied at open; they do not change the schema or what is stored."),
  storage: object({
    enforce_private_permissions: boolean2().default(true).describe("When true (default), Magic Context creates and re-tightens its storage directories to owner-only 0700 and storage files to owner-only 0600. Set false only for a deliberate trusted-group deployment whose operator manages directory, database, WAL/SHM, cache, and RPC file permissions externally; Magic Context then never chmods or supplies restrictive creation modes. USER-LEVEL ONLY — ignored in project config for security. On Windows, POSIX chmod modes are already meaningless, so this setting is a no-op.")
  }).default({ enforce_private_permissions: true }).describe("Storage permission policy. The default keeps session content and memories owner-private. Disabling enforcement is for trusted shared-group storage managed externally; every group member able to read the storage can read all stored session content and memories."),
  embedding: EmbeddingConfigSchema.default({
    provider: "local",
    model: DEFAULT_LOCAL_EMBEDDING_MODEL,
    local_runtime: "auto"
  }).describe("Embedding provider configuration"),
  subc: object({
    connection_file: string2().trim().min(1).transform(expandConfigPath).describe("Path to the owner-only subc connection file.")
  }).optional().describe("User-only Synapse daemon connection settings."),
  shadow_embedding: object({
    enabled: boolean2().default(false).describe("Developer-only Synapse shadow embedding lane switch.")
  }).default({ enabled: false }).describe("Developer-only Synapse shadow embedding lane."),
  temporal_awareness: boolean2().default(true).describe('Inject wall-clock gap markers (<!-- +Xm -->) between user messages where > 5 min elapsed since the previous message, and add compact date ranges to compartment headings. Gives the agent a sense of session pacing and "how long ago" across multi-day sessions. Graduated from experimental.temporal_awareness; default: true (set false to opt out).'),
  keep_subagents: boolean2().default(false).describe("Debug: keep the child sessions Magic Context spawns for its own subagents (historian, dreamer, memory-migration) instead of deleting them on success. Useful for short-term inspection/data collection — their full transcript (prompt, tool calls, token usage, output) stays in the host session store. Kept sessions accumulate until manually cleared; leave false for normal use. Requires a restart to take effect."),
  debug_rpc: boolean2().default(false).describe("Developer-only: enable authenticated loopback RPCs for memory counters and heap snapshots. Disabled by default. USER-LEVEL ONLY and requires a restart."),
  fail_closed_blocking: boolean2().default(true).describe("When Magic Context cannot operate (schema fence mismatch, storage open/migration failure), block the primary-session prompt with a loud recovery error instead of silently degrading to native compaction. Default true. Set false only to restore the old degrade-silently behavior (not recommended). USER-LEVEL ONLY — ignored in project config for security. Requires a restart."),
  compaction: object({
    enabled: boolean2().default(true).describe("When false, Magic Context stops managing the context window and keeps its knowledge layer: memory and docs/user-profile/key-files injection through additive m[0]/m[1], raw-message FTS indexing, dreamer, notes, ctx_search, ctx_expand, ctx_memory, and /ctx-embed remain available. MC's historian/compartment preparation, tagging, markers, pruning, folding, drops, strips, splicing, synthetic context-management todos, temporal markers, nudges, and fail-closed blocking stop; ctx_expand remains a knowledge-surface tool. fail_closed_blocking is inert: a transform failure passes the input messages through without blocking or cancelling. This setting does not enable native compaction: OpenCode's compaction.auto / compaction.prune or Pi's equivalent owns the window, or nothing does. MC's compaction.enabled in magic-context.jsonc is distinct from OpenCode's compaction.auto / compaction.prune in opencode.jsonc; they are different files and different owners. On the first turn after disabling, a long session may trigger one native compaction cycle; MC removes only its own marker boundary, leaves native boundaries and stored compartments intact, and does no pre-trimming mitigation. Marker cleanup is lazy per session, so an unresumed session is cleaned when it is next resumed. If compaction is enabled again, run /ctx-wrapup when the historian is runnable to catch up. OpenCode peer verification against v1.18.4 confirms native compaction covers child sessions: subagents receive additive memory/docs injection and no MC reclaim in this mode, so keep subagent tasks small or leave compaction.enabled on for long subagent runs. This is boot-resolved and requires a process restart; project-tier compaction.enabled is stripped so a cloned repository cannot disable the user's setting. The sidebar reports raw usage as Context: <pct>% · native compaction or Context: <pct>% · no active compaction and does not show an MC execute-threshold fill. /ctx-wrapup, /ctx-recomp, /ctx-flush, and /ctx-session-upgrade refuse without context-management side effects; /ctx-embed remains functional. Raw content hidden by a native boundary before Magic Context's first pass is not retroactively indexed.")
  }).default({ enabled: true }).describe("Compaction-off mode gate. Default true (MC manages the context window as today). Set compaction.enabled=false to keep the knowledge layer while letting native compaction (or nothing) own the window. Boot-resolved; requires a restart to change."),
  todowrite: object({
    enabled: boolean2().default(true).describe("Pi only: register Magic Context's todowrite task-list tool. Disable if you use your own todo extension. OpenCode ships its own built-in todowrite; this setting has no effect there."),
    overlay: boolean2().default(true).describe("Pi only: show the persistent todo overlay above the editor while tasks are active.")
  }).default({ enabled: true, overlay: true }).describe("Pi-only todowrite tool and overlay controls. Pi registers tools and widgets at extension boot, so changing this after /cd requires /reload or restart."),
  pi: PiConfigSchema.describe("Pi-only child-process extension controls. This setting is user-level only; project configuration cannot choose which extensions a user's subagent children load."),
  smart_drops: boolean2().default(false).describe("Content-aware reclaim of provably-superseded tool output, layered on the existing execute-pass auto-drop. When on: superseded todowrite (keep newest 1), spent ctx_reduce (keep newest 3), and zero-value meta (bash_status, bash_kill, ctx_note read/dismiss) outputs are dropped; older edits to a file are compressed to a filePath-preserving marker while the newest edit per file stays full. Only acts on passes already busting the cache, so it never originates a cache bust. Honors the protected-tag reserve. Experimental: opt-in, default off until cache stability is proven; when off the wire is byte-identical to the positional-only reclaim. Requires a restart."),
  caveman_text_compression: object({
    enabled: boolean2().default(false).describe("Apply deterministic caveman-style text compression to old conversation text. Active for primary sessions when enabled; never for subagents. Compresses user/assistant text in oldest-first tiers: ultra (oldest 20%), full, lite, untouched (newest 40%)."),
    min_chars: number2().min(100).max(1e4).default(500).describe("Text parts shorter than this (characters) stay untouched. Min 100, max 10000. Default: 500.")
  }).default({ enabled: false, min_chars: 500 }).describe("Age-tier caveman compression for long user/assistant text parts. Active for primary sessions when enabled; never for subagents. Oldest 20% of eligible tags (outside protected tail) go to ultra, next 20% to full, next 20% to lite, newest 40% untouched. Graduated from experimental.caveman_text_compression; opt-in, default off (lossy)."),
  memory: object({
    enabled: boolean2().default(true).describe("Enable cross-session memory (default: true)"),
    injection_budget_tokens: number2().min(500).max(20000).default(4000).describe("Token budget for memory injection on session start (min: 500, max: 20000, default: 4000)"),
    auto_promote: boolean2().default(true).describe("Automatically promote eligible session facts into memory (default: true)"),
    retrieval_count_promotion_threshold: number2().min(1).default(3).describe("retrieval_count threshold for promoting memory to permanent status (min: 1, default: 3)"),
    auto_search: object({
      enabled: boolean2().default(true).describe("Automatically append a compact <ctx-search-hint> to eligible user messages when relevant memories, conversation, or commits are found. Graduated from experimental.auto_search; on by default (set false to opt out). Independent of memory.enabled."),
      score_threshold: number2().min(0.3).max(0.95).default(0.6).describe("Top hit score must exceed this threshold for the hint to fire (min: 0.3, max: 0.95, default: 0.60)"),
      min_prompt_chars: number2().min(5).max(500).default(20).describe("Skip hint when user message is shorter than this (min: 5, max: 500, default: 20)")
    }).default({ enabled: true, score_threshold: 0.6, min_prompt_chars: 20 }).describe("Auto-search hint: transform-time ctx_search on each new user message; when the top hit clears the threshold, append a compact <ctx-search-hint> block of vague fragments to that user message. Does NOT inject full content. Graduated from experimental.auto_search; enabled by default (set enabled: false to opt out). Independent of memory.enabled."),
    git_commit_indexing: object({
      enabled: boolean2().default(false).describe("Index HEAD git commits for ctx_search (git_commit source). Graduated from experimental.git_commit_indexing; opt-in, default off. Independent of memory.enabled."),
      since_days: number2().min(7).max(3650).default(365).describe("Days of HEAD history to index (min: 7, max: 3650, default: 365)"),
      max_commits: number2().min(100).max(20000).default(2000).describe("Max commits kept per project; oldest evicted (min: 100, max: 20000, default: 2000)")
    }).default({ enabled: false, since_days: 365, max_commits: 2000 }).describe("Index git commit messages from HEAD into ctx_search. Commits become a 4th searchable source alongside memories and session history. Graduated from experimental.git_commit_indexing; opt-in, default off (per-project embedding cost). Independent of memory.enabled.")
  }).default({
    enabled: true,
    injection_budget_tokens: 4000,
    auto_promote: true,
    retrieval_count_promotion_threshold: 3,
    auto_search: { enabled: true, score_threshold: 0.6, min_prompt_chars: 20 },
    git_commit_indexing: { enabled: false, since_days: 365, max_commits: 2000 }
  }).describe("Cross-session memory configuration")
}).transform((data) => {
  return {
    ...data,
    protected_tags: data.protected_tags
  };
});

// ../plugin/src/config/profiles.ts
function withoutProfileFields(raw) {
  const copy = { ...raw };
  delete copy.profile;
  delete copy.profiles;
  return copy;
}
function readProfileSelection(raw) {
  if (!Object.hasOwn(raw, "profile"))
    return { declared: false };
  const value = raw.profile;
  if (typeof value !== "string")
    return { declared: true };
  const name = value.trim();
  return name.length > 0 ? { declared: true, name } : { declared: true };
}
function resolveConfigProfile(args) {
  const warnings = [];
  const userSelection = readProfileSelection(args.userRaw);
  const projectSelection = readProfileSelection(args.projectRaw);
  const selection = projectSelection.name ? { name: projectSelection.name, source: "project" } : userSelection.name ? { name: userSelection.name, source: "user" } : undefined;
  if (projectSelection.declared && !projectSelection.name) {
    warnings.push("Ignoring invalid profile selection from project config; expected a non-empty string.");
  }
  if (!projectSelection.declared && userSelection.declared && !userSelection.name) {
    warnings.push("Ignoring invalid profile selection from user config; expected a non-empty string.");
  }
  let profiles = {};
  if (Object.hasOwn(args.userRaw, "profiles")) {
    const parsed = ConfigProfilesSchema.safeParse(args.userRaw.profiles);
    if (parsed.success) {
      profiles = parsed.data;
    } else {
      warnings.push("Ignoring profiles from user config: invalid profile configuration; profiles may contain only historian/dreamer harness model blocks.");
    }
  }
  if (!selection) {
    return {
      userBase: withoutProfileFields(args.userRaw),
      projectBase: withoutProfileFields(args.projectRaw),
      overlay: {},
      warnings
    };
  }
  if (!Object.hasOwn(profiles, selection.name)) {
    warnings.push(`Unknown profile "${selection.name}" selected by ${selection.source} config; using base config without a profile.`);
    return {
      userBase: withoutProfileFields(args.userRaw),
      projectBase: withoutProfileFields(args.projectRaw),
      overlay: {},
      warnings
    };
  }
  const overlay = profiles[selection.name];
  return {
    userBase: withoutProfileFields(args.userRaw),
    projectBase: withoutProfileFields(args.projectRaw),
    overlay,
    activeProfile: selection.name,
    warnings
  };
}

// ../plugin/src/config/project-security.ts
var HIDDEN_AGENT_KEYS = ["historian", "dreamer"];
var HARNESS_KEYS = PER_HARNESS_MODEL_KEYS;
var HISTORIAN_USER_ONLY_FIELDS = PER_HARNESS_MIGRATION_INVENTORY.historian.migrated_execution;
var PROMPT_SURFACE_USER_ONLY_FIELDS = ["guidance_override_path", "tool_descriptions"];
var AGENT_ESCALATION_FIELDS = ["prompt", "permission", "tools"];
var EMBEDDING_USER_ONLY_FIELDS = [
  "endpoint",
  "provider",
  "fallback_provider",
  "query_instruction",
  "document_prefix"
];
var PERCENTAGE_THRESHOLD_REASON = "security: a repository may only raise compaction thresholds above the user's effective value; it cannot force earlier historian work or cloned-repo cost escalation.";
var TOKEN_THRESHOLD_REASON = "security: a repository may only raise execute_threshold_tokens above the user's trusted token threshold; it cannot force earlier historian work or cloned-repo cost escalation.";
var TOKEN_THRESHOLD_INTRODUCTION_REASON = "security: a repository cannot introduce a new execute_threshold_tokens override when the user has no trusted token threshold for that key; that could force earlier historian work or cloned-repo cost escalation.";
var PROTECTED_TOKENS_REASON = "security: a repository may only raise protected_tokens above the resolved user-or-derived floor; it cannot lower protection.";
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function resolveProtectedTokensScalar(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 4000 && value <= 1e6) {
    return value;
  }
  return;
}
var PROTECTED_TOKENS_TIER_OVERRIDES = Symbol.for("@cortexkit/magic-context/protected-tokens-tier-overrides");
function attachProtectedTokensTierOverrides(config, args) {
  const user = resolveProtectedTokensScalar(args.trustedUser);
  const rawProject = resolveProtectedTokensScalar(args.project);
  const project = rawProject !== undefined && (user === undefined || rawProject >= user) ? rawProject : undefined;
  if (user === undefined && project === undefined)
    return config;
  Object.defineProperty(config, PROTECTED_TOKENS_TIER_OVERRIDES, {
    value: {
      ...user !== undefined ? { user } : {},
      ...project !== undefined ? { project } : {}
    },
    configurable: false,
    enumerable: false,
    writable: false
  });
  return config;
}
function stripListedFields(target, fields, path, removed) {
  for (const field of fields) {
    if (field in target) {
      delete target[field];
      removed.push(path.length > 0 ? `${path}.${field}` : field);
    }
  }
}
function stripEscalationAtExecutableSite(block, path, removed) {
  stripListedFields(block, AGENT_ESCALATION_FIELDS, path, removed);
  if (isPlainObject2(block.model)) {
    stripListedFields(block.model, AGENT_ESCALATION_FIELDS, `${path}.model`, removed);
  }
  if (Array.isArray(block.fallback_models)) {
    for (let index = 0;index < block.fallback_models.length; index++) {
      const entry = block.fallback_models[index];
      if (isPlainObject2(entry)) {
        stripListedFields(entry, AGENT_ESCALATION_FIELDS, `${path}.fallback_models.${index}`, removed);
      }
    }
  }
}
function stripNestedMuralModels(node, path, removed) {
  for (const [key, value] of Object.entries(node)) {
    if (key === "mural" && isPlainObject2(value) && "model" in value) {
      delete value.model;
      removed.push(`${path}.${key}.model`);
    } else if (isPlainObject2(value)) {
      stripNestedMuralModels(value, `${path}.${key}`, removed);
    }
  }
}
function isValidPercentageThreshold(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 20 && value <= 80;
}
function isValidTokenThreshold(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 5000 && value <= 2000000;
}
function normalizeTrustedPercentageThresholds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { defaultValue: value, overrides: new Map };
  }
  if (isPlainObject2(value) && typeof value.default === "number" && Number.isFinite(value.default)) {
    const overrides = new Map;
    for (const [key, child] of Object.entries(value)) {
      if (key === "default")
        continue;
      if (typeof child === "number" && Number.isFinite(child)) {
        overrides.set(key, child);
      }
    }
    return { defaultValue: value.default, overrides };
  }
  return { defaultValue: DEFAULT_EXECUTE_THRESHOLD_PERCENTAGE, overrides: new Map };
}
function normalizeTrustedTokenThresholds(value) {
  if (!isPlainObject2(value)) {
    return { defaultValue: undefined, overrides: new Map };
  }
  const overrides = new Map;
  for (const [key, child] of Object.entries(value)) {
    if (key === "default")
      continue;
    if (typeof child === "number" && Number.isFinite(child)) {
      overrides.set(key, child);
    }
  }
  return {
    defaultValue: typeof value.default === "number" && Number.isFinite(value.default) ? value.default : undefined,
    overrides
  };
}
function clonePercentageThresholds(value) {
  return {
    defaultValue: value.defaultValue,
    overrides: new Map(value.overrides)
  };
}
function cloneTokenThresholds(value) {
  return {
    defaultValue: value.defaultValue,
    overrides: new Map(value.overrides)
  };
}
function percentageThresholdsEqual(left, right) {
  if (left.defaultValue !== right.defaultValue)
    return false;
  if (left.overrides.size !== right.overrides.size)
    return false;
  for (const [key, value] of left.overrides) {
    if (right.overrides.get(key) !== value)
      return false;
  }
  return true;
}
function setMergedPercentageThreshold(mergedRaw, value) {
  if (value.overrides.size === 0) {
    mergedRaw.execute_threshold_percentage = value.defaultValue;
    return;
  }
  const serialized = { default: value.defaultValue };
  for (const [key, threshold] of value.overrides) {
    serialized[key] = threshold;
  }
  mergedRaw.execute_threshold_percentage = serialized;
}
function setMergedTokenThreshold(mergedRaw, value) {
  if (value.defaultValue === undefined && value.overrides.size === 0) {
    delete mergedRaw.execute_threshold_tokens;
    return;
  }
  const serialized = {};
  if (value.defaultValue !== undefined) {
    serialized.default = value.defaultValue;
  }
  for (const [key, threshold] of value.overrides) {
    serialized[key] = threshold;
  }
  mergedRaw.execute_threshold_tokens = serialized;
}
function makeProjectThresholdWarning(field, reason) {
  return `Ignoring ${field} from project config (${reason})`;
}
function stripUnsafeProjectConfigFields(projectRaw) {
  const warnings = [];
  if ("profiles" in projectRaw) {
    delete projectRaw.profiles;
    warnings.push("Ignoring profiles from project config (security: profile definitions are user-level only; a repository may select a named user profile with profile).");
  }
  if ("auto_update" in projectRaw) {
    delete projectRaw.auto_update;
    warnings.push("Ignoring auto_update from project config (security: this setting only honors user-level config).");
  }
  if ("fail_closed_blocking" in projectRaw) {
    delete projectRaw.fail_closed_blocking;
    warnings.push("Ignoring fail_closed_blocking from project config (security: only user-level config may disable or force the loud inoperability gate).");
  }
  if ("debug_rpc" in projectRaw) {
    delete projectRaw.debug_rpc;
    warnings.push("Ignoring debug_rpc from project config (security: only user-level config may enable process heap diagnostics).");
  }
  if ("allow_home_project" in projectRaw) {
    delete projectRaw.allow_home_project;
    warnings.push("Ignoring allow_home_project from project config (security: only user-level config may opt the user's home directory into Magic Context).");
  }
  const compaction = projectRaw.compaction;
  if (isPlainObject2(compaction) && "enabled" in compaction) {
    delete compaction.enabled;
    warnings.push("Ignoring compaction.enabled from project config (security: only user-level config may disable Magic Context's context-window management; a cloned repo cannot change how the user's window is owned).");
  }
  if ("output_reserve" in projectRaw) {
    delete projectRaw.output_reserve;
    warnings.push("Ignoring output_reserve from project config (security: output-token reservation only honors user-level config).");
  }
  const models = projectRaw.models;
  if (isPlainObject2(models) && "window_overlay_path" in models) {
    delete models.window_overlay_path;
    warnings.push("Ignoring models.window_overlay_path from project config (security: only user-level config may select model geometry metadata).");
  }
  if ("language" in projectRaw) {
    delete projectRaw.language;
    warnings.push("Ignoring language from project config (security: output language is a user-level setting).");
  }
  if ("sqlite" in projectRaw) {
    delete projectRaw.sqlite;
    warnings.push("Ignoring sqlite.* from project config (security: SQLite cache/mmap PRAGMAs apply to the " + "process-global shared database handle; only user-level config may set them).");
  }
  const storage = projectRaw.storage;
  if (isPlainObject2(storage) && "enforce_private_permissions" in storage) {
    delete storage.enforce_private_permissions;
    warnings.push("Ignoring storage.enforce_private_permissions from project config (security: only user-level config may opt into externally managed shared storage permissions).");
  }
  const promptSurface = projectRaw.prompt_surface;
  if (isPlainObject2(promptSurface)) {
    const removed = [];
    for (const field of PROMPT_SURFACE_USER_ONLY_FIELDS) {
      if (field in promptSurface) {
        delete promptSurface[field];
        removed.push(field);
      }
    }
    if (removed.length > 0) {
      warnings.push(`Ignoring prompt_surface.${removed.join("/")} from project config (security: repositories may select prompt presets but only user config may provide guidance or tool-description text).`);
    }
  }
  const pi = projectRaw.pi;
  if (isPlainObject2(pi) && "subagent_extensions" in pi) {
    delete pi.subagent_extensions;
    warnings.push("Ignoring pi.subagent_extensions from project config (security: only user-level config may choose extensions loaded by Pi subagent children).");
  }
  for (const field of ["subc", "shadow_embedding"]) {
    if (field in projectRaw) {
      delete projectRaw[field];
      warnings.push(`Ignoring ${field} from project config (security: daemon routing and developer-only embedding traffic are user-level settings).`);
    }
  }
  const embedding = projectRaw.embedding;
  if (isPlainObject2(embedding)) {
    const removed = [];
    for (const field of EMBEDDING_USER_ONLY_FIELDS) {
      if (field in embedding) {
        delete embedding[field];
        removed.push(field);
      }
    }
    if (removed.length > 0) {
      warnings.push(`Ignoring embedding.${removed.join("/")} from project config ` + "(security: a repository cannot choose where or how private text is embedded).");
    }
  }
  for (const agentKey of HIDDEN_AGENT_KEYS) {
    const block = projectRaw[agentKey];
    if (!isPlainObject2(block))
      continue;
    const removed = [];
    stripEscalationAtExecutableSite(block, agentKey, removed);
    for (const harness of HARNESS_KEYS) {
      const harnessBlock = block[harness];
      if (!isPlainObject2(harnessBlock))
        continue;
      stripEscalationAtExecutableSite(harnessBlock, `${agentKey}.${harness}`, removed);
      const tasks = harnessBlock.tasks;
      if (isPlainObject2(tasks)) {
        for (const [taskName, taskBlock] of Object.entries(tasks)) {
          if (isPlainObject2(taskBlock)) {
            stripEscalationAtExecutableSite(taskBlock, `${agentKey}.${harness}.tasks.${taskName}`, removed);
          }
        }
      }
    }
    const schedulingTasks = block.tasks;
    if (isPlainObject2(schedulingTasks)) {
      for (const [taskName, taskBlock] of Object.entries(schedulingTasks)) {
        if (isPlainObject2(taskBlock)) {
          stripListedFields(taskBlock, AGENT_ESCALATION_FIELDS, `${agentKey}.tasks.${taskName}`, removed);
        }
      }
    }
    if (removed.length > 0) {
      warnings.push(`Ignoring ${removed.join(", ")} from project config ` + "(security: a repository cannot reprogram or re-permission hidden agents).");
    }
  }
  const historian = projectRaw.historian;
  if (isPlainObject2(historian)) {
    const removed = [];
    for (const field of HISTORIAN_USER_ONLY_FIELDS) {
      if (field in historian) {
        delete historian[field];
        removed.push(field);
      }
    }
    for (const harness of HARNESS_KEYS) {
      const harnessBlock = historian[harness];
      if (!isPlainObject2(harnessBlock))
        continue;
      for (const field of HISTORIAN_USER_ONLY_FIELDS) {
        if (field in harnessBlock) {
          delete harnessBlock[field];
          removed.push(`${harness}.${field}`);
        }
      }
    }
    if (removed.length > 0) {
      warnings.push(`Ignoring ${removed.map((path) => `historian.${path}`).join(", ")} from project config ` + "(security: historian model selection is user-level only; a repository cannot force extra compaction cost).");
    }
  }
  const mural = projectRaw.mural;
  if (isPlainObject2(mural) && "model" in mural) {
    delete mural.model;
    warnings.push("Ignoring mural.model from project config (security: the mural cue-compressor model is a user-level setting; a repository cannot choose where project memory is sent).");
  }
  const experimental = projectRaw.experimental;
  const legacyMural = isPlainObject2(experimental) ? experimental.mural : undefined;
  if (isPlainObject2(legacyMural) && "model" in legacyMural) {
    delete legacyMural.model;
    warnings.push("Ignoring experimental.mural.model from project config (security: the mural cue-compressor model is a user-level setting; use user-level mural.model).");
  }
  const nestedMuralRemoved = [];
  for (const agentKey of HIDDEN_AGENT_KEYS) {
    const block = projectRaw[agentKey];
    if (!isPlainObject2(block))
      continue;
    stripNestedMuralModels(block, agentKey, nestedMuralRemoved);
  }
  if (nestedMuralRemoved.length > 0) {
    warnings.push(`Ignoring ${nestedMuralRemoved.join(", ")} from project config (security: the mural cue-compressor model is a user-level setting; a repository cannot choose where project memory is sent).`);
  }
  return warnings;
}
function constrainProjectThresholdOverrides(args) {
  const warnings = [];
  const basePercentage = normalizeTrustedPercentageThresholds(args.trustedBaseConfig.execute_threshold_percentage);
  const baseTokens = normalizeTrustedTokenThresholds(args.trustedBaseConfig.execute_threshold_tokens);
  if ("execute_threshold_percentage" in args.projectRaw) {
    const projectValue = args.projectRaw.execute_threshold_percentage;
    if (isValidPercentageThreshold(projectValue)) {
      const constrained = clonePercentageThresholds(basePercentage);
      constrained.defaultValue = Math.max(basePercentage.defaultValue, projectValue);
      for (const [modelKey, threshold] of basePercentage.overrides) {
        const raisedThreshold = Math.max(threshold, projectValue);
        if (raisedThreshold === constrained.defaultValue) {
          constrained.overrides.delete(modelKey);
        } else {
          constrained.overrides.set(modelKey, raisedThreshold);
        }
      }
      setMergedPercentageThreshold(args.mergedRaw, constrained);
      if (percentageThresholdsEqual(constrained, basePercentage)) {
        warnings.push(makeProjectThresholdWarning("execute_threshold_percentage", PERCENTAGE_THRESHOLD_REASON));
      }
    } else if (isPlainObject2(projectValue)) {
      const constrained = clonePercentageThresholds(basePercentage);
      let touchedValidEntry = false;
      if (isValidPercentageThreshold(projectValue.default)) {
        touchedValidEntry = true;
        if (projectValue.default > basePercentage.defaultValue) {
          constrained.defaultValue = projectValue.default;
        } else {
          warnings.push(makeProjectThresholdWarning("execute_threshold_percentage.default", PERCENTAGE_THRESHOLD_REASON));
        }
      }
      for (const [modelKey, rawValue] of Object.entries(projectValue)) {
        if (modelKey === "default")
          continue;
        if (!isValidPercentageThreshold(rawValue))
          continue;
        touchedValidEntry = true;
        const baseValue = basePercentage.overrides.get(modelKey) ?? basePercentage.defaultValue;
        if (rawValue > baseValue) {
          if (rawValue === constrained.defaultValue) {
            constrained.overrides.delete(modelKey);
          } else {
            constrained.overrides.set(modelKey, rawValue);
          }
        } else {
          warnings.push(makeProjectThresholdWarning(`execute_threshold_percentage.${modelKey}`, PERCENTAGE_THRESHOLD_REASON));
        }
      }
      if (touchedValidEntry) {
        setMergedPercentageThreshold(args.mergedRaw, constrained);
      }
    }
  }
  if ("execute_threshold_tokens" in args.projectRaw && isPlainObject2(args.projectRaw.execute_threshold_tokens)) {
    const projectValue = args.projectRaw.execute_threshold_tokens;
    const constrained = cloneTokenThresholds(baseTokens);
    let touchedValidEntry = false;
    if (isValidTokenThreshold(projectValue.default)) {
      touchedValidEntry = true;
      if (baseTokens.defaultValue === undefined) {
        warnings.push(makeProjectThresholdWarning("execute_threshold_tokens.default", TOKEN_THRESHOLD_INTRODUCTION_REASON));
      } else if (projectValue.default > baseTokens.defaultValue) {
        constrained.defaultValue = projectValue.default;
      } else {
        warnings.push(makeProjectThresholdWarning("execute_threshold_tokens.default", TOKEN_THRESHOLD_REASON));
      }
    }
    for (const [modelKey, rawValue] of Object.entries(projectValue)) {
      if (modelKey === "default")
        continue;
      if (!isValidTokenThreshold(rawValue))
        continue;
      touchedValidEntry = true;
      const baseValue = baseTokens.overrides.get(modelKey) ?? baseTokens.defaultValue;
      if (baseValue === undefined) {
        warnings.push(makeProjectThresholdWarning(`execute_threshold_tokens.${modelKey}`, TOKEN_THRESHOLD_INTRODUCTION_REASON));
        continue;
      }
      if (rawValue > baseValue) {
        if (rawValue === constrained.defaultValue) {
          constrained.overrides.delete(modelKey);
        } else {
          constrained.overrides.set(modelKey, rawValue);
        }
      } else {
        warnings.push(makeProjectThresholdWarning(`execute_threshold_tokens.${modelKey}`, TOKEN_THRESHOLD_REASON));
      }
    }
    if (touchedValidEntry) {
      setMergedTokenThreshold(args.mergedRaw, constrained);
    }
  }
  if ("protected_tokens" in args.projectRaw) {
    const rawProject = args.projectRaw.protected_tokens;
    const projectVal = resolveProtectedTokensScalar(rawProject);
    const trustedUserVal = resolveProtectedTokensScalar(args.trustedBaseConfig.protected_tokens);
    if (projectVal !== undefined) {
      if (trustedUserVal !== undefined) {
        if (projectVal >= trustedUserVal) {
          args.mergedRaw.protected_tokens = projectVal;
        } else {
          args.mergedRaw.protected_tokens = trustedUserVal;
          warnings.push(makeProjectThresholdWarning("protected_tokens", PROTECTED_TOKENS_REASON));
        }
      } else {
        args.mergedRaw.protected_tokens = projectVal;
      }
    } else {
      if (trustedUserVal !== undefined) {
        args.mergedRaw.protected_tokens = trustedUserVal;
      } else {
        delete args.mergedRaw.protected_tokens;
      }
      warnings.push(makeProjectThresholdWarning("protected_tokens", PROTECTED_TOKENS_REASON));
    }
  }
  return warnings;
}
function normalizeEndpoint(value) {
  if (typeof value !== "string")
    return;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}
function dropInheritedEmbeddingKeyOnRedirect(projectRaw, mergedRaw, userRaw) {
  const projectEmbedding = projectRaw.embedding;
  if (!isPlainObject2(projectEmbedding))
    return [];
  const redirectsEndpoint = "endpoint" in projectEmbedding;
  if (!redirectsEndpoint)
    return [];
  const userEmbedding = userRaw?.embedding;
  if (isPlainObject2(userEmbedding)) {
    const projectEndpoint = normalizeEndpoint(projectEmbedding.endpoint);
    const userEndpoint = normalizeEndpoint(userEmbedding.endpoint);
    if (projectEndpoint !== undefined && projectEndpoint === userEndpoint) {
      return [];
    }
  }
  const providesOwnKey = typeof projectEmbedding.api_key === "string" && projectEmbedding.api_key.length > 0;
  if (providesOwnKey)
    return [];
  const mergedEmbedding = mergedRaw.embedding;
  if (!isPlainObject2(mergedEmbedding))
    return [];
  if (!("api_key" in mergedEmbedding))
    return [];
  delete mergedEmbedding.api_key;
  return [
    "Dropped inherited user embedding api_key because project config redirected " + "embedding.endpoint without supplying its own key (security: prevents key " + "exfiltration to a repository-chosen endpoint)."
  ];
}

// ../plugin/src/config/prune-config-leaf.ts
function isPlainObject3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function pruneNestedConfigLeaf(block, relativePath) {
  if (relativePath.length === 0)
    return null;
  const result = { ...block };
  let cursor = result;
  for (let i = 0;i < relativePath.length - 1; i++) {
    const seg = String(relativePath[i]);
    const child = cursor[seg];
    if (!isPlainObject3(child)) {
      if (!(seg in cursor))
        return null;
      delete cursor[seg];
      return {
        block: result,
        removed: relativePath.slice(0, i + 1).map(String).join(".")
      };
    }
    const clonedChild = { ...child };
    cursor[seg] = clonedChild;
    cursor = clonedChild;
  }
  const leaf = String(relativePath[relativePath.length - 1]);
  if (!(leaf in cursor))
    return null;
  delete cursor[leaf];
  return { block: result, removed: relativePath.map(String).join(".") };
}

// ../plugin/src/config/raw-loader.ts
import {
  closeSync as closeSync2,
  existsSync as existsSync4,
  linkSync,
  openSync as openSync2,
  readFileSync as readFileSync4,
  renameSync as renameSync2,
  statSync as statSync2,
  unlinkSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { basename as basename2, dirname as dirname4, join as join4 } from "node:path";
var MODEL_FIELDS = ["model", "fallback_models"];
var QUALIFIER_FIELDS = ["variant", "thinking_level"];
var TASK_MODEL_FIELDS = [...MODEL_FIELDS, ...QUALIFIER_FIELDS, "timeout_minutes"];
var PRE_PER_HARNESS_BACKUP_SUFFIX = ".pre-per-harness.bak";
var temporaryFileSequence = 0;
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asDocument(text) {
  try {
    const document = parseJsonc(text.startsWith("\uFEFF") ? text.slice(1) : text);
    return isRecord2(document) ? document : null;
  } catch {
    return null;
  }
}
function getAtPath(document, path) {
  let current = document;
  for (const part of path) {
    if (!isRecord2(current) || !Object.hasOwn(current, part))
      return;
    current = current[part];
  }
  return current;
}
function stableJson(value) {
  if (Array.isArray(value))
    return `[${value.map(stableJson).join(",")}]`;
  if (!isRecord2(value))
    return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}
function valuesMatch(left, right) {
  return stableJson(left) === stableJson(right);
}
function valueForDiagnostic(value) {
  return stableJson(value);
}
function migrateEntryForHarness(value, harness) {
  if (Array.isArray(value))
    return value.map((entry) => migrateEntryForHarness(entry, harness));
  if (!isRecord2(value) || !Object.hasOwn(value, "model"))
    return value;
  const entry = { model: value.model };
  if (harness === "opencode" && Object.hasOwn(value, "variant")) {
    entry.variant = value.variant;
  }
  if (harness === "pi" && Object.hasOwn(value, "thinking_level")) {
    entry.thinking_level = value.thinking_level;
  }
  return entry;
}
function migrateFallbackForHarness(value, harness) {
  if (typeof value === "string")
    return [value];
  return migrateEntryForHarness(value, harness);
}
function canCreateAtPath(document, path) {
  let current = document;
  for (const part of path) {
    if (current === undefined)
      return true;
    if (!isRecord2(current))
      return false;
    current = current[part];
  }
  return current === undefined || isRecord2(current);
}
function flatFieldPath(parts) {
  return parts.join(".");
}
function updateDocumentForFlatFields(text) {
  const hasBom = text.startsWith("\uFEFF");
  const editableText = hasBom ? text.slice(1) : text;
  const document = asDocument(text);
  if (!document) {
    return { text, hasFlatKeys: false, diagnostics: [], flatPaths: [] };
  }
  let nextText = editableText;
  let hasFlatKeys = false;
  const diagnostics = [];
  const flatPaths = [];
  const sourcePathsToRemove = [];
  const addDestination = (sourcePath, destinationPath, destinationValue) => {
    const sourceLabel = flatFieldPath(sourcePath);
    const destinationLabel = flatFieldPath(destinationPath);
    if (!canCreateAtPath(document, destinationPath.slice(0, -1))) {
      diagnostics.push({
        path: sourceLabel,
        message: `Flat config field "${sourceLabel}" (${valueForDiagnostic(destinationValue)}) conflicts with non-object destination "${destinationLabel}" (${valueForDiagnostic(getAtPath(document, destinationPath.slice(0, -1)))}); kept the destination and ignored the flat field.`
      });
      return;
    }
    const existing = getAtPath(document, destinationPath);
    if (existing !== undefined) {
      if (!valuesMatch(existing, destinationValue)) {
        diagnostics.push({
          path: sourceLabel,
          message: `Flat config field "${sourceLabel}" (${valueForDiagnostic(destinationValue)}) conflicts with "${destinationLabel}" (${valueForDiagnostic(existing)}); kept "${destinationLabel}" and ignored the flat field.`
        });
      }
      return;
    }
    nextText = setJsoncValue(nextText, destinationPath, destinationValue);
  };
  const migrateAgentFields = (agentName) => {
    const agent = document[agentName];
    if (!isRecord2(agent))
      return;
    for (const field of MODEL_FIELDS) {
      if (!Object.hasOwn(agent, field))
        continue;
      const sourcePath = [agentName, field];
      hasFlatKeys = true;
      flatPaths.push(flatFieldPath(sourcePath));
      sourcePathsToRemove.push(sourcePath);
      const migrateValue = field === "fallback_models" ? migrateFallbackForHarness : migrateEntryForHarness;
      addDestination(sourcePath, [agentName, "opencode", field], migrateValue(agent[field], "opencode"));
      addDestination(sourcePath, [agentName, "pi", field], migrateValue(agent[field], "pi"));
    }
    if (Object.hasOwn(agent, "variant")) {
      const sourcePath = [agentName, "variant"];
      hasFlatKeys = true;
      flatPaths.push(flatFieldPath(sourcePath));
      sourcePathsToRemove.push(sourcePath);
      addDestination(sourcePath, [agentName, "opencode", "variant"], agent.variant);
    }
    if (Object.hasOwn(agent, "thinking_level")) {
      const sourcePath = [agentName, "thinking_level"];
      hasFlatKeys = true;
      flatPaths.push(flatFieldPath(sourcePath));
      sourcePathsToRemove.push(sourcePath);
      addDestination(sourcePath, [agentName, "pi", "thinking_level"], agent.thinking_level);
    }
  };
  migrateAgentFields("historian");
  migrateAgentFields("dreamer");
  const dreamer = document.dreamer;
  const tasks = isRecord2(dreamer) ? dreamer.tasks : undefined;
  if (isRecord2(tasks)) {
    for (const taskName of Object.keys(tasks).sort()) {
      const task = tasks[taskName];
      if (!isRecord2(task))
        continue;
      for (const field of TASK_MODEL_FIELDS) {
        if (!Object.hasOwn(task, field))
          continue;
        const sourcePath = ["dreamer", "tasks", taskName, field];
        hasFlatKeys = true;
        flatPaths.push(flatFieldPath(sourcePath));
        sourcePathsToRemove.push(sourcePath);
        if (field === "model" || field === "fallback_models") {
          addDestination(sourcePath, ["dreamer", "opencode", "tasks", taskName, field], field === "fallback_models" ? migrateFallbackForHarness(task[field], "opencode") : migrateEntryForHarness(task[field], "opencode"));
          addDestination(sourcePath, ["dreamer", "pi", "tasks", taskName, field], field === "fallback_models" ? migrateFallbackForHarness(task[field], "pi") : migrateEntryForHarness(task[field], "pi"));
        } else if (field === "variant") {
          addDestination(sourcePath, ["dreamer", "opencode", "tasks", taskName, field], task[field]);
        } else if (field === "thinking_level") {
          addDestination(sourcePath, ["dreamer", "pi", "tasks", taskName, field], task[field]);
        } else {
          addDestination(sourcePath, ["dreamer", "opencode", "tasks", taskName, field], task[field]);
          addDestination(sourcePath, ["dreamer", "pi", "tasks", taskName, field], task[field]);
        }
      }
    }
  }
  for (const sourcePath of sourcePathsToRemove) {
    nextText = removeJsoncValue(nextText, sourcePath);
  }
  return {
    text: hasBom ? `\uFEFF${nextText}` : nextText,
    hasFlatKeys,
    diagnostics,
    flatPaths
  };
}
function hasFlatKeys(input) {
  const text = typeof input === "string" ? input : input.toString("utf-8");
  return updateDocumentForFlatFields(text).hasFlatKeys;
}
function migrateFlatDetailed(input) {
  const bytes = typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  const result = updateDocumentForFlatFields(bytes.toString("utf-8"));
  return {
    bytes: Buffer.from(result.text, "utf-8"),
    hasFlatKeys: result.hasFlatKeys,
    diagnostics: result.diagnostics
  };
}
function writeExclusiveBackup(backupPath, bytes, mode) {
  const temporaryPath = writeTemporaryCandidate(backupPath, bytes, mode);
  try {
    try {
      linkSync(temporaryPath, backupPath);
      return;
    } catch (error) {
      if (error.code !== "EEXIST")
        throw error;
    }
    const existingBytes = readFileSync4(backupPath);
    if (existingBytes.equals(bytes))
      return;
    if (bytes.subarray(0, existingBytes.length).equals(existingBytes)) {
      renameSync2(temporaryPath, backupPath);
      return;
    }
  } finally {
    try {
      unlinkSync(temporaryPath);
    } catch {}
  }
}
function writeTemporaryCandidate(configPath, bytes, mode) {
  const directory = dirname4(configPath);
  const stem = basename2(configPath);
  for (let attempt = 0;attempt < 32; attempt++) {
    temporaryFileSequence += 1;
    const path = join4(directory, `.${stem}.per-harness-${process.pid}-${temporaryFileSequence}.tmp`);
    let descriptor;
    try {
      descriptor = openSync2(path, "wx", mode);
      writeFileSync2(descriptor, bytes);
      closeSync2(descriptor);
      return path;
    } catch (error) {
      if (descriptor !== undefined) {
        try {
          closeSync2(descriptor);
        } catch {}
      }
      try {
        unlinkSync(path);
      } catch {}
      if (error.code !== "EEXIST")
        throw error;
    }
  }
  throw new Error(`Could not allocate a temporary config file beside ${configPath}`);
}
function migrationWarning(diagnostic) {
  return diagnostic.message;
}
function loadRawConfigFile(options) {
  if (!existsSync4(options.configPath))
    return null;
  let observedBytes;
  try {
    observedBytes = readFileSync4(options.configPath);
  } catch (error) {
    throw new Error(`failed to read config: ${error instanceof Error ? error.message : String(error)}`);
  }
  const initialMigration = migrateFlatDetailed(observedBytes);
  if (!initialMigration.hasFlatKeys) {
    return {
      configPath: options.configPath,
      bytes: observedBytes,
      text: observedBytes.toString("utf-8"),
      warnings: [],
      migrated: false
    };
  }
  if (options.tier === "project") {
    return {
      configPath: options.configPath,
      bytes: initialMigration.bytes,
      text: initialMigration.bytes.toString("utf-8"),
      warnings: [
        "Adapted flat model config in memory; use historian.opencode/historian.pi and dreamer.opencode/dreamer.pi instead. Project config files are never rewritten.",
        ...initialMigration.diagnostics.map(migrationWarning)
      ],
      migrated: false
    };
  }
  const backupPath = `${options.configPath}${PRE_PER_HARNESS_BACKUP_SUFFIX}`;
  for (;; ) {
    const migration = migrateFlatDetailed(observedBytes);
    if (!migration.hasFlatKeys) {
      return {
        configPath: options.configPath,
        bytes: observedBytes,
        text: observedBytes.toString("utf-8"),
        warnings: [],
        migrated: false
      };
    }
    let temporaryPath;
    try {
      const mode = statSync2(options.configPath).mode & 511;
      writeExclusiveBackup(backupPath, observedBytes, mode);
      temporaryPath = writeTemporaryCandidate(options.configPath, migration.bytes, mode);
      options.afterTemporaryWrite?.();
      const currentBytes = readFileSync4(options.configPath);
      if (!hasFlatKeys(currentBytes)) {
        unlinkSync(temporaryPath);
        return {
          configPath: options.configPath,
          bytes: currentBytes,
          text: currentBytes.toString("utf-8"),
          warnings: [],
          migrated: false
        };
      }
      if (!currentBytes.equals(observedBytes)) {
        unlinkSync(temporaryPath);
        observedBytes = currentBytes;
        continue;
      }
      renameSync2(temporaryPath, options.configPath);
      return {
        configPath: options.configPath,
        bytes: migration.bytes,
        text: migration.bytes.toString("utf-8"),
        warnings: [
          "Migrated flat historian/dreamer model config to per-harness blocks.",
          ...migration.diagnostics.map(migrationWarning)
        ],
        migrated: true
      };
    } catch (error) {
      if (temporaryPath) {
        try {
          unlinkSync(temporaryPath);
        } catch {}
      }
      return {
        configPath: options.configPath,
        bytes: observedBytes,
        text: observedBytes.toString("utf-8"),
        warnings: [
          `Could not migrate flat model config: ${error instanceof Error ? error.message : String(error)}. Flat fields were not applied.`,
          ...migration.diagnostics.map(migrationWarning)
        ],
        migrated: false
      };
    }
  }
}

// ../plugin/src/config/removed-agent-config.ts
var REMOVED_AGENT_CONFIG_KEY = "sidekick";
var REMOVED_AGENT_CONFIG_WARNING = `The "${REMOVED_AGENT_CONFIG_KEY}" configuration was removed and is ignored.`;
function isPlainObject4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stripRemovedAgentConfig(rawConfig, warnings) {
  let removed = false;
  const patched = { ...rawConfig };
  if (Object.hasOwn(patched, REMOVED_AGENT_CONFIG_KEY)) {
    delete patched[REMOVED_AGENT_CONFIG_KEY];
    removed = true;
  }
  if (isPlainObject4(patched.profiles)) {
    const profiles = { ...patched.profiles };
    let profilesChanged = false;
    for (const [name, value] of Object.entries(profiles)) {
      if (!isPlainObject4(value) || !Object.hasOwn(value, REMOVED_AGENT_CONFIG_KEY))
        continue;
      const profile = { ...value };
      delete profile[REMOVED_AGENT_CONFIG_KEY];
      profiles[name] = profile;
      profilesChanged = true;
      removed = true;
    }
    if (profilesChanged)
      patched.profiles = profiles;
  }
  if (removed && !warnings.includes(REMOVED_AGENT_CONFIG_WARNING)) {
    warnings.push(REMOVED_AGENT_CONFIG_WARNING);
  }
  return removed ? patched : rawConfig;
}

// ../plugin/src/config/transform-mode.ts
var RUST_COMPACTION_OFF_WARNING = "compaction-off mode does not support rust transform mode; using the TypeScript transform.";
var RUST_REQUIRES_USER_SUBC_WARNING = "rust mode requires user-level subc configuration; running ts.";
function resolveTransformMode(args) {
  if (args.configured === "rust" && !args.compactionEnabled) {
    return {
      mode: "ts",
      warnings: [RUST_COMPACTION_OFF_WARNING]
    };
  }
  if (args.configured === "rust" && !args.userTierHasSubc) {
    return {
      mode: "ts",
      warnings: [RUST_REQUIRES_USER_SUBC_WARNING]
    };
  }
  return { mode: args.configured, warnings: [] };
}

// ../plugin/src/config/variable.ts
import { existsSync as existsSync5, readFileSync as readFileSync5 } from "node:fs";
import { homedir as homedir6 } from "node:os";
import { dirname as dirname5, isAbsolute as isAbsolute3, resolve as resolve2 } from "node:path";
var ENV_PATTERN = /\{env:([^}]+)\}/g;
var FILE_PATTERN = /\{file:([^}]+)\}/g;
function sensitiveFilePathReason(resolvedPath) {
  const home = homedir6();
  const sensitiveDirs = [
    { dir: resolve2(home, ".ssh"), label: "SSH keys" },
    { dir: resolve2(home, ".aws"), label: "AWS credentials" },
    { dir: resolve2(home, ".gnupg"), label: "GnuPG keyring" },
    { dir: resolve2(home, ".config", "gh"), label: "GitHub CLI auth" }
  ];
  for (const { dir, label } of sensitiveDirs) {
    if (resolvedPath === dir || resolvedPath.startsWith(`${dir}/`)) {
      return label;
    }
  }
  return null;
}
function substituteConfigVariables(input) {
  const warnings = [];
  let text = input.text;
  if (input.isProjectConfig) {
    const hasEnvTokens = ENV_PATTERN.test(text);
    const hasFileTokens = FILE_PATTERN.test(text);
    ENV_PATTERN.lastIndex = 0;
    FILE_PATTERN.lastIndex = 0;
    if (hasEnvTokens || hasFileTokens) {
      const tokenTypes = [
        hasEnvTokens ? "{env:}" : undefined,
        hasFileTokens ? "{file:}" : undefined
      ].filter(Boolean).join(" and ");
      warnings.push(`Project-level config no longer supports ${tokenTypes} tokens for security reasons; leaving tokens literal. Move secret expansion to user-level config.`);
    }
    return { text, warnings };
  }
  text = stripJsonComments(text);
  text = text.replace(ENV_PATTERN, (_, rawName) => {
    const varName = rawName.trim();
    const value = varName ? process.env[varName] : undefined;
    if (value === undefined || value === "") {
      warnings.push(`Environment variable ${varName} is not set (referenced via {env:${varName}}); using empty string`);
      return "";
    }
    return JSON.stringify(value).slice(1, -1);
  });
  const fileMatches = Array.from(text.matchAll(FILE_PATTERN));
  if (fileMatches.length === 0) {
    return { text, warnings };
  }
  const configDir = input.configPath ? dirname5(input.configPath) : process.cwd();
  let output = "";
  let cursor = 0;
  for (const match of fileMatches) {
    const token = match[0];
    const rawPath = match[1] ?? "";
    const index = match.index ?? 0;
    output += text.slice(cursor, index);
    cursor = index + token.length;
    const lineStart = text.lastIndexOf(`
`, index - 1) + 1;
    const prefix = text.slice(lineStart, index).trimStart();
    if (prefix.startsWith("//")) {
      output += token;
      continue;
    }
    let filePath = rawPath.trim();
    if (filePath.startsWith("~/")) {
      filePath = resolve2(homedir6(), filePath.slice(2));
    } else if (!isAbsolute3(filePath)) {
      filePath = resolve2(configDir, filePath);
    }
    const sensitiveReason = sensitiveFilePathReason(filePath);
    if (sensitiveReason) {
      warnings.push(`${token} resolves to a sensitive path (${sensitiveReason}: ${filePath}); ` + "inlining its contents into config — make sure this is intentional.");
    }
    if (!existsSync5(filePath)) {
      warnings.push(`File not found for ${token} (resolved to ${filePath}); using empty string`);
      continue;
    }
    let contents;
    try {
      contents = readFileSync5(filePath, "utf-8").trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to read file for ${token} (${filePath}): ${message}; using empty string`);
      continue;
    }
    output += JSON.stringify(contents).slice(1, -1);
  }
  output += text.slice(cursor);
  return { text: output, warnings };
}

// ../plugin/src/config/index.ts
function getUserConfigBasePath() {
  return cortexKitUserConfigBasePath();
}
function getProjectConfigBasePath(directory) {
  return cortexKitProjectConfigBasePath(directory);
}
function resolveLegacyReadFallback(sources) {
  return { source: sources.find((s) => existsSync6(s.path)) ?? null };
}
function loadConfigFileDetailed(configPath, source) {
  if (!existsSync6(configPath)) {
    return null;
  }
  let rawText;
  let rawWarnings;
  try {
    const raw = loadRawConfigFile({ configPath, tier: source });
    if (!raw)
      return null;
    rawText = raw.text;
    rawWarnings = raw.warnings;
  } catch (error) {
    const message = `failed to read config: ${error instanceof Error ? error.message : String(error)}`;
    return {
      config: {},
      warnings: [`${configPath}: ${message}`],
      parseFailures: [],
      warningDetails: [
        { warningClass: CONFIG_WARNING_CLASS.FILE_IO, source, path: configPath, message }
      ],
      outcome: "project-file-io-error",
      source
    };
  }
  try {
    const substituted = substituteConfigVariables({
      text: rawText,
      configPath,
      isProjectConfig: source === "project"
    });
    const rejectedKeyPaths = [];
    const parsed = parseJsoncRecovering(substituted.text, {
      onRejectedKey: (path) => rejectedKeyPaths.push(path.join("."))
    });
    const config = parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value) ? parsed.value : {};
    const unsafeKeyWarnings = rejectedKeyPaths.map((path) => `Ignored unsafe config key "${path}" (security: prototype-pollution keys are not allowed).`);
    const firstIssue = parsed.issues[0];
    const recovered = firstIssue !== undefined && Object.keys(config).length > 0;
    const parseFailures = firstIssue ? [
      {
        warningClass: CONFIG_WARNING_CLASS.FILE_PARSE,
        source,
        path: configPath,
        line: firstIssue.line,
        column: firstIssue.column,
        message: firstIssue.message,
        recovered,
        warning: `${configPath}:${firstIssue.line}:${firstIssue.column}: ${firstIssue.message}; ${recovered ? "recovered values were applied, but the file must be fixed." : "using defaults for this file."}`
      }
    ] : [];
    return {
      config,
      warnings: [
        ...parseFailures.map((failure) => failure.warning),
        ...rawWarnings.map((warning) => `${configPath}: ${warning}`),
        ...substituted.warnings.map((warning) => `${configPath}: ${warning}`),
        ...unsafeKeyWarnings.map((warning) => `${configPath}: ${warning}`)
      ],
      parseFailures,
      warningDetails: parseFailures,
      outcome: parseFailures.length > 0 ? "project-file-parse-error" : rejectedKeyPaths.length > 0 ? "schema-recovery" : substituted.warnings.length > 0 ? "substitution-failure" : "ok",
      source
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const warning = `${configPath}:1:1: ${message}; using defaults for this file.`;
    const failure = {
      warningClass: CONFIG_WARNING_CLASS.FILE_PARSE,
      source,
      path: configPath,
      line: 1,
      column: 1,
      message,
      recovered: false,
      warning
    };
    return {
      config: {},
      warnings: [warning],
      parseFailures: [failure],
      warningDetails: [failure],
      outcome: "project-file-parse-error",
      source
    };
  }
}
function defineOwnConfigValue(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
}
function deepMergeRawConfig(base, override) {
  const result = {};
  for (const key of Object.keys(base)) {
    if (isPrototypePollutionKey(key))
      continue;
    defineOwnConfigValue(result, key, base[key]);
  }
  for (const key of Object.keys(override)) {
    if (isPrototypePollutionKey(key))
      continue;
    const baseVal = Object.hasOwn(base, key) ? base[key] : undefined;
    const overrideVal = override[key];
    let mergedValue;
    if (baseVal !== null && typeof baseVal === "object" && !Array.isArray(baseVal) && overrideVal !== null && typeof overrideVal === "object" && !Array.isArray(overrideVal)) {
      mergedValue = deepMergeRawConfig(baseVal, overrideVal);
    } else if (key === "disabled_hooks" && Array.isArray(baseVal) && Array.isArray(overrideVal)) {
      mergedValue = [...new Set([...baseVal, ...overrideVal])];
    } else {
      mergedValue = overrideVal;
    }
    defineOwnConfigValue(result, key, mergedValue);
  }
  return result;
}
function redactConfigValue(value) {
  if (value === undefined)
    return "<missing>";
  if (value === null)
    return "null";
  if (typeof value === "string")
    return `string, ${value.length} char${value.length === 1 ? "" : "s"}`;
  if (typeof value === "number")
    return `number ${value}`;
  if (typeof value === "boolean")
    return `boolean ${value}`;
  if (Array.isArray(value))
    return `array, ${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `object with keys [${keys.join(", ")}]`;
  }
  return typeof value;
}
var warnedProtectedTagsDeprecation = false;
function formatProtectedTokensBelowMinWarning(value) {
  return `protected_tokens is a token floor (minimum ${PROTECTED_TOKENS_MIN}, default derived from the context window); ${value} looks like the old protected_tags count. Remove the key to use the default, or set a token count such as 16000.`;
}
function warnProtectedTagsDeprecationOnce() {
  if (!warnedProtectedTagsDeprecation) {
    warnedProtectedTagsDeprecation = true;
    console.warn("[magic-context] protected_tags is deprecated and ignored; use protected_tokens instead.");
  }
}
function parsePluginConfig(rawConfig, recoveredTopLevelKeys = []) {
  const preMigrationWarnings = [];
  const configWithoutRemovedAgent = stripRemovedAgentConfig(rawConfig, preMigrationWarnings);
  if (Object.hasOwn(rawConfig, "protected_tags")) {
    warnProtectedTagsDeprecationOnce();
    preMigrationWarnings.push("protected_tags is deprecated and ignored; use protected_tokens instead.");
  }
  const migratedExperimental = migrateLegacyExperimental(configWithoutRemovedAgent, preMigrationWarnings);
  const migratedDreamer = migrateDreamerV2(migratedExperimental, preMigrationWarnings);
  const migrated = migrateLegacyAgentEnabledInMemory(migratedDreamer, preMigrationWarnings);
  const parsed = MagicContextConfigSchema.safeParse(migrated);
  const disabledHooks = Array.isArray(rawConfig.disabled_hooks) ? rawConfig.disabled_hooks.filter((value) => typeof value === "string") : undefined;
  const command = typeof rawConfig.command === "object" && rawConfig.command !== null ? rawConfig.command : undefined;
  if (parsed.success) {
    return {
      ...parsed.data,
      disabled_hooks: disabledHooks,
      command,
      ...preMigrationWarnings.length > 0 ? { configWarnings: preMigrationWarnings } : {}
    };
  }
  const defaults = MagicContextConfigSchema.parse({});
  const warnings = [];
  const errorPaths = new Set;
  const customMessagesByKey = new Map;
  const issuePathsByKey = new Map;
  const GENERIC_ZOD_PREFIXES = ["Too big", "Too small", "Invalid input", "Invalid", "Expected"];
  for (const issue of parsed.error.issues) {
    const topKey = issue.path[0];
    if (topKey !== undefined) {
      const key = String(topKey);
      errorPaths.add(key);
      const paths = issuePathsByKey.get(key) ?? [];
      if (issue.code === "unrecognized_keys") {
        for (const unrecognizedKey of issue.keys) {
          paths.push([...issue.path, unrecognizedKey]);
        }
      } else {
        paths.push([...issue.path]);
      }
      issuePathsByKey.set(key, paths);
      const msg = issue.message;
      if (msg && !GENERIC_ZOD_PREFIXES.some((p) => msg.startsWith(p))) {
        if (!customMessagesByKey.has(key)) {
          customMessagesByKey.set(key, msg);
        }
      }
    }
  }
  const patched = { ...rawConfig };
  for (const key of errorPaths) {
    recoveredTopLevelKeys.push(key);
    const isAgentConfig = key === "historian" || key === "dreamer";
    const issuePaths = issuePathsByKey.get(key) ?? [];
    const rawValue = rawConfig[key];
    const allNested = issuePaths.length > 0 && issuePaths.every((p) => p.length >= 2) && typeof rawValue === "object" && rawValue !== null && !Array.isArray(rawValue);
    if (allNested) {
      let prunedBlock = {
        ...rawValue
      };
      const prunedLeaves = [];
      for (const p of issuePaths) {
        const relative = p.slice(1);
        const result = pruneNestedConfigLeaf(prunedBlock, relative);
        if (result) {
          prunedBlock = result.block;
          prunedLeaves.push(result.removed);
        }
      }
      if (prunedLeaves.length === issuePaths.length) {
        patched[key] = prunedBlock;
        const reason = customMessagesByKey.get(key);
        warnings.push(`"${key}": invalid nested field(s) ${prunedLeaves.map((leaf) => `"${key}.${leaf}"`).join(", ")}, using defaults for those.${reason ? ` ${reason}` : ""}`);
        continue;
      }
    }
    if (isAgentConfig) {
      delete patched[key];
      warnings.push(`"${key}": invalid agent configuration, ignoring. Check your magic-context.jsonc.`);
      continue;
    }
    delete patched[key];
    const defaultVal = defaults[key];
    const reason = customMessagesByKey.get(key);
    const invalidRawValue = rawConfig[key];
    if (key === "protected_tokens" && typeof invalidRawValue === "number" && invalidRawValue < PROTECTED_TOKENS_MIN) {
      warnings.push(formatProtectedTokensBelowMinWarning(invalidRawValue));
      continue;
    }
    warnings.push(`"${key}": invalid value (${redactConfigValue(rawConfig[key])}), using default ${JSON.stringify(defaultVal)}.${reason ? ` ${reason}` : ""}`);
  }
  const retryMigrated = migrateLegacyAgentEnabledInMemory(migrateDreamerV2(migrateLegacyExperimental(patched, preMigrationWarnings), preMigrationWarnings), preMigrationWarnings);
  const retryParsed = MagicContextConfigSchema.safeParse(retryMigrated);
  if (retryParsed.success) {
    return {
      ...retryParsed.data,
      disabled_hooks: disabledHooks,
      command,
      configWarnings: [...preMigrationWarnings, ...warnings]
    };
  }
  warnings.push("Config recovery failed, using all defaults.");
  return {
    ...defaults,
    disabled_hooks: disabledHooks,
    command,
    configWarnings: [...preMigrationWarnings, ...warnings]
  };
}
function hasUserTierSubcConfig(config) {
  const subc = config?.subc;
  if (typeof subc !== "object" || subc === null || Array.isArray(subc))
    return false;
  const connectionFile = subc.connection_file;
  return typeof connectionFile === "string" && connectionFile.trim().length > 0;
}
function collectEmptyStringPaths(value, prefix = "") {
  if (typeof value === "string") {
    return value === "" && prefix ? [prefix] : [];
  }
  if (Array.isArray(value) || value === null || typeof value !== "object") {
    return [];
  }
  const paths = [];
  for (const [key, child] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    paths.push(...collectEmptyStringPaths(child, nextPrefix));
  }
  return paths;
}
function bindSubstitutionFailures(loaded) {
  if (!loaded || loaded.warnings.length === 0 || loaded.outcome !== "substitution-failure") {
    return [];
  }
  const emptyPaths = collectEmptyStringPaths(loaded.config);
  return loaded.warnings.map((message) => {
    const matchedPath = emptyPaths.find((path) => {
      const tail = path.split(".").at(-1) ?? path;
      return message.includes(path) || message.toLowerCase().includes(tail.toLowerCase());
    });
    return { keyPath: matchedPath ?? "<unknown>", source: loaded.source, message };
  });
}
function combinedOutcome(args) {
  const sourceOutcomes = Object.values(args.sources);
  if (sourceOutcomes.includes("project-file-parse-error"))
    return "project-file-parse-error";
  if (sourceOutcomes.includes("project-file-io-error"))
    return "project-file-io-error";
  if (sourceOutcomes.includes("legacy-config-unmigrated"))
    return "legacy-config-unmigrated";
  if (args.recoveredTopLevelKeys.length > 0)
    return "schema-recovery";
  if (args.substitutionFailures.length > 0)
    return "substitution-failure";
  return "ok";
}
function loadPluginConfigDetailed(directory) {
  const userDetected = detectConfigFile(getUserConfigBasePath());
  const projectDetected = detectConfigFile(getProjectConfigBasePath(directory));
  const legacySources = resolveLegacyConfigSources(directory);
  const harnessLegacy = resolveLegacyConfigSourcesForHarness(directory, "opencode");
  const userLegacyFallback = userDetected.format === "none" ? resolveLegacyReadFallback(harnessLegacy.user) : { source: null };
  const projectLegacyFallback = projectDetected.format === "none" ? resolveLegacyReadFallback(harnessLegacy.project) : { source: null };
  const legacyUserUnmigrated = userDetected.format === "none" && !userLegacyFallback.source && legacySources.user.some((source) => existsSync6(source.path));
  const legacyProjectUnmigrated = projectDetected.format === "none" && !projectLegacyFallback.source && legacySources.project.some((source) => existsSync6(source.path));
  const userLoaded = userDetected.format !== "none" ? loadConfigFileDetailed(userDetected.path, "user") : userLegacyFallback.source ? loadConfigFileDetailed(userLegacyFallback.source.path, "user") : null;
  const projectLoaded = projectDetected.format !== "none" ? loadConfigFileDetailed(projectDetected.path, "project") : projectLegacyFallback.source ? loadConfigFileDetailed(projectLegacyFallback.source.path, "project") : null;
  const allWarnings = [];
  const removedConfigWarnings = [];
  const userRaw = stripRemovedAgentConfig(userLoaded?.config ?? {}, removedConfigWarnings);
  if (userLegacyFallback.source) {
    allWarnings.push(`[user config] reading legacy config from ${userLegacyFallback.source.path} until migration completes; run \`npx @cortexkit/magic-context doctor\` to consolidate into the shared CortexKit location.`);
  } else if (legacyUserUnmigrated) {
    allWarnings.push("[user config] legacy Magic Context config exists but the shared CortexKit config is absent; embedding registration is paused until config migration completes.");
  }
  if (projectLegacyFallback.source) {
    allWarnings.push(`[project config] reading legacy config from ${projectLegacyFallback.source.path} until migration completes; run \`npx @cortexkit/magic-context doctor\` to consolidate into the shared CortexKit location.`);
  } else if (legacyProjectUnmigrated) {
    allWarnings.push("[project config] legacy Magic Context config exists but the shared CortexKit config is absent; embedding registration is paused until config migration completes.");
  }
  if (userLoaded) {
    allWarnings.push(...userLoaded.warnings.map((w) => `[user config] ${w}`));
  }
  let projectRaw = {};
  if (projectLoaded) {
    allWarnings.push(...projectLoaded.warnings.map((w) => `[project config] ${w}`));
    projectRaw = stripRemovedAgentConfig(projectLoaded.config, removedConfigWarnings);
    for (const warning of stripUnsafeProjectConfigFields(projectRaw)) {
      allWarnings.push(`[project config] ${warning}`);
    }
  }
  allWarnings.push(...removedConfigWarnings.map((warning) => `[config] ${warning}`));
  const profileResolution = resolveConfigProfile({
    userRaw,
    projectRaw
  });
  allWarnings.push(...profileResolution.warnings.map((warning) => `[config] ${warning}`));
  const trustedProfiledRaw = deepMergeRawConfig(profileResolution.userBase, profileResolution.overlay);
  let mergedRaw = trustedProfiledRaw;
  const trustedBaseConfig = parsePluginConfig(trustedProfiledRaw);
  if (projectLoaded) {
    mergedRaw = deepMergeRawConfig(mergedRaw, profileResolution.projectBase);
    for (const warning of dropInheritedEmbeddingKeyOnRedirect(projectRaw, mergedRaw, profileResolution.userBase)) {
      allWarnings.push(`[project config] ${warning}`);
    }
    for (const warning of constrainProjectThresholdOverrides({
      mergedRaw,
      projectRaw: profileResolution.projectBase,
      trustedBaseConfig
    })) {
      allWarnings.push(`[project config] ${warning}`);
    }
  }
  const recoveredTopLevelKeys = [];
  const cacheTtlConfigured = Object.hasOwn(mergedRaw, "cache_ttl");
  const config = parsePluginConfig(mergedRaw, recoveredTopLevelKeys);
  attachProtectedTokensTierOverrides(config, {
    trustedUser: trustedBaseConfig.protected_tokens,
    project: projectLoaded ? profileResolution.projectBase.protected_tokens : undefined
  });
  if (profileResolution.activeProfile)
    config.profile = profileResolution.activeProfile;
  setOutputReserveConfig(config.output_reserve);
  setWindowOverlayPath(config.models?.window_overlay_path);
  const leafValidationWarnings = [...config.configWarnings ?? []];
  if (config.configWarnings?.length) {
    allWarnings.push(...config.configWarnings.map((w) => {
      if (userLoaded && projectLoaded)
        return `[config] ${w}`;
      if (userLoaded)
        return `[user config] ${w}`;
      return `[project config] ${w}`;
    }));
  }
  const resolvedTransformMode = resolveTransformMode({
    configured: config.transform_mode,
    userTierHasSubc: hasUserTierSubcConfig(userRaw),
    compactionEnabled: isCompactionEnabled(config)
  });
  config.transform_mode = resolvedTransformMode.mode;
  allWarnings.push(...resolvedTransformMode.warnings.map((warning) => `[config] ${warning}`));
  if (allWarnings.length > 0) {
    config.configWarnings = allWarnings;
  } else if ("configWarnings" in config) {
    config.configWarnings = undefined;
  }
  const substitutionFailures = [
    ...bindSubstitutionFailures(userLoaded),
    ...bindSubstitutionFailures(projectLoaded)
  ];
  const configParseFailures = [
    ...userLoaded?.parseFailures ?? [],
    ...projectLoaded?.parseFailures ?? []
  ];
  const warningDetails = [
    ...userLoaded?.warningDetails ?? [],
    ...projectLoaded?.warningDetails ?? [],
    ...leafValidationWarnings.map((message) => ({
      warningClass: CONFIG_WARNING_CLASS.INVALID_LEAF,
      message
    }))
  ];
  config.configParseFailures = configParseFailures;
  config.configWarningDetails = warningDetails;
  config.cacheTtlConfigured = cacheTtlConfigured;
  const sources = {
    userConfig: userLoaded?.outcome ?? (legacyUserUnmigrated ? "legacy-config-unmigrated" : "ok"),
    projectConfig: projectLoaded?.outcome ?? (legacyProjectUnmigrated ? "legacy-config-unmigrated" : "ok")
  };
  return {
    config,
    registrationPromptSurface: trustedBaseConfig.prompt_surface,
    loadOutcome: combinedOutcome({ sources, substitutionFailures, recoveredTopLevelKeys }),
    sources,
    substitutionFailures,
    recoveredTopLevelKeys,
    configParseFailures,
    warningDetails,
    cacheTtlConfigured
  };
}

// ../plugin/src/features/magic-context/storage-db.ts
import {
  chmodSync as chmodSync2,
  copyFileSync,
  cpSync,
  existsSync as existsSync9,
  mkdirSync as mkdirSync3,
  readdirSync as readdirSync3,
  readFileSync as readFileSync7,
  statSync as statSync4,
  unlinkSync as unlinkSync2
} from "node:fs";
import { basename as basename3, dirname as dirname6, join as join6, resolve as resolve3 } from "node:path";

// ../plugin/src/plugin/boot-quiet.ts
var bootQuietUntilMs = 0;
function bootQuietRemainingMs(now = Date.now()) {
  return Math.max(0, bootQuietUntilMs - now);
}
function scheduleAfterBootQuiet(task, additionalDelayMs = 0) {
  const timer = setTimeout(task, bootQuietRemainingMs() + Math.max(0, additionalDelayMs));
  timer.unref?.();
  return timer;
}

// ../plugin/src/shared/error-message.ts
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// ../plugin/src/shared/rpc-utils.ts
import { execFileSync } from "node:child_process";
import { readFileSync as readFileSync6 } from "node:fs";

// ../plugin/src/shared/pi-executable.ts
var PI_IMAGE_NAMES = new Set(["pi", "pi.cmd", "omp", "oh-my-pi"]);
function piHarnessKindFromExecutable(value) {
  const executable = (value ?? "").trim().replace(/^['"]|['"]$/g, "").replaceAll("\\", "/").split("/").at(-1)?.toLowerCase().replace(/\.(?:exe|cmd)$/, "");
  if (!executable || !PI_IMAGE_NAMES.has(executable))
    return;
  return executable === "pi" ? "pi" : "omp";
}

// ../plugin/src/shared/rpc-utils.ts
function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return "dead";
  if (rpcIdentityPlatform === "win32")
    return readWindowsProcess(pid).state;
  try {
    rpcIdentityProcessKill(pid, 0);
    return "alive";
  } catch (error) {
    return error.code === "ESRCH" ? "dead" : "inconclusive";
  }
}
var RPC_IDENTITY_SKEW_TOLERANCE_MS = 120000;
var LINUX_CLOCK_TICKS_PER_SECOND = 100;
var PS_PROBE_TIMEOUT_MS = 1000;
var WINDOWS_CIM_PROBE_TIMEOUT_MS = 5000;
var MAX_ANCESTOR_WALK_DEPTH = 16;
var OPEN_CODE_COMMAND_MARKERS = ["opencode", "node", "bun", "electron"];
var TASKLIST_NO_TASKS_PATTERN = /^INFO:\s+No tasks are running which match the specified criteria\.?$/im;
var WINDOWS_CIM_COMMAND = "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,CreationDate | ConvertTo-Json -Compress";
var PI_HARNESS_ARC_MARKERS = [
  "pi-coding-agent",
  "oh-my-pi",
  "@oh-my-pi",
  "cljs/dist",
  "dist/bundle/cli"
];
var rpcIdentityReadFileSync = readFileSync6;
var rpcIdentityExecFileSync = execFileSync;
var rpcIdentityProcessKill = process.kill;
var rpcProcessListExecFileSync = execFileSync;
var rpcIdentityPlatform = process.platform;
var rpcIdentityNowMs = () => Date.now();
function parseLinuxProcessStartTime(statContent, uptimeContent) {
  const closingCommandName = statContent.lastIndexOf(")");
  if (closingCommandName < 0)
    return null;
  const statFields = statContent.slice(closingCommandName + 1).trim().split(/\s+/);
  const startTimeTicks = Number(statFields[19]);
  const uptimeSeconds = Number(uptimeContent.trim().split(/\s+/)[0]);
  if (!Number.isFinite(startTimeTicks) || startTimeTicks < 0 || !Number.isFinite(uptimeSeconds) || uptimeSeconds < 0) {
    return null;
  }
  const processStartTime = rpcIdentityNowMs() - uptimeSeconds * 1000 + startTimeTicks / LINUX_CLOCK_TICKS_PER_SECOND * 1000;
  return Number.isFinite(processStartTime) ? processStartTime : null;
}
function readLinuxProcessStartTime(pid) {
  try {
    const statContent = String(rpcIdentityReadFileSync(`/proc/${pid}/stat`, "utf8"));
    const uptimeContent = String(rpcIdentityReadFileSync("/proc/uptime", "utf8"));
    return parseLinuxProcessStartTime(statContent, uptimeContent);
  } catch {
    return null;
  }
}
function readPsProcessStartTime(pid) {
  try {
    const output = rpcIdentityExecFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const processStartTime = Date.parse(String(output).trim());
    return Number.isFinite(processStartTime) ? processStartTime : null;
  } catch {
    return null;
  }
}
function readProcessStartTime(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return null;
  return rpcIdentityPlatform === "linux" ? readLinuxProcessStartTime(pid) : rpcIdentityPlatform === "win32" ? readWindowsProcessStartTime(pid) : readPsProcessStartTime(pid);
}
function readProcessProbeEvidence(pid) {
  return {
    startTime: readProcessStartTime(pid),
    commandLine: readProcessCommand(pid)
  };
}
var windowsProcessFactsCache = null;
function rememberWindowsProcessFacts(facts) {
  windowsProcessFactsCache = new Map(facts.map((fact) => [fact.pid, fact]));
}
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0;index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted)
    return null;
  fields.push(field);
  return fields;
}
function parseTasklistOutput(output) {
  const entries = [];
  let sawHeader = false;
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line)
      continue;
    if (TASKLIST_NO_TASKS_PATTERN.test(line))
      return [];
    const fields = parseCsvLine(line);
    if (!fields)
      continue;
    if (fields[1]?.trim().toLowerCase() === "pid") {
      sawHeader = true;
      continue;
    }
    const pid = Number(fields[1]);
    if (!Number.isInteger(pid) || pid <= 0 || !fields[0])
      continue;
    entries.push({ pid, command: fields[0] });
  }
  return entries.length > 0 || sawHeader ? entries : null;
}
function readWindowsProcess(pid) {
  try {
    const output = rpcIdentityExecFileSync("tasklist", ["/FO", "CSV", "/FI", `PID eq ${pid}`], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const entries = parseTasklistOutput(String(output));
    if (entries === null)
      return { state: "inconclusive" };
    const process2 = entries.find((entry) => entry.pid === pid);
    return process2 ? { state: "alive", command: process2.command } : { state: "dead" };
  } catch {
    return { state: "inconclusive" };
  }
}
function readWindowsProcessStartTime(pid) {
  const cached = windowsProcessFactsCache?.get(pid);
  if (cached)
    return cached.startTime;
  const snapshot = tryReadWindowsCimSnapshot(rpcIdentityExecFileSync);
  if (!snapshot)
    return null;
  rememberWindowsProcessFacts(snapshot.facts);
  return windowsProcessFactsCache?.get(pid)?.startTime ?? null;
}
function readLinuxProcessCommand(pid) {
  try {
    return String(rpcIdentityReadFileSync(`/proc/${pid}/cmdline`, "utf8"));
  } catch {
    return null;
  }
}
function readPsProcessCommand(pid) {
  try {
    const output = rpcIdentityExecFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return String(output);
  } catch {
    return null;
  }
}
function readProcessCommand(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return null;
  if (rpcIdentityPlatform === "linux")
    return readLinuxProcessCommand(pid);
  if (rpcIdentityPlatform === "win32") {
    const cached = windowsProcessFactsCache?.get(pid);
    if (cached?.commandLine)
      return cached.commandLine;
    return readWindowsProcess(pid).command ?? null;
  }
  return readPsProcessCommand(pid);
}
function executableName(token) {
  return (token ?? "").replace(/^['"]|['"]$/g, "").split("/").at(-1) ?? "";
}
function commandTokens(command) {
  return command.toLowerCase().replaceAll("\\", "/").replaceAll("\x00", " ").split(/\s+/).map((token) => token.replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function commandHasOpenCodeExecutable(tokens) {
  return tokens.findIndex((token) => {
    const executable = executableName(token).replace(/\.(?:exe|cmd)$/, "");
    return executable === "opencode" || executable.endsWith("/opencode");
  });
}
function commandHasPiExecutable(tokens) {
  for (let index = 0;index < tokens.length; index += 1) {
    const executable = executableName(tokens[index]).replace(/\.(?:exe|cmd)$/, "");
    if (piHarnessKindFromExecutable(executable) !== undefined)
      return true;
    if (["node", "bun", "deno"].includes(executable)) {
      const script = executableName(tokens[index + 1]).replace(/\.(?:exe|cmd)$/, "");
      if (["pi", "pi.js", "pi.mjs", "pi.cjs"].includes(script) || tokens[index + 1]?.includes("pi-coding-agent")) {
        return true;
      }
    }
  }
  return false;
}
function classifyProcessKind(command) {
  if (!command)
    return "process";
  const tokens = commandTokens(command);
  const openCodeIndex = commandHasOpenCodeExecutable(tokens);
  if (openCodeIndex >= 0) {
    const args = tokens.slice(openCodeIndex + 1);
    if (args.some((token) => token === "serve" || token === "--serve" || token.startsWith("--serve="))) {
      return "OpenCode server";
    }
    return "OpenCode instance (TUI/CLI)";
  }
  return commandHasPiExecutable(tokens) ? "Pi" : "process";
}
function commandLooksLikeOpenCode(command) {
  const normalized = command.toLowerCase();
  return OPEN_CODE_COMMAND_MARKERS.some((marker) => normalized.includes(marker));
}
function isPidIdentityPlausible(record, evidence) {
  if (!Number.isInteger(record.pid) || record.pid <= 0)
    return "implausible";
  if (Number.isFinite(record.started_at) && record.started_at > 0) {
    const processStartTime = evidence ? evidence.startTime : readProcessStartTime(record.pid);
    if (processStartTime === null)
      return "inconclusive";
    return processStartTime <= record.started_at + RPC_IDENTITY_SKEW_TOLERANCE_MS ? "plausible" : "implausible";
  }
  const command = evidence ? evidence.commandLine : rpcIdentityPlatform === "linux" ? readLinuxProcessCommand(record.pid) : rpcIdentityPlatform === "win32" ? readWindowsProcess(record.pid).command ?? null : readPsProcessCommand(record.pid);
  if (command === null)
    return "inconclusive";
  return commandLooksLikeOpenCode(command) ? "plausible" : "implausible";
}
function commandLooksLikePiImage(command) {
  const tokens = commandTokens(command);
  const first = executableName(tokens[0]).replace(/\.(?:exe|cmd)$/, "");
  return PI_IMAGE_NAMES.has(first);
}
function commandHasPiHarnessArc(command) {
  const normalized = command.trim().toLowerCase().replaceAll("\\", "/").replaceAll("\x00", " ");
  if (!normalized)
    return false;
  const tokens = commandTokens(command);
  if (tokens.length === 0)
    return false;
  const hasArc = PI_HARNESS_ARC_MARKERS.some((marker) => normalized.includes(marker));
  const first = executableName(tokens[0]).replace(/\.(?:exe|cmd)$/, "");
  if (hasArc && ["pi", "omp", "oh-my-pi", "node", "bun", "deno", "cmd"].includes(first)) {
    return true;
  }
  if (hasArc && PI_HARNESS_ARC_MARKERS.some((marker) => tokens[0].includes(marker))) {
    return true;
  }
  if (["node", "bun", "deno"].includes(first)) {
    const script = executableName(tokens[1]).replace(/\.(?:exe|cmd)$/, "");
    if (["pi", "pi.js", "pi.mjs", "pi.cjs"].includes(script))
      return true;
    if (hasArc)
      return true;
  }
  return false;
}
function execProcessList(exec, file, args, timeout = PS_PROBE_TIMEOUT_MS) {
  return String(exec(file, [...args], {
    encoding: "utf8",
    timeout,
    stdio: ["ignore", "pipe", "pipe"]
  }));
}
function parseWindowsCreationDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1000000000000 ? value : value * 1000;
  }
  if (typeof value !== "string")
    return null;
  const trimmed = value.trim();
  if (!trimmed)
    return null;
  const wmi = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d{6})([+-])(\d{3})$/.exec(trimmed);
  if (wmi) {
    const utcMs = Date.UTC(Number(wmi[1]), Number(wmi[2]) - 1, Number(wmi[3]), Number(wmi[4]), Number(wmi[5]), Number(wmi[6]), Number(wmi[7]) / 1000);
    if (!Number.isFinite(utcMs))
      return null;
    const offsetMinutes = Number(wmi[9]);
    const sign = wmi[8] === "+" ? 1 : -1;
    return utcMs - sign * offsetMinutes * 60000;
  }
  const dotNet = /^\/Date\((-?\d+)\)\/$/.exec(trimmed);
  if (dotNet) {
    const milliseconds = Number(dotNet[1]);
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
function parseWindowsCimOutput(output) {
  const trimmed = output.trim();
  if (!trimmed)
    return null;
  const bracket = trimmed.indexOf("[");
  const brace = trimmed.indexOf("{");
  const start = Math.min(bracket === -1 ? Number.POSITIVE_INFINITY : bracket, brace === -1 ? Number.POSITIVE_INFINITY : brace);
  if (!Number.isFinite(start))
    return null;
  let parsed;
  try {
    parsed = JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
  if (parsed == null)
    return null;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const facts = [];
  for (const row of rows) {
    if (!row || typeof row !== "object")
      continue;
    const record = row;
    const pid = Number(record.ProcessId);
    if (!Number.isInteger(pid) || pid <= 0)
      continue;
    const parentRaw = record.ParentProcessId;
    const parentPid = parentRaw == null || parentRaw === "" ? Number.NaN : Number(parentRaw);
    const commandLine = typeof record.CommandLine === "string" ? record.CommandLine : null;
    facts.push({
      pid,
      parentPid: Number.isInteger(parentPid) && parentPid > 0 ? parentPid : null,
      commandLine,
      imageName: commandLine ? executableName(commandTokens(commandLine)[0]) : null,
      startTime: parseWindowsCreationDate(record.CreationDate)
    });
  }
  return facts.length > 0 ? facts : null;
}
function snapshotFromFacts(facts, source) {
  const parentByPid = new Map;
  for (const fact of facts) {
    if (fact.parentPid != null)
      parentByPid.set(fact.pid, fact.parentPid);
  }
  return { facts, parentByPid, source };
}
function tryReadWindowsCimSnapshot(exec) {
  try {
    const output = execProcessList(exec, "powershell", ["-NoProfile", "-Command", WINDOWS_CIM_COMMAND], WINDOWS_CIM_PROBE_TIMEOUT_MS);
    const facts = parseWindowsCimOutput(output);
    return facts ? snapshotFromFacts(facts, "cim") : null;
  } catch {
    return null;
  }
}
function tryReadWindowsTasklistSnapshot() {
  try {
    const output = execProcessList(rpcProcessListExecFileSync, "tasklist", ["/FO", "CSV"]);
    const entries = parseTasklistOutput(output);
    if (entries === null)
      return null;
    const facts = entries.map((entry) => ({
      pid: entry.pid,
      parentPid: null,
      commandLine: null,
      imageName: entry.command,
      startTime: null
    }));
    return snapshotFromFacts(facts, "tasklist");
  } catch {
    return null;
  }
}
function readPosixProcessSnapshot() {
  const output = execProcessList(rpcProcessListExecFileSync, "ps", ["-axo", "pid=,command="]);
  const facts = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /^\s*(\d+)\s+(.+)$/.exec(line);
    if (!match)
      continue;
    const pid = Number(match[1]);
    if (!Number.isInteger(pid) || pid <= 0)
      continue;
    facts.push({
      pid,
      parentPid: null,
      commandLine: match[2],
      imageName: executableName(commandTokens(match[2])[0]),
      startTime: null
    });
  }
  return snapshotFromFacts(facts, "ps");
}
function readPosixParentPid(pid) {
  try {
    const output = execProcessList(rpcProcessListExecFileSync, "ps", [
      "-o",
      "ppid=",
      "-p",
      String(pid)
    ]);
    const match = /^\s*(\d+)\s*$/.exec(output);
    if (!match)
      return null;
    const ppid = Number(match[1]);
    return Number.isInteger(ppid) && ppid > 0 ? ppid : null;
  } catch {
    return null;
  }
}
function collectAncestorPids(selfPid, parentByPid) {
  const ancestors = new Set;
  let current = selfPid;
  for (let depth = 0;depth < MAX_ANCESTOR_WALK_DEPTH; depth += 1) {
    let ppid = null;
    if (parentByPid.has(current)) {
      ppid = parentByPid.get(current) ?? null;
    } else if (rpcIdentityPlatform !== "win32") {
      ppid = readPosixParentPid(current);
      if (ppid == null && current === process.pid && process.ppid > 0) {
        ppid = process.ppid;
      }
    } else if (current === process.pid && process.ppid > 0) {
      ppid = process.ppid;
    } else {
      break;
    }
    if (ppid == null || ppid <= 0 || ppid === current || ancestors.has(ppid))
      break;
    ancestors.add(ppid);
    current = ppid;
  }
  return ancestors;
}
function classifyLivePiSnapshot(snapshot) {
  const ancestors = collectAncestorPids(process.pid, snapshot.parentByPid);
  const processIds = new Set;
  const inconclusivePids = new Set;
  const skippedAncestorPids = [];
  for (const fact of snapshot.facts) {
    if (fact.pid === process.pid)
      continue;
    const command = fact.commandLine ?? fact.imageName ?? "";
    const looksLikeHarness = commandHasPiHarnessArc(command) || commandLooksLikePiImage(command);
    if (!looksLikeHarness)
      continue;
    if (ancestors.has(fact.pid)) {
      skippedAncestorPids.push(fact.pid);
      log(`[magic-context] Pi process scan: skipping ancestor PID ${fact.pid} (session launcher shim)`);
      continue;
    }
    if (commandHasPiHarnessArc(command)) {
      processIds.add(fact.pid);
      continue;
    }
    inconclusivePids.add(fact.pid);
    log(`[magic-context] Pi process scan: PID ${fact.pid} command line is ambiguous (image-name or missing Pi/OMP arc); treating as inconclusive`);
  }
  skippedAncestorPids.sort((left, right) => left - right);
  const verified = [...processIds].sort((left, right) => left - right);
  const inconclusive = [...inconclusivePids].sort((left, right) => left - right);
  if (verified.length === 0 && inconclusive.length > 0) {
    return {
      state: "inconclusive",
      processIds: [],
      inconclusivePids: inconclusive,
      ...skippedAncestorPids.length > 0 ? { skippedAncestorPids } : {}
    };
  }
  return {
    state: "known",
    processIds: verified,
    ...inconclusive.length > 0 ? { inconclusivePids: inconclusive } : {},
    ...skippedAncestorPids.length > 0 ? { skippedAncestorPids } : {}
  };
}
function inspectLivePiProcesses() {
  if (false) {}
  try {
    if (rpcIdentityPlatform === "win32") {
      const cim = tryReadWindowsCimSnapshot(rpcProcessListExecFileSync);
      const snapshot = cim ?? tryReadWindowsTasklistSnapshot();
      if (!snapshot) {
        return {
          state: "unreadable",
          processIds: [],
          error: "process list unavailable"
        };
      }
      rememberWindowsProcessFacts(snapshot.facts);
      return classifyLivePiSnapshot(snapshot);
    }
    return classifyLivePiSnapshot(readPosixProcessSnapshot());
  } catch (error) {
    return {
      state: "unreadable",
      processIds: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function parseRpcPortFile(content, fallbackPid = 0) {
  const trimmed = content.trim();
  if (!trimmed)
    return null;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const port = Number(parsed.port);
      const pid = Number(parsed.pid);
      const startedAt = Number(parsed.started_at);
      if (!isValidPort(port) || !Number.isInteger(pid) || pid <= 0)
        return null;
      return {
        port,
        pid,
        started_at: Number.isFinite(startedAt) ? startedAt : 0,
        kind: typeof parsed.kind === "string" ? parsed.kind : undefined,
        harness: typeof parsed.harness === "string" ? parsed.harness : undefined,
        token: typeof parsed.token === "string" ? parsed.token : undefined,
        instance_id: typeof parsed.instance_id === "string" ? parsed.instance_id : undefined
      };
    } catch {
      return null;
    }
  }
  const port = Number.parseInt(trimmed, 10);
  if (!isValidPort(port))
    return null;
  return { port, pid: fallbackPid, started_at: 0 };
}
function isValidPort(port) {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

// ../plugin/src/shared/sqlite.ts
var reportSlowPrivilegedWrite;
function registerSlowWriteReporter(reporter) {
  reportSlowPrivilegedWrite = reporter;
}
function detectSqliteRuntime() {
  const hasBunVersion = typeof process !== "undefined" && typeof process.versions?.bun === "string";
  const hasBunGlobal = typeof globalThis !== "undefined" && typeof globalThis.Bun !== "undefined";
  return hasBunVersion || hasBunGlobal ? "Bun" : "Node.js";
}
var bunSpec = "bun:" + "sqlite";
var nodeSpec = "node:" + "sqlite";
async function importSqliteModule(specifier) {
  return await import(specifier);
}
function isModuleNotFoundError(error, specifier) {
  const candidate = error;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const name = typeof candidate?.name === "string" ? candidate.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const details = `${code} ${name} ${message}`.toLowerCase();
  const mentionsSpecifier = details.includes(specifier.toLowerCase());
  if (!mentionsSpecifier)
    return false;
  return code === "ERR_MODULE_NOT_FOUND" || code === "ERR_UNKNOWN_BUILTIN_MODULE" || code === "MODULE_NOT_FOUND" || name === "ResolveMessage" || details.includes("module not found") || details.includes("cannot find module") || details.includes("cannot find package") || details.includes("no such built-in module");
}

class SqliteRuntimeUnavailableError extends Error {
  runtime;
  specifier;
  constructor(runtime, specifier, cause) {
    const requirement = specifier === nodeSpec ? "Requires Node.js >= 24, or Bun with bun:sqlite — this Bun build lacks node:sqlite." : "Requires Bun with bun:sqlite, or Node.js >= 24 — this Bun build lacks bun:sqlite.";
    super(`Magic Context detected ${runtime}, but could not load ${specifier}. ${requirement}`, { cause });
    this.name = "SqliteRuntimeUnavailableError";
    this.runtime = runtime;
    this.specifier = specifier;
  }
}
async function loadSqliteModule(runtime = detectSqliteRuntime(), importer = importSqliteModule) {
  const specifier = runtime === "Bun" ? bunSpec : nodeSpec;
  try {
    return await importer(specifier);
  } catch (error) {
    if (isModuleNotFoundError(error, specifier)) {
      throw new SqliteRuntimeUnavailableError(runtime, specifier, error);
    }
    throw error;
  }
}
var detectedRuntime = detectSqliteRuntime();
var isBun = detectedRuntime === "Bun";
var sqliteModule = await loadSqliteModule(detectedRuntime);
var DatabaseImpl = isBun ? sqliteModule.Database : buildNodeSqliteDatabaseClass(sqliteModule.DatabaseSync);
var trackedSqliteConnections = new Map;
var nextSqliteConnectionSequence = 1;
function trackSqliteConnection(db, filename, options) {
  const originalClose = db.close.bind(db);
  const sequence = nextSqliteConnectionSequence++;
  const metadata = {
    sequence,
    filename: typeof filename === "string" ? filename : Buffer.isBuffer(filename) ? "<buffer>" : ":memory:",
    readonly: Boolean(options) && typeof options === "object" && (options.readonly === true || options.readOnly === true)
  };
  Object.defineProperty(db, "close", {
    configurable: true,
    value: (...args) => {
      try {
        return originalClose(...args);
      } finally {
        trackedSqliteConnections.delete(sequence);
      }
    }
  });
  trackedSqliteConnections.set(sequence, {
    ...metadata,
    reference: new WeakRef(db)
  });
  return db;
}
var TrackedDatabase = new Proxy(DatabaseImpl, {
  construct(target, args) {
    const db = Reflect.construct(target, args, target);
    return trackSqliteConnection(db, args[0], args[1]);
  }
});
function buildNodeSqliteDatabaseClass(DatabaseSync) {
  const SAVEPOINT = "mc_tx_sp";

  class NodeSqliteDatabase extends DatabaseSync {
    constructor(filename, options) {
      const translated = { ...options };
      if (options && "readonly" in options) {
        translated.readOnly = options.readonly;
        delete translated.readonly;
      }
      super(typeof filename === "string" ? filename : ":memory:", translated);
    }
    prepare(sql) {
      const stmt = super.prepare(sql);
      for (const method of ["run", "get", "all"]) {
        const original = stmt[method].bind(stmt);
        stmt[method] = (...args) => args.length === 1 && Array.isArray(args[0]) ? original(...args[0]) : original(...args);
      }
      return stmt;
    }
    transaction(fn) {
      const self = this;
      const execute = (mode, receiver, args) => {
        const nested = self.isTransaction === true;
        self.exec(nested ? `SAVEPOINT ${SAVEPOINT}` : `BEGIN${mode ? ` ${mode}` : ""}`);
        try {
          const result = fn.apply(receiver, args);
          self.exec(nested ? `RELEASE ${SAVEPOINT}` : "COMMIT");
          return result;
        } catch (error) {
          if (nested) {
            self.exec(`ROLLBACK TO ${SAVEPOINT}`);
            self.exec(`RELEASE ${SAVEPOINT}`);
          } else {
            self.exec("ROLLBACK");
          }
          throw error;
        }
      };
      const wrapped = function(...args) {
        return execute("", this, args);
      };
      wrapped.default = function(...args) {
        return execute("", this, args);
      };
      wrapped.deferred = function(...args) {
        return execute("DEFERRED", this, args);
      };
      wrapped.immediate = function(...args) {
        return execute("IMMEDIATE", this, args);
      };
      wrapped.exclusive = function(...args) {
        return execute("EXCLUSIVE", this, args);
      };
      return wrapped;
    }
  }
  return NodeSqliteDatabase;
}
var Database = TrackedDatabase;
var privilegeDepth = new WeakMap;
function isInTransaction(db) {
  const candidate = db;
  return candidate.inTransaction === true || candidate.isTransaction === true;
}
function withPrivilegedWriter(db, operation) {
  const previousDepth = privilegeDepth.get(db) ?? 0;
  const nested = isInTransaction(db);
  const savepoint = "mc_privilege_scope";
  const transactionStartedAt = nested ? undefined : performance.now();
  if (nested) {
    db.exec(`SAVEPOINT ${savepoint}`);
  } else {
    db.exec("BEGIN IMMEDIATE");
  }
  privilegeDepth.set(db, previousDepth + 1);
  try {
    db.prepare("INSERT INTO context_privilege_state(id, enabled) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET enabled = 1").run();
    const result = operation();
    if (previousDepth === 0) {
      db.prepare("UPDATE context_privilege_state SET enabled = 0 WHERE id = 1").run();
    }
    if (nested) {
      db.exec(`RELEASE ${savepoint}`);
    } else {
      db.exec("COMMIT");
      if (transactionStartedAt !== undefined) {
        reportSlowPrivilegedWrite?.("privileged_writer", transactionStartedAt);
      }
    }
    if (previousDepth > 0)
      privilegeDepth.set(db, previousDepth);
    else
      privilegeDepth.delete(db);
    return result;
  } catch (error) {
    try {
      if (nested) {
        db.exec(`ROLLBACK TO ${savepoint}`);
        db.exec(`RELEASE ${savepoint}`);
      } else {
        db.exec("ROLLBACK");
      }
    } finally {
      if (previousDepth > 0)
        privilegeDepth.set(db, previousDepth);
      else
        privilegeDepth.delete(db);
    }
    throw error;
  }
}

// ../plugin/src/shared/sqlite-helpers.ts
function closeQuietly(db) {
  if (!db)
    return;
  try {
    db.close();
  } catch {}
}

// ../plugin/src/shared/write-transaction-timing.ts
var SLOW_WRITE_TRANSACTION_THRESHOLD_MS = 1000;
function logSlowWriteTransaction(site, startedAt, thresholdMs = SLOW_WRITE_TRANSACTION_THRESHOLD_MS, completedAtMs = performance.now()) {
  try {
    const durationMs = completedAtMs - startedAt;
    if (durationMs < thresholdMs)
      return;
    log(`[magic-context] slow write transaction: site=${site} held=${durationMs.toFixed(1)}ms`);
  } catch {}
}

// ../plugin/src/features/magic-context/context-authority.ts
import { createHash, randomUUID } from "node:crypto";
var observedAuthorityRoutingByProject = new Map;
var moduleNoteEvaluationBridges = new Map;
function getContextStoreUuid(db) {
  const row = db.prepare("SELECT value FROM context_store_meta WHERE key = 'store_uuid'").get();
  return typeof row?.value === "string" && row.value.length > 0 ? row.value : null;
}
function ensureContextStoreUuid(db) {
  const existing = getContextStoreUuid(db);
  if (existing)
    return existing;
  const minted = randomUUID();
  withPrivilegedWriter(db, () => {
    db.transaction(() => {
      db.prepare("INSERT INTO context_store_meta(key, value) VALUES ('store_uuid', ?) ON CONFLICT(key) DO NOTHING").run(minted);
    }).immediate();
  });
  return getContextStoreUuid(db) ?? minted;
}
var MAX_AUTHORITY_SEED_FRAME_BYTES = 900 * 1024;
var mirrorFlights = new WeakMap;

// ../plugin/src/features/magic-context/fail-closed-block.ts
function attachFailClosedBlockingProcessEvidence(process2, evidence) {
  Object.defineProperties(process2, {
    startTime: { configurable: true, value: evidence.startTime },
    commandLine: { configurable: true, value: evidence.commandLine }
  });
  return process2;
}
var OPENCODE_INTERNAL_AGENT_NAMES = new Set(["title", "summary", "compaction"]);

// ../plugin/src/features/magic-context/message-fts-rowid-map.ts
import { createHash as createHash2 } from "node:crypto";
var MESSAGE_FTS_ROWID_MAP_BACKFILL_BATCH_SIZE = 500;
var BACKFILL_STATE_ID = 1;
var EMPTY_INDEX_CONTENT_HASH = createHash2("sha256").update("").digest("hex");
var upsertMapStatements = new WeakMap;
var rangeReadyStatements = new WeakMap;
var activeBackfills = new WeakMap;
function getUpsertMapStatement(db) {
  let statement = upsertMapStatements.get(db);
  if (!statement) {
    statement = db.prepare(`INSERT INTO message_fts_rowid_map (session_id, message_ordinal, fts_rowid)
             VALUES (?, ?, ?)
             ON CONFLICT(session_id, message_ordinal) DO UPDATE SET
                 fts_rowid = excluded.fts_rowid`);
    upsertMapStatements.set(db, statement);
  }
  return statement;
}
function getBackfillState(db) {
  const row = db.prepare(`SELECT watermark_rowid AS watermarkRowid, completed
             FROM message_fts_rowid_map_backfill_state
             WHERE id = ?`).get(BACKFILL_STATE_ID);
  return {
    processed: 0,
    watermarkRowid: typeof row?.watermarkRowid === "number" && Number.isSafeInteger(row.watermarkRowid) ? row.watermarkRowid : 0,
    completed: row?.completed === 1
  };
}
function recordMessageFtsRowid(db, sessionId, messageOrdinal, ftsRowid) {
  const numericRowid = Number(ftsRowid);
  if (!Number.isSafeInteger(numericRowid) || numericRowid <= 0) {
    throw new Error(`invalid message FTS rowid: ${String(ftsRowid)}`);
  }
  getUpsertMapStatement(db).run(sessionId, messageOrdinal, numericRowid);
}
function backfillMessageFtsRowidMapBatch(db, batchSize = MESSAGE_FTS_ROWID_MAP_BACKFILL_BATCH_SIZE) {
  const boundedBatchSize = Math.max(1, Math.floor(batchSize));
  let progress = {
    processed: 0,
    watermarkRowid: 0,
    completed: false
  };
  const transactionStartedAt = performance.now();
  db.transaction(() => {
    const state = getBackfillState(db);
    if (state.completed) {
      progress = state;
      return;
    }
    const rows = db.prepare(`SELECT rowid AS ftsRowid,
                        session_id AS sessionId,
                        message_ordinal AS messageOrdinal
                 FROM message_history_fts
                 WHERE rowid > ?
                 ORDER BY rowid ASC
                 LIMIT ?`).all(state.watermarkRowid, boundedBatchSize);
    let watermarkRowid = state.watermarkRowid;
    for (const row of rows) {
      const ftsRowid = Number(row.ftsRowid);
      const messageOrdinal = Number(row.messageOrdinal);
      if (Number.isSafeInteger(ftsRowid) && ftsRowid > watermarkRowid) {
        watermarkRowid = ftsRowid;
      }
      if (typeof row.sessionId === "string" && Number.isSafeInteger(messageOrdinal) && messageOrdinal >= 0 && Number.isSafeInteger(ftsRowid) && ftsRowid > 0) {
        recordMessageFtsRowid(db, row.sessionId, messageOrdinal, ftsRowid);
      }
    }
    const completed = rows.length < boundedBatchSize;
    db.prepare(`UPDATE message_fts_rowid_map_backfill_state
             SET watermark_rowid = ?, completed = ?, updated_at = ?
             WHERE id = ?`).run(watermarkRowid, completed ? 1 : 0, Date.now(), BACKFILL_STATE_ID);
    progress = {
      processed: rows.length,
      watermarkRowid,
      completed
    };
  })();
  logSlowWriteTransaction("message_fts_rowid_backfill", transactionStartedAt);
  return progress;
}
async function runMessageFtsRowidMapBackfill(db) {
  for (;; ) {
    const progress = backfillMessageFtsRowidMapBatch(db);
    if (progress.completed)
      return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
function startMessageFtsRowidMapBackfill(db) {
  const active = activeBackfills.get(db);
  if (active)
    return active;
  const run = runMessageFtsRowidMapBackfill(db).finally(() => {
    activeBackfills.delete(db);
  });
  activeBackfills.set(db, run);
  return run;
}

// ../plugin/src/hooks/magic-context/compartment-parser.ts
function makeTierOpenRegex(n) {
  return new RegExp(`<p${n}\\s*(/?)>`);
}
var TIER_OPEN_REGEXES = [
  makeTierOpenRegex(1),
  makeTierOpenRegex(2),
  makeTierOpenRegex(3),
  makeTierOpenRegex(4)
];
var TIER_CLOSE_ANY_REGEX = /<\/p\d/;
var TIER_OPEN_ANY_REGEX = /<p\d/;
function extractTier(inner, index) {
  const openMatch = TIER_OPEN_REGEXES[index].exec(inner);
  if (!openMatch)
    return;
  if (openMatch[1] === "/")
    return "";
  const rest = inner.slice(openMatch.index + openMatch[0].length);
  const closeAt = rest.search(TIER_CLOSE_ANY_REGEX);
  let body = closeAt === -1 ? rest : rest.slice(0, closeAt);
  const openInside = body.search(TIER_OPEN_ANY_REGEX);
  if (openInside !== -1)
    body = body.slice(0, openInside);
  return unescapeXml(body.trim());
}
function extractTiersFromInner(inner) {
  return {
    p1: extractTier(inner, 0),
    p2: extractTier(inner, 1),
    p3: extractTier(inner, 2),
    p4: extractTier(inner, 3)
  };
}
function unescapeXml(s) {
  return s.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// ../plugin/src/features/magic-context/storage-schema-helpers.ts
function ensureColumn(db, table, column, definition) {
  if (!/^[a-z][a-z0-9_]*$/.test(table) || !/^[a-z][a-z0-9_]*$/.test(column) || !/^[A-Z0-9_"'(),[\]\s]+$/i.test(definition)) {
    throw new Error(`Unsafe schema identifier: ${table}.${column} ${definition}`);
  }
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  if (rows.some((row) => row.name === column)) {
    return;
  }
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    const recheck = db.prepare(`PRAGMA table_info(${table})`).all();
    if (recheck.some((row) => row.name === column)) {
      return;
    }
    throw err;
  }
}
function healAllNullColumns(db) {
  const existingColumns = getSessionMetaColumns(db);
  const fallbacks = [
    ["cache_ttl", ""],
    ["last_nudge_band", ""],
    ["last_nudge_level", ""],
    ["channel2_nudge_claim_token", ""],
    ["last_transform_error", ""],
    ["nudge_anchor_message_id", ""],
    ["nudge_anchor_text", ""],
    ["sticky_turn_reminder_text", ""],
    ["sticky_turn_reminder_message_id", ""],
    ["note_nudge_trigger_message_id", ""],
    ["note_nudge_sticky_text", ""],
    ["note_nudge_sticky_message_id", ""],
    ["last_todo_state", ""],
    ["todo_synthetic_call_id", ""],
    ["todo_synthetic_anchor_message_id", ""],
    ["todo_synthetic_state_json", ""],
    ["system_prompt_hash", ""],
    ["stripped_placeholder_ids", ""],
    ["stale_reduce_stripped_ids", ""],
    ["processed_image_stripped_ids", ""],
    ["merged_reasoning_stripped_ids", ""],
    ["thinking_binding_recovery_target", ""],
    ["trailing_blank_decisions", ""],
    ["memory_block_cache", ""],
    ["memory_block_ids", ""],
    ["compaction_marker_state", ""],
    ["key_files", ""],
    ["times_execute_threshold_reached", 0],
    ["compartment_in_progress", 0],
    ["historian_failure_count", 0],
    ["cleared_reasoning_through_tag", 0],
    ["memory_block_count", 0],
    ["system_prompt_tokens", 0],
    ["conversation_tokens", 0],
    ["tool_call_tokens", 0],
    ["note_nudge_trigger_pending", 0],
    ["observed_safe_input_tokens", 0],
    ["cache_alert_sent", 0],
    ["new_work_tokens", 0],
    ["total_input_tokens", 0],
    ["last_emergency_input_sample", 0],
    ["channel2_nudge_claimed_at", 0],
    ["last_usage_context_limit", 0],
    ["prior_boundary_ordinal", 1],
    ["protected_tail_policy_version", 0],
    ["protected_tail_drain_window_started_at", 0],
    ["protected_tail_drain_tokens", 0],
    ["recovery_no_eligible_head_count", 0],
    ["force_emergency_bypass_window_start", 0],
    ["force_emergency_bypass_used", 0],
    ["emergency_drain_active", 0],
    ["historian_drain_failure_at", 0]
  ];
  const presentFallbacks = fallbacks.filter(([column]) => existingColumns.has(column));
  if (presentFallbacks.length > 0) {
    const assignments = presentFallbacks.map(([column]) => `${column} = COALESCE(${column}, ?)`).join(", ");
    const nullPredicate = presentFallbacks.map(([column]) => `${column} IS NULL`).join(" OR ");
    db.prepare(`UPDATE session_meta SET ${assignments} WHERE ${nullPredicate}`).run(...presentFallbacks.map(([, fallback]) => fallback));
  }
  healMissingMemoryBlockIds(db, existingColumns);
}
function getSessionMetaColumns(db) {
  const rows = db.prepare("PRAGMA table_info(session_meta)").all();
  return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function healMissingMemoryBlockIds(db, columns) {
  if (!columns.has("memory_block_cache") || !columns.has("memory_block_ids") || !columns.has("memory_block_count")) {
    return;
  }
  db.prepare("UPDATE session_meta SET memory_block_cache = '' WHERE memory_block_cache != '' AND (memory_block_ids IS NULL OR memory_block_ids = '') AND memory_block_count > 0").run();
}

// ../plugin/src/features/magic-context/memory/constants.ts
var V2_MEMORY_CATEGORIES = [
  "PROJECT_RULES",
  "ARCHITECTURE",
  "CONSTRAINTS",
  "CONFIG_VALUES",
  "NAMING"
];
var CATEGORY_PRIORITY = [
  "PROJECT_RULES",
  "ARCHITECTURE",
  "CONSTRAINTS",
  "CONFIG_VALUES",
  "NAMING",
  "USER_DIRECTIVES",
  "USER_PREFERENCES",
  "CONFIG_DEFAULTS",
  "ARCHITECTURE_DECISIONS",
  "ENVIRONMENT",
  "WORKFLOW_RULES",
  "KNOWN_ISSUES"
];
var MEMORY_CATEGORY_ORDER_UNKNOWN = 99;
var MEMORY_CATEGORY_ORDER_PRIORITY = CATEGORY_PRIORITY.reduce((acc, category, index) => {
  acc[category] = index;
  return acc;
}, {});
var MEMORY_CATEGORY_ORDER_SQL = `CASE category ${CATEGORY_PRIORITY.map((category, index) => `WHEN '${category}' THEN ${index}`).join(" ")} ELSE ${MEMORY_CATEGORY_ORDER_UNKNOWN} END`;
var CATEGORY_DEFAULT_TTL = {
  WORKFLOW_RULES: 90 * 24 * 60 * 60 * 1000,
  KNOWN_ISSUES: 30 * 24 * 60 * 60 * 1000
};

// ../plugin/src/features/magic-context/memory/project-identity.ts
var TRANSIENT_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;
var identityCache = new Map;
var linkedGitWorktreeCache = new Map;
var lastKnownGitIdentityCache = new Map;
var directoryFallbackCache = new Map;
var transientFailureCooldown = new Map;
var dubiousOwnershipFallbackDirectories = new Set;
var dubiousOwnershipLoggedDirectories = new Set;
var dubiousOwnershipWarnedDirectories = new Set;
var transientGitIdentityReuseLoggedDirectories = new Set;
var sessionIdentityCache = new Map;
// ../plugin/src/features/magic-context/workspaces.ts
var VALID_SHARE_CATEGORIES = new Set(V2_MEMORY_CATEGORIES);
function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function isInTransaction2(db) {
  const candidate = db;
  return candidate.inTransaction === true || candidate.isTransaction === true;
}
function bumpEpochRows(db, identities, now) {
  const stmt = db.prepare(`INSERT INTO project_state
            (project_path, project_memory_epoch, project_user_profile_version, updated_at)
         VALUES (?, 1, 0, ?)
         ON CONFLICT(project_path) DO UPDATE SET
            project_memory_epoch = project_memory_epoch + 1,
            updated_at = excluded.updated_at`);
  for (const identity of uniqueSorted(identities)) {
    stmt.run(identity, now);
  }
}
function bumpEpochsForWorkspaceMemberSet(db, identities, now = Date.now()) {
  const run = () => bumpEpochRows(db, identities, now);
  if (isInTransaction2(db)) {
    run();
    return;
  }
  const transactionStartedAt = performance.now();
  db.exec("BEGIN IMMEDIATE");
  try {
    run();
    db.exec("COMMIT");
    logSlowWriteTransaction("workspace_epoch_bump", transactionStartedAt);
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}

// ../plugin/src/features/magic-context/migrations.ts
var FORK_MIGRATION_VERSION_FLOOR = 1e4;
var MIGRATION_LOCK_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

class MigrationLockBusyError extends Error {
  constructor(message) {
    super(message);
    this.name = "MigrationLockBusyError";
  }
}
function isSqliteLockError(error) {
  if (!error || typeof error !== "object")
    return false;
  const candidate = error;
  if (candidate.code === "SQLITE_BUSY" || candidate.code === "SQLITE_LOCKED")
    return true;
  return typeof candidate.message === "string" && /database is locked|sqlite_(busy|locked)/i.test(candidate.message);
}
function tableExists(db, name) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
}
function tableHasHarnessColumn(db, name) {
  if (!tableExists(db, name))
    return false;
  return db.prepare(`PRAGMA table_info(${name})`).all().some((column) => column.name === "harness");
}
var V85_OPENCODE2_RELABEL_TABLES = [
  "tags",
  "pending_ops",
  "source_contents",
  "compartments",
  "compartment_chunk_embeddings",
  "session_projects",
  "compartment_events",
  "compression_depth",
  "session_facts",
  "primer_candidates",
  "notes",
  "message_history_index",
  "message_history_source",
  "pending_session_cleanup",
  "message_history_orphan_sweep",
  "session_meta",
  "subagent_invocations",
  "historian_runs",
  "transform_decisions",
  "recomp_compartments",
  "recomp_facts"
];
var V85_OPTIONAL_OPENCODE2_RELABEL_TABLES = ["session_project_backfill_state"];
function deleteLosingOpenCode2Twin(db, table, joinColumns, newerPredicate) {
  if (!tableHasHarnessColumn(db, table))
    return;
  const naturalJoin = joinColumns.map((column) => `oc.${column} = o2.${column}`).join(" AND ");
  const o2On = naturalJoin ? `${naturalJoin} AND oc.harness = 'opencode'` : `oc.harness = 'opencode'`;
  const ocOn = naturalJoin ? `${naturalJoin} AND o2.harness = 'opencode2'` : `o2.harness = 'opencode2'`;
  db.exec(`
        DELETE FROM ${table}
        WHERE rowid IN (
            SELECT o2.rowid
            FROM ${table} AS o2
            JOIN ${table} AS oc
              ON ${o2On}
            WHERE o2.harness = 'opencode2'
              AND NOT (${newerPredicate})
        );
        DELETE FROM ${table}
        WHERE rowid IN (
            SELECT oc.rowid
            FROM ${table} AS oc
            JOIN ${table} AS o2
              ON ${ocOn}
            WHERE oc.harness = 'opencode'
              AND (${newerPredicate})
        );
    `);
}
function relabelOpenCode2HarnessRows(db) {
  deleteLosingOpenCode2Twin(db, "session_projects", ["session_id"], "o2.updated_at > oc.updated_at");
  deleteLosingOpenCode2Twin(db, "primer_candidates", ["project_path", "session_id", "source_start_message_id", "source_end_message_id"], "o2.created_at > oc.created_at");
  deleteLosingOpenCode2Twin(db, "transform_decisions", ["session_id", "message_id"], "o2.ts_ms > oc.ts_ms");
  deleteLosingOpenCode2Twin(db, "message_history_orphan_sweep", [], "COALESCE(o2.last_swept_at, -1) > COALESCE(oc.last_swept_at, -1)");
  if (tableHasHarnessColumn(db, "session_project_backfill_state")) {
    db.exec(`
            DELETE FROM session_project_backfill_state
            WHERE harness = 'opencode2'
              AND EXISTS (
                  SELECT 1 FROM session_project_backfill_state WHERE harness = 'opencode'
              )
              AND NOT (
                  (status = 'completed'
                    AND (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode')
                        != 'completed')
                  OR (
                      status = (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode')
                      AND COALESCE(started_at, -1) > COALESCE(
                          (SELECT started_at FROM session_project_backfill_state WHERE harness = 'opencode'),
                          -1
                      )
                  )
              );
            DELETE FROM session_project_backfill_state
            WHERE harness = 'opencode'
              AND EXISTS (
                  SELECT 1 FROM session_project_backfill_state WHERE harness = 'opencode2'
              )
              AND (
                  ((SELECT status FROM session_project_backfill_state WHERE harness = 'opencode2') = 'completed'
                    AND status != 'completed')
                  OR (
                      status = (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode2')
                      AND COALESCE(
                          (SELECT started_at FROM session_project_backfill_state WHERE harness = 'opencode2'),
                          -1
                      ) > COALESCE(started_at, -1)
                  )
              );
        `);
  }
  const tables = new Set([
    ...V85_OPENCODE2_RELABEL_TABLES,
    ...V85_OPTIONAL_OPENCODE2_RELABEL_TABLES
  ]);
  for (const table of tables) {
    if (!tableHasHarnessColumn(db, table))
      continue;
    db.exec(`UPDATE ${table} SET harness = 'opencode' WHERE harness = 'opencode2'`);
  }
}
function healMismatchedTierClose(db, table, hasLegacy) {
  if (!tableExists(db, table))
    return;
  const columns = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
  for (const required of ["content", "p1", "p2", "p3", "p4"]) {
    if (!columns.has(required))
      return;
  }
  if (hasLegacy && !columns.has("legacy"))
    return;
  const predicate = hasLegacy ? "legacy = 1 AND p1 IS NULL AND content LIKE '%<p1%'" : "p1 IS NULL AND content LIKE '%<p1%'";
  const rows = db.prepare(`SELECT id, content FROM ${table} WHERE ${predicate}`).all();
  const update = db.prepare(`UPDATE ${table} SET p1 = ?, p2 = ?, p3 = ?, p4 = ?${hasLegacy ? ", legacy = 0" : ""} WHERE id = ?`);
  for (const row of rows) {
    const tiers = extractTiersFromInner(row.content);
    if (typeof tiers.p1 !== "string" || tiers.p1.length === 0)
      continue;
    const p1 = tiers.p1;
    const p2 = typeof tiers.p2 === "string" ? tiers.p2 : p1;
    const p3 = typeof tiers.p3 === "string" ? tiers.p3 : p2;
    const p4 = typeof tiers.p4 === "string" ? tiers.p4 : "";
    update.run(p1, p2, p3, p4, row.id);
  }
}
function assertForeignKeyIntegrity(db, table) {
  const rows = (table ? db.prepare(`PRAGMA foreign_key_check(${table})`) : db.prepare("PRAGMA foreign_key_check")).all();
  if (rows.length > 0) {
    throw new Error(`foreign_key_check failed after embedding table rebuild${table ? ` (${table})` : ""} (${rows.length} violation(s))`);
  }
}
function authorityPrivilegeCheck() {
  return "COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0";
}
function managedAuthorityNoteRow(row) {
  return `(
        EXISTS (SELECT 1 FROM authority_managed WHERE project_path = ${row}.project_path)
        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = ${row}.project_path)
        OR EXISTS (
            SELECT 1 FROM session_projects sp
            JOIN authority_managed am ON am.project_path = sp.project_path
            WHERE sp.session_id = ${row}.session_id
        )
        OR EXISTS (
            SELECT 1 FROM session_projects sp
            JOIN authority_repair_pending arp ON arp.project_path = sp.project_path
            WHERE sp.session_id = ${row}.session_id
        )
    )`;
}
function installLatestAuthorityTriggers(db) {
  const privilegeCheck = authorityPrivilegeCheck();
  if (tableExists(db, "memories")) {
    db.exec(`
            DROP TRIGGER IF EXISTS memories_authority_guard_insert;
            DROP TRIGGER IF EXISTS memories_authority_guard_update;
            DROP TRIGGER IF EXISTS memories_authority_guard_delete;
            CREATE TRIGGER memories_authority_guard_insert
            BEFORE INSERT ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
            CREATE TRIGGER memories_authority_guard_update
            BEFORE UPDATE ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
            CREATE TRIGGER memories_authority_guard_delete
            BEFORE DELETE ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
        `);
  }
  if (tableExists(db, "notes")) {
    const managedOld = managedAuthorityNoteRow("OLD");
    const managedNew = managedAuthorityNoteRow("NEW");
    db.exec(`
            DROP TRIGGER IF EXISTS notes_authority_guard_insert;
            DROP TRIGGER IF EXISTS notes_authority_guard_update;
            DROP TRIGGER IF EXISTS notes_authority_guard_delete;
            CREATE TRIGGER notes_authority_guard_insert
            BEFORE INSERT ON notes
            WHEN ${managedNew} AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
            CREATE TRIGGER notes_authority_guard_update
            BEFORE UPDATE ON notes
            WHEN (${managedOld} OR ${managedNew}) AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
            CREATE TRIGGER notes_authority_guard_delete
            BEFORE DELETE ON notes
            WHEN ${managedOld} AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
        `);
  }
}
var MIGRATIONS = [
  {
    version: 1,
    description: "Merge session_notes + smart_notes into unified notes table",
    up: (db) => {
      db.exec(`
				CREATE TABLE IF NOT EXISTS notes (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					type TEXT NOT NULL DEFAULT 'session',
					status TEXT NOT NULL DEFAULT 'active',
					content TEXT NOT NULL,
					session_id TEXT,
					project_path TEXT,
					surface_condition TEXT,
					created_at INTEGER NOT NULL,
					updated_at INTEGER NOT NULL,
					last_checked_at INTEGER,
					ready_at INTEGER,
					ready_reason TEXT,
					compiled_provider TEXT,
					compiled_config TEXT,
					compiled_at INTEGER,
					compile_status TEXT CHECK(compile_status IN ('compiled', 'plain', 'refused'))
				);
				CREATE INDEX IF NOT EXISTS idx_notes_session_status ON notes(session_id, status);
				CREATE INDEX IF NOT EXISTS idx_notes_project_status ON notes(project_path, status);
				CREATE INDEX IF NOT EXISTS idx_notes_type_status ON notes(type, status);
			`);
      const hasSessionNotes = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session_notes'").get();
      if (hasSessionNotes) {
        db.exec(`
					INSERT INTO notes (type, status, content, session_id, created_at, updated_at)
					SELECT 'session', 'active', content, session_id, created_at, created_at
					FROM session_notes
				`);
      }
      const hasSmartNotes = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='smart_notes'").get();
      if (hasSmartNotes) {
        db.exec(`
					INSERT INTO notes (type, status, content, session_id, project_path, surface_condition,
						created_at, updated_at, last_checked_at, ready_at, ready_reason)
					SELECT 'smart', status, content, created_session_id, project_path, surface_condition,
						created_at, updated_at, last_checked_at, ready_at, ready_reason
					FROM smart_notes
				`);
      }
      if (hasSessionNotes) {
        const sourceCount = db.prepare("SELECT COUNT(*) as c FROM session_notes").get().c;
        const migratedCount = db.prepare("SELECT COUNT(*) as c FROM notes WHERE type = 'session'").get().c;
        if (migratedCount >= sourceCount) {
          db.exec("DROP TABLE session_notes");
        } else {
          throw new Error(`session_notes migration verification failed: expected ${sourceCount} rows, got ${migratedCount}`);
        }
      }
      if (hasSmartNotes) {
        const sourceCount = db.prepare("SELECT COUNT(*) as c FROM smart_notes").get().c;
        const migratedCount = db.prepare("SELECT COUNT(*) as c FROM notes WHERE type = 'smart'").get().c;
        if (migratedCount >= sourceCount) {
          db.exec("DROP TABLE smart_notes");
        } else {
          throw new Error(`smart_notes migration verification failed: expected ${sourceCount} rows, got ${migratedCount}`);
        }
      }
    }
  },
  {
    version: 2,
    description: "Add plugin_messages table for TUI ↔ server communication",
    up: (db) => {
      db.exec(`
				CREATE TABLE IF NOT EXISTS plugin_messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					direction TEXT NOT NULL,
					type TEXT NOT NULL,
					payload TEXT NOT NULL DEFAULT '{}',
					session_id TEXT,
					created_at INTEGER NOT NULL,
					consumed_at INTEGER
				);
				CREATE INDEX IF NOT EXISTS idx_plugin_messages_direction_consumed
					ON plugin_messages(direction, consumed_at);
				CREATE INDEX IF NOT EXISTS idx_plugin_messages_created
					ON plugin_messages(created_at);
			`);
    }
  },
  {
    version: 3,
    description: "Add user_memory_candidates and user_memories tables",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS user_memory_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    source_compartment_start INTEGER,
                    source_compartment_end INTEGER,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_umc_created ON user_memory_candidates(created_at);

                CREATE TABLE IF NOT EXISTS user_memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active',
                    promoted_at INTEGER NOT NULL,
                    source_candidate_ids TEXT DEFAULT '[]',
                    source_candidate_provenance TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_um_status ON user_memories(status);
            `);
    }
  },
  {
    version: 4,
    description: "Add git_commits + git_commit_embeddings + git_commits_fts tables",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS git_commits (
                    sha TEXT PRIMARY KEY,
                    project_path TEXT NOT NULL,
                    short_sha TEXT NOT NULL,
                    message TEXT NOT NULL,
                    author TEXT,
                    committed_at INTEGER NOT NULL,
                    indexed_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_git_commits_project_time
                    ON git_commits(project_path, committed_at DESC);

                CREATE TABLE IF NOT EXISTS git_commit_embeddings (
                    sha TEXT PRIMARY KEY,
                    embedding BLOB NOT NULL,
                    model_id TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    -- FK-cascade audit (v12): git_commit_embeddings.sha -> git_commits.sha
                    -- uses ON DELETE CASCADE, so SQLite PRAGMA foreign_keys must be ON on
                    -- every connection and v12 cleans historical orphan rows.
                    FOREIGN KEY(sha) REFERENCES git_commits(sha) ON DELETE CASCADE
                );

                CREATE VIRTUAL TABLE IF NOT EXISTS git_commits_fts USING fts5(
                    sha UNINDEXED,
                    project_path UNINDEXED,
                    message,
                    tokenize = 'porter unicode61'
                );

                -- Mirror writes into FTS. We intentionally rebuild FTS rows on
                -- every INSERT OR REPLACE so amended commits or re-indexed
                -- messages update cleanly.
                CREATE TRIGGER IF NOT EXISTS git_commits_fts_insert
                AFTER INSERT ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = NEW.sha;
                    INSERT INTO git_commits_fts(sha, project_path, message)
                    VALUES (NEW.sha, NEW.project_path, NEW.message);
                END;

                CREATE TRIGGER IF NOT EXISTS git_commits_fts_delete
                AFTER DELETE ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = OLD.sha;
                END;

                CREATE TRIGGER IF NOT EXISTS git_commits_fts_update
                AFTER UPDATE OF message, project_path ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = OLD.sha;
                    INSERT INTO git_commits_fts(sha, project_path, message)
                    VALUES (NEW.sha, NEW.project_path, NEW.message);
                END;
            `);
    }
  },
  {
    version: 5,
    description: "One-shot heal of NULL session_meta columns",
    up: (db) => {
      healAllNullColumns(db);
    }
  },
  {
    version: 6,
    description: "Heal session_meta.counter drift below MAX(tag_number)",
    up: (db) => {
      db.prepare(`UPDATE session_meta
                 SET counter = (
                     SELECT MAX(tag_number)
                     FROM tags
                     WHERE tags.session_id = session_meta.session_id
                 )
                 WHERE EXISTS (
                     SELECT 1
                     FROM tags
                     WHERE tags.session_id = session_meta.session_id
                       AND tags.tag_number > session_meta.counter
                 )`).run();
    }
  },
  {
    version: 7,
    description: "Add harness column to notes table for cross-harness sharing",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(notes)").all();
      if (!cols.some((c) => c.name === "harness")) {
        db.exec("ALTER TABLE notes ADD COLUMN harness TEXT NOT NULL DEFAULT 'opencode'");
      }
    }
  },
  {
    version: 8,
    description: "Add partial indexes on tags(session_id, tag_number) for active and dropped",
    up: (db) => {
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_tags_active_session_tag_number
                ON tags(session_id, tag_number)
                WHERE status = 'active';

                CREATE INDEX IF NOT EXISTS idx_tags_dropped_session_tag_number
                ON tags(session_id, tag_number)
                WHERE status = 'dropped';
            `);
      db.exec("ANALYZE tags;");
    }
  },
  {
    version: 9,
    description: "Persist tool_definition_measurements across plugin restarts",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS tool_definition_measurements (
                    provider_id TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    tool_id TEXT NOT NULL,
                    token_count INTEGER NOT NULL,
                    recorded_at INTEGER NOT NULL,
                    PRIMARY KEY (provider_id, model_id, agent_name, tool_id)
                );
            `);
    }
  },
  {
    version: 10,
    description: "Add tool_owner_message_id column to tags + composite identity indexes",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(tags)").all();
      if (!cols.some((c) => c.name === "tool_owner_message_id")) {
        db.exec("ALTER TABLE tags ADD COLUMN tool_owner_message_id TEXT DEFAULT NULL");
      }
      db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_tool_composite
                ON tags(session_id, message_id, tool_owner_message_id)
                WHERE type = 'tool' AND tool_owner_message_id IS NOT NULL;

                CREATE INDEX IF NOT EXISTS idx_tags_tool_null_owner
                ON tags(session_id, message_id)
                WHERE type = 'tool' AND tool_owner_message_id IS NULL;
            `);
    }
  },
  {
    version: 11,
    description: "Add todo state synthesis columns to session_meta",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "last_todo_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN last_todo_state TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_call_id")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_call_id TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_anchor_message_id")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_anchor_message_id TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_state_json")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_state_json TEXT DEFAULT ''");
      }
    }
  },
  {
    version: 12,
    description: "Clean orphan rows from FK-cascade embedding tables",
    up: (db) => {
      const hasTable = (name) => Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
      const memoryEmbeddings = hasTable("memory_embeddings") ? db.prepare(`DELETE FROM memory_embeddings
                           WHERE memory_id NOT IN (SELECT id FROM memories)`).run().changes : 0;
      log(`[migrations] v12 cleaned ${memoryEmbeddings} orphan memory_embeddings row(s)`);
      const gitCommitEmbeddings = hasTable("git_commit_embeddings") ? db.prepare(`DELETE FROM git_commit_embeddings
                           WHERE sha NOT IN (SELECT sha FROM git_commits)`).run().changes : 0;
      log(`[migrations] v12 cleaned ${gitCommitEmbeddings} orphan git_commit_embeddings row(s)`);
    }
  },
  {
    version: 13,
    description: "Add pending_compaction_marker_state column for deferred marker drain",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "pending_compaction_marker_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pending_compaction_marker_state TEXT");
      }
    }
  },
  {
    version: 14,
    description: "Add project-scoped key files and version counter",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS project_key_files (
                    project_path           TEXT    NOT NULL,
                    path                   TEXT    NOT NULL,
                    content                TEXT    NOT NULL,
                    content_hash           TEXT    NOT NULL,
                    local_token_estimate   INTEGER NOT NULL,
                    generated_at           INTEGER NOT NULL,
                    generated_by_model     TEXT,
                    generation_config_hash TEXT    NOT NULL,
                    stale_reason           TEXT,
                    PRIMARY KEY (project_path, path)
                );

                CREATE INDEX IF NOT EXISTS idx_project_key_files_project
                    ON project_key_files(project_path);
                CREATE INDEX IF NOT EXISTS idx_project_key_files_generated_at
                    ON project_key_files(project_path, generated_at);

                CREATE TABLE IF NOT EXISTS project_key_files_version (
                    project_path TEXT    PRIMARY KEY,
                    version      INTEGER NOT NULL DEFAULT 0
                );
            `);
    }
  },
  {
    version: 15,
    description: "Add the now-retired deferred_execute_state column",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "deferred_execute_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN deferred_execute_state TEXT");
      }
    }
  },
  {
    version: 16,
    description: "Add context-limit cache regression sentinels",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "observed_safe_input_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN observed_safe_input_tokens INTEGER NOT NULL DEFAULT 0");
      }
      if (!cols.some((c) => c.name === "cache_alert_sent")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN cache_alert_sent INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 17,
    description: "Multi-anchor JSON storage for note-nudge and auto-search-hint persistence",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "note_nudge_anchors")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN note_nudge_anchors TEXT NOT NULL DEFAULT '[]'");
      }
      if (!cols.some((c) => c.name === "auto_search_hint_decisions")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN auto_search_hint_decisions TEXT NOT NULL DEFAULT '[]'");
      }
      db.exec(`
                UPDATE session_meta
                SET note_nudge_anchors = json_array(
                    json_object(
                        'messageId', note_nudge_sticky_message_id,
                        'text', note_nudge_sticky_text
                    )
                )
                WHERE COALESCE(note_nudge_sticky_text, '') != ''
                  AND COALESCE(note_nudge_sticky_message_id, '') != ''
                  AND (note_nudge_anchors IS NULL OR note_nudge_anchors = '[]')
            `);
      db.exec(`
                UPDATE session_meta SET note_nudge_anchors = '[]'
                WHERE note_nudge_anchors IS NULL
            `);
      db.exec(`
                UPDATE session_meta SET auto_search_hint_decisions = '[]'
                WHERE auto_search_hint_decisions IS NULL
            `);
    }
  },
  {
    version: 18,
    description: "Add pending_pi_compaction_marker_state column for Pi deferred marker drain",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "pending_pi_compaction_marker_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pending_pi_compaction_marker_state TEXT");
      }
    }
  },
  {
    version: 19,
    description: "Add compartment state lease table",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_state_lease (
                    session_id TEXT PRIMARY KEY NOT NULL,
                    holder_id TEXT NOT NULL,
                    acquired_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_compartment_state_lease_expires
                    ON compartment_state_lease(expires_at);
            `);
    }
  },
  {
    version: 20,
    description: "Add subagent invocation token accounting",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS subagent_invocations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL,
                    subagent TEXT NOT NULL,
                    task TEXT,
                    provider_id TEXT,
                    model_id TEXT,
                    started_at INTEGER NOT NULL,
                    ended_at INTEGER,
                    status TEXT NOT NULL,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
                    error TEXT,
                    parent_invocation_id INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_sai_session_started
                    ON subagent_invocations(session_id, started_at DESC);
                CREATE INDEX IF NOT EXISTS idx_sai_subagent
                    ON subagent_invocations(subagent, started_at DESC);
            `);
    }
  },
  {
    version: 21,
    description: "Add session lifetime work metrics",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "new_work_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN new_work_tokens INTEGER NOT NULL DEFAULT 0");
      }
      if (!cols.some((c) => c.name === "total_input_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN total_input_tokens INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 22,
    description: "v2.0 cache architecture schema foundation",
    up: (db) => {
      const hasSessionMetaTable = tableExists(db, "session_meta");
      const hasCompartmentsTable = tableExists(db, "compartments");
      const hasMemoriesTable = tableExists(db, "memories");
      if (hasSessionMetaTable) {
        ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
        ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
        ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
        ensureColumn(db, "session_meta", "upgrade_reminded_at", "INTEGER");
      }
      if (hasCompartmentsTable) {
        ensureColumn(db, "compartments", "p1", "TEXT");
        ensureColumn(db, "compartments", "p2", "TEXT");
        ensureColumn(db, "compartments", "p3", "TEXT");
        ensureColumn(db, "compartments", "p4", "TEXT");
        ensureColumn(db, "compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
        ensureColumn(db, "compartments", "episode_type", "TEXT");
        ensureColumn(db, "compartments", "p1_embedding", "BLOB");
        ensureColumn(db, "compartments", "p1_embedding_model_id", "TEXT");
        ensureColumn(db, "compartments", "legacy", "INTEGER NOT NULL DEFAULT 0");
      }
      const hasRecompCompartmentsTable = tableExists(db, "recomp_compartments");
      if (hasRecompCompartmentsTable) {
        ensureColumn(db, "recomp_compartments", "p1", "TEXT");
        ensureColumn(db, "recomp_compartments", "p2", "TEXT");
        ensureColumn(db, "recomp_compartments", "p3", "TEXT");
        ensureColumn(db, "recomp_compartments", "p4", "TEXT");
        ensureColumn(db, "recomp_compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
        ensureColumn(db, "recomp_compartments", "episode_type", "TEXT");
      }
      if (hasMemoriesTable) {
        ensureColumn(db, "memories", "importance", "INTEGER");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS schema_migrations_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS project_state (
                    project_path TEXT PRIMARY KEY,
                    project_memory_epoch INTEGER NOT NULL DEFAULT 0,
                    project_user_profile_version INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS m0_mutation_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    mutation_type TEXT NOT NULL CHECK (mutation_type IN (
                        'compartment_delete',
                        'compartment_merge',
                        'recomp_boundary_change',
                        'compartment_upgrade'
                    )),
                    target_id INTEGER,
                    queued_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session
                    ON m0_mutation_log(session_id);

                CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
                    old_project_path TEXT PRIMARY KEY,
                    new_project_path TEXT NOT NULL,
                    rekeyed_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS v22_backfill_failures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    row_id INTEGER NOT NULL,
                    raw_project_path TEXT NOT NULL,
                    error_class TEXT NOT NULL CHECK (error_class IN (
                        'not_git_repo',
                        'git_missing',
                        'git_timeout',
                        'permission_denied',
                        'unknown'
                    )),
                    error_message TEXT,
                    failed_at INTEGER NOT NULL,
                    UNIQUE(table_name, row_id)
                );
            `);
      if (hasCompartmentsTable) {
        db.exec(`
                    INSERT OR IGNORE INTO schema_migrations_meta (key, value)
                    SELECT 'v22_legacy_compartment_boundary', CAST(COALESCE(MAX(id), 0) AS TEXT)
                    FROM compartments
                `);
        const boundaryRow = db.prepare("SELECT value FROM schema_migrations_meta WHERE key = 'v22_legacy_compartment_boundary'").get();
        const compartmentBoundary = Number.parseInt(boundaryRow?.value ?? "0", 10);
        db.prepare("UPDATE compartments SET legacy = 1 WHERE legacy = 0 AND id <= ?").run(Number.isFinite(compartmentBoundary) ? compartmentBoundary : 0);
      } else {
        db.prepare("INSERT OR IGNORE INTO schema_migrations_meta (key, value) VALUES ('v22_legacy_compartment_boundary', '0')").run();
      }
      db.prepare("INSERT OR IGNORE INTO schema_migrations_meta (key, value) VALUES ('v22_legacy_memory_backfill', 'pending')").run();
    }
  },
  {
    version: 23,
    description: "v2 compartment events storage (causal_incident / trajectory_correction)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    compartment_id INTEGER,
                    kind TEXT NOT NULL,
                    at_compartment INTEGER,
                    fields_json TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode'
                );
                CREATE INDEX IF NOT EXISTS idx_compartment_events_session
                    ON compartment_events(session_id);
            `);
    }
  },
  {
    version: 24,
    description: "historian_runs metrics (per-run quality/cost telemetry)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS historian_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    subagent_invocation_id INTEGER,
                    run_kind TEXT NOT NULL,
                    status TEXT NOT NULL,
                    failure_reason TEXT,
                    chunk_start_ordinal INTEGER,
                    chunk_end_ordinal INTEGER,
                    unprocessed_from INTEGER,
                    compartments_produced INTEGER NOT NULL DEFAULT 0,
                    compartment_id_min INTEGER,
                    compartment_id_max INTEGER,
                    facts_emitted INTEGER NOT NULL DEFAULT 0,
                    facts_by_category_json TEXT,
                    events_emitted INTEGER NOT NULL DEFAULT 0,
                    importance_min INTEGER,
                    importance_max INTEGER,
                    importance_avg REAL,
                    discarded_last INTEGER NOT NULL DEFAULT 0,
                    legacy INTEGER NOT NULL DEFAULT 0,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_historian_runs_session
                    ON historian_runs(session_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_historian_runs_status
                    ON historian_runs(status, created_at DESC);
            `);
    }
  },
  {
    version: 25,
    description: "pi_stable_id_scheme session_meta column (Pi message-id cutover gate)",
    up: (db) => {
      const rows = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!rows.some((row) => row.name === "pi_stable_id_scheme")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pi_stable_id_scheme INTEGER");
      }
    }
  },
  {
    version: 26,
    description: "memory mutation log and atomic m[1] cache columns",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS memory_mutation_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    mutation_type TEXT NOT NULL CHECK (mutation_type IN (
                        'archive',
                        'delete',
                        'update',
                        'superseded'
                    )),
                    target_memory_id INTEGER NOT NULL,
                    superseded_by_id INTEGER,
                    category TEXT,
                    new_content TEXT,
                    queued_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
                    ON memory_mutation_log(project_path, id);
            `);
      ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
      ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_memory_mutation_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
      ensureColumn(db, "session_meta", "cached_m1_bytes", "BLOB");
      ensureColumn(db, "session_meta", "last_observed_model_key", "TEXT");
      ensureColumn(db, "session_meta", "memory_block_cache", "TEXT DEFAULT ''");
      ensureColumn(db, "session_meta", "memory_block_count", "INTEGER DEFAULT 0");
      ensureColumn(db, "session_meta", "memory_block_ids", "TEXT DEFAULT ''");
      db.prepare(`UPDATE session_meta SET
                    cached_m0_bytes = NULL,
                    cached_m1_bytes = NULL,
                    cached_m0_project_memory_epoch = NULL,
                    cached_m0_project_user_profile_version = NULL,
                    cached_m0_max_compartment_seq = NULL,
                    cached_m0_max_memory_id = NULL,
                    cached_m0_max_mutation_id = NULL,
                    cached_m0_max_memory_mutation_id = NULL,
                    cached_m0_project_docs_hash = NULL,
                    cached_m0_materialized_at = NULL,
                    cached_m0_session_facts_version = NULL,
                    cached_m0_upgrade_state = NULL,
                    memory_block_cache = '',
                    memory_block_count = 0,
                    memory_block_ids = ''`).run();
    }
  },
  {
    version: 27,
    description: "tags.entry_fingerprint for Pi fallback-tag adoption",
    up: (db) => {
      const hasTags = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='tags' LIMIT 1").get();
      if (!hasTags)
        return;
      ensureColumn(db, "tags", "entry_fingerprint", "TEXT");
      db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_adopt
                    ON tags(session_id, entry_fingerprint)
                    WHERE type='message' AND entry_fingerprint IS NOT NULL`);
    }
  },
  {
    version: 28,
    description: "Add git commit sweep coordinator lease/cooldown table",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS git_sweep_coordinator (
                    project_path TEXT PRIMARY KEY,
                    lease_holder TEXT,
                    lease_expires_at INTEGER,
                    last_swept_at INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_lease_expires
                    ON git_sweep_coordinator(lease_expires_at);
                CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_last_swept
                    ON git_sweep_coordinator(last_swept_at);
            `);
    }
  },
  {
    version: 29,
    description: "Add anchor_ordinal to notes (traceback to the conversation tail)",
    up: (db) => {
      const notesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes'").get();
      if (!notesExists) {
        return;
      }
      const columns = db.prepare("PRAGMA table_info(notes)").all();
      if (!columns.some((column) => column.name === "anchor_ordinal")) {
        db.exec("ALTER TABLE notes ADD COLUMN anchor_ordinal INTEGER");
      }
    }
  },
  {
    version: 30,
    description: "HARD-bust m[0] markers: cached system/tool-set/model identity",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "cached_m0_system_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_tool_set_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_model_key", "TEXT");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      if (columns.has("cached_m0_bytes")) {
        db.prepare(`UPDATE session_meta SET
                        cached_m0_bytes = NULL,
                        cached_m1_bytes = NULL,
                        cached_m0_materialized_at = NULL,
                        cached_m0_system_hash = NULL,
                        cached_m0_tool_set_hash = NULL,
                        cached_m0_model_key = NULL`).run();
      }
    }
  },
  {
    version: 31,
    description: "Nudge redesign: Channel 1 cadence (last_nudge_undropped) + Channel 2 ceiling lease " + "(channel2_nudge_state); zero legacy ctx_reduce-nudge sticky/anchor state (startup heal)",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "last_nudge_undropped", "INTEGER DEFAULT 0");
      ensureColumn(db, "session_meta", "channel2_nudge_state", "TEXT DEFAULT ''");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      if (columns.has("sticky_turn_reminder_text")) {
        db.prepare(`UPDATE session_meta SET
                        sticky_turn_reminder_text = '',
                        sticky_turn_reminder_message_id = '',
                        nudge_anchor_message_id = '',
                        nudge_anchor_text = ''`).run();
      }
    }
  },
  {
    version: 32,
    description: "Protected tail boundary state, usage resolver fields, recovery escape, and drain quota",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "prior_boundary_ordinal", "INTEGER NOT NULL DEFAULT 1");
      ensureColumn(db, "session_meta", "protected_tail_policy_version", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "protected_tail_drain_window_started_at", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "protected_tail_drain_tokens", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "recovery_no_eligible_head_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "force_emergency_bypass_window_start", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "force_emergency_bypass_used", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "last_usage_context_limit", "INTEGER NOT NULL DEFAULT 0");
      db.prepare("UPDATE session_meta SET prior_boundary_ordinal = 1 WHERE prior_boundary_ordinal IS NULL OR prior_boundary_ordinal < 1").run();
      db.prepare("UPDATE session_meta SET protected_tail_policy_version = 0 WHERE protected_tail_policy_version IS NULL").run();
      db.prepare("UPDATE session_meta SET protected_tail_drain_window_started_at = 0 WHERE protected_tail_drain_window_started_at IS NULL").run();
      db.prepare("UPDATE session_meta SET protected_tail_drain_tokens = 0 WHERE protected_tail_drain_tokens IS NULL").run();
      db.prepare("UPDATE session_meta SET recovery_no_eligible_head_count = 0 WHERE recovery_no_eligible_head_count IS NULL").run();
      db.prepare("UPDATE session_meta SET force_emergency_bypass_window_start = 0 WHERE force_emergency_bypass_window_start IS NULL").run();
      db.prepare("UPDATE session_meta SET force_emergency_bypass_used = 0 WHERE force_emergency_bypass_used IS NULL").run();
      db.prepare("UPDATE session_meta SET last_usage_context_limit = 0 WHERE last_usage_context_limit IS NULL").run();
    }
  },
  {
    version: 33,
    description: "Compartment chunk embeddings for semantic message-history search",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_chunk_embeddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    window_index INTEGER NOT NULL DEFAULT 0,
                    start_ordinal INTEGER NOT NULL,
                    end_ordinal INTEGER NOT NULL,
                    chunk_hash TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    dims INTEGER NOT NULL,
                    vector BLOB NOT NULL,
                    created_at INTEGER NOT NULL,
                    UNIQUE(compartment_id, window_index)
                );
                CREATE INDEX IF NOT EXISTS idx_cce_session
                    ON compartment_chunk_embeddings(session_id);
                CREATE INDEX IF NOT EXISTS idx_cce_project_model
                    ON compartment_chunk_embeddings(project_path, model_id);
            `);
    }
  },
  {
    version: 34,
    description: "workspace tables and m[0] workspace fingerprint cache reset",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS workspaces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workspace_members (
                    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                    project_path TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    display_path TEXT NOT NULL,
                    added_at INTEGER NOT NULL,
                    PRIMARY KEY (workspace_id, project_path)
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique
                    ON workspace_members(project_path);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name
                    ON workspace_members(workspace_id, display_name);
            `);
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "cached_m0_workspace_fingerprint", "TEXT");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      const clears = [
        ["cached_m0_bytes", null],
        ["cached_m1_bytes", null],
        ["cached_m0_project_memory_epoch", null],
        ["cached_m0_workspace_fingerprint", null],
        ["cached_m0_project_user_profile_version", null],
        ["cached_m0_max_compartment_seq", null],
        ["cached_m0_max_memory_id", null],
        ["cached_m0_max_mutation_id", null],
        ["cached_m0_max_memory_mutation_id", null],
        ["cached_m0_project_docs_hash", null],
        ["cached_m0_materialized_at", null],
        ["cached_m0_session_facts_version", null],
        ["cached_m0_upgrade_state", null],
        ["cached_m0_system_hash", null],
        ["cached_m0_tool_set_hash", null],
        ["cached_m0_model_key", null],
        ["cached_m0_last_baseline_end_message_id", null],
        ["memory_block_cache", ""],
        ["memory_block_ids", ""],
        ["memory_block_count", 0]
      ];
      const setClauses = [];
      const values = [];
      for (const [column, value] of clears) {
        if (!columns.has(column))
          continue;
        setClauses.push(`${column} = ?`);
        values.push(value);
      }
      if (setClauses.length > 0) {
        db.prepare(`UPDATE session_meta SET ${setClauses.join(", ")}`).run(...values);
      }
    }
  },
  {
    version: 35,
    description: "workspace per-category share defaults and epoch refresh",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS workspaces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
                );
            `);
      ensureColumn(db, "workspaces", "share_categories", `TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'`);
      db.prepare(`UPDATE workspaces
                    SET share_categories = '["CONSTRAINTS"]'
                  WHERE share_categories IS NULL OR share_categories = ''`).run();
      if (!tableExists(db, "workspace_members"))
        return;
      const rows = db.prepare(`SELECT DISTINCT project_path AS identity
                       FROM workspace_members
                      WHERE project_path IS NOT NULL AND project_path <> ''
                      ORDER BY project_path ASC`).all();
      const identities = rows.map((row) => typeof row.identity === "string" ? row.identity : "").filter((identity) => identity.length > 0);
      if (identities.length > 0) {
        bumpEpochsForWorkspaceMemberSet(db, identities, Date.now());
      }
    }
  },
  {
    version: 36,
    description: "session project ownership map for compartment chunk backfill scoping",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS session_projects (
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    project_path TEXT NOT NULL,
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY(session_id, harness)
                );
                CREATE INDEX IF NOT EXISTS idx_session_projects_project
                    ON session_projects(project_path);
            `);
      const hasChunkTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='compartment_chunk_embeddings'").get();
      if (hasChunkTable) {
        db.exec(`
                    INSERT OR IGNORE INTO session_projects (session_id, harness, project_path, updated_at)
                    SELECT session_id, harness, MIN(project_path), 0
                    FROM compartment_chunk_embeddings
                    GROUP BY session_id, harness
                    HAVING COUNT(DISTINCT project_path) = 1;
                `);
      }
    }
  },
  {
    version: 37,
    description: "emergency drain catch-up latch + historian drain failure backoff",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta'").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "emergency_drain_active", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "historian_drain_failure_at", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 38,
    description: "durable transform decisions for cache-event cause attribution",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS transform_decisions (
                    session_id         TEXT    NOT NULL,
                    harness            TEXT    NOT NULL DEFAULT 'opencode',
                    message_id         TEXT    NOT NULL,
                    ts_ms              INTEGER NOT NULL,
                    decision           TEXT    NOT NULL,
                    materialized       INTEGER NOT NULL DEFAULT 0,
                    materialize_reason TEXT,
                    emergency          INTEGER NOT NULL DEFAULT 0,
                    dropped_tokens     INTEGER NOT NULL DEFAULT 0,
                    dropped_count      INTEGER NOT NULL DEFAULT 0,
                    input_tokens       INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (session_id, harness, message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
                    ON transform_decisions(session_id, harness);
            `);
    }
  },
  {
    version: 39,
    description: "persist compaction marker target end message id",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta'").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "compaction_marker_state", "TEXT DEFAULT ''");
      ensureColumn(db, "session_meta", "compaction_marker_target_end_message_id", "TEXT");
      db.exec(`
                UPDATE session_meta
                SET compaction_marker_target_end_message_id = json_extract(compaction_marker_state, '$.targetEndMessageId')
                WHERE compaction_marker_target_end_message_id IS NULL
                  AND COALESCE(compaction_marker_state, '') != ''
                  AND json_valid(compaction_marker_state)
                  AND typeof(json_extract(compaction_marker_state, '$.targetEndMessageId')) = 'text'
            `);
    }
  },
  {
    version: 40,
    description: "index Pi fallback tool owners for stable-id cutover",
    up: (db) => {
      if (!tableExists(db, "tags"))
        return;
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_tags_pi_fallback_tool_owner
                ON tags(session_id, tool_owner_message_id)
                WHERE type='tool';
            `);
    }
  },
  {
    version: 41,
    description: "key detected context limits by model",
    up: (db) => {
      if (!tableExists(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "detected_context_limit_model_key", "TEXT");
    }
  },
  {
    version: 42,
    description: "per-task dreamer scheduling state (Dreamer v2 A+B)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS task_schedule_state (
                    project_path  TEXT    NOT NULL,
                    task          TEXT    NOT NULL,
                    last_run_at   INTEGER,
                    next_due_at   INTEGER,
                    schedule      TEXT,
                    last_status   TEXT,
                    last_error    TEXT,
                    retry_count   INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (project_path, task)
                );
                CREATE INDEX IF NOT EXISTS idx_task_schedule_due
                    ON task_schedule_state(next_due_at);
            `);
    }
  },
  {
    version: 43,
    description: "memory verification side table and verify watermarks",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS memory_verifications (
                    memory_id    INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
                    file_path    TEXT NOT NULL,
                    verified_at  INTEGER NOT NULL,
                    PRIMARY KEY (memory_id, file_path)
                );
                CREATE INDEX IF NOT EXISTS idx_memory_verifications_memory
                    ON memory_verifications(memory_id);
            `);
      if (tableExists(db, "task_schedule_state")) {
        ensureColumn(db, "task_schedule_state", "last_checked_commit", "TEXT");
        ensureColumn(db, "task_schedule_state", "last_broad_run_at", "INTEGER");
      }
    }
  },
  {
    version: 44,
    description: "memory classification scope and shareability columns",
    up: (db) => {
      if (!tableExists(db, "memories"))
        return;
      ensureColumn(db, "memories", "scope", "TEXT NOT NULL DEFAULT 'project'");
      ensureColumn(db, "memories", "shareable", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 45,
    description: "retrospective content watermark and processed-window idempotence",
    up: (db) => {
      if (tableExists(db, "task_schedule_state")) {
        ensureColumn(db, "task_schedule_state", "retrospective_watermark_ms", "INTEGER");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS retrospective_processed_windows (
                    project_path TEXT NOT NULL,
                    window_key   TEXT NOT NULL,
                    processed_at INTEGER NOT NULL,
                    PRIMARY KEY (project_path, window_key)
                );
            `);
    }
  },
  {
    version: 46,
    description: "Primers v1 candidate and promoted primer storage",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS primer_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    session_id TEXT NOT NULL,
                    question TEXT NOT NULL,
                    normalized_question TEXT NOT NULL,
                    source_compartment_start INTEGER,
                    source_compartment_end INTEGER,
                    source_start_message_id TEXT NOT NULL DEFAULT '',
                    source_end_message_id TEXT NOT NULL DEFAULT '',
                    source_message_time INTEGER NOT NULL,
                    question_embedding BLOB,
                    question_embedding_model_id TEXT,
                    created_at INTEGER NOT NULL,
                    UNIQUE(project_path, harness, session_id, source_start_message_id, source_end_message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
                    ON primer_candidates(project_path, source_message_time);
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
                    ON primer_candidates(session_id, harness);
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
                    ON primer_candidates(project_path, question_embedding_model_id);

                CREATE TABLE IF NOT EXISTS primers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    question TEXT NOT NULL,
                    question_embedding BLOB,
                    question_embedding_model_id TEXT,
                    answer TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
                    total_support INTEGER NOT NULL DEFAULT 0,
                    last_observed_at INTEGER,
                    answer_refreshed_at INTEGER,
                    source_candidate_ids TEXT NOT NULL DEFAULT '[]',
                    source_candidate_provenance TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
                    ON primers(project_path, status, last_observed_at DESC);
                CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
                    ON primers(project_path, question_embedding_model_id);

                CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
                    question,
                    answer,
                    project_path UNINDEXED,
                    content='primers',
                    content_rowid='id',
                    tokenize='porter unicode61'
                );
                CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
                    INSERT INTO primers_fts(rowid, question, answer, project_path)
                    VALUES (new.id, new.question, new.answer, new.project_path);
                END;
                CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
                    INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
                    VALUES ('delete', old.id, old.question, old.answer, old.project_path);
                END;
                CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
                    INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
                    VALUES ('delete', old.id, old.question, old.answer, old.project_path);
                    INSERT INTO primers_fts(rowid, question, answer, project_path)
                    VALUES (new.id, new.question, new.answer, new.project_path);
                END;
            `);
    }
  },
  {
    version: 47,
    description: "compiled smart-note checks and runtime policy state",
    up: (db) => {
      if (!tableExists(db, "notes"))
        return;
      ensureColumn(db, "notes", "compiled_check", "TEXT");
      ensureColumn(db, "notes", "manifest_json", "TEXT");
      ensureColumn(db, "notes", "check_hash", "TEXT");
      ensureColumn(db, "notes", "check_cron", "TEXT");
      ensureColumn(db, "notes", "check_version", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_status", "TEXT NOT NULL DEFAULT 'uncompiled'");
      ensureColumn(db, "notes", "check_failure_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_network_failure_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_quarantined_until", "INTEGER");
      ensureColumn(db, "notes", "check_next_due_at", "INTEGER");
      ensureColumn(db, "notes", "check_compiled_at", "INTEGER");
      ensureColumn(db, "notes", "check_false_since_at", "INTEGER");
      ensureColumn(db, "notes", "check_last_liveness_at", "INTEGER");
      ensureColumn(db, "notes", "policy_version", "INTEGER NOT NULL DEFAULT 1");
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_notes_smart_checks_due
                    ON notes(project_path, check_status, check_next_due_at)
                    WHERE type = 'smart' AND status = 'pending';
                CREATE INDEX IF NOT EXISTS idx_notes_smart_checks_liveness
                    ON notes(project_path, check_false_since_at, check_last_liveness_at)
                    WHERE type = 'smart' AND status = 'pending';
            `);
    }
  },
  {
    version: 48,
    description: "DreamerV2 rework: memory→file mapping vs verification split, classify marker",
    up: (db) => {
      if (tableExists(db, "memory_verifications")) {
        ensureColumn(db, "memory_verifications", "mapped_at", "INTEGER NOT NULL DEFAULT 0");
      }
      if (tableExists(db, "memories")) {
        ensureColumn(db, "memories", "classified_at", "INTEGER");
      }
    }
  },
  {
    version: 49,
    description: "per-model embedding coexistence and active identity tracking",
    up: (db) => {
      if (tableExists(db, "memory_embeddings")) {
        db.exec(`
                    UPDATE memory_embeddings
                    SET model_id = 'legacy:unknown'
                    WHERE model_id IS NULL;
                `);
        if (tableExists(db, "memories")) {
          db.exec(`
                        DELETE FROM memory_embeddings
                        WHERE memory_id NOT IN (SELECT id FROM memories);
                    `);
        }
        db.exec(`
                    DROP TABLE IF EXISTS memory_embeddings_v49_new;
                    CREATE TABLE memory_embeddings_v49_new (
                        memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
                        embedding BLOB NOT NULL,
                        model_id TEXT NOT NULL,
                        PRIMARY KEY(memory_id, model_id)
                    );
                    INSERT INTO memory_embeddings_v49_new (memory_id, embedding, model_id)
                    SELECT memory_id, embedding, model_id
                    FROM memory_embeddings;
                    DROP TABLE memory_embeddings;
                    ALTER TABLE memory_embeddings_v49_new RENAME TO memory_embeddings;
                `);
        assertForeignKeyIntegrity(db, "memory_embeddings");
      }
      if (tableExists(db, "git_commit_embeddings")) {
        if (tableExists(db, "git_commits")) {
          db.exec(`
                        DELETE FROM git_commit_embeddings
                        WHERE sha NOT IN (SELECT sha FROM git_commits);
                    `);
        }
        db.exec(`
                    DROP TABLE IF EXISTS git_commit_embeddings_v49_new;
                    CREATE TABLE git_commit_embeddings_v49_new (
                        sha TEXT NOT NULL,
                        embedding BLOB NOT NULL,
                        model_id TEXT NOT NULL,
                        created_at INTEGER NOT NULL,
                        PRIMARY KEY(sha, model_id),
                        FOREIGN KEY(sha) REFERENCES git_commits(sha) ON DELETE CASCADE
                    );
                    INSERT INTO git_commit_embeddings_v49_new (sha, embedding, model_id, created_at)
                    SELECT sha, embedding, model_id, created_at
                    FROM git_commit_embeddings;
                    DROP TABLE git_commit_embeddings;
                    ALTER TABLE git_commit_embeddings_v49_new RENAME TO git_commit_embeddings;
                `);
        assertForeignKeyIntegrity(db, "git_commit_embeddings");
      }
      if (tableExists(db, "compartment_chunk_embeddings")) {
        if (tableExists(db, "compartments")) {
          db.exec(`
                        DELETE FROM compartment_chunk_embeddings
                        WHERE compartment_id NOT IN (SELECT id FROM compartments);
                    `);
        }
        db.exec(`
                    DROP INDEX IF EXISTS idx_cce_session;
                    DROP INDEX IF EXISTS idx_cce_project_model;
                    DROP TABLE IF EXISTS compartment_chunk_embeddings_v49_new;
                    CREATE TABLE compartment_chunk_embeddings_v49_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
                        session_id TEXT NOT NULL,
                        project_path TEXT NOT NULL,
                        harness TEXT NOT NULL DEFAULT 'opencode',
                        window_index INTEGER NOT NULL DEFAULT 0,
                        start_ordinal INTEGER NOT NULL,
                        end_ordinal INTEGER NOT NULL,
                        chunk_hash TEXT NOT NULL,
                        model_id TEXT NOT NULL,
                        dims INTEGER NOT NULL,
                        vector BLOB NOT NULL,
                        created_at INTEGER NOT NULL,
                        UNIQUE(compartment_id, model_id, window_index)
                    );
                    INSERT INTO compartment_chunk_embeddings_v49_new (
                        id, compartment_id, session_id, project_path, harness, window_index,
                        start_ordinal, end_ordinal, chunk_hash, model_id, dims, vector, created_at
                    )
                    SELECT id, compartment_id, session_id, project_path, harness, window_index,
                           start_ordinal, end_ordinal, chunk_hash, model_id, dims, vector, created_at
                    FROM compartment_chunk_embeddings;
                    DROP TABLE compartment_chunk_embeddings;
                    ALTER TABLE compartment_chunk_embeddings_v49_new RENAME TO compartment_chunk_embeddings;
                    CREATE INDEX IF NOT EXISTS idx_cce_session ON compartment_chunk_embeddings(session_id);
                    CREATE INDEX IF NOT EXISTS idx_cce_project_model ON compartment_chunk_embeddings(project_path, model_id);
                `);
        assertForeignKeyIntegrity(db, "compartment_chunk_embeddings");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS embedding_identity_active (
                    project_path TEXT NOT NULL,
                    scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
                    model_id TEXT NOT NULL,
                    last_active_at INTEGER NOT NULL,
                    PRIMARY KEY(project_path, scope, model_id)
                );
            `);
    }
  },
  {
    version: 50,
    description: "add durable ctx-wrapup session marker",
    up(db) {
      if (tableExists(db, "session_meta")) {
        ensureColumn(db, "session_meta", "wrapup_in_progress_state", "TEXT");
      }
    }
  },
  {
    version: 51,
    description: "version tool-owner backfill state and repair legacy NULL session metadata",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
                    session_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
                    started_at INTEGER,
                    lease_expires_at INTEGER,
                    completed_at INTEGER,
                    last_error TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
                    ON tool_owner_backfill_state(status);
            `);
      healAllNullColumns(db);
    }
  },
  {
    version: 52,
    description: "persist emergency recovery origin",
    up(db) {
      if (tableExists(db, "session_meta")) {
        ensureColumn(db, "session_meta", "emergency_recovery_origin", "TEXT DEFAULT ''");
      }
    }
  },
  {
    version: 53,
    description: "add Synapse batch, shadow, and measurement storage",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS embedding_registrations (
                    project_path TEXT PRIMARY KEY,
                    provider_identity TEXT NOT NULL DEFAULT '',
                    model_id TEXT NOT NULL DEFAULT '',
                    chunk_model_id TEXT NOT NULL DEFAULT '',
                    fingerprint TEXT NOT NULL DEFAULT '',
                    table_epoch INTEGER NOT NULL DEFAULT 0,
                    dims INTEGER NOT NULL DEFAULT 0,
                    provenance_json TEXT NOT NULL DEFAULT '{}',
                    generation INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS synapse_batch_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL DEFAULT '',
                    scope TEXT NOT NULL DEFAULT '',
                    manifest_json TEXT NOT NULL DEFAULT '{}',
                    request_key TEXT NOT NULL DEFAULT '',
                    job_id TEXT,
                    cursor TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(session_id, request_key)
                );
                CREATE INDEX IF NOT EXISTS idx_synapse_batch_ledger_session
                    ON synapse_batch_ledger(session_id, updated_at);
                CREATE TABLE IF NOT EXISTS shadow_embedding_registrations (
                    project_path TEXT NOT NULL,
                    scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
                    model_id TEXT NOT NULL,
                    generation INTEGER NOT NULL DEFAULT 0,
                    fingerprint TEXT NOT NULL DEFAULT '',
                    table_epoch INTEGER NOT NULL DEFAULT 0,
                    dims INTEGER NOT NULL DEFAULT 0,
                    provenance_json TEXT NOT NULL DEFAULT '{}',
                    updated_at INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(project_path, scope, model_id)
                );
                CREATE TABLE IF NOT EXISTS embedding_measurement_corpus (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL DEFAULT '',
                    dedup_key TEXT NOT NULL DEFAULT '',
                    cohort_key TEXT NOT NULL DEFAULT '',
                    query_text_hash TEXT NOT NULL DEFAULT '',
                    primary_result_ids_json TEXT NOT NULL DEFAULT '[]',
                    shadow_result_ids_json TEXT NOT NULL DEFAULT '[]',
                    primary_latency_ms INTEGER,
                    shadow_latency_ms INTEGER,
                    primary_failed INTEGER NOT NULL DEFAULT 0,
                    shadow_failed INTEGER NOT NULL DEFAULT 0,
                    primary_model_id TEXT NOT NULL DEFAULT '',
                    shadow_model_id TEXT NOT NULL DEFAULT '',
                    primary_fingerprint TEXT NOT NULL DEFAULT '',
                    shadow_fingerprint TEXT NOT NULL DEFAULT '',
                    primary_epoch INTEGER NOT NULL DEFAULT 0,
                    shadow_epoch INTEGER NOT NULL DEFAULT 0,
                    corpus_hash TEXT NOT NULL DEFAULT '',
                    coverage_json TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(dedup_key, cohort_key)
                );
                CREATE INDEX IF NOT EXISTS idx_embedding_measurement_session
                    ON embedding_measurement_corpus(session_id, created_at);
            `);
    }
  },
  {
    version: 54,
    description: "add authority identity, managed-write guards, and mirror cursors",
    up(db) {
      const memoriesPresent = tableExists(db, "memories");
      const notesPresent = tableExists(db, "notes");
      db.exec(`
                CREATE TABLE IF NOT EXISTS context_store_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS authority_managed (
                    project_path TEXT PRIMARY KEY,
                    context_store_uuid TEXT NOT NULL,
                    marked_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS authority_repair_pending (
                    project_path TEXT PRIMARY KEY,
                    started_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS mirror_identity (
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    context_row_id INTEGER NOT NULL,
                    PRIMARY KEY(domain, module_project, module_row_id),
                    UNIQUE(domain, context_row_id)
                );
                CREATE TABLE IF NOT EXISTS mirror_cursors (
                    domain TEXT PRIMARY KEY CHECK(domain IN ('memories', 'notes')),
                    cursor INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS context_privilege_state (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0, 1))
                );
            `);
      if (memoriesPresent) {
        db.exec(`
                DROP TRIGGER IF EXISTS memories_authority_guard_insert;
                DROP TRIGGER IF EXISTS memories_authority_guard_update;
                DROP TRIGGER IF EXISTS memories_authority_guard_delete;
                CREATE TRIGGER memories_authority_guard_insert
                BEFORE INSERT ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                CREATE TRIGGER memories_authority_guard_update
                BEFORE UPDATE ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                CREATE TRIGGER memories_authority_guard_delete
                BEFORE DELETE ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                `);
      }
      if (notesPresent) {
        db.exec(`
                DROP TRIGGER IF EXISTS notes_authority_guard_insert;
                DROP TRIGGER IF EXISTS notes_authority_guard_update;
                DROP TRIGGER IF EXISTS notes_authority_guard_delete;
                CREATE TRIGGER notes_authority_guard_insert
                BEFORE INSERT ON notes
                 WHEN NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                   AND (
                       EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                   ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                CREATE TRIGGER notes_authority_guard_update
                BEFORE UPDATE ON notes
                WHEN (
                     (OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)))
                     OR
                     (NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)))
                ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                CREATE TRIGGER notes_authority_guard_delete
                BEFORE DELETE ON notes
                 WHEN OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                   AND (
                       EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                   ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                `);
      }
    }
  },
  {
    version: 55,
    description: "make managed-write privilege connection-local",
    up(db) {
      const memoriesPresent = tableExists(db, "memories");
      const notesPresent = tableExists(db, "notes");
      const native = db;
      const privilegeCheck = typeof native.function === "function" || typeof native.createFunction === "function" ? "mc_privileged_writer() = 0" : "COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0";
      if (memoriesPresent) {
        db.exec(`
                    DROP TRIGGER IF EXISTS memories_authority_guard_insert;
                    DROP TRIGGER IF EXISTS memories_authority_guard_update;
                    DROP TRIGGER IF EXISTS memories_authority_guard_delete;
                    CREATE TRIGGER memories_authority_guard_insert
                    BEFORE INSERT ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                    CREATE TRIGGER memories_authority_guard_update
                    BEFORE UPDATE ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                    CREATE TRIGGER memories_authority_guard_delete
                    BEFORE DELETE ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                `);
      }
      if (notesPresent) {
        db.exec(`
                    DROP TRIGGER IF EXISTS notes_authority_guard_insert;
                    DROP TRIGGER IF EXISTS notes_authority_guard_update;
                    DROP TRIGGER IF EXISTS notes_authority_guard_delete;
                    CREATE TRIGGER notes_authority_guard_insert
                    BEFORE INSERT ON notes
                    WHEN NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                    CREATE TRIGGER notes_authority_guard_update
                    BEFORE UPDATE ON notes
                    WHEN ((OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                            AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                              OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)))
                       OR (NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                            AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                              OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                    CREATE TRIGGER notes_authority_guard_delete
                    BEFORE DELETE ON notes
                    WHEN OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                `);
      }
    }
  },
  {
    version: 56,
    description: "record authority capture bounds and pending mirror references",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS authority_capture_bounds (
                    project_path TEXT NOT NULL,
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    max_rowid INTEGER NOT NULL,
                    data_version INTEGER NOT NULL,
                    captured_at INTEGER NOT NULL,
                    PRIMARY KEY(project_path, domain)
                );
                CREATE TABLE IF NOT EXISTS mirror_pending_references (
                    domain TEXT NOT NULL CHECK(domain = 'memories'),
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    target_module_row_id INTEGER NOT NULL,
                    PRIMARY KEY(domain, module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_pending_reference_target
                    ON mirror_pending_references(domain, module_project, target_module_row_id);
                CREATE TABLE IF NOT EXISTS mirror_note_revisions (
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    context_row_id INTEGER NOT NULL,
                    status_version INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(module_project, module_row_id),
                    UNIQUE(context_row_id)
                );
            `);
      installLatestAuthorityTriggers(db);
    }
  },
  {
    version: 57,
    description: "domain mutation epoch for authority capture bounds",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS domain_mutation_epoch (
                    project_path TEXT NOT NULL,
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    epoch INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(project_path, domain)
                );
            `);
      if (tableExists(db, "authority_capture_bounds")) {
        ensureColumn(db, "authority_capture_bounds", "mutation_epoch", "INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 58,
    description: "track live module memory identities during mirror replay",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_live_memory_rows (
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    normalized_hash TEXT NOT NULL,
                    PRIMARY KEY(module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_live_memory_content
                    ON mirror_live_memory_rows(module_project, category, normalized_hash);
                CREATE TABLE IF NOT EXISTS mirror_resnapshot_state (
                    domain TEXT PRIMARY KEY CHECK(domain = 'memories'),
                    status TEXT NOT NULL CHECK(status IN ('pending_check', 'resnapshotting', 'complete')),
                    updated_at INTEGER NOT NULL
                );
                INSERT OR IGNORE INTO mirror_resnapshot_state(domain, status, updated_at)
                VALUES ('memories', 'pending_check', 0);
            `);
    }
  },
  {
    version: 59,
    description: "stage paged live memory resnapshots before atomic replacement",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_live_staging (
                    generation TEXT NOT NULL,
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    normalized_hash TEXT NOT NULL,
                    PRIMARY KEY(generation, module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_live_staging_generation
                    ON mirror_live_staging(generation);
            `);
    }
  },
  {
    version: 60,
    description: "persist the owning live memory resnapshot generation",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_resnapshot_state (
                    domain TEXT PRIMARY KEY CHECK(domain = 'memories'),
                    status TEXT NOT NULL CHECK(status IN ('pending_check', 'resnapshotting', 'complete')),
                    updated_at INTEGER NOT NULL
                );
            `);
      db.exec("INSERT OR IGNORE INTO mirror_resnapshot_state(domain, status, updated_at) VALUES ('memories', 'pending_check', 0)");
      ensureColumn(db, "mirror_resnapshot_state", "generation", "TEXT");
    }
  },
  {
    version: 61,
    description: "retain complete memory snapshots for mirror healing",
    up(db) {
      ensureColumn(db, "mirror_live_memory_rows", "full_row_snapshot", "TEXT");
      ensureColumn(db, "mirror_live_staging", "full_row_snapshot", "TEXT");
      db.prepare(`UPDATE mirror_resnapshot_state
                    SET status = 'pending_check', generation = NULL, updated_at = ?
                  WHERE domain = 'memories'
                    AND status = 'complete'
                    AND NOT EXISTS (
                        SELECT 1 FROM schema_migrations WHERE version = 61
                    )`).run(Date.now());
    }
  },
  {
    version: 62,
    description: "durable row-level project identity merge audit log",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS identity_merge_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_identity TEXT NOT NULL,
                    to_identity TEXT NOT NULL,
                    table_name TEXT NOT NULL,
                    row_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    target_row_id TEXT,
                    merged_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_identity_merge_log_identities
                    ON identity_merge_log(from_identity, to_identity, merged_at);
                CREATE INDEX IF NOT EXISTS idx_identity_merge_log_table_row
                    ON identity_merge_log(table_name, row_id);
            `);
    }
  },
  {
    version: 63,
    description: "Add anchor_block_id to notes (module note mirror writes it)",
    up(db) {
      if (!tableExists(db, "notes"))
        return;
      const columns = db.prepare("PRAGMA table_info(notes)").all();
      if (!columns.some((column) => column.name === "anchor_block_id")) {
        db.exec("ALTER TABLE notes ADD COLUMN anchor_block_id TEXT");
      }
    }
  },
  {
    version: 64,
    description: "store project-scoped rendered memory mural",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mural_manifest (
                    project_path TEXT PRIMARY KEY,
                    image BLOB NOT NULL,
                    content_hash TEXT NOT NULL,
                    rendered_at INTEGER NOT NULL,
                    model TEXT,
                    memory_ids_json TEXT NOT NULL DEFAULT '[]',
                    width INTEGER NOT NULL DEFAULT 1092,
                    height INTEGER NOT NULL DEFAULT 1092
                );
            `);
      ensureColumn(db, "mural_manifest", "model", "TEXT");
      ensureColumn(db, "mural_manifest", "memory_ids_json", "TEXT NOT NULL DEFAULT '[]'");
      ensureColumn(db, "mural_manifest", "width", "INTEGER NOT NULL DEFAULT 1092");
      ensureColumn(db, "mural_manifest", "height", "INTEGER NOT NULL DEFAULT 1092");
    }
  },
  {
    version: 65,
    description: "Add per-memory mural cue columns for the deterministic cue-compression cutover",
    up(db) {
      if (!tableExists(db, "memories"))
        return;
      ensureColumn(db, "memories", "mural_cue", "TEXT");
      ensureColumn(db, "memories", "mural_cue_hash", "TEXT");
      ensureColumn(db, "memories", "mural_cue_at", "INTEGER");
    }
  },
  {
    version: 66,
    description: "bound per-session historian upgrade reminders",
    up(db) {
      if (!tableExists(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "upgrade_reminder_last_sent_at", "INTEGER");
      ensureColumn(db, "session_meta", "upgrade_reminder_count", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 67,
    description: "persist the frozen mural payload with each cached m0 baseline",
    up(db) {
      if (!tableExists(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "cached_m0_mural_data_url", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_mural_hash", "TEXT");
    }
  },
  {
    version: 68,
    description: "converge message FTS deletions and same-ID source revisions",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS message_history_source (
                    session_id TEXT NOT NULL,
                    message_id TEXT NOT NULL,
                    message_ordinal INTEGER NOT NULL,
                    source_version TEXT NOT NULL,
                    normalized_content_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY(session_id, message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_message_history_source_session_ordinal
                    ON message_history_source(session_id, message_ordinal);

                CREATE TABLE IF NOT EXISTS pending_session_cleanup (
                    session_id TEXT PRIMARY KEY,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    requested_at INTEGER NOT NULL,
                    last_attempt_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS message_history_orphan_sweep (
                    harness TEXT PRIMARY KEY,
                    cursor_session_id TEXT NOT NULL DEFAULT '',
                    last_swept_at INTEGER
                );
            `);
      if (tableExists(db, "message_history_index")) {
        const columns = new Set(db.prepare("PRAGMA table_info(message_history_index)").all().map((column) => column.name));
        if (columns.has("session_id") && columns.has("harness") && columns.has("updated_at")) {
          db.exec(`
                        CREATE INDEX IF NOT EXISTS idx_message_history_index_orphan_sweep
                            ON message_history_index(harness, session_id, updated_at);
                    `);
        }
      }
    }
  },
  {
    version: 69,
    description: "index visibility mutation discovery and target loading",
    up(db) {
      if (!tableExists(db, "memory_mutation_log"))
        return;
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_visibility
                    ON memory_mutation_log(project_path, category, id, target_memory_id);
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_target
                    ON memory_mutation_log(project_path, target_memory_id, id);
            `);
    }
  },
  {
    version: 70,
    description: "heal legacy compartments stranded by mismatched tier closing tags (issue #246)",
    up(db) {
      healMismatchedTierClose(db, "compartments", true);
      healMismatchedTierClose(db, "recomp_compartments", false);
    }
  },
  {
    version: 71,
    description: "rebuild authority guard triggers to the durable state-table form (issue #253)",
    up(db) {
      installLatestAuthorityTriggers(db);
    }
  },
  {
    version: 72,
    description: "add per-session compaction mode record column (issue #266)",
    up(db) {
      if (tableExists(db, "session_meta")) {
        ensureColumn(db, "session_meta", "compaction_mode_record", "TEXT");
      }
    }
  },
  {
    version: 73,
    description: "persist the last successful todowrite permission verdict",
    up(db) {
      if (tableExists(db, "session_meta")) {
        ensureColumn(db, "session_meta", "todo_permission_denied", "INTEGER NOT NULL DEFAULT 2");
      }
    }
  },
  {
    version: 74,
    description: "persist detected context-limit provenance",
    up(db) {
      if (tableExists(db, "session_meta")) {
        ensureColumn(db, "session_meta", "detected_context_limit_provenance", "TEXT NOT NULL DEFAULT 'unknown'");
      }
    }
  },
  {
    version: 75,
    description: "persist mural cue validation rejection latches",
    up(db) {
      if (!tableExists(db, "memories"))
        return;
      ensureColumn(db, "memories", "mural_cue_rejection_count", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 76,
    description: "persist retina provider compilation for smart-note conditions",
    up(db) {
      if (!tableExists(db, "notes"))
        return;
      ensureColumn(db, "notes", "compiled_provider", "TEXT");
      ensureColumn(db, "notes", "compiled_config", "TEXT");
      ensureColumn(db, "notes", "compiled_at", "INTEGER");
      ensureColumn(db, "notes", "compile_status", "TEXT CHECK(compile_status IN ('compiled', 'plain', 'refused'))");
    }
  },
  {
    version: 77,
    description: "persist scoped provenance for promoted user memories and primers",
    up(db) {
      if (tableExists(db, "user_memories")) {
        ensureColumn(db, "user_memories", "source_candidate_provenance", "TEXT");
      }
      if (tableExists(db, "primers")) {
        ensureColumn(db, "primers", "source_candidate_provenance", "TEXT");
      }
    }
  },
  {
    version: 78,
    description: "add migration_pending journal for crash-safe cross-harness session migration",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS migration_pending (
                    migration_key TEXT PRIMARY KEY,
                    source_session_id TEXT NOT NULL,
                    target_harness TEXT NOT NULL,
                    pi_session_id TEXT NOT NULL,
                    final_path TEXT NOT NULL,
                    stage_path TEXT NOT NULL,
                    content_sha256 TEXT NOT NULL,
                    phase TEXT NOT NULL CHECK (phase IN ('staged', 'db_committed')),
                    created_at INTEGER NOT NULL
                );
            `);
    }
  },
  {
    version: 79,
    description: "record m[0] system-hash and model-key comparison telemetry",
    up(db) {
      if (!tableExists(db, "transform_decisions"))
        return;
      ensureColumn(db, "transform_decisions", "system_hash_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "system_hash_new", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_model_key_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_model_key_new", "TEXT");
    }
  },
  {
    version: 80,
    description: "record observed m[0] tool-set hash comparisons",
    up(db) {
      if (!tableExists(db, "transform_decisions"))
        return;
      ensureColumn(db, "transform_decisions", "m0_tool_set_hash_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_tool_set_hash_new", "TEXT");
    }
  },
  {
    version: 81,
    description: "persist last-known-good transform snapshots across restarts",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS lkg_slots (
                    session_id TEXT PRIMARY KEY,
                    json_prefix TEXT NOT NULL,
                    input_id_seq TEXT NOT NULL,
                    input_content_digests TEXT NOT NULL,
                    input_content_signatures TEXT,
                    last_input_message_id TEXT NOT NULL,
                    model_key TEXT,
                    provider_key TEXT,
                    captured_at INTEGER NOT NULL,
                    row_version INTEGER,
                    capture_sequence INTEGER
                );
            `);
    }
  },
  {
    version: 82,
    description: "record the origin of memory file-independent mappings",
    up(db) {
      if (!tableExists(db, "memory_verifications"))
        return;
      ensureColumn(db, "memory_verifications", "mapping_origin", "TEXT NOT NULL DEFAULT 'mapper'");
    }
  },
  {
    version: 83,
    description: "add indexed rowid access for message FTS content",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS message_fts_rowid_map (
                    session_id TEXT NOT NULL,
                    message_ordinal INTEGER NOT NULL,
                    fts_rowid INTEGER NOT NULL,
                    PRIMARY KEY(session_id, message_ordinal)
                );

                CREATE TABLE IF NOT EXISTS message_fts_rowid_map_backfill_state (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    watermark_rowid INTEGER NOT NULL DEFAULT 0,
                    completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                INSERT OR IGNORE INTO message_fts_rowid_map_backfill_state
                    (id, watermark_rowid, completed, updated_at)
                VALUES (1, 0, 0, 0);
            `);
    }
  },
  {
    version: 84,
    description: "persist protected-token floor state per session",
    up(db) {
      if (!tableExists(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "protected_tokens_effective", "INTEGER");
      ensureColumn(db, "session_meta", "protected_tokens_pre_snapshot", "TEXT");
    }
  },
  {
    version: 85,
    description: "relabel OpenCode 1.x mis-tagged opencode2 session rows",
    up(db) {
      relabelOpenCode2HarnessRows(db);
    }
  }
];
var LATEST_MIGRATION_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);
function ensureMigrationsTable(db) {
  db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			description TEXT NOT NULL,
			applied_at INTEGER NOT NULL
		)
	`);
}
function getCurrentVersion(db) {
  const row = db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations WHERE version < ?").get(FORK_MIGRATION_VERSION_FLOOR);
  return row?.version ?? 0;
}
function isMigrationApplied(db, version) {
  return db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(version) != null;
}
function isSiblingMigrationConflict(db, error, version) {
  if (!(error instanceof Error))
    return false;
  const msg = error.message;
  if (!msg.includes("schema_migrations"))
    return false;
  if (!msg.toLowerCase().includes("version"))
    return false;
  const confirmed = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(version);
  return confirmed != null;
}
function runMigrations(db) {
  try {
    ensureMigrationsTable(db);
  } catch (error) {
    if (isSqliteLockError(error)) {
      throw new MigrationLockBusyError(`failed to prepare migration lock: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
  let loggedPlan = false;
  let touchedLegacyAuthorityBatch = false;
  while (true) {
    let migration;
    const migrationState = {};
    let currentVersion = 0;
    try {
      currentVersion = getCurrentVersion(db);
      const pendingMigration = MIGRATIONS.find((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version));
      if (!pendingMigration)
        break;
      migration = undefined;
      const transactionStartedAt = performance.now();
      const applied = db.transaction(() => {
        currentVersion = getCurrentVersion(db);
        migration = MIGRATIONS.find((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version));
        migrationState.value = migration;
        if (!migration)
          return false;
        if (!loggedPlan) {
          const pendingCount = MIGRATIONS.filter((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version)).length;
          log(`[migrations] current upstream migration lane: ${currentVersion}, applying ${pendingCount} migration(s)`);
          loggedPlan = true;
        }
        migration.up(db);
        db.prepare("INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.description, Date.now());
        return true;
      }).immediate();
      logSlowWriteTransaction("migration-runner", transactionStartedAt);
      migration = migrationState.value;
      if (!applied || !migration)
        break;
      if (migration.version <= 61)
        touchedLegacyAuthorityBatch = true;
      log(`[migrations] applied v${migration.version}: ${migration.description}`);
    } catch (error) {
      if (!migration && isSqliteLockError(error)) {
        throw new MigrationLockBusyError(`failed to acquire migration write lock: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (migration && isSiblingMigrationConflict(db, error, migration.version)) {
        log(`[migrations] v${migration.version} already applied by sibling instance — resuming with re-read version`);
        const reReadVersion = getCurrentVersion(db);
        if (reReadVersion > currentVersion)
          continue;
        throw new Error(`Migration v${migration.version} failed: sibling conflict reported but version did not advance. Database may need manual repair.`);
      }
      const version = migration?.version ?? currentVersion + 1;
      const description = migration?.description ?? "acquire migration write lock";
      log(`[migrations] FAILED v${version}: ${description} — ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Migration v${version} failed: ${error instanceof Error ? error.message : String(error)}. Database may need manual repair.`);
    }
  }
  if (touchedLegacyAuthorityBatch) {
    try {
      const transactionStartedAt = performance.now();
      db.transaction(() => installLatestAuthorityTriggers(db)).immediate();
      logSlowWriteTransaction("migration-runner", transactionStartedAt);
    } catch (error) {
      throw new Error(`Migration authority-trigger postcondition failed: ${error instanceof Error ? error.message : String(error)}. Database may need manual repair.`);
    }
  }
  if (loggedPlan) {
    log(`[migrations] upstream migration lane now: ${MIGRATIONS[MIGRATIONS.length - 1].version}`);
  }
}
async function runMigrationsWithRetry(db, options = {}) {
  const retryDelaysMs = options.retryDelaysMs ?? MIGRATION_LOCK_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  const totalAttempts = retryDelaysMs.length + 1;
  for (let attempt = 1;attempt <= totalAttempts; attempt += 1) {
    log(`[migrations] migration lock check attempt ${attempt}/${totalAttempts}`);
    try {
      runMigrations(db);
      return;
    } catch (error) {
      if (!(error instanceof MigrationLockBusyError))
        throw error;
      const delayMs = retryDelaysMs[attempt - 1];
      if (delayMs === undefined)
        throw error;
      log(`[migrations] migration write lock is busy; retrying attempt ${attempt + 1}/${totalAttempts} in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
}

// ../plugin/src/shared/commit-detection.ts
var HASH_HEX = "[0-9a-f]{7,12}";
var COMMIT_HASH_TEST_PATTERN = new RegExp(`\\b${HASH_HEX}\\b`, "i");

// ../plugin/src/features/magic-context/tool-definition-tokens.ts
var measurements = new Map;
var fingerprints = new Map;
var persistenceDb = null;
var cachedInsertStmt = null;
function keyFor(providerID, modelID, agentName) {
  const agent = agentName && agentName.length > 0 ? agentName : "default";
  return `${providerID}/${modelID}/${agent}`;
}
function setDatabase(db) {
  persistenceDb = db;
  cachedInsertStmt = null;
}
function loadToolDefinitionMeasurements(db) {
  let rows = [];
  try {
    rows = db.prepare("SELECT provider_id, model_id, agent_name, tool_id, token_count FROM tool_definition_measurements").all();
  } catch {
    return;
  }
  for (const row of rows) {
    const key = keyFor(row.provider_id, row.model_id, row.agent_name);
    let inner = measurements.get(key);
    if (!inner) {
      inner = new Map;
      measurements.set(key, inner);
    }
    inner.set(row.tool_id, row.token_count);
  }
}

// ../plugin/src/features/magic-context/tool-owner-backfill.ts
import { existsSync as existsSync8 } from "node:fs";

// ../plugin/src/shared/opencode-db-path.ts
import { existsSync as existsSync7, readdirSync as readdirSync2, statSync as statSync3 } from "node:fs";
import { homedir as homedir7 } from "node:os";
import { isAbsolute as isAbsolute4, join as join5 } from "node:path";
var cachedResolution = null;
var claimedDiagnostics = new Set;
function openCodeDataDir(env = process.env, dataHome) {
  return join5(dataHome ?? env.XDG_DATA_HOME ?? join5(homedir7(), ".local", "share"), "opencode");
}
function environmentKey(dataDir, hostGeneration, channel, env) {
  return [
    hostGeneration,
    dataDir,
    env.OPENCODE_DB ?? "",
    env.OPENCODE_DISABLE_CHANNEL_DB ?? "",
    channel ?? env.OPENCODE_CHANNEL ?? ""
  ].join("\x00");
}
function channelPath(dataDir, channel) {
  return ["latest", "beta", "prod"].includes(channel) ? join5(dataDir, "opencode.db") : join5(dataDir, `opencode-${channel}.db`);
}
function discoveredCandidateNames(dataDir) {
  const names = ["opencode.db", "opencode-local.db", "opencode-dev.db"];
  try {
    const discovered = readdirSync2(dataDir, { withFileTypes: true }).filter((entry) => /^opencode-.+\.db$/.test(entry.name) && !names.includes(entry.name)).map((entry) => entry.name).sort();
    names.push(...discovered);
  } catch {}
  return names;
}
function discoverOpenCodeDb(dataDir) {
  const candidates = discoveredCandidateNames(dataDir).map((name, order) => {
    const path = join5(dataDir, name);
    try {
      const metadata = statSync3(path);
      return metadata.isFile() ? { path, order, mtimeMs: metadata.mtimeMs } : null;
    } catch {
      return null;
    }
  });
  const existing = candidates.filter((candidate) => candidate !== null).sort((left, right) => right.mtimeMs - left.mtimeMs || left.order - right.order)[0];
  if (!existing) {
    return { path: join5(dataDir, "opencode.db"), source: "default", channel: null };
  }
  const name = existing.path.slice(dataDir.length + 1);
  const channel = name === "opencode.db" ? null : name.slice("opencode-".length, -".db".length) || null;
  return { path: existing.path, source: "discovered", channel };
}
function resolveV1Fresh(dataDir, env = process.env) {
  const explicit = env.OPENCODE_DB;
  if (explicit !== undefined && explicit.length > 0) {
    if (explicit === ":memory:") {
      return { path: explicit, source: "OPENCODE_DB", channel: null };
    }
    return {
      path: isAbsolute4(explicit) ? explicit : join5(dataDir, explicit),
      source: "OPENCODE_DB",
      channel: null
    };
  }
  const disableChannelDb = env.OPENCODE_DISABLE_CHANNEL_DB;
  if (disableChannelDb === "1" || disableChannelDb === "true") {
    return { path: join5(dataDir, "opencode.db"), source: "default", channel: null };
  }
  const channel = env.OPENCODE_CHANNEL;
  if (channel !== undefined && channel.length > 0) {
    return { path: channelPath(dataDir, channel), source: "channel", channel };
  }
  return discoverOpenCodeDb(dataDir);
}
function sourceOpenCodeDatabaseFilename(hostGeneration, channel, env = process.env) {
  if (hostGeneration === "v1") {
    const explicit = env.OPENCODE_DB;
    if (explicit !== undefined && explicit.length > 0)
      return explicit;
    if (env.OPENCODE_DISABLE_CHANNEL_DB === "1" || env.OPENCODE_DISABLE_CHANNEL_DB === "true") {
      return "opencode.db";
    }
    return ["latest", "beta", "prod"].includes(channel) ? "opencode.db" : `opencode-${channel}.db`;
  }
  return env.OPENCODE_DB ?? (["latest", "dev", "beta", "next", "prod"].includes(channel) || env.OPENCODE_DISABLE_CHANNEL_DB === "1" || env.OPENCODE_DISABLE_CHANNEL_DB === "true" ? "opencode.db" : `opencode-${channel.replace(/[^a-zA-Z0-9._-]/g, "")}.db`);
}
function resolveV2Fresh(dataDir, channel, env) {
  const filename = sourceOpenCodeDatabaseFilename("v2", channel, env);
  const explicit = env.OPENCODE_DB !== undefined;
  return {
    path: filename === ":memory:" ? filename : join5(dataDir, filename),
    source: explicit ? "OPENCODE_DB" : env.OPENCODE_CHANNEL ? "channel" : "default",
    channel: explicit ? null : channel
  };
}
function resolveOpenCodeDbPath(hostGeneration = "v1", options = {}) {
  const env = options.env ?? process.env;
  const dataDir = openCodeDataDir(env, options.dataHome);
  const channel = options.channel ?? env.OPENCODE_CHANNEL;
  const key = environmentKey(dataDir, hostGeneration, channel, env);
  if (cachedResolution?.key === key && (!cachedResolution.existed || existsSync7(cachedResolution.resolution.path))) {
    if (cachedResolution.existed)
      return cachedResolution.resolution;
  }
  const resolution = hostGeneration === "v2" ? resolveV2Fresh(dataDir, channel ?? "latest", env) : resolveV1Fresh(dataDir, env);
  cachedResolution = {
    key,
    resolution,
    existed: resolution.path !== ":memory:" && existsSync7(resolution.path)
  };
  return resolution;
}
function schemaTableNames(db, schema = "main") {
  const rows = db.prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table' AND name IN ('message', 'part', 'session', 'project', 'session_message')`).all();
  return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function detectOpenCodeStoreGeneration(db, schema = "main") {
  const tables = schemaTableNames(db, schema);
  const hasV1Messages = tables.has("message") && tables.has("part");
  if (hasV1Messages)
    return "v1";
  if (tables.has("session_message"))
    return "v2";
  if (tables.has("session") || tables.has("project"))
    return "v1";
  return "unknown";
}
function assertOpenCodeStoreGeneration(db, expected, path, schema = "main") {
  const actual = detectOpenCodeStoreGeneration(db, schema);
  if (actual === expected)
    return;
  if (actual === "unknown")
    return;
  throw new Error(`OpenCode store generation mismatch at ${path}: expected ${expected}, found ${actual}; refusing generation-specific database access`);
}

// ../plugin/src/features/magic-context/tool-owner-backfill.ts
var LEASE_DURATION_MS = 5 * 60 * 1000;
var LEASE_RENEWAL_MS = 60 * 1000;
function resolveOpencodeDbPath() {
  return resolveOpenCodeDbPath().path;
}
function ensureBackfillStateTable(db) {
  db.exec(`
        CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
            session_id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
            started_at INTEGER,
            lease_expires_at INTEGER,
            completed_at INTEGER,
            last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
        ON tool_owner_backfill_state(status);
    `);
}
function runToolOwnerBackfill(db) {
  const startedAt = performance.now();
  ensureBackfillStateTable(db);
  const result = {
    sessionsProcessed: 0,
    sessionsSkippedNoOcDb: 0,
    sessionsSkippedNoMatches: 0,
    sessionsCompleted: 0,
    sessionsBlockedByLease: 0,
    sessionsErrored: 0,
    rowsUpdated: 0,
    rowsLeftNull: 0,
    durationMs: 0
  };
  if (!isToolOwnerBackfillNeeded(db)) {
    result.durationMs = performance.now() - startedAt;
    return result;
  }
  const opencodeDbPath = resolveOpencodeDbPath();
  if (!existsSync8(opencodeDbPath)) {
    log(`[backfill] OpenCode DB not found at ${opencodeDbPath} — marking all unbackfilled sessions as skipped. Lazy adoption (defense-in-depth) handles legacy rows at runtime.`);
    markAllUnbackfilledSessionsSkipped(db);
    result.sessionsSkippedNoOcDb = countSessionsByStatus(db, "skipped");
    result.durationMs = performance.now() - startedAt;
    return result;
  }
  const escapedDbPath = opencodeDbPath.replaceAll("'", "''");
  db.exec(`ATTACH '${escapedDbPath}' AS oc_backfill`);
  try {
    assertOpenCodeStoreGeneration(db, "v1", opencodeDbPath, "oc_backfill");
    backfillToolOwnersInChunks(db, result);
  } finally {
    try {
      db.exec("DETACH DATABASE oc_backfill");
    } catch (error) {
      log(`[backfill] failed to detach oc_backfill database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  result.durationMs = performance.now() - startedAt;
  log(`[backfill] sessions=${result.sessionsProcessed} completed=${result.sessionsCompleted} skipped_no_oc=${result.sessionsSkippedNoOcDb} skipped_no_matches=${result.sessionsSkippedNoMatches} blocked_by_lease=${result.sessionsBlockedByLease} errored=${result.sessionsErrored} rows_updated=${result.rowsUpdated} rows_left_null=${result.rowsLeftNull} duration_ms=${Math.round(result.durationMs)}`);
  return result;
}
function isToolOwnerBackfillNeeded(db) {
  ensureBackfillStateTable(db);
  const row = db.prepare(`SELECT 1 AS hit
             FROM tags
             WHERE type = 'tool' AND tool_owner_message_id IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM tool_owner_backfill_state s
                   WHERE s.session_id = tags.session_id
                     AND s.status IN ('completed', 'skipped')
               )
             LIMIT 1`).get();
  return row !== null && row !== undefined;
}
function markAllUnbackfilledSessionsSkipped(db) {
  const now = Date.now();
  db.prepare(`INSERT INTO tool_owner_backfill_state(session_id, status, started_at, completed_at, last_error)
         SELECT DISTINCT session_id, 'skipped', NULL, ?, NULL
         FROM tags
         WHERE type = 'tool' AND tool_owner_message_id IS NULL
         ON CONFLICT(session_id) DO UPDATE SET
             status = 'skipped',
             completed_at = excluded.completed_at,
             last_error = NULL
         WHERE tool_owner_backfill_state.status NOT IN ('completed', 'running')`).run(now);
}
function countSessionsByStatus(db, status) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM tool_owner_backfill_state WHERE status = ?").get(status);
  return row.c;
}
function acquireSessionLease(db, sessionId, now) {
  const expiresAt = now + LEASE_DURATION_MS;
  const result = db.prepare(`INSERT INTO tool_owner_backfill_state(session_id, status, started_at, lease_expires_at)
             SELECT ?, 'running', ?, ?
             WHERE EXISTS (SELECT 1 FROM tags WHERE session_id = ?)
             ON CONFLICT(session_id) DO UPDATE SET
                 status = 'running',
                 started_at = excluded.started_at,
                 lease_expires_at = excluded.lease_expires_at,
                 last_error = NULL
             WHERE tool_owner_backfill_state.status IN ('pending', 'skipped')
                OR (tool_owner_backfill_state.status = 'running'
                    AND tool_owner_backfill_state.lease_expires_at < ?)`).run(sessionId, now, expiresAt, sessionId, now);
  return (result.changes ?? 0) === 1;
}
function renewSessionLease(db, sessionId, now) {
  const expiresAt = now + LEASE_DURATION_MS;
  db.prepare(`UPDATE tool_owner_backfill_state
         SET lease_expires_at = ?
         WHERE session_id = ? AND status = 'running'`).run(expiresAt, sessionId);
}
function markSessionCompleted(db, sessionId, now) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'completed', completed_at = ?, lease_expires_at = NULL, last_error = NULL
         WHERE session_id = ?`).run(now, sessionId);
}
function markSessionPendingRetry(db, sessionId) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'pending', completed_at = NULL, lease_expires_at = NULL, last_error = NULL
         WHERE session_id = ?`).run(sessionId);
}
function markSessionSkipped(db, sessionId, now, reason) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'skipped', completed_at = ?, last_error = ?, lease_expires_at = NULL
         WHERE session_id = ? AND status = 'running'`).run(now, reason, sessionId);
}
function markSessionErrored(db, sessionId, error) {
  const message = error instanceof Error ? error.message : String(error);
  db.prepare(`UPDATE tool_owner_backfill_state
         SET last_error = ?, lease_expires_at = NULL
         WHERE session_id = ?`).run(message, sessionId);
}
function getSessionsNeedingBackfill(db) {
  const rows = db.prepare(`SELECT DISTINCT t.session_id
             FROM tags t
             LEFT JOIN tool_owner_backfill_state s ON s.session_id = t.session_id
             WHERE t.type = 'tool' AND t.tool_owner_message_id IS NULL
               AND (s.status IS NULL OR s.status NOT IN ('completed', 'skipped'))
             ORDER BY t.session_id ASC`).all();
  return rows.map((r) => r.session_id);
}
function buildSessionOwnerMap(db, sessionId) {
  const rows = db.prepare(`SELECT
                COALESCE(
                    CASE WHEN json_extract(p.data, '$.type') = 'tool_use'
                        THEN json_extract(p.data, '$.id')
                    END,
                    json_extract(p.data, '$.callID')
                ) AS callid,
                m.id AS owner_id,
                m.time_created AS owner_t_created,
                p.id AS part_id,
                p.time_created AS part_t_created
             FROM oc_backfill.message m
             INNER JOIN oc_backfill.part p ON p.message_id = m.id
             WHERE m.session_id = ?
               AND json_extract(m.data, '$.role') = 'assistant'
               AND (
                   (json_extract(p.data, '$.type') IN ('tool', 'tool-invocation')
                       AND json_extract(p.data, '$.callID') IS NOT NULL)
                   OR (json_extract(p.data, '$.type') = 'tool_use'
                       AND json_extract(p.data, '$.id') IS NOT NULL)
               )
             ORDER BY
                 m.time_created ASC,
                 m.id ASC,
                 p.time_created ASC,
                 p.id ASC`).all(sessionId);
  const oldestByCallId = new Map;
  for (const r of rows) {
    if (typeof r.callid !== "string" || r.callid.length === 0)
      continue;
    if (!oldestByCallId.has(r.callid)) {
      oldestByCallId.set(r.callid, r.owner_id);
    }
  }
  return oldestByCallId;
}
function applyOwnersForSession(db, sessionId, ownersByCallId) {
  if (ownersByCallId.size === 0) {
    const leftNull = db.prepare(`SELECT COUNT(*) AS c FROM tags
                     WHERE session_id = ? AND type = 'tool'
                       AND tool_owner_message_id IS NULL`).get(sessionId).c;
    return { rowsUpdated: 0, rowsLeftNull: leftNull };
  }
  const findOrphanStmt = db.prepare(`SELECT id FROM tags
         WHERE session_id = ? AND message_id = ? AND type = 'tool'
           AND tool_owner_message_id IS NULL
         ORDER BY tag_number ASC
         LIMIT 1`);
  const updateRowStmt = db.prepare(`UPDATE tags
         SET tool_owner_message_id = ?
         WHERE id = ? AND tool_owner_message_id IS NULL`);
  const existingOwnerStmt = db.prepare(`SELECT 1 AS hit FROM tags
         WHERE session_id = ? AND message_id = ? AND type = 'tool'
           AND tool_owner_message_id = ?
         LIMIT 1`);
  let rowsUpdated = 0;
  db.transaction(() => {
    for (const [callId, ownerId] of ownersByCallId) {
      const orphan = findOrphanStmt.get(sessionId, callId);
      if (!orphan)
        continue;
      if (existingOwnerStmt.get(sessionId, callId, ownerId))
        continue;
      const result = updateRowStmt.run(ownerId, orphan.id);
      rowsUpdated += result.changes ?? 0;
    }
  }).immediate();
  const rowsLeftNull = db.prepare(`SELECT COUNT(*) AS c FROM tags
                 WHERE session_id = ? AND type = 'tool'
                   AND tool_owner_message_id IS NULL`).get(sessionId).c;
  return { rowsUpdated, rowsLeftNull };
}
function backfillToolOwnersInChunks(db, result) {
  const sessionIds = getSessionsNeedingBackfill(db);
  let lastRenewedAt = Date.now();
  for (const sessionId of sessionIds) {
    const now = Date.now();
    result.sessionsProcessed += 1;
    const acquired = acquireSessionLease(db, sessionId, now);
    if (!acquired) {
      result.sessionsBlockedByLease += 1;
      continue;
    }
    try {
      const owners = buildSessionOwnerMap(db, sessionId);
      const { rowsUpdated, rowsLeftNull } = applyOwnersForSession(db, sessionId, owners);
      result.rowsUpdated += rowsUpdated;
      result.rowsLeftNull += rowsLeftNull;
      if (owners.size === 0) {
        markSessionSkipped(db, sessionId, Date.now(), "no_oc_matches");
        result.sessionsSkippedNoMatches += 1;
      } else if (rowsLeftNull > 0) {
        markSessionPendingRetry(db, sessionId);
      } else {
        markSessionCompleted(db, sessionId, Date.now());
        result.sessionsCompleted += 1;
      }
    } catch (error) {
      log(`[backfill] session=${sessionId} errored: ${error instanceof Error ? error.message : String(error)}`);
      markSessionErrored(db, sessionId, error);
      result.sessionsErrored += 1;
    }
    const sinceRenew = Date.now() - lastRenewedAt;
    if (sinceRenew > LEASE_RENEWAL_MS) {
      renewSessionLease(db, sessionId, Date.now());
      lastRenewedAt = Date.now();
    }
  }
}

// ../plugin/src/features/magic-context/storage-db.ts
registerSlowWriteReporter(logSlowWriteTransaction);
var databases = new Map;
var pendingAsyncOpens = new Map;
var persistenceByDatabase = new WeakMap;
var persistenceErrorByDatabase = new WeakMap;
var pathByDatabase = new WeakMap;
var lastSchemaFenceRejection = null;
var lastMigrationOnOpenRefusal = null;
function getSchemaFenceRejection() {
  return lastSchemaFenceRejection;
}
function getMigrationOnOpenRefusal() {
  return lastMigrationOnOpenRefusal;
}
var LATEST_SUPPORTED_VERSION = 85;
var BOOT_SQLITE_BUSY_TIMEOUT_MS = 5000;
var PERMISSIONS_ENFORCEABLE = process.platform !== "win32";
var defaultStoragePermissionFs = { chmodSync: chmodSync2, mkdirSync: mkdirSync3 };
var storagePermissionFs = defaultStoragePermissionFs;
function ensureSecureStorageDir(dir) {
  if (!shouldEnforcePrivateStoragePermissions()) {
    storagePermissionFs.mkdirSync(dir, { recursive: true });
    return;
  }
  storagePermissionFs.mkdirSync(dir, { recursive: true, mode: 448 });
  if (!PERMISSIONS_ENFORCEABLE)
    return;
  try {
    storagePermissionFs.chmodSync(dir, 448);
  } catch (error) {
    log(`[magic-context] could not restrict storage dir permissions on ${dir}: ${getErrorMessage(error)}`);
  }
}
function restrictDatabaseFilePermissions(dbPath) {
  if (!PERMISSIONS_ENFORCEABLE || !shouldEnforcePrivateStoragePermissions())
    return;
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (!existsSync9(file))
      continue;
    try {
      storagePermissionFs.chmodSync(file, 384);
    } catch (error) {
      log(`[magic-context] could not restrict DB file permissions on ${file}: ${getErrorMessage(error)}`);
    }
  }
}
function resolveBootBusyTimeoutMs(value) {
  if (value === undefined)
    return BOOT_SQLITE_BUSY_TIMEOUT_MS;
  if (!Number.isFinite(value))
    return BOOT_SQLITE_BUSY_TIMEOUT_MS;
  return Math.max(0, Math.min(BOOT_SQLITE_BUSY_TIMEOUT_MS, Math.floor(value)));
}
function installBootBusyTimeout(db, dbPath, timeoutMs, report = log) {
  db.exec(`PRAGMA busy_timeout=${timeoutMs}`);
  report(`[magic-context] SQLite boot busy timeout: backend=${detectSqliteRuntime()} timeout=${timeoutMs}ms path=${dbPath}`);
}
function resolveDatabasePath(dbPathOverride) {
  if (dbPathOverride) {
    return { dbDir: dirname6(dbPathOverride), dbPath: dbPathOverride };
  }
  const dbDir = getMagicContextStorageDir();
  return { dbDir, dbPath: join6(dbDir, "context.db") };
}
function migrateLegacyStorageIfNeeded(targetDbPath, targetDbDir) {
  if (existsSync9(targetDbPath))
    return;
  const legacyDir = getLegacyOpenCodeMagicContextStorageDir();
  const legacyDbPath = join6(legacyDir, "context.db");
  if (!existsSync9(legacyDbPath))
    return;
  log(`[magic-context] migrating legacy plugin storage: ${legacyDir} -> ${targetDbDir} (legacy left in place as backup)`);
  ensureSecureStorageDir(targetDbDir);
  try {
    const legacyDb = new Database(legacyDbPath);
    try {
      legacyDb.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    } finally {
      closeQuietly(legacyDb);
    }
  } catch (error) {
    log(`[magic-context] legacy WAL checkpoint before copy failed (continuing with sidecar copy): ${getErrorMessage(error)}`);
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    const src = `${legacyDbPath}${suffix}`;
    const dst = join6(targetDbDir, `context.db${suffix}`);
    if (existsSync9(src)) {
      try {
        copyFileSync(src, dst);
      } catch (error) {
        log(`[magic-context] failed to copy ${src}:`, getErrorMessage(error));
      }
    }
  }
  const legacyModelsDir = join6(legacyDir, "models");
  const targetModelsDir = join6(targetDbDir, "models");
  if (existsSync9(legacyModelsDir) && !existsSync9(targetModelsDir)) {
    try {
      cpSync(legacyModelsDir, targetModelsDir, { recursive: true });
    } catch (error) {
      log("[magic-context] failed to copy embedding model cache:", getErrorMessage(error));
    }
  }
}
function getPersistedSchemaVersion(db) {
  const hasMigrationsTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
  if (!hasMigrationsTable) {
    return 0;
  }
  const row = db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations WHERE version < ?").get(FORK_MIGRATION_VERSION_FLOOR);
  return row?.version ?? 0;
}
function formatSchemaFenceBootLog(persistedVersion, supportedVersion) {
  return `[magic-context] upstream migration lane at boot: database=v${persistedVersion}, supported_fence=v${supportedVersion}`;
}
function getRuntimeLatestSupportedVersion(options) {
  if (options?.latestSupportedVersion !== undefined) {
    return options.latestSupportedVersion;
  }
  const override = process.env.MAGIC_CONTEXT_LATEST_SUPPORTED_VERSION;
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return LATEST_SUPPORTED_VERSION;
}
function enforceSchemaFence(db, dbPath, latestSupportedVersion) {
  const persistedVersion = getPersistedSchemaVersion(db);
  if (persistedVersion <= latestSupportedVersion) {
    lastSchemaFenceRejection = null;
    return true;
  }
  lastSchemaFenceRejection = { persistedVersion, supportedVersion: latestSupportedVersion };
  log(`[magic-context] storage fatal: refusing to open ${dbPath}; upstream migration lane v${persistedVersion} is newer than this binary supports (max v${latestSupportedVersion}). A pinned or stale plugin is likely sharing this database with a newer instance; update or unpin Magic Context with 'npx @cortexkit/magic-context@latest doctor --force', then restart.`);
  return false;
}
function unreadableDiscovery(path, arm) {
  return {
    state: "unreadable",
    serverPids: [],
    staleFiles: [],
    unreadableFile: path,
    unreadableArm: arm
  };
}
var RPC_DISCOVERY_PARSE_GRACE_MS = 10 * 60 * 1000;
var defaultRpcDiscoveryFs = {
  readdirSync: (path, options) => options?.withFileTypes ? readdirSync3(path, { withFileTypes: true }) : readdirSync3(path),
  readFileSync: (path, encoding) => String(readFileSync7(path, encoding)),
  statSync: (path) => ({ mtimeMs: statSync4(path).mtimeMs }),
  unlinkSync: (path) => unlinkSync2(path)
};
var rpcDiscoveryFs = defaultRpcDiscoveryFs;
function invalidDiscoveryReason(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if ("pid" in parsed) {
        const pid = Number(parsed.pid);
        if (!Number.isInteger(pid) || pid <= 0)
          return "invalid-pid";
      }
    } catch {}
  }
  return "parse-invalid";
}
function classifyDiscoveryRecordKind(record) {
  for (const value of [record.kind, record.harness]) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized)
      continue;
    if (normalized === "process")
      return "process";
    if (normalized === "opencode server" || normalized === "server") {
      return "OpenCode server";
    }
    if (normalized === "opencode instance" || normalized === "opencode instance (tui/cli)" || normalized === "opencode" || normalized === "tui" || normalized === "cli") {
      return "OpenCode instance (TUI/CLI)";
    }
    if (normalized === "pi" || normalized === "pi harness" || normalized === "omp" || normalized === "oh-my-pi") {
      return "Pi";
    }
  }
  return null;
}
function classifyRpcProcess(record, commandLine) {
  return classifyDiscoveryRecordKind(record) ?? classifyProcessKind(commandLine === undefined ? readProcessProbeEvidence(record.pid).commandLine : commandLine);
}
function classifyJunkDiscovery(portFile, raw, staleFiles) {
  let mtimeMs;
  try {
    mtimeMs = rpcDiscoveryFs.statSync(portFile).mtimeMs;
  } catch (error) {
    if (error.code === "ENOENT")
      return null;
    return unreadableDiscovery(portFile, "io");
  }
  const ageMs = Date.now() - mtimeMs;
  if (!Number.isFinite(ageMs) || ageMs < RPC_DISCOVERY_PARSE_GRACE_MS) {
    return unreadableDiscovery(portFile, "parse");
  }
  staleFiles.push(portFile);
  const reason = invalidDiscoveryReason(raw);
  log(`[magic-context] removing stale RPC discovery file ${portFile}: ${reason} record older than 10 minutes`);
  return null;
}
function inspectRpcServerDiscovery(storageDir) {
  const rpcRoot = join6(storageDir, "rpc");
  let projectEntries;
  try {
    projectEntries = rpcDiscoveryFs.readdirSync(rpcRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return { state: "absent", serverPids: [], staleFiles: [] };
    }
    return unreadableDiscovery(rpcRoot, "io");
  }
  const portFiles = [];
  for (const projectEntry of projectEntries) {
    if (!projectEntry.isDirectory())
      continue;
    const projectDir = join6(rpcRoot, projectEntry.name);
    let entries;
    try {
      entries = rpcDiscoveryFs.readdirSync(projectDir);
    } catch (error) {
      if (error.code === "ENOENT")
        continue;
      return unreadableDiscovery(projectDir, "io");
    }
    for (const entry of entries) {
      if (entry === "port" || entry.startsWith("port-") && entry.endsWith(".json")) {
        portFiles.push(join6(projectDir, entry));
      }
    }
  }
  if (portFiles.length === 0) {
    return { state: "absent", serverPids: [], staleFiles: [] };
  }
  const pids = new Set;
  const processByPid = new Map;
  const staleFiles = [];
  const inconclusivePids = new Set;
  for (const portFile of portFiles) {
    let raw;
    try {
      raw = rpcDiscoveryFs.readFileSync(portFile, "utf8");
    } catch (error) {
      if (error.code === "ENOENT")
        continue;
      return unreadableDiscovery(portFile, "io");
    }
    const filename = basename3(portFile);
    const pidFromName = /^port-(\d+)/.exec(filename)?.[1];
    const fallbackPid = pidFromName ? Number(pidFromName) : 0;
    const record = parseRpcPortFile(raw, fallbackPid);
    if (!record || !Number.isInteger(record.pid) || record.pid <= 0) {
      const junk = classifyJunkDiscovery(portFile, raw, staleFiles);
      if (junk)
        return junk;
      continue;
    }
    const liveness = isPidAlive(record.pid);
    if (liveness === "dead") {
      staleFiles.push(portFile);
      continue;
    }
    const evidence = readProcessProbeEvidence(record.pid);
    const identity = isPidIdentityPlausible(record, evidence);
    if (identity === "plausible") {
      pids.add(record.pid);
      const detected = attachFailClosedBlockingProcessEvidence({
        kind: classifyRpcProcess(record, evidence.commandLine),
        pid: record.pid
      }, evidence);
      const previous = processByPid.get(record.pid);
      if (!previous || previous.kind === "process" && detected.kind !== "process") {
        processByPid.set(record.pid, detected);
      }
    } else if (identity === "implausible") {
      staleFiles.push(portFile);
    } else {
      inconclusivePids.add(record.pid);
    }
  }
  for (const staleFile of staleFiles) {
    try {
      rpcDiscoveryFs.unlinkSync(staleFile);
    } catch {
      return unreadableDiscovery(staleFile, "io");
    }
  }
  const serverPids = [...pids].sort((a, b) => a - b);
  if (serverPids.length > 0) {
    return {
      state: "live",
      serverPids,
      serverProcesses: serverPids.map((pid) => processByPid.get(pid) ?? { kind: "process", pid }),
      staleFiles
    };
  }
  const uncertainPids = [...inconclusivePids].sort((a, b) => a - b);
  if (uncertainPids.length > 0) {
    return {
      state: "inconclusive",
      serverPids: [],
      staleFiles,
      inconclusivePids: uncertainPids
    };
  }
  return { state: "stale", serverPids: [], staleFiles };
}
function createPiBlockingProcess(pid) {
  return attachFailClosedBlockingProcessEvidence({ kind: "Pi", pid }, readProcessProbeEvidence(pid));
}
function formatInconclusiveOpenCodeMigrationWarning(dbPath, pids) {
  return `[magic-context] storage warning: continuing migration for ${dbPath}; OpenCode server PID ${pids.join(", ")} was not confirmed because its liveness or identity check could not run. This commonly means an OS sandbox denied kill(0) or ps. No live OpenCode server was confirmed.`;
}
function formatInconclusivePiMigrationWarning(dbPath, pids) {
  return `[magic-context] storage warning: continuing migration for ${dbPath}; Pi/OMP PID ${pids.join(", ")} was not confirmed as a live harness because the process image or command line was ambiguous. No live Pi harness was confirmed.`;
}
function logInconclusiveMigrationProbes(dbPath, discovery, piDiscovery) {
  const uncertainPids = discovery.inconclusivePids ?? [];
  if (uncertainPids.length > 0) {
    log(formatInconclusiveOpenCodeMigrationWarning(dbPath, uncertainPids));
  }
  if (piDiscovery.state === "unreadable") {
    log(`[magic-context] storage warning: continuing migration for ${dbPath}; the Pi/OMP process-list probe could not run, which commonly means an OS sandbox denied ps. No live Pi harness was confirmed.`);
  } else if ((piDiscovery.inconclusivePids?.length ?? 0) > 0) {
    log(formatInconclusivePiMigrationWarning(dbPath, piDiscovery.inconclusivePids ?? []));
  }
}
function isDefaultSharedDatabasePath(dbPath) {
  if (!process.env.XDG_DATA_HOME && (process.env.MAGIC_CONTEXT_TEST_DATA_DIR || false)) {
    return false;
  }
  return resolve3(dbPath) === resolve3(join6(getMagicContextStorageDir(), "context.db"));
}
function migrationBlockingPiPids(dbPath, discovery, discoveredPiPids) {
  if (isDefaultSharedDatabasePath(dbPath))
    return [...discoveredPiPids];
  const sameDataDirPids = new Set(discovery.serverPids);
  return discoveredPiPids.filter((pid) => sameDataDirPids.has(pid));
}
function formatLiveProcessMigrationRefusal(dbPath, persistedVersion, latestSupportedVersion, serverPids, piPids) {
  const blockers = [
    ...serverPids.map((pid) => `confirmed OpenCode server PID ${pid}`),
    ...piPids.map((pid) => `confirmed Pi harness PID ${pid}`)
  ];
  return `[magic-context] storage fatal: refusing to migrate ${dbPath} from upstream migration v${persistedVersion} to v${latestSupportedVersion} while ${blockers.join(", ")} still use the old plugin build. Restart the blocking harness, then retry this process.`;
}
function enforceMigrationOnOpenGuard(db, dbPath, dbDir, latestSupportedVersion) {
  const persistedVersion = getPersistedSchemaVersion(db);
  if (persistedVersion >= latestSupportedVersion) {
    lastMigrationOnOpenRefusal = null;
    return true;
  }
  const discovery = inspectRpcServerDiscovery(dbDir);
  const piDiscovery = inspectLivePiProcesses();
  const piPids = migrationBlockingPiPids(dbPath, discovery, piDiscovery.processIds);
  const serverProcesses = discovery.serverProcesses ?? (discovery.state === "live" ? discovery.serverPids.map((pid) => ({ kind: "process", pid })) : []);
  const blockingProcesses = [...serverProcesses, ...piPids.map(createPiBlockingProcess)];
  if ((discovery.state === "absent" || discovery.state === "stale" || discovery.state === "inconclusive") && piPids.length === 0) {
    lastMigrationOnOpenRefusal = null;
    logInconclusiveMigrationProbes(dbPath, discovery, piDiscovery);
    return true;
  }
  const blockingPids = [...new Set([...discovery.serverPids, ...piPids])].sort((left, right) => left - right);
  lastMigrationOnOpenRefusal = {
    persistedVersion,
    supportedVersion: latestSupportedVersion,
    serverPids: blockingPids,
    blockingProcesses,
    ...discovery.unreadableFile ? { unreadableFile: discovery.unreadableFile } : {},
    ...discovery.unreadableArm ? { unreadableArm: discovery.unreadableArm } : {}
  };
  if (discovery.state === "unreadable") {
    const unreadableFile = discovery.unreadableFile ?? "<unknown>";
    const arm = discovery.unreadableArm ?? "io";
    const recovery = arm === "io" ? `If no OpenCode server is running, it is safe to delete ${unreadableFile} and retry.` : `Retry after the file is older than the ten-minute grace window, or stop OpenCode before deleting it.`;
    log(`[magic-context] storage fatal: refusing to migrate ${dbPath} from upstream migration v${persistedVersion} to v${latestSupportedVersion} because RPC discovery file ${unreadableFile} is uncertain (${arm} arm), so the absence of a live OpenCode server cannot be proven. ${recovery}`);
  } else {
    log(formatLiveProcessMigrationRefusal(dbPath, persistedVersion, latestSupportedVersion, discovery.serverPids, piPids));
  }
  return false;
}
var sqlitePragmaConfig = {
  cacheSizeMb: 64,
  mmapSizeMb: 0
};
function applySqliteTuningPragmas(db) {
  db.exec(`PRAGMA cache_size=-${Math.round(sqlitePragmaConfig.cacheSizeMb * 1024)}`);
  db.exec(`PRAGMA mmap_size=${Math.round(sqlitePragmaConfig.mmapSizeMb * 1024 * 1024)}`);
  db.exec("PRAGMA analysis_limit=400");
}
function finishDatabaseOpen(db, dbPath, explicitDbPath, latestSupportedVersion) {
  if (!enforceSchemaFence(db, dbPath, latestSupportedVersion)) {
    closeQuietly(db);
    return null;
  }
  healWedgedChannel2Claims(db);
  if (!explicitDbPath) {
    const runBackfills = () => {
      try {
        runToolOwnerBackfill(db);
      } catch (error) {
        log(`[magic-context] tool-owner backfill failed (continuing with lazy adoption fallback): ${getErrorMessage(error)}`);
      }
      startMessageFtsRowidMapBackfill(db).catch((error) => {
        log(`[magic-context] message FTS rowid-map backfill failed (will resume next startup): ${getErrorMessage(error)}`);
      });
    };
    if (bootQuietRemainingMs() > 0)
      scheduleAfterBootQuiet(runBackfills);
    else
      runBackfills();
  }
  setDatabase(db);
  loadToolDefinitionMeasurements(db);
  restrictDatabaseFilePermissions(dbPath);
  databases.set(dbPath, db);
  pathByDatabase.set(db, dbPath);
  persistenceByDatabase.set(db, true);
  persistenceErrorByDatabase.delete(db);
  if (!explicitDbPath) {
    log(formatSchemaFenceBootLog(getPersistedSchemaVersion(db), latestSupportedVersion));
  }
  return db;
}
function initializeDatabase(db, busyTimeoutMs = BOOT_SQLITE_BUSY_TIMEOUT_MS) {
  db.exec(`PRAGMA busy_timeout=${resolveBootBusyTimeoutMs(busyTimeoutMs)}`);
  db.exec("PRAGMA foreign_keys=ON");
  db.exec("PRAGMA journal_mode=WAL");
  applySqliteTuningPragmas(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      message_id TEXT,
      type TEXT,
      status TEXT DEFAULT 'active',
      byte_size INTEGER,
      tag_number INTEGER,
      harness TEXT NOT NULL DEFAULT 'opencode',
      entry_fingerprint TEXT,
      token_count INTEGER,
      input_token_count INTEGER,
      reasoning_token_count INTEGER,
      UNIQUE(session_id, tag_number)
    );

    CREATE TABLE IF NOT EXISTS pending_ops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      tag_id INTEGER,
      operation TEXT,
      queued_at INTEGER,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS source_contents (
      tag_id INTEGER,
      session_id TEXT,
      content TEXT,
      created_at INTEGER, -- epoch ms; Date.now() on source writes, preserved on session clones
      harness TEXT NOT NULL DEFAULT 'opencode',
      PRIMARY KEY(session_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS compartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      start_message INTEGER NOT NULL,
      end_message INTEGER NOT NULL,
      start_message_id TEXT DEFAULT '',
      end_message_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      p1 TEXT,
      p2 TEXT,
      p3 TEXT,
      p4 TEXT,
      importance INTEGER NOT NULL DEFAULT 50,
      episode_type TEXT,
      p1_embedding BLOB,
      p1_embedding_model_id TEXT,
      legacy INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode',
      UNIQUE(session_id, sequence)
    );
    CREATE INDEX IF NOT EXISTS idx_compartments_session ON compartments(session_id);

    CREATE TABLE IF NOT EXISTS compartment_chunk_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      window_index INTEGER NOT NULL DEFAULT 0,
      start_ordinal INTEGER NOT NULL,
      end_ordinal INTEGER NOT NULL,
      chunk_hash TEXT NOT NULL,
      model_id TEXT NOT NULL,
      dims INTEGER NOT NULL,
      vector BLOB NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      UNIQUE(compartment_id, model_id, window_index)
    );
    CREATE INDEX IF NOT EXISTS idx_cce_session ON compartment_chunk_embeddings(session_id);
    CREATE INDEX IF NOT EXISTS idx_cce_project_model ON compartment_chunk_embeddings(project_path, model_id);

    CREATE TABLE IF NOT EXISTS session_projects (
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      project_path TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(session_id, harness)
    );
    CREATE INDEX IF NOT EXISTS idx_session_projects_project
      ON session_projects(project_path);

    CREATE TABLE IF NOT EXISTS compartment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      compartment_id INTEGER,
      kind TEXT NOT NULL,
      at_compartment INTEGER,
      fields_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode'
    );
    CREATE INDEX IF NOT EXISTS idx_compartment_events_session
      ON compartment_events(session_id);

    CREATE TABLE IF NOT EXISTS compartment_state_lease (
      session_id TEXT PRIMARY KEY NOT NULL,
      holder_id TEXT NOT NULL,
      acquired_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_compartment_state_lease_expires
      ON compartment_state_lease(expires_at);

    CREATE TABLE IF NOT EXISTS compression_depth (
      session_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      depth INTEGER NOT NULL DEFAULT 0,
      harness TEXT NOT NULL DEFAULT 'opencode',
      PRIMARY KEY(session_id, message_ordinal)
    );
    CREATE INDEX IF NOT EXISTS idx_compression_depth_session ON compression_depth(session_id);

    CREATE TABLE IF NOT EXISTS session_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS primer_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      normalized_question TEXT NOT NULL,
      source_compartment_start INTEGER,
      source_compartment_end INTEGER,
      source_start_message_id TEXT NOT NULL DEFAULT '',
      source_end_message_id TEXT NOT NULL DEFAULT '',
      source_message_time INTEGER NOT NULL,
      question_embedding BLOB,
      question_embedding_model_id TEXT,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      UNIQUE(project_path, harness, session_id, source_start_message_id, source_end_message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
      ON primer_candidates(project_path, source_message_time);
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
      ON primer_candidates(session_id, harness);
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
      ON primer_candidates(project_path, question_embedding_model_id);

    CREATE TABLE IF NOT EXISTS primers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      question TEXT NOT NULL,
      question_embedding BLOB,
      question_embedding_model_id TEXT,
      answer TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      total_support INTEGER NOT NULL DEFAULT 0,
      last_observed_at INTEGER,
      answer_refreshed_at INTEGER,
      source_candidate_ids TEXT NOT NULL DEFAULT '[]',
      source_candidate_provenance TEXT,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
      ON primers(project_path, status, last_observed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
      ON primers(project_path, question_embedding_model_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
      question,
      answer,
      project_path UNINDEXED,
      content='primers',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
      INSERT INTO primers_fts(rowid, question, answer, project_path)
      VALUES (new.id, new.question, new.answer, new.project_path);
    END;

    CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
      INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
      VALUES ('delete', old.id, old.question, old.answer, old.project_path);
    END;

    CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
      INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
      VALUES ('delete', old.id, old.question, old.answer, old.project_path);
      INSERT INTO primers_fts(rowid, question, answer, project_path)
      VALUES (new.id, new.question, new.answer, new.project_path);
    END;

    -- session_notes and smart_notes were merged into the unified notes table
    -- by migration v1 (see features/magic-context/migrations.ts). The old tables
    -- are never recreated; fresh DBs create only notes, upgraded DBs have
    -- their old tables migrated and dropped by the migration runner.

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      normalized_hash TEXT NOT NULL,
      importance INTEGER,
      scope TEXT NOT NULL DEFAULT 'project',
      shareable INTEGER NOT NULL DEFAULT 0,
      source_session_id TEXT,
      source_type TEXT DEFAULT 'historian',
      seen_count INTEGER DEFAULT 1,
      retrieval_count INTEGER DEFAULT 0,
      first_seen_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      last_retrieved_at INTEGER,
      status TEXT DEFAULT 'active',
      expires_at INTEGER,
      verification_status TEXT DEFAULT 'unverified',
      verified_at INTEGER,
      classified_at INTEGER,
      superseded_by_memory_id INTEGER,
      merged_from TEXT,
      metadata_json TEXT,
      mural_cue TEXT,
      mural_cue_hash TEXT,
      mural_cue_at INTEGER,
      mural_cue_rejection_count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(project_path, category, normalized_hash)
    );

    CREATE TABLE IF NOT EXISTS memory_embeddings (
      -- FK-cascade audit (v12): memory_embeddings.memory_id -> memories.id
      -- uses ON DELETE CASCADE, so SQLite PRAGMA foreign_keys must be ON on
      -- every connection and v12 cleans historical orphan rows.
      memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      embedding BLOB NOT NULL,
      model_id TEXT NOT NULL,
      PRIMARY KEY(memory_id, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_identity_active (
      project_path TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
      model_id TEXT NOT NULL,
      last_active_at INTEGER NOT NULL,
      PRIMARY KEY(project_path, scope, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_registrations (
      project_path TEXT PRIMARY KEY,
      provider_identity TEXT NOT NULL DEFAULT '',
      model_id TEXT NOT NULL DEFAULT '',
      chunk_model_id TEXT NOT NULL DEFAULT '',
      fingerprint TEXT NOT NULL DEFAULT '',
      table_epoch INTEGER NOT NULL DEFAULT 0,
      dims INTEGER NOT NULL DEFAULT 0,
      provenance_json TEXT NOT NULL DEFAULT '{}',
      generation INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS synapse_batch_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      manifest_json TEXT NOT NULL DEFAULT '{}',
      request_key TEXT NOT NULL DEFAULT '',
      job_id TEXT,
      cursor TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT 0, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL DEFAULT 0,
      UNIQUE(session_id, request_key)
    );
    CREATE INDEX IF NOT EXISTS idx_synapse_batch_ledger_session
      ON synapse_batch_ledger(session_id, updated_at);

    CREATE TABLE IF NOT EXISTS shadow_embedding_registrations (
      project_path TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
      model_id TEXT NOT NULL,
      generation INTEGER NOT NULL DEFAULT 0,
      fingerprint TEXT NOT NULL DEFAULT '',
      table_epoch INTEGER NOT NULL DEFAULT 0,
      dims INTEGER NOT NULL DEFAULT 0,
      provenance_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(project_path, scope, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_measurement_corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL DEFAULT '',
      dedup_key TEXT NOT NULL DEFAULT '',
      cohort_key TEXT NOT NULL DEFAULT '',
      query_text_hash TEXT NOT NULL DEFAULT '',
      primary_result_ids_json TEXT NOT NULL DEFAULT '[]',
      shadow_result_ids_json TEXT NOT NULL DEFAULT '[]',
      primary_latency_ms INTEGER,
      shadow_latency_ms INTEGER,
      primary_failed INTEGER NOT NULL DEFAULT 0,
      shadow_failed INTEGER NOT NULL DEFAULT 0,
      primary_model_id TEXT NOT NULL DEFAULT '',
      shadow_model_id TEXT NOT NULL DEFAULT '',
      primary_fingerprint TEXT NOT NULL DEFAULT '',
      shadow_fingerprint TEXT NOT NULL DEFAULT '',
      primary_epoch INTEGER NOT NULL DEFAULT 0,
      shadow_epoch INTEGER NOT NULL DEFAULT 0,
      corpus_hash TEXT NOT NULL DEFAULT '',
      coverage_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT 0, -- epoch ms (Date.now())
      UNIQUE(dedup_key, cohort_key)
    );
    CREATE INDEX IF NOT EXISTS idx_embedding_measurement_session
      ON embedding_measurement_corpus(session_id, created_at);

    CREATE TABLE IF NOT EXISTS memory_verifications (
      memory_id    INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      file_path    TEXT NOT NULL,
      -- verified_at=0 means "mapped (files known) but not yet content-verified".
      -- map-memories sets mapped_at + verified_at=0; verify sets verified_at=now.
      verified_at  INTEGER NOT NULL,
       mapped_at    INTEGER NOT NULL DEFAULT 0,
       -- Distinguishes mapper-authored independence from a host rejection fallback.
       mapping_origin TEXT NOT NULL DEFAULT 'mapper',
       PRIMARY KEY (memory_id, file_path)
    );
    CREATE INDEX IF NOT EXISTS idx_memory_verifications_memory ON memory_verifications(memory_id);

    CREATE TABLE IF NOT EXISTS memory_mutation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      mutation_type TEXT NOT NULL CHECK (mutation_type IN ('archive', 'delete', 'update', 'superseded')),
      target_memory_id INTEGER NOT NULL,
      superseded_by_id INTEGER,
      category TEXT,
      new_content TEXT,
      queued_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
      ON memory_mutation_log(project_path, id);
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_visibility
      ON memory_mutation_log(project_path, category, id, target_memory_id);
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_target
      ON memory_mutation_log(project_path, target_memory_id, id);

    CREATE TABLE IF NOT EXISTS dream_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dream_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      reason TEXT NOT NULL,
      enqueued_at INTEGER NOT NULL,
      started_at INTEGER,
      retry_count INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_dream_queue_project ON dream_queue(project_path);
CREATE INDEX IF NOT EXISTS idx_dream_queue_pending ON dream_queue(started_at, enqueued_at);

    CREATE TABLE IF NOT EXISTS dream_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      holder_id TEXT NOT NULL,
      tasks_json TEXT NOT NULL,
      tasks_succeeded INTEGER NOT NULL DEFAULT 0,
      tasks_failed INTEGER NOT NULL DEFAULT 0,
      smart_notes_surfaced INTEGER NOT NULL DEFAULT 0,
      smart_notes_pending INTEGER NOT NULL DEFAULT 0,
      memory_changes_json TEXT,
      parent_session_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_dream_runs_project ON dream_runs(project_path, finished_at DESC);

    CREATE TABLE IF NOT EXISTS task_schedule_state (
      project_path  TEXT    NOT NULL,
      task          TEXT    NOT NULL,
      last_run_at   INTEGER,
      next_due_at   INTEGER,
      schedule      TEXT,
      last_status   TEXT,
      last_error    TEXT,
      last_checked_commit TEXT,
      last_broad_run_at INTEGER,
      retrospective_watermark_ms INTEGER,
      retry_count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (project_path, task)
    );
    CREATE INDEX IF NOT EXISTS idx_task_schedule_due ON task_schedule_state(next_due_at);

    CREATE TABLE IF NOT EXISTS retrospective_processed_windows (
      project_path TEXT NOT NULL,
      window_key   TEXT NOT NULL,
      processed_at INTEGER NOT NULL,
      PRIMARY KEY (project_path, window_key)
    );

    CREATE TABLE IF NOT EXISTS project_key_files (
      project_path           TEXT    NOT NULL,
      path                   TEXT    NOT NULL,
      content                TEXT    NOT NULL,
      content_hash           TEXT    NOT NULL,
      local_token_estimate   INTEGER NOT NULL,
      generated_at           INTEGER NOT NULL,
      generated_by_model     TEXT,
      generation_config_hash TEXT    NOT NULL,
      stale_reason           TEXT,
      PRIMARY KEY (project_path, path)
    );
    CREATE INDEX IF NOT EXISTS idx_project_key_files_project ON project_key_files(project_path);
    CREATE INDEX IF NOT EXISTS idx_project_key_files_generated_at ON project_key_files(project_path, generated_at);

    CREATE TABLE IF NOT EXISTS project_key_files_version (
      project_path TEXT    PRIMARY KEY,
      version      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS schema_migrations_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_state (
      project_path TEXT PRIMARY KEY,
      project_memory_epoch INTEGER NOT NULL DEFAULT 0,
      project_user_profile_version INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS git_sweep_coordinator (
      project_path TEXT PRIMARY KEY,
      lease_holder TEXT,
      lease_expires_at INTEGER,
      last_swept_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_lease_expires
      ON git_sweep_coordinator(lease_expires_at);
    CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_last_swept
      ON git_sweep_coordinator(last_swept_at);

    CREATE TABLE IF NOT EXISTS m0_mutation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      mutation_type TEXT NOT NULL CHECK (mutation_type IN (
        'compartment_delete', 'compartment_merge', 'recomp_boundary_change', 'compartment_upgrade'
      )),
      target_id INTEGER,
      queued_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session ON m0_mutation_log(session_id);

    CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
      old_project_path TEXT PRIMARY KEY,
      new_project_path TEXT NOT NULL,
      rekeyed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_path TEXT NOT NULL,
      display_name TEXT NOT NULL,
      display_path TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      PRIMARY KEY (workspace_id, project_path)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique ON workspace_members(project_path);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name ON workspace_members(workspace_id, display_name);

    CREATE TABLE IF NOT EXISTS v22_backfill_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id INTEGER NOT NULL,
      raw_project_path TEXT NOT NULL,
      error_class TEXT NOT NULL CHECK (error_class IN ('not_git_repo', 'git_missing', 'git_timeout', 'permission_denied', 'unknown')),
      error_message TEXT,
      failed_at INTEGER NOT NULL,
      UNIQUE(table_name, row_id)
    );

    -- (smart_notes: see note above; merged into unified notes table by migration v1)

    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      content,
      category,
      content='memories',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS message_history_fts USING fts5(
      session_id UNINDEXED,
      message_ordinal UNINDEXED,
      message_id UNINDEXED,
      role,
      content,
      tokenize='porter unicode61'
    );

    CREATE TABLE IF NOT EXISTS message_fts_rowid_map (
      session_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      fts_rowid INTEGER NOT NULL,
      PRIMARY KEY(session_id, message_ordinal)
    );

    CREATE TABLE IF NOT EXISTS message_fts_rowid_map_backfill_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      watermark_rowid INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO message_fts_rowid_map_backfill_state
      (id, watermark_rowid, completed, updated_at)
    VALUES (1, 0, 0, 0);

    CREATE TABLE IF NOT EXISTS message_history_index (
      session_id TEXT PRIMARY KEY,
      last_indexed_ordinal INTEGER NOT NULL DEFAULT 0,
      dirty_floor_ordinal INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS message_history_source (
      session_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      source_version TEXT NOT NULL,
      normalized_content_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(session_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_message_history_source_session_ordinal
      ON message_history_source(session_id, message_ordinal);

    CREATE TABLE IF NOT EXISTS pending_session_cleanup (
      session_id TEXT PRIMARY KEY,
      harness TEXT NOT NULL DEFAULT 'opencode',
      requested_at INTEGER NOT NULL,
      last_attempt_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS message_history_orphan_sweep (
      harness TEXT PRIMARY KEY,
      cursor_session_id TEXT NOT NULL DEFAULT '',
      last_swept_at INTEGER
    );

    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content, category) VALUES (new.id, new.content, new.category);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, category) VALUES ('delete', old.id, old.content, old.category);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, category) VALUES ('delete', old.id, old.content, old.category);
      INSERT INTO memories_fts(rowid, content, category) VALUES (new.id, new.content, new.category);
    END;

    CREATE TABLE IF NOT EXISTS session_meta (
      session_id TEXT PRIMARY KEY,
      harness TEXT NOT NULL DEFAULT 'opencode',
      last_response_time INTEGER,
      cache_ttl TEXT,
      counter INTEGER DEFAULT 0,
      last_nudge_tokens INTEGER DEFAULT 0,
      last_nudge_band TEXT DEFAULT '',
      last_nudge_undropped INTEGER DEFAULT 0,
      last_nudge_level TEXT DEFAULT '',
      channel2_nudge_state TEXT DEFAULT '',
      channel2_nudge_claimed_at INTEGER DEFAULT 0,
      channel2_nudge_claim_token TEXT DEFAULT '',
      last_emergency_input_sample INTEGER DEFAULT 0,
      last_transform_error TEXT DEFAULT '',
      nudge_anchor_message_id TEXT DEFAULT '',
      nudge_anchor_text TEXT DEFAULT '',
      sticky_turn_reminder_text TEXT DEFAULT '',
      sticky_turn_reminder_message_id TEXT DEFAULT '',
      note_nudge_trigger_pending INTEGER DEFAULT 0,
      note_nudge_trigger_message_id TEXT DEFAULT '',
      note_nudge_sticky_text TEXT DEFAULT '',
      note_nudge_sticky_message_id TEXT DEFAULT '',
      note_nudge_anchors TEXT NOT NULL DEFAULT '[]',
      auto_search_hint_decisions TEXT NOT NULL DEFAULT '[]',
      last_todo_state TEXT DEFAULT '',
      todo_permission_denied INTEGER NOT NULL DEFAULT 2,
      todo_synthetic_call_id TEXT DEFAULT '',
      todo_synthetic_anchor_message_id TEXT DEFAULT '',
      todo_synthetic_state_json TEXT DEFAULT '',
      is_subagent INTEGER DEFAULT 0,
      last_context_percentage REAL DEFAULT 0,
      last_input_tokens INTEGER DEFAULT 0,
      detected_context_limit_provenance TEXT NOT NULL DEFAULT 'unknown',
      observed_safe_input_tokens INTEGER NOT NULL DEFAULT 0,
      cache_alert_sent INTEGER NOT NULL DEFAULT 0,
      times_execute_threshold_reached INTEGER DEFAULT 0,
      compartment_in_progress INTEGER DEFAULT 0,
      historian_failure_count INTEGER DEFAULT 0,
      historian_last_error TEXT DEFAULT NULL,
      historian_last_failure_at INTEGER DEFAULT NULL,
      system_prompt_hash TEXT DEFAULT '',
      memory_block_cache TEXT DEFAULT '',
      memory_block_count INTEGER DEFAULT 0,
      memory_block_ids TEXT DEFAULT '',
      -- pending_compaction_marker_state: intentionally NULLABLE without a
      -- default. Absence of a deferred marker is SQL NULL; presence is a
      -- valid JSON blob written via setPendingCompactionMarkerState.
      -- Excluded from the healAllNullColumns fallback list. Readers filter
      -- IS NOT NULL AND != empty-string defensively. Plan v6 section 3.
      pending_compaction_marker_state TEXT,
      -- Target OpenCode message id used to inject the current compaction marker.
      -- Nullable for legacy persisted markers; repaired on the next marker move.
      compaction_marker_target_end_message_id TEXT,
      -- pending_pi_compaction_marker_state: intentionally NULLABLE without a
      -- default. Absence of a deferred Pi-native marker is SQL NULL; presence
      -- is a valid JSON blob written via setPendingPiCompactionMarkerState.
      -- Excluded from the healAllNullColumns fallback list.
      pending_pi_compaction_marker_state TEXT,
      new_work_tokens INTEGER NOT NULL DEFAULT 0,
      total_input_tokens INTEGER NOT NULL DEFAULT 0,
      -- Retired columns remain in place so existing databases keep the same schema:
      -- deferred_execute_state was used by the removed turn-boundary execute hold.
      deferred_execute_state TEXT,
      cached_m0_bytes BLOB,
      cached_m0_project_memory_epoch INTEGER,
      cached_m0_workspace_fingerprint TEXT,
      cached_m0_project_user_profile_version INTEGER,
      cached_m0_max_compartment_seq INTEGER,
      cached_m0_max_memory_id INTEGER,
      cached_m0_max_mutation_id INTEGER,
      cached_m0_max_memory_mutation_id INTEGER,
      cached_m0_project_docs_hash TEXT,
      cached_m1_bytes BLOB,
      last_observed_model_key TEXT,
      last_usage_context_limit INTEGER NOT NULL DEFAULT 0,
      prior_boundary_ordinal INTEGER NOT NULL DEFAULT 1,
      protected_tokens_effective INTEGER,
      protected_tokens_pre_snapshot TEXT,
      protected_tail_policy_version INTEGER NOT NULL DEFAULT 0,
      protected_tail_drain_window_started_at INTEGER NOT NULL DEFAULT 0,
      protected_tail_drain_tokens INTEGER NOT NULL DEFAULT 0,
      recovery_no_eligible_head_count INTEGER NOT NULL DEFAULT 0,
      force_emergency_bypass_window_start INTEGER NOT NULL DEFAULT 0,
      force_emergency_bypass_used INTEGER NOT NULL DEFAULT 0,
      emergency_drain_active INTEGER NOT NULL DEFAULT 0,
      historian_drain_failure_at INTEGER NOT NULL DEFAULT 0,
      wrapup_in_progress_state TEXT,
      compaction_mode_record TEXT,
      cached_m0_materialized_at INTEGER,
      cached_m0_session_facts_version INTEGER,
      cached_m0_upgrade_state TEXT,
      cached_m0_system_hash TEXT,
      cached_m0_tool_set_hash TEXT,
      cached_m0_model_key TEXT,
       cached_m0_project_identity TEXT,
       cached_m0_last_baseline_end_message_id TEXT,
       thinking_binding_recovery_target TEXT NOT NULL DEFAULT '',
       upgrade_reminded_at INTEGER,
       pi_stable_id_scheme INTEGER
    );

    CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
      session_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
      started_at INTEGER,
      lease_expires_at INTEGER,
      completed_at INTEGER,
      last_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
      ON tool_owner_backfill_state(status);

    CREATE TABLE IF NOT EXISTS subagent_invocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL,
      subagent TEXT NOT NULL,
      task TEXT,
      provider_id TEXT,
      model_id TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      status TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      parent_invocation_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_sai_session_started
      ON subagent_invocations(session_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sai_subagent
      ON subagent_invocations(subagent, started_at DESC);

    CREATE TABLE IF NOT EXISTS historian_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      subagent_invocation_id INTEGER,
      run_kind TEXT NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      chunk_start_ordinal INTEGER,
      chunk_end_ordinal INTEGER,
      unprocessed_from INTEGER,
      compartments_produced INTEGER NOT NULL DEFAULT 0,
      compartment_id_min INTEGER,
      compartment_id_max INTEGER,
      facts_emitted INTEGER NOT NULL DEFAULT 0,
      facts_by_category_json TEXT,
      events_emitted INTEGER NOT NULL DEFAULT 0,
      importance_min INTEGER,
      importance_max INTEGER,
      importance_avg REAL,
      discarded_last INTEGER NOT NULL DEFAULT 0,
      legacy INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL -- epoch ms (Date.now())
    );
    CREATE INDEX IF NOT EXISTS idx_historian_runs_session
      ON historian_runs(session_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_historian_runs_status
      ON historian_runs(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS transform_decisions (
      session_id         TEXT    NOT NULL,
      harness            TEXT    NOT NULL DEFAULT 'opencode',
      message_id         TEXT    NOT NULL,
      ts_ms              INTEGER NOT NULL,
      decision           TEXT    NOT NULL,
      materialized       INTEGER NOT NULL DEFAULT 0,
      materialize_reason TEXT,
      system_hash_prev      TEXT,
      system_hash_new       TEXT,
      m0_tool_set_hash_prev TEXT,
      m0_tool_set_hash_new  TEXT,
      m0_model_key_prev     TEXT,
      m0_model_key_new      TEXT,
      emergency          INTEGER NOT NULL DEFAULT 0,
      dropped_tokens     INTEGER NOT NULL DEFAULT 0,
      dropped_count      INTEGER NOT NULL DEFAULT 0,
      input_tokens       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (session_id, harness, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
      ON transform_decisions(session_id, harness);

    CREATE INDEX IF NOT EXISTS idx_tags_session_tag_number ON tags(session_id, tag_number);
    CREATE INDEX IF NOT EXISTS idx_tags_session_message_id ON tags(session_id, message_id);
    CREATE INDEX IF NOT EXISTS idx_pending_ops_session ON pending_ops(session_id);
    CREATE INDEX IF NOT EXISTS idx_pending_ops_session_tag_id ON pending_ops(session_id, tag_id);
    CREATE INDEX IF NOT EXISTS idx_source_contents_session ON source_contents(session_id);
    
    CREATE TABLE IF NOT EXISTS recomp_compartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      start_message INTEGER NOT NULL,
      end_message INTEGER NOT NULL,
      start_message_id TEXT DEFAULT '',
      end_message_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      p1 TEXT,
      p2 TEXT,
      p3 TEXT,
      p4 TEXT,
      importance INTEGER NOT NULL DEFAULT 50,
      episode_type TEXT,
      pass_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode',
      UNIQUE(session_id, sequence)
    );

    CREATE TABLE IF NOT EXISTS recomp_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      pass_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE INDEX IF NOT EXISTS idx_session_facts_session ON session_facts(session_id);
    CREATE INDEX IF NOT EXISTS idx_recomp_compartments_session ON recomp_compartments(session_id);
    CREATE INDEX IF NOT EXISTS idx_recomp_facts_session ON recomp_facts(session_id);
    CREATE INDEX IF NOT EXISTS idx_memories_project_status_category ON memories(project_path, status, category);
    CREATE INDEX IF NOT EXISTS idx_memories_project_status_expires ON memories(project_path, status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_memories_project_category_hash ON memories(project_path, category, normalized_hash);
    CREATE INDEX IF NOT EXISTS idx_message_history_index_updated_at ON message_history_index(updated_at);
  `);
  ensureColumn(db, "primer_candidates", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "primer_candidates", "source_start_message_id", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "primer_candidates", "source_end_message_id", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "primer_candidates", "question_embedding", "BLOB");
  ensureColumn(db, "primer_candidates", "question_embedding_model_id", "TEXT");
  ensureColumn(db, "primers", "question_embedding_model_id", "TEXT");
  ensureColumn(db, "primers", "source_candidate_provenance", "TEXT");
  const hasUserMemoriesTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_memories'").get();
  if (hasUserMemoriesTable) {
    ensureColumn(db, "user_memories", "source_candidate_provenance", "TEXT");
  }
  db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_primer_candidates_occurrence
        ON primer_candidates(project_path, harness, session_id, source_start_message_id, source_end_message_id);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
        ON primer_candidates(project_path, source_message_time);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
        ON primer_candidates(session_id, harness);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
        ON primer_candidates(project_path, question_embedding_model_id);
      CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
        ON primers(project_path, status, last_observed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
        ON primers(project_path, question_embedding_model_id);
      CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
        question,
        answer,
        project_path UNINDEXED,
        content='primers',
        content_rowid='id',
        tokenize='porter unicode61'
      );
      CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
        INSERT INTO primers_fts(rowid, question, answer, project_path)
        VALUES (new.id, new.question, new.answer, new.project_path);
      END;
      CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
        INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
        VALUES ('delete', old.id, old.question, old.answer, old.project_path);
      END;
      CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
        INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
        VALUES ('delete', old.id, old.question, old.answer, old.project_path);
        INSERT INTO primers_fts(rowid, question, answer, project_path)
        VALUES (new.id, new.question, new.answer, new.project_path);
      END;
    `);
  ensureColumn(db, "session_meta", "last_nudge_band", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "last_nudge_undropped", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "last_nudge_level", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "channel2_nudge_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "channel2_nudge_claimed_at", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "channel2_nudge_claim_token", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "last_emergency_input_sample", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "last_transform_error", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "nudge_anchor_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "nudge_anchor_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "sticky_turn_reminder_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "sticky_turn_reminder_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_trigger_pending", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "note_nudge_trigger_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_sticky_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_sticky_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_anchors", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "session_meta", "auto_search_hint_decisions", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "session_meta", "last_todo_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_permission_denied", "INTEGER NOT NULL DEFAULT 2");
  ensureColumn(db, "session_meta", "todo_synthetic_call_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_synthetic_anchor_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_synthetic_state_json", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_last_read_at", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "times_execute_threshold_reached", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "observed_safe_input_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cache_alert_sent", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "compartment_in_progress", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_failure_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_last_error", "TEXT DEFAULT NULL");
  ensureColumn(db, "session_meta", "historian_last_failure_at", "INTEGER DEFAULT NULL");
  ensureColumn(db, "session_meta", "system_prompt_hash", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "cleared_reasoning_through_tag", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "tool_reclaim_watermark", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "stripped_placeholder_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "stale_reduce_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "processed_image_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "merged_reasoning_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "thinking_binding_recovery_target", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "trailing_blank_decisions", "TEXT DEFAULT ''");
  ensureColumn(db, "compartments", "start_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "compartments", "end_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "memory_embeddings", "model_id", "TEXT");
  ensureColumn(db, "session_meta", "memory_block_cache", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "memory_block_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "pi_stable_id_scheme", "INTEGER");
  ensureColumn(db, "session_meta", "memory_block_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "dream_queue", "retry_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "reasoning_byte_size", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "drop_mode", "TEXT DEFAULT 'full'");
  ensureColumn(db, "tags", "tool_name", "TEXT");
  ensureColumn(db, "tags", "input_byte_size", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "caveman_depth", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "tool_owner_message_id", "TEXT DEFAULT NULL");
  ensureColumn(db, "tags", "entry_fingerprint", "TEXT");
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_adopt
            ON tags(session_id, entry_fingerprint)
            WHERE type='message' AND entry_fingerprint IS NOT NULL`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_fallback_tool_owner
            ON tags(session_id, tool_owner_message_id)
            WHERE type='tool'`);
  ensureColumn(db, "tags", "token_count", "INTEGER");
  ensureColumn(db, "tags", "input_token_count", "INTEGER");
  ensureColumn(db, "tags", "reasoning_token_count", "INTEGER");
  ensureColumn(db, "task_schedule_state", "schedule", "TEXT");
  ensureColumn(db, "task_schedule_state", "last_checked_commit", "TEXT");
  ensureColumn(db, "task_schedule_state", "last_broad_run_at", "INTEGER");
  ensureColumn(db, "task_schedule_state", "retrospective_watermark_ms", "INTEGER");
  ensureColumn(db, "dream_runs", "parent_session_id", "TEXT");
  ensureColumn(db, "session_meta", "system_prompt_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "compaction_marker_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "compaction_marker_target_end_message_id", "TEXT");
  ensureColumn(db, "session_meta", "key_files", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "conversation_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "tool_call_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "recomp_partial_range_start", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "recomp_partial_range_end", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "detected_context_limit", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "detected_context_limit_model_key", "TEXT");
  ensureColumn(db, "session_meta", "detected_context_limit_provenance", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(db, "session_meta", "needs_emergency_recovery", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "emergency_recovery_origin", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "pending_compaction_marker_state", "TEXT");
  ensureColumn(db, "session_meta", "pending_pi_compaction_marker_state", "TEXT");
  ensureColumn(db, "session_meta", "new_work_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "total_input_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "deferred_execute_state", "TEXT");
  ensureColumn(db, "compartments", "p1", "TEXT");
  ensureColumn(db, "compartments", "p2", "TEXT");
  ensureColumn(db, "compartments", "p3", "TEXT");
  ensureColumn(db, "compartments", "p4", "TEXT");
  ensureColumn(db, "compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
  ensureColumn(db, "compartments", "episode_type", "TEXT");
  ensureColumn(db, "compartments", "p1_embedding", "BLOB");
  ensureColumn(db, "compartments", "p1_embedding_model_id", "TEXT");
  ensureColumn(db, "compartments", "legacy", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "recomp_compartments", "p1", "TEXT");
  ensureColumn(db, "recomp_compartments", "p2", "TEXT");
  ensureColumn(db, "recomp_compartments", "p3", "TEXT");
  ensureColumn(db, "recomp_compartments", "p4", "TEXT");
  ensureColumn(db, "recomp_compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
  ensureColumn(db, "recomp_compartments", "episode_type", "TEXT");
  ensureColumn(db, "memories", "importance", "INTEGER");
  ensureColumn(db, "memories", "classified_at", "INTEGER");
  ensureColumn(db, "memories", "mural_cue", "TEXT");
  ensureColumn(db, "memories", "mural_cue_hash", "TEXT");
  ensureColumn(db, "memories", "mural_cue_at", "INTEGER");
  ensureColumn(db, "memory_verifications", "mapped_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
  ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_workspace_fingerprint", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_memory_mutation_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m1_bytes", "BLOB");
  ensureColumn(db, "session_meta", "last_observed_model_key", "TEXT");
  ensureColumn(db, "session_meta", "last_usage_context_limit", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "prior_boundary_ordinal", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "session_meta", "protected_tokens_effective", "INTEGER");
  ensureColumn(db, "session_meta", "protected_tokens_pre_snapshot", "TEXT");
  ensureColumn(db, "session_meta", "protected_tail_policy_version", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "protected_tail_drain_window_started_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "protected_tail_drain_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "recovery_no_eligible_head_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "force_emergency_bypass_window_start", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "force_emergency_bypass_used", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "emergency_drain_active", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_drain_failure_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "wrapup_in_progress_state", "TEXT");
  ensureColumn(db, "session_meta", "compaction_mode_record", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_system_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_tool_set_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_model_key", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_project_identity", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_last_baseline_end_message_id", "TEXT");
  ensureColumn(db, "session_meta", "upgrade_reminded_at", "INTEGER");
  ensureColumn(db, "session_meta", "upgrade_reminder_last_sent_at", "INTEGER");
  ensureColumn(db, "session_meta", "upgrade_reminder_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cached_m0_mural_data_url", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_mural_hash", "TEXT");
  db.exec(`
      CREATE TABLE IF NOT EXISTS project_state (
        project_path TEXT PRIMARY KEY,
        project_memory_epoch INTEGER NOT NULL DEFAULT 0,
        project_user_profile_version INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS session_projects (
        session_id TEXT NOT NULL,
        harness TEXT NOT NULL DEFAULT 'opencode',
        project_path TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(session_id, harness)
      );
      CREATE INDEX IF NOT EXISTS idx_session_projects_project
        ON session_projects(project_path);
      CREATE TABLE IF NOT EXISTS m0_mutation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        mutation_type TEXT NOT NULL CHECK (mutation_type IN (
          'compartment_delete', 'compartment_merge', 'recomp_boundary_change', 'compartment_upgrade'
        )),
        target_id INTEGER,
        queued_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session ON m0_mutation_log(session_id);
      CREATE TABLE IF NOT EXISTS memory_mutation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_path TEXT NOT NULL,
        mutation_type TEXT NOT NULL CHECK (mutation_type IN ('archive', 'delete', 'update', 'superseded')),
        target_memory_id INTEGER NOT NULL,
        superseded_by_id INTEGER,
        category TEXT,
        new_content TEXT,
        queued_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
        ON memory_mutation_log(project_path, id);
       CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
         old_project_path TEXT PRIMARY KEY,
         new_project_path TEXT NOT NULL,
         rekeyed_at INTEGER NOT NULL
       );
       CREATE TABLE IF NOT EXISTS identity_merge_log (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         from_identity TEXT NOT NULL,
         to_identity TEXT NOT NULL,
         table_name TEXT NOT NULL,
         row_id TEXT NOT NULL,
         action TEXT NOT NULL,
         target_row_id TEXT,
         merged_at INTEGER NOT NULL
       );
       CREATE INDEX IF NOT EXISTS idx_identity_merge_log_identities
         ON identity_merge_log(from_identity, to_identity, merged_at);
       CREATE INDEX IF NOT EXISTS idx_identity_merge_log_table_row
         ON identity_merge_log(table_name, row_id);
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
      );
      CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        project_path TEXT NOT NULL,
        display_name TEXT NOT NULL,
        display_path TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (workspace_id, project_path)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique ON workspace_members(project_path);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name ON workspace_members(workspace_id, display_name);
      CREATE TABLE IF NOT EXISTS v22_backfill_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        raw_project_path TEXT NOT NULL,
        error_class TEXT NOT NULL CHECK (error_class IN ('not_git_repo', 'git_missing', 'git_timeout', 'permission_denied', 'unknown')),
        error_message TEXT,
        failed_at INTEGER NOT NULL,
        UNIQUE(table_name, row_id)
      );
      CREATE TABLE IF NOT EXISTS transform_decisions (
        session_id         TEXT    NOT NULL,
        harness            TEXT    NOT NULL DEFAULT 'opencode',
        message_id         TEXT    NOT NULL,
        ts_ms              INTEGER NOT NULL,
        decision           TEXT    NOT NULL,
        materialized       INTEGER NOT NULL DEFAULT 0,
        materialize_reason TEXT,
      system_hash_prev      TEXT,
      system_hash_new       TEXT,
      m0_tool_set_hash_prev TEXT,
      m0_tool_set_hash_new  TEXT,
      m0_model_key_prev     TEXT,
      m0_model_key_new      TEXT,
        emergency          INTEGER NOT NULL DEFAULT 0,
        dropped_tokens     INTEGER NOT NULL DEFAULT 0,
        dropped_count      INTEGER NOT NULL DEFAULT 0,
        input_tokens       INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (session_id, harness, message_id)
      );
      CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
        ON transform_decisions(session_id, harness);
    `);
  ensureColumn(db, "transform_decisions", "system_hash_prev", "TEXT");
  ensureColumn(db, "transform_decisions", "system_hash_new", "TEXT");
  ensureColumn(db, "transform_decisions", "m0_model_key_prev", "TEXT");
  ensureColumn(db, "transform_decisions", "m0_model_key_new", "TEXT");
  ensureColumn(db, "tags", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "message_history_index", "dirty_floor_ordinal", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pending_ops", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "source_contents", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "compartments", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "compression_depth", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "session_facts", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "session_meta", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "recomp_compartments", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "recomp_facts", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "message_history_index", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  db.exec(`
      CREATE INDEX IF NOT EXISTS idx_message_history_index_orphan_sweep
        ON message_history_index(harness, session_id, updated_at);
    `);
  ensureColumn(db, "workspaces", "share_categories", `TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'`);
}
var CHANNEL2_CLAIM_TTL_MS = 10 * 60000;
function healWedgedChannel2Claims(db) {
  try {
    const staleBefore = Date.now() - CHANNEL2_CLAIM_TTL_MS;
    db.prepare("UPDATE session_meta SET channel2_nudge_state = '', channel2_nudge_claimed_at = 0, channel2_nudge_claim_token = '' WHERE channel2_nudge_state = 'claimed' AND (channel2_nudge_claimed_at IS NULL OR channel2_nudge_claimed_at = 0 OR channel2_nudge_claimed_at <= ?)").run(staleBefore);
  } catch {}
}
async function openDatabaseAsync(dbPathOrOptions) {
  const options = typeof dbPathOrOptions === "string" ? { dbPath: dbPathOrOptions } : dbPathOrOptions;
  const explicitDbPath = options?.dbPath !== undefined;
  const { dbDir, dbPath } = resolveDatabasePath(options?.dbPath);
  const latestSupportedVersion = getRuntimeLatestSupportedVersion(options);
  const busyTimeoutMs = resolveBootBusyTimeoutMs(options?.busyTimeoutMs);
  lastSchemaFenceRejection = null;
  lastMigrationOnOpenRefusal = null;
  const existing = databases.get(dbPath);
  if (existing) {
    const startedAt = performance.now();
    const accepted = enforceSchemaFence(existing, dbPath, latestSupportedVersion);
    if (accepted) {
      if (!persistenceByDatabase.has(existing))
        persistenceByDatabase.set(existing, true);
      healWedgedChannel2Claims(existing);
    }
    options?.onBootTimings?.({
      openMs: performance.now() - startedAt,
      guardMs: 0,
      migrateMs: 0
    });
    return accepted ? existing : null;
  }
  const pending = pendingAsyncOpens.get(dbPath);
  if (pending)
    return pending;
  const opening = (async () => {
    let db;
    const openStartedAt = performance.now();
    let openMs = 0;
    let guardMs = 0;
    let migrateMs = 0;
    let guardStartedAt = null;
    let migrateStartedAt = null;
    try {
      if (!explicitDbPath)
        migrateLegacyStorageIfNeeded(dbPath, dbDir);
      ensureSecureStorageDir(dbDir);
      db = new Database(dbPath);
      installBootBusyTimeout(db, dbPath, busyTimeoutMs, options?.onBootBusyTimeout);
      openMs = performance.now() - openStartedAt;
      guardStartedAt = performance.now();
      if (!enforceSchemaFence(db, dbPath, latestSupportedVersion)) {
        guardMs = performance.now() - guardStartedAt;
        closeQuietly(db);
        return null;
      }
      if (!enforceMigrationOnOpenGuard(db, dbPath, dbDir, latestSupportedVersion)) {
        guardMs = performance.now() - guardStartedAt;
        closeQuietly(db);
        return null;
      }
      guardMs = performance.now() - guardStartedAt;
      migrateStartedAt = performance.now();
      initializeDatabase(db, busyTimeoutMs);
      await runMigrationsWithRetry(db);
      ensureContextStoreUuid(db);
      const opened = finishDatabaseOpen(db, dbPath, explicitDbPath, latestSupportedVersion);
      migrateMs = performance.now() - migrateStartedAt;
      return opened;
    } catch (error) {
      if (db)
        closeQuietly(db);
      const detail = getErrorMessage(error);
      log(`[magic-context] storage fatal: failed to open ${dbPath}: ${detail}`);
      throw new Error(`[magic-context] storage unavailable: ${detail}. Magic Context is disabled for this run; check log for details.`);
    } finally {
      if (openMs === 0)
        openMs = performance.now() - openStartedAt;
      if (guardStartedAt !== null && guardMs === 0) {
        guardMs = performance.now() - guardStartedAt;
      }
      if (migrateStartedAt !== null && migrateMs === 0) {
        migrateMs = performance.now() - migrateStartedAt;
      }
      options?.onBootTimings?.({ openMs, guardMs, migrateMs });
    }
  })();
  pendingAsyncOpens.set(dbPath, opening);
  try {
    return await opening;
  } finally {
    if (pendingAsyncOpens.get(dbPath) === opening)
      pendingAsyncOpens.delete(dbPath);
  }
}

// src/doctor/doctor.ts
async function classifyDatabaseOpen(dbPath) {
  try {
    const db = await openDatabaseAsync({ dbPath });
    if (db === null) {
      const fence = getSchemaFenceRejection();
      if (fence !== null)
        return { kind: "schema-fence", detail: fence };
      const guard = getMigrationOnOpenRefusal();
      if (guard !== null)
        return { kind: "migration-guard", detail: guard };
      return {
        kind: "migration-guard",
        detail: "open returned null without a recorded reason"
      };
    }
    return {
      kind: "ok",
      db,
      schemaVersion: getPersistedSchemaVersion(db),
      latestSupported: LATEST_SUPPORTED_VERSION
    };
  } catch (error) {
    return { kind: "fatal", detail: errorMessage(error) };
  }
}
function scanLivenessMarkers(storageDir) {
  const rpcRoot = join7(storageDir, "rpc");
  if (!existsSync10(rpcRoot))
    return { markers: [], liveCount: 0 };
  const markers = [];
  let projectDirs = [];
  try {
    projectDirs = readdirSync4(rpcRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return { markers: [], liveCount: 0 };
  }
  for (const projectDir of projectDirs) {
    const dirPath = join7(rpcRoot, projectDir);
    let files = [];
    try {
      files = readdirSync4(dirPath);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.startsWith("port-") || !file.endsWith(".json"))
        continue;
      const path = join7(dirPath, file);
      try {
        const record = JSON.parse(readFileSync8(path, "utf8"));
        markers.push({
          path,
          pid: record.pid,
          live: pidAlive(record.pid),
          port: record.port
        });
      } catch {
        markers.push({ path, pid: NaN, live: false, port: 0 });
      }
    }
  }
  return { markers, liveCount: markers.filter((marker) => marker.live).length };
}
function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function profileBundleFacts(dshHome, profileName) {
  const packageJsonPath = join7(dshHome, "profiles", profileName, "package.json");
  const packageJsonExists = existsSync10(packageJsonPath);
  let bundles = [];
  if (packageJsonExists) {
    const parsed = readJsoncFile(packageJsonPath);
    const raw = parsed?.dsh?.profile?.bundles;
    if (Array.isArray(raw))
      bundles = raw.map(String);
  }
  const bundleInstalled = bundles.includes(MAGIC_CONTEXT_PACKAGE);
  const nodeModulesPackageExists = existsSync10(join7(dshHome, "profiles", profileName, "node_modules", MAGIC_CONTEXT_PACKAGE));
  return {
    name: profileName,
    packageJsonPath,
    packageJsonExists,
    bundles,
    bundleInstalled,
    nodeModulesPackageExists
  };
}
function listProfiles(dshHome) {
  const profilesRoot = join7(dshHome, "profiles");
  if (!existsSync10(profilesRoot))
    return [];
  try {
    return readdirSync4(profilesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== "node_modules").map((entry) => entry.name);
  } catch {
    return [];
  }
}
async function runDshDoctor(argv, options = {}) {
  const { flags } = parseFlags(argv);
  const env = options.env ?? process.env;
  const dshHome = options.dshHome ?? stringFlag(flags, "dsh-home") ?? resolveDshHome(env);
  const dshInstallDir = options.dshInstallDir ?? stringFlag(flags, "dsh-install");
  const stockPresetPath = options.stockPresetPath ?? stringFlag(flags, "stock-preset");
  const directory = options.directory ?? stringFlag(flags, "directory") ?? process.cwd();
  const profileFilter = options.profile ?? stringFlag(flags, "profile");
  const checks = [];
  const located = locateDshInstall({ dshHome, dshInstallDir, stockPresetPath, env });
  if (located.dshInstallDir === undefined) {
    checks.push({
      id: "dsh-version",
      title: "DSH version",
      status: "fail",
      detail: `Could not locate the DSH install (expected ${DSH_COMPAT_EXPECTED_VERSION}). Probed:
` + located.tried.map((candidate) => `  - ${candidate}`).join(`
`),
      fix: `Install DSH ${DSH_COMPAT_EXPECTED_VERSION} or pass --dsh-install <dir>.`
    });
  } else {
    const manifestPath = join7(located.dshInstallDir, "package.json");
    let installedVersion;
    try {
      const parsed = JSON.parse(readFileSync8(manifestPath, "utf8"));
      if (typeof parsed.version === "string")
        installedVersion = parsed.version;
    } catch (error) {
      checks.push({
        id: "dsh-version",
        title: "DSH version",
        status: "fail",
        detail: `${manifestPath}: ${errorMessage(error)}`,
        fix: `Reinstall DSH ${DSH_COMPAT_EXPECTED_VERSION}.`
      });
      installedVersion = undefined;
    }
    if (installedVersion !== undefined) {
      if (isSupportedDshVersion(installedVersion)) {
        checks.push({
          id: "dsh-version",
          title: "DSH version",
          status: "ok",
          detail: `${located.dshInstallDir} → ${installedVersion} (compat contract ${DSH_COMPAT_EXPECTED_VERSION}.x).`
        });
      } else {
        checks.push({
          id: "dsh-version",
          title: "DSH version",
          status: "fail",
          detail: `installed ${installedVersion} at ${located.dshInstallDir}; the adapter targets ` + `the ${DSH_COMPAT_EXPECTED_VERSION}.x release line (compat/dsh-0.1).`,
          fix: `Install a ${DSH_COMPAT_EXPECTED_VERSION}.x release of ${DSH_PACKAGE}.`
        });
      }
    }
  }
  const profiles = profileFilter !== undefined ? [profileFilter] : listProfiles(dshHome);
  if (profiles.length === 0) {
    checks.push({
      id: "bundle-install",
      title: "Bundle install state",
      status: "warn",
      detail: `no profiles found under ${join7(dshHome, "profiles")}.`,
      fix: `Create a profile first (e.g. dsh --profile web), then add ${MAGIC_CONTEXT_PACKAGE}.`
    });
  } else {
    let installedCount = 0;
    for (const profileName of profiles) {
      const facts = profileBundleFacts(dshHome, profileName);
      if (facts.bundleInstalled)
        installedCount += 1;
      const status = !facts.packageJsonExists ? "warn" : facts.bundleInstalled ? "ok" : "fail";
      checks.push({
        id: `bundle-install.${profileName}`,
        title: `Bundle install state — profile ${profileName}`,
        status,
        detail: facts.bundleInstalled ? `${MAGIC_CONTEXT_PACKAGE} is in dsh.profile.bundles` + (facts.nodeModulesPackageExists ? " and resolvable in node_modules." : " but NOT resolvable in node_modules.") : `${MAGIC_CONTEXT_PACKAGE} is missing from dsh.profile.bundles` + (facts.packageJsonExists ? ` (current bundles: ${facts.bundles.join(", ") || "none"}).` : ` (${facts.packageJsonPath} missing).`),
        fix: `dsh plugin --profile ${profileName} add ${MAGIC_CONTEXT_PACKAGE} (or edit the profile package.json dsh.profile.bundles manually).`
      });
    }
    if (installedCount === 0 && profiles.length > 0) {
      checks.push({
        id: "bundle-install",
        title: "Bundle install state (summary)",
        status: "fail",
        detail: `${MAGIC_CONTEXT_PACKAGE} is not installed in any profile.`,
        fix: `dsh plugin --profile <name> add ${MAGIC_CONTEXT_PACKAGE}`
      });
    }
  }
  {
    let presetStatus = "ok";
    let presetDetail = "";
    const ownPatchUrl = new URL("../../cordis.patch.yml", import.meta.url);
    try {
      if (located.stockPresetPath === undefined) {
        presetStatus = "fail";
        presetDetail = `could not locate the shipped standard preset patch for ${dshHome} ` + `(probed: ${located.tried.join(", ")}).`;
      } else {
        const shipped = parseEntryListYaml(readFileSync8(located.stockPresetPath, "utf8"));
        const declared = readPresetDeclaration(shipped, STOCK_PRESET_ROW_ID);
        if (typeof declared === "string" || declared.plugins === undefined) {
          presetStatus = "fail";
          presetDetail = `${located.stockPresetPath}: ${typeof declared === "string" ? declared : "no plugin list"} ` + `— this bundle overrides that row and cannot be verified.`;
        } else {
          const stockPlugins = declared.plugins;
          const ownPatch = parseEntryListYaml(readFileSync8(ownPatchUrl, "utf8"));
          const own = readPresetDeclaration(ownPatch, STOCK_PRESET_ROW_ID);
          if (typeof own === "string") {
            presetStatus = "fail";
            presetDetail = `cordis.patch.yml: ${own}`;
          } else {
            const plugins = own.plugins ?? [];
            const problems = [];
            const stockIds = new Set(stockPlugins.map((row) => row.id).filter((id) => typeof id === "string"));
            for (const row of plugins) {
              if (row.id === MAGIC_AGENT_ROW_ID || row.id === MAGIC_COMPACTION_ROW_ID)
                continue;
              if (typeof row.id === "string" && !stockIds.has(row.id)) {
                problems.push(`row "${row.id}" is not in the shipped preset`);
              }
            }
            const missing = [...stockIds].filter((id) => !plugins.some((row) => row.id === id));
            if (missing.length > 0) {
              problems.push(`shipped rows dropped by the override: ${missing.join(", ")}`);
            }
            if (findPresetRow(plugins, MAGIC_COMPACTION_ROW_ID) === undefined) {
              problems.push(`missing "${MAGIC_COMPACTION_ROW_ID}" row`);
            }
            if (findPresetRow(plugins, MAGIC_AGENT_ROW_ID) === undefined) {
              problems.push(`missing "${MAGIC_AGENT_ROW_ID}" row`);
            }
            const basicRow = findPresetRow(plugins, STOCK_COMPACTION_BASIC_ROW.id);
            if (basicRow !== undefined && basicRow.disabled !== true) {
              problems.push("compaction-basic is not disabled (both engines would compress)");
            }
            for (const stockRow of stockPlugins) {
              const id = stockRow.id;
              if (typeof id !== "string")
                continue;
              if (id === MAGIC_AGENT_ROW_ID || id === MAGIC_COMPACTION_ROW_ID)
                continue;
              const ownRow = findPresetRow(plugins, id);
              if (ownRow === undefined)
                continue;
              if (stockRow.config === undefined)
                continue;
              const ownConfig = ownRow.config;
              if (ownConfig === undefined) {
                problems.push(`row "${id}" dropped the shipped config`);
                continue;
              }
              for (const key of Object.keys(stockRow.config)) {
                if (!(key in ownConfig)) {
                  problems.push(`row "${id}" dropped config.${key}`);
                }
              }
            }
            if (problems.length > 0) {
              presetStatus = "fail";
              presetDetail = `the preset override drifted from the shipped list: ${problems.join("; ")}. ` + `DSH upgraded its standard preset — regenerate cordis.patch.yml.`;
            } else {
              presetDetail = `${STOCK_PRESET_ROW_ID} override restates all ${String(stockIds.size)} shipped ` + `rows plus ${MAGIC_COMPACTION_ROW_ID} and ${MAGIC_AGENT_ROW_ID} ` + `(shipped patch: ${located.stockPresetPath}).`;
            }
          }
        }
      }
    } catch (error) {
      presetStatus = "fail";
      presetDetail = `${ownPatchUrl.pathname}: ${errorMessage(error)}`;
    }
    checks.push({
      id: "preset-override",
      title: "Preset override (standard)",
      status: presetStatus,
      detail: presetDetail,
      fix: "Regenerate cordis.patch.yml from the shipped standard preset, then reinstall the bundle."
    });
  }
  const storageDir = options.storageDirOverride ?? getMagicContextStorageDir();
  const dbPath = options.dbPathOverride ?? join7(storageDir, "context.db");
  if (!existsSync10(dbPath)) {
    checks.push({
      id: "shared-db",
      title: "Shared DB",
      status: "warn",
      detail: `${dbPath} does not exist yet (storage dir: ${storageDir}).`,
      fix: "Start a session or run `dsh-magic-context setup`, then re-run doctor."
    });
  } else {
    const outcome = await classifyDatabaseOpen(dbPath);
    switch (outcome.kind) {
      case "ok": {
        outcome.db?.close();
        checks.push({
          id: "shared-db",
          title: "Shared DB",
          status: "ok",
          detail: `${dbPath}: opened; schema v${outcome.schemaVersion} (adapter supports ` + `up to v${outcome.latestSupported}).`
        });
        break;
      }
      case "schema-fence":
        checks.push({
          id: "shared-db",
          title: "Shared DB",
          status: "fail",
          detail: `${dbPath}: schema fence refused the open — the persisted schema is ` + `newer than this adapter supports. ${formatDetail(outcome.detail)}`,
          fix: "Update Magic Context / the DSH adapter to a build that supports the newer schema."
        });
        break;
      case "migration-guard":
        checks.push({
          id: "shared-db",
          title: "Shared DB",
          status: "fail",
          detail: `${dbPath}: the migration-on-open guard refused the open — another ` + `harness process may still be running against this database. ${formatDetail(outcome.detail)}`,
          fix: "Close every OpenCode / Pi / DSH process that may hold the DB, then re-run doctor."
        });
        break;
      case "fatal":
        checks.push({
          id: "shared-db",
          title: "Shared DB",
          status: "fail",
          detail: `${dbPath}: ${String(outcome.detail ?? "unknown open error")}`,
          fix: "Repair or restore the database; see doctor repair guidance."
        });
        break;
    }
  }
  const markerScan = scanLivenessMarkers(storageDir);
  if (markerScan.liveCount === 0) {
    checks.push({
      id: "liveness-markers",
      title: "Liveness markers",
      status: "ok",
      detail: markerScan.markers.length === 0 ? `${join7(storageDir, "rpc")}: no DSH liveness markers.` : `${markerScan.markers.length} marker(s) found, all from dead processes (stale, harmless).`
    });
  } else {
    checks.push({
      id: "liveness-markers",
      title: "Liveness markers",
      status: "warn",
      detail: `${markerScan.liveCount} live DSH liveness marker(s) under ${join7(storageDir, "rpc")} — ` + `a running harness process may hold the migration guard.`,
      fix: "If no harness is actually running, remove the stale port-*.json marker files."
    });
  }
  const configPath = resolveCortexKitUserConfigPath();
  const loaded = loadPluginConfigDetailed(directory);
  const outcome = loaded.loadOutcome;
  const statusForOutcome = {
    ok: "ok",
    "schema-recovery": "warn",
    "substitution-failure": "warn",
    "legacy-config-unmigrated": "warn",
    "project-file-parse-error": "fail",
    "project-file-io-error": "fail"
  };
  const configStatus = !existsSync10(configPath) ? "warn" : statusForOutcome[outcome] ?? "warn";
  checks.push({
    id: "config-load",
    title: "Config loading",
    status: configStatus,
    detail: `${existsSync10(configPath) ? configPath : "no user config (defaults apply)"} ` + `→ loadOutcome=${outcome} (user: ${loaded.sources.userConfig}, project: ${loaded.sources.projectConfig})` + (loaded.config.configWarnings?.length ? `; warnings: ${loaded.config.configWarnings.join(" | ")}` : ""),
    fix: configStatus === "ok" ? undefined : configStatus === "fail" ? "Fix the config file parse error, then re-run doctor." : "Review the config warnings; run `dsh-magic-context setup` to bootstrap a user config."
  });
  return {
    exitCode: checks.some((check) => check.status === "fail") ? 1 : 0,
    checks
  };
}
function formatDetail(detail) {
  if (detail === undefined || detail === null)
    return "";
  if (typeof detail === "string")
    return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

// src/doctor/cli.ts
var VERSION = "0.1.0";
function printSetupReport(report) {
  for (const step of report.steps) {
    const mark = step.status === "ok" ? "ok  " : step.status === "warn" ? "warn" : "FAIL";
    console.log(`[${mark}] ${step.title}`);
    for (const line of step.detail.split(`
`))
      console.log(`       ${line}`);
  }
  if (report.nextSteps.length > 0) {
    console.log(`
Next steps:`);
    for (const line of report.nextSteps)
      console.log(`  - ${line}`);
  }
}
function printDoctorReport(report) {
  for (const check of report.checks) {
    const mark = check.status === "ok" ? "ok  " : check.status === "warn" ? "warn" : "FAIL";
    console.log(`[${mark}] ${check.title}`);
    for (const line of check.detail.split(`
`))
      console.log(`       ${line}`);
    if (check.fix !== undefined)
      console.log(`       fix: ${check.fix}`);
  }
}
function usage() {
  console.log([
    `${MAGIC_CONTEXT_PACKAGE} — Magic Context DSH adapter tools`,
    "",
    "Usage:",
    "  dsh-magic-context setup   [--dsh-home <dir>] [--dsh-install <dir>]",
    "                            [--stock-preset <file>] [--profile <name>] [--dry-run]",
    "  dsh-magic-context doctor  [--dsh-home <dir>] [--dsh-install <dir>]",
    "                            [--stock-preset <file>] [--profile <name>]",
    "                            [--directory <dir>]",
    "  dsh-magic-context --version",
    ""
  ].join(`
`));
}
async function main(argv) {
  const command = argv[0];
  const rest = argv.slice(1);
  switch (command) {
    case "setup": {
      const report = await runDshSetup(rest);
      printSetupReport(report);
      return report.exitCode;
    }
    case "doctor": {
      const report = await runDshDoctor(rest);
      printDoctorReport(report);
      return report.exitCode;
    }
    case "--version":
    case "-v":
      console.log(VERSION);
      return 0;
    default:
      usage();
      return command === undefined ? 0 : 2;
  }
}
function isDirectEntry() {
  const entry = process.argv[1];
  if (entry === undefined)
    return false;
  const normalized = entry.replace(/\\/g, "/");
  return import.meta.url.endsWith(normalized) || import.meta.url.endsWith(normalized.split("/").pop() ?? "");
}
if (isDirectEntry()) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }, (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
export {
  main,
  printDoctorReport,
  printSetupReport
};
