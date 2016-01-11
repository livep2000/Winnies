// Worker is sandboxed by nature
// it's another process

// Recycled function: retrieves Int8Array part of source ArrayBuffer
var getInt8Part = function (buffer, byteOffset, length, bytesPerInteger, callback) {
	var src8 = new Int8Array(buffer, byteOffset, length * bytesPerInteger)
	var dst8 = new Int8Array(length * bytesPerInteger);
	dst8.set(src8);
	callback(dst8.buffer);
}
// Recycled function: retrieve UintArray part of source ArrayBuffer
var getUint8Part = function (buffer, byteOffset, length, bytesPerInteger, callback) {
	var srcU8 = new Uint8Array(buffer, byteOffset, length * bytesPerInteger)
	var dstU8 = new Uint8Array(length * bytesPerInteger);
	dstU8.set(srcU8);
	callback(dstU8.buffer);
}
// If Array hase 1 memeber, return only the member, else the array
var returnSingle = function (input) {
	if (input.length === 1) {
		return input[0];
	}
	else { return input; }
}
// If input is only a number, return array with 1 member
var acceptSingle = function (input) {
	if (typeof (input) === "number") {
		return ([input]);
	}
	else {
		return (input);
	}
}

// Get string from source
ArrayBuffer.prototype.getString = function (byteOffset, byteLength, callback) {
	var buf = new Uint8Array(this, byteOffset, byteLength)
	var str = "";
	var ab = new Uint16Array(buf);
	var abLen = ab.length;
	var CHUNK_SIZE = Math.pow(2, 16);
	var offset, len, subab;
	for (offset = 0; offset < abLen; offset += CHUNK_SIZE) {
		len = Math.min(CHUNK_SIZE, abLen - offset);
		subab = ab.subarray(offset, offset + len);
		str += String.fromCharCode.apply(null, subab);
	}
	callback(str);
};
// Set string in source
ArrayBuffer.prototype.setString = function (str, writePosition, callback) {
	var bufView = new Uint8Array(this);
	for (var i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i + writePosition] = str.charCodeAt(i);
	}
	callback(str.length);
};
// Get Uint8array from source
ArrayBuffer.prototype.getUint8 = function (byteOffset, byteLength, callback) {
	callback(returnSingle(new Uint8Array(this, byteOffset, byteLength)));
};
// Get Int8Array from source
ArrayBuffer.prototype.getInt8 = function (byteOffset, byteLength, callback) {
	callback(returnSingle(new Int8Array(this, byteOffset, byteLength)));
};
// Get Uint16Array from source
ArrayBuffer.prototype.getUint16 = function (byteOffset, length, callback) {
	getUint8Part(this, byteOffset, length, 2, function (dstU8buffer) {
		callback(returnSingle(new Uint16Array(dstU8buffer, 0, length)));
	});
};
// Get Int16Array from source
ArrayBuffer.prototype.getInt16 = function (byteOffset, length, callback) {
	getInt8Part(this, byteOffset, length, 2, function (dst8buffer) {
		callback(returnSingle(new Int16Array(dst8buffer, 0, length)));
	});
};
// Get Uint32Array from source
ArrayBuffer.prototype.getUint32 = function (byteOffset, length, callback) {
	getUint8Part(this, byteOffset, length, 4, function (dstU8buffer) {
		callback(returnSingle(new Uint32Array(dstU8buffer, 0, length)));
	});
};
// Get Int32Array from source
ArrayBuffer.prototype.getInt32 = function (byteOffset, length, callback) {
	getInt8Part(this, byteOffset, length, 4, function (dst8buffer) {
		callback(returnSingle(new Int32Array(dst8buffer, 0, length)));
	});
};
// combine arraybuffer with arraybuffer
ArrayBuffer.prototype.setArrayBuffer = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Uint8Array(bufferToCombine);
	var dstU8 = new Uint8Array(this);
	dstU8.set(bufferToCombine, writePosition);
	callback(bufferToCombine.length);
};
// get arraybuffer from arraybuffer
ArrayBuffer.prototype.getArrayBuffer = function (byteOffset, byteLength, callback) {
	getUint8Part(this, byteOffset, byteLength, 1, function (dst8buffer) {
		callback(dst8buffer);
	});
};
// combine arraybuffer with uint8array
ArrayBuffer.prototype.setUint8 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Uint8Array(acceptSingle(bufferToCombine));
	var dstU8 = new Uint8Array(this);
	dstU8.set(bufferToCombine, writePosition);
	callback(bufferToCombine.byteLength);
};
// combine arraybuffer with uint16array
ArrayBuffer.prototype.setUint16 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Uint16Array(acceptSingle(bufferToCombine));
	var dstU8 = new Uint8Array(this);
	dstU8.set(new Uint8Array(bufferToCombine.buffer), writePosition);
	callback(bufferToCombine.byteLength);
};
// combine arraybuffer with uint32array
ArrayBuffer.prototype.setUint32 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Uint32Array(acceptSingle(bufferToCombine));
	var dstU8 = new Uint8Array(this);
	dstU8.set(new Uint8Array(bufferToCombine.buffer), writePosition);
	callback(bufferToCombine.byteLength);
};
// combine arraybuffer with uint8array
ArrayBuffer.prototype.setInt8 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Int8Array(acceptSingle(bufferToCombine));
	var dst8 = new Int8Array(this);
	dst8.set(bufferToCombine, writePosition);
	callback(bufferToCombine.byteLength);
};
// combine arraybuffer with uint16array
ArrayBuffer.prototype.setInt16 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Int16Array(acceptSingle(bufferToCombine));
	var dst8 = new Int8Array(this);
	dst8.set(new Int8Array(bufferToCombine.buffer), writePosition);
	callback(bufferToCombine.byteLength);
};
// combine arraybuffer with uint32array
ArrayBuffer.prototype.setInt32 = function (bufferToCombine, writePosition, callback) {
	bufferToCombine = new Int32Array(acceptSingle(bufferToCombine));
	var dst8 = new Int8Array(this);
	dst8.set(new Int8Array(bufferToCombine.buffer), writePosition);
	callback(bufferToCombine.byteLength);
};