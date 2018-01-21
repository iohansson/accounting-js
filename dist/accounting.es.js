/**
 * The library's settings configuration interface.
 *
 * @typedef {Object} Settings
 * @property {String} [symbol='$'] - Currency symbol
 * @property {String|CurrencyFormat} [format='%s%v'] - Controls output: %s = symbol, %v = value (can be object, see docs)
 * @property {String} [decimal='.'] - Decimal point separator
 * @property {String} [thousand=','] - Thousands separator
 * @property {Number} [precision=2] - Number of decimal places to round the amount to
 * @property {Number} [grouping=3] - Digit grouping (not implemented yet)
 * @property {Boolean} [stripZeros=false] - Strip insignificant zeros from decimal part
 * @property {Float} [fallback=0] - Value returned on unformat() failure
 * @property {Number} [round=0] - Decide round direction.
 */

/**
 * Currency format interface.
 *
 * Each property represents template string used by formatMoney.
 * Inside this template you can use these patterns:
 * - **%s** - Currency symbol
 * - **%v** - Amount
 *
 * **Examples**:
 * ```js
 * '%s %v'   => '$ 1.00'
 * '%s (%v)' => '$ (1.00)'
 * '%s  -- ' => '$  --'
 * ```
 *
 * @typedef {Format} CurrencyFormat
 * @property {String} pos - Currency format for positive values
 * @property {String} [neg=pos] - Currency format for positive values
 * @property {String} [zero=pos] - Currency format for positive values
 *
 */

/**
 * The library's default settings configuration object.
 * Contains default parameters for currency and number formatting.
 *
 * @type {Settings} settings
 */
var settings = {
  symbol: '$',
  format: '%s%v',
  decimal: '.',
  thousand: ',',
  precision: 2,
  grouping: 3,
  stripZeros: false,
  fallback: 0,
  round: 0
};

/**
 * Takes a string/array of strings, removes all formatting/cruft and returns the raw float value.
 *
 * Decimal must be included in the regular expression to match floats (defaults to
 * `settings.decimal`), so if the number uses a non-standard decimal
 * separator, provide it as the second argument.
 *
 * Also matches bracketed negatives (eg. `'$ (1.99)' => -1.99`).
 *
 * Doesn't throw any errors (`NaN`s become 0 or provided by fallback value).
 *
 * _Alias_: `parse(value, decimal, fallback)`
 *
 * **Usage:**
 *
 * ```js
 * unformat('£ 12,345,678.90 GBP');
 * // => 12345678.9
 * ```
 *
 * @access public
 * @param {String|Array<String>} value - String or array of strings containing the number/s to parse
 * @param {Number} [decimal=settings.decimal] - Number of decimal digits of the resultant number
 * @param {Float} [fallback=settings.fallback] - Value returned on unformat() failure
 * @return {Float} - Parsed number
 */
function unformat(value) {
  var decimal = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : settings.decimal;
  var fallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : settings.fallback;

  // Recursively unformat arrays:
  if (Array.isArray(value)) {
    return value.map(function (val) {
      return unformat(val, decimal, fallback);
    });
  }

  // Return the value as-is if it's already a number
  if (typeof value === 'number') return value;

  // Build regex to strip out everything except digits, decimal point and minus sign
  var regex = new RegExp('[^0-9-(-)-' + decimal + ']', ['g']);
  var unformattedValueString = ('' + value).replace(regex, '') // strip out any cruft
  .replace(decimal, '.') // make sure decimal point is standard
  .replace(/\(([-]*\d*[^)]?\d+)\)/g, '-$1') // replace bracketed values with negatives
  .replace(/\((.*)\)/, ''); // remove any brackets that do not have numeric value

  /**
   * Handling -ve number and bracket, eg.
   * (-100) = 100, -(100) = 100, --100 = 100
   */
  var negative = (unformattedValueString.match(/-/g) || 2).length % 2,
      absUnformatted = parseFloat(unformattedValueString.replace(/-/g, '')),
      unformatted = absUnformatted * (negative ? -1 : 1);

  // This will fail silently which may cause trouble, let's wait and see
  return !isNaN(unformatted) ? unformatted : fallback;
}

/**
 * Check and normalise the value of precision (must be positive integer).
 */
function checkPrecision(val, base) {
  val = Math.round(Math.abs(val));
  return isNaN(val) ? base : val;
}

/**
 * Implementation of toFixed() that treats floats more like decimals.
 *
 * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
 * problems for accounting- and finance-related software.
 *
 * **Usage:**
 *
 * ```js
 * // Native toFixed has rounding issues
 * (0.615).toFixed(2);
 * // => '0.61'
 *
 * // With accounting-js
 * toFixed(0.615, 2);
 * // => '0.62'
 * ```
 *
 * @access public
 * @param {Float} value - Float to be treated as a decimal number
 * @param {Number} [precision=settings.precision] - Number of decimal digits to keep
 * @param {Number} [round=settings.round] - Decide round direction
 * @return {String} - Given number transformed into a string with the given precission
 */
function toFixed(value, precision, round) {
  precision = checkPrecision(precision, settings.precision);
  var power = Math.pow(10, precision);

  var roundMethod = void 0;
  if (round > 0) {
    roundMethod = Math.ceil;
  } else if (round < 0) {
    roundMethod = Math.floor;
  } else {
    roundMethod = Math.round;
  }
  // Multiply up by precision, round accurately, then divide and use native toFixed()
  return (roundMethod((value + 1e-11) * power) / power).toFixed(precision);
}

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

function stripInsignificantZeros(str, decimal) {
  var parts = str.split(decimal);
  var integerPart = parts[0];
  var decimalPart = parts[1].replace(/0+$/, '');

  if (decimalPart.length > 0) {
    return integerPart + decimal + decimalPart;
  }

  return integerPart;
}

/**
 * Format a number, with comma-separated thousands and custom precision/decimal places.
 *
 * _Alias_: `format(number, opts)`
 *
 * **Usage:**
 *
 * ```js
 * // Default usage
 * formatNumber(5318008);
 * // => 5,318,008
 *
 * // Custom format
 * formatNumber(9876543.21, { precision: 3, thousand: " " });
 * // => 9 876 543.210
 * ```
 *
 * @access public
 * @param {Number} number - Number to be formatted
 * @param {Object} [opts={}] - Object containing all the options of the method
 * @return {String} - Given number properly formatted
  */
function formatNumber(number) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // Resursively format arrays:
  if (Array.isArray(number)) {
    return number.map(function (val) {
      return formatNumber(val, opts);
    });
  }

  // Build options object from second param (if object) or all params, extending defaults
  opts = objectAssign({}, settings, opts);

  // Do some calc
  var negative = number < 0 ? '-' : '';
  var base = parseInt(toFixed(Math.abs(number), opts.precision, opts.round), 10) + '';
  var mod = base.length > 3 ? base.length % 3 : 0;

  // Format the number
  var formatted = negative + (mod ? base.substr(0, mod) + opts.thousand : '') + base.substr(mod).replace(/(\d{3})(?=\d)/g, '$1' + opts.thousand) + (opts.precision > 0 ? opts.decimal + toFixed(Math.abs(number), opts.precision).split('.')[1] : '');

  return opts.stripZeros ? stripInsignificantZeros(formatted, opts.decimal) : formatted;
}

var strValue = String.prototype.valueOf;
var tryStringObject = function tryStringObject(value) {
	try {
		strValue.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var strClass = '[object String]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isString = function isString(value) {
	if (typeof value === 'string') { return true; }
	if (typeof value !== 'object') { return false; }
	return hasToStringTag ? tryStringObject(value) : toStr.call(value) === strClass;
};

/**
 * Parses a format string or object and returns format obj for use in rendering.
 *
 * `format` is either a string with the default (positive) format, or object
 * containing `pos` (required), `neg` and `zero` values.
 *
 * Either string or format.pos must contain '%v' (value) to be valid.
 *
 * @private
 * @param {String} [format='%s%v'] - String with the format to apply, where %s is the currency symbol and %v is the value
 * @return {Object} object represnting format (with pos, neg and zero attributes)
 */
function checkCurrencyFormat(format) {
  // Format should be a string, in which case `value` ('%v') must be present
  if (isString(format) && format.match('%v')) {
    // Create and return positive, negative and zero formats
    return {
      pos: format,
      neg: format.replace('-', '').replace('%v', '-%v'),
      zero: format
    };
  }

  // Otherwise, assume format was fine
  return format;
}

/**
 * Format a number into currency.
 *
 * **Usage:**
 *
 * ```js
 * // Default usage
 * formatMoney(12345678);
 * // => $12,345,678.00
 *
 * // European formatting (custom symbol and separators)
 * formatMoney(4999.99, { symbol: "€", precision: 2, thousand: ".", decimal: "," });
 * // => €4.999,99
 *
 * // Negative values can be formatted nicely
 * formatMoney(-500000, { symbol: "£ ", precision: 0 });
 * // => £ -500,000
 *
 * // Simple `format` string allows control of symbol position (%v = value, %s = symbol)
 * formatMoney(5318008, { symbol: "GBP",  format: "%v %s" });
 * // => 5,318,008.00 GBP
 * ```
 *
 * @access public
 * @param {Number} amount - Amount to be formatted
 * @param {Object} [opts={}] - Object containing all the options of the method
 * @return {String} - Given number properly formatted as money
 */
function formatMoney(amount) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // Resursively format arrays
  if (Array.isArray(amount)) {
    return amount.map(function (value) {
      return formatMoney(value, opts);
    });
  }

  // Build options object from second param (if object) or all params, extending defaults
  opts = objectAssign({}, settings, opts);

  // Check format (returns object with pos, neg and zero)
  var formats = checkCurrencyFormat(opts.format);

  // Choose which format to use for this value
  var useFormat = void 0;

  if (amount > 0) {
    useFormat = formats.pos;
  } else if (amount < 0) {
    useFormat = formats.neg;
  } else {
    useFormat = formats.zero;
  }

  // Return with currency symbol added
  return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(amount), opts));
}

/**
 * Format a list of numbers into an accounting column, padding with whitespace
 * to line up currency symbols, thousand separators and decimals places.
 *
 * Returns array of accouting-formatted number strings of same length.
 *
 * NB: `white-space:pre` CSS rule is required on the list container to prevent
 * browsers from collapsing the whitespace in the output strings.
 *
 * **Usage:**
 *
 * ```js
 * formatColumn([123.5, 3456.49, 777888.99, 12345678, -5432], { symbol: "$ " });
 * ```
 *
 * @access public
 * @param {Array<Number>} list - Array of numbers to format
 * @param {Object} [opts={}] - Object containing all the options of the method
 * @return {Array<String>} - Array of accouting-formatted number strings of same length
 */
function formatColumn(list) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!list) return [];

  // Build options object from second param (if object) or all params, extending defaults
  opts = objectAssign({}, settings, opts);

  // Check format (returns object with pos, neg and zero), only need pos for now
  var formats = checkCurrencyFormat(opts.format);

  // Whether to pad at start of string or after currency symbol
  var padAfterSymbol = formats.pos.indexOf('%s') < formats.pos.indexOf('%v');

  // Store value for the length of the longest string in the column
  var maxLength = 0;

  // Format the list according to options, store the length of the longest string
  var formatted = list.map(function (val) {
    if (Array.isArray(val)) {
      // Recursively format columns if list is a multi-dimensional array
      return formatColumn(val, opts);
    }
    // Clean up the value
    val = unformat(val, opts.decimal);

    // Choose which format to use for this value (pos, neg or zero)
    var useFormat = void 0;

    if (val > 0) {
      useFormat = formats.pos;
    } else if (val < 0) {
      useFormat = formats.neg;
    } else {
      useFormat = formats.zero;
    }

    // Format this value, push into formatted list and save the length
    var fVal = useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(val), opts));

    if (fVal.length > maxLength) {
      maxLength = fVal.length;
    }

    return fVal;
  });

  // Pad each number in the list and send back the column of numbers
  return formatted.map(function (val) {
    // Only if this is a string (not a nested array, which would have already been padded)
    if (isString(val) && val.length < maxLength) {
      // Depending on symbol position, pad after symbol or at index 0
      return padAfterSymbol ? val.replace(opts.symbol, opts.symbol + new Array(maxLength - val.length + 1).join(' ')) : new Array(maxLength - val.length + 1).join(' ') + val;
    }
    return val;
  });
}

export { settings, unformat, toFixed, formatMoney, formatNumber, formatColumn, formatMoney as format, unformat as parse };
//# sourceMappingURL=accounting.es.js.map