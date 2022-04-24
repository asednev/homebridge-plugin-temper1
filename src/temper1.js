var HID = require('node-hid');
var readCommand = [0x01, 0x80, 0x33, 0x01, 0x00, 0x00, 0x00, 0x00];

exports.readTemperatures = function (devices) {
    // not implemented
};

exports.getDevices = function () {
    var devices = HID.devices();
    var expectedInterface = process.platform === 'darwin' ? -1 : 1;
    var seen = {};
    var list = [];
    devices.forEach((item) => {
        if ( // item.product.match("TEMPer1V1") && // match any TEMPer products by vendorId
            item.vendorId === 3141
            && item.interface === expectedInterface
            && !seen[item.path]
        ) {
            list.push(item.path);
            seen[item.path] = true;
        }
    });
    return list;
};

exports.readTemperature = function (path, callback, converter) {
    if (!converter) {
        converter = exports.toDegreeCelsius;
    }

    var device = new HID.HID(path);
    device.write(readCommand);
    device.read(function (err, response) {
        device.close();
        if (err) {
            callback.call(this, err, null);
        } else {
            callback.call(this, null, converter(response[2], response[3]), converter(response[4], response[5]));
        }
    });
};

exports.toDegreeCelsius = function (hiByte, loByte) {
    if (hiByte == 255 && loByte == 255) {
        return NaN;
    }
    if ((hiByte & 128) == 128) {
        return -((256 - hiByte) + (1 + ~(loByte >> 4)) / 16.0);
    }
    return hiByte + ((loByte >> 4) / 16.0);
};

// 'Celsius' is misspelled, but left here so as not to break existing code
exports.toDegreeCelcius = function (hibyte, lobyte) {
    return exports.toDegreeCelsius(hibyte, lobyte);
};

exports.toDegreeFahrenheit = function (hiByte, loByte) {
    return exports.celsiusToFahrenheit(exports.toDegreeCelsius(hiByte, loByte));
};

exports.celsiusToFahrenheit = function (c) {
    return (c * 1.8) + 32.0;
};
