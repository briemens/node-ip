/*jslint node:true, white: true, sloppy: true*/
/*!
 * Get IP address
 * Copyright(c) 2011 Bart Riemens
 * MIT Licensed
 */

var shell = require('child_process')
	, nic = process.argv.length < 3 ? '' : process.argv[2];

function Nic(name, text) {
	var self = this
		, nicRegEx = /^\t(\w+)(?:[\:]?[ ])/gm
		, nicIndexes = []
		, match;
	
	this.name = name;
	this.ip4 = '';

	while (match !== null) {
		match = nicRegEx.exec(text);
		if (match !== null) {
			nicIndexes.push({ name: match[1], keyIndex: match.index, valueIndex: match.index + match[0].length });
		}
	}

	(function () {
		var index
			, startIndex
			, endIndex
			, value;

		for (index = 0; index < nicIndexes.length; index += 1) {
			startIndex = nicIndexes[index].valueIndex;
			endIndex = (nicIndexes[index + 1] || { keyIndex: text.length }).keyIndex;
			value = this[nicIndexes[index].name] = text.substr(startIndex, endIndex - startIndex).replace(/[\n\t]/, '');

			if (nicIndexes[index].name === 'inet') {
				self.ip4 = value.match(/\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}/)[0];
			}
		}
	}());
}

function Nics(text) {
	var self = this
		, nicRegEx = /^(\w*\d)(?:[\:])/gm
		, nicIndexes = []
		, match;

	this.nics = [];

	this.getActive = function () {
		var active = [];
		self.nics.forEach(function (nic) {
			if (nic.status === 'active') {
				active.push(nic);
			}
		});
		return active;
	};

	while (match !== null) {
		match = nicRegEx.exec(text);
		if (match !== null) {
			nicIndexes.push({ name: match[1], index: match.index });
		}
	}

	(function () {
		var index
			, startIndex
			, endIndex;

		for (index = 0; index < nicIndexes.length; index += 1) {
			startIndex = nicIndexes[index].index + nicIndexes[index].name.length + 2;
			endIndex = ((nicIndexes[index + 1] || { index: null }).index || text.length) - 1;
			self.nics.push(new Nic(nicIndexes[index].name, text.substr(startIndex, endIndex - startIndex)));
		}
	}());

}

shell.exec('ifconfig ' + nic, function (err, stdout) {
	if (err) { throw err; }
	var nics = new Nics(stdout.toString());
	nics.nics.forEach(function (nic) {
		if (nic.ip4) {
			console.log(nic.name + ": " + nic.ip4);
		}
	});
});
