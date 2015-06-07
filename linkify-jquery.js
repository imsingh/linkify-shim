;(function (jQuery, linkify) {
"use strict";
var tokenize = linkify.tokenize, options = linkify.options;
"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var HTML_NODE = 1,
    TXT_NODE = 3;

/**
	Given an array of MultiTokens, return an array of Nodes that are either
	(a) Plain Text nodes (node type 3)
	(b) Anchor tag nodes (usually, unless tag name is overriden in the options)

	Takes the same options as linkifyElement and an optional doc element (this should be passed in by linkifyElement)
*/
function tokensToNodes(tokens, opts, doc) {
	var result = [];

	for (var i = 0; i < tokens.length; i++) {
		var token = tokens[i];

		if (token.isLink) {

			var tagName = options.resolve(opts.tagName, token.type),
			    linkClass = options.resolve(opts.linkClass, token.type),
			    target = options.resolve(opts.target, token.type),
			    formatted = options.resolve(opts.format, token.toString(), token.type),
			    href = token.toHref(opts.defaultProtocol),
			    formattedHref = options.resolve(opts.formatHref, href, token.type),
			    attributesHash = options.resolve(opts.attributes, token.type),
			    events = options.resolve(opts.events, token.type);

			// Build the link
			var link = doc.createElement(tagName);
			link.setAttribute("href", formattedHref);
			link.setAttribute("class", linkClass);
			if (target) {
				link.setAttribute("target", target);
			}

			// Build up additional attributes
			if (attributesHash) {
				for (var attr in attributesHash) {
					link.setAttribute(attr, attributesHash[attr]);
				}
			}

			if (events) {
				for (var _event in events) {
					if (link.addEventListener) {
						link.addEventListener(_event, events[_event]);
					} else if (link.attachEvent) {
						link.attachEvent("on" + _event, events[_event]);
					}
				}
			}

			link.appendChild(doc.createTextNode(formatted));
			result.push(link);
		} else if (token.type === "nl" && opts.nl2br) {
			result.push(doc.createElement("br"));
		} else {
			result.push(doc.createTextNode(token.toString()));
		}
	}

	return result;
}

// Requires document.createElement
function linkifyElementHelper(element, opts, doc) {

	// Can the element be linkified?
	if (!element || typeof element !== "object" || element.nodeType !== HTML_NODE) {
		throw new Error("Cannot linkify " + element + " - Invalid DOM Node type");
	}

	// Is this element already a link?
	if (element.tagName.toLowerCase() === "a" /*|| element.hasClass('linkified')*/) {
		// No need to linkify
		return element;
	}

	var children = [],
	    childElement = element.firstChild;

	while (childElement) {

		switch (childElement.nodeType) {
			case HTML_NODE:
				children.push(linkifyElementHelper(childElement, opts, doc));
				break;
			case TXT_NODE:

				var str = childElement.nodeValue,
				    tokens = tokenize(str);
				children.push.apply(children, _toConsumableArray(tokensToNodes(tokens, opts, doc)));

				break;

			default:
				children.push(childElement);break;
		}

		childElement = childElement.nextSibling;
	}

	// Clear out the element
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}

	// Replace with all the new nodes
	for (var i = 0; i < children.length; i++) {
		element.appendChild(children[i]);
	}

	return element;
}

function linkifyElement(element, opts) {
	var doc = arguments[2] === undefined ? null : arguments[2];

	try {
		doc = doc || window && window.document || global && global.document;
	} catch (e) {}

	if (!doc) {
		throw new Error("Cannot find document implementation. " + "If you are in a non-browser environment like Node.js, " + "pass the document implementation as the third argument to linkifyElement.");
	}

	opts = options.normalize(opts);
	return linkifyElementHelper(element, opts, doc);
}

// Maintain reference to the recursive helper to save some option-normalization
// cycles
linkifyElement.helper = linkifyElementHelper;
linkifyElement.normalize = options.normalize;

/**
	Linkify a HTML DOM node
*/

/* do nothing for now */
"use strict";

var doc = undefined;

try {
	doc = document;
} catch (e) {
	doc = null;
}

// Applies the plugin to jQuery
function apply($) {
	var doc = arguments[1] === undefined ? null : arguments[1];

	$.fn = $.fn || {};

	try {
		doc = doc || window && window.document || global && global.document;
	} catch (e) {}

	if (!doc) {
		throw new Error("Cannot find document implementation. " + "If you are in a non-browser environment like Node.js, " + "pass the document implementation as the third argument to linkifyElement.");
	}

	if (typeof $.fn.linkify === "function") {
		// Already applied
		return;
	}

	function jqLinkify(opts) {
		opts = linkifyElement.normalize(opts);
		return this.each(function () {
			linkifyElement.helper(this, opts, doc);
		});
	}

	$.fn.linkify = jqLinkify;

	$(doc).ready(function () {
		$("[data-linkify]").each(function () {

			var $this = $(this),
			    data = $this.data(),
			    target = data.linkify,
			    nl2br = data.linkifyNlbr,
			    options = {
				linkAttributes: data.linkifyAttributes,
				defaultProtocol: data.linkifyDefaultProtocol,
				events: data.linkifyEvents,
				format: data.linkifyFormat,
				formatHref: data.linkifyFormatHref,
				newLine: data.linkifyNewline, // deprecated
				nl2br: !!nl2br && nl2br !== 0 && nl2br !== "false",
				tagName: data.linkifyTagname,
				target: data.linkifyTarget,
				linkClass: data.linkifyLinkclass };
			var $target = target === "this" ? $this : $this.find(target);
			$target.linkify(options);
		});
	});
}

// Apply it right away if possible
if (typeof jQuery !== "undefined" && doc) {
	apply(jQuery, doc);
}

/* do nothing for now */
window.linkifyElement = linkifyElement;
})(window.jQuery, window.linkify);