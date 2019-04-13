const app = require('express')();
const path = require('path');

const bluetooth = require("node-bluetooth");

const device = new bluetooth.DeviceINQ();

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

var interval;
var h = 0;
var colors = ['01fe0000538310000000000050000000', '01fe0000538310000000000050000000'];
var value = 1;

var baseColor1 = { r: 255, g: 255, b: 255 };
var baseColor2 = { r: 255, g: 255, b: 255 };
var rotate = false;
var mode = 0;

function toHex(n) {
    var hex = Number(n).toString(16);
    if (hex.length % 2) {
        hex = "0" + hex;
    }
    return hex;
}
function startParty(connections) {
    interval = setInterval(() => {
        switch (mode) {
            case 0:

            if (rotate) h += 0.01;
            if (h >= 1) h -= 1;
    
            var rgb = HSVtoRGB(h, 1, value);

            baseColor1 = rgb;
            baseColor2 = rgb;
            break;

            case 1:

            if (rotate) h += 0.01;
            if (h >= 1) h -= 1;
    
            var rgb1 = HSVtoRGB(h, 1, value);
            var rgb2 = HSVtoRGB((h + 0.66) % 1, 1, value);

            baseColor1 = rgb1;
            baseColor2 = rgb2;
            break;

            case 2:

            if (rotate) h += 0.01;
            if (h >= 1) h -= 1;
    
            var rgb1 = HSVtoRGB(h, 1, value);
            var rgb2 = HSVtoRGB((h + 0.5) % 1, 1, value);

            baseColor1 = rgb1;
            baseColor2 = rgb2;
            break;

            case 3:

            if (rotate) h += 0.01;
            if (h >= 1) h -= 1;
    
            var rgb1 = HSVtoRGB(h, 1, value);
            var rgb2 = HSVtoRGB((h + 0.2) % 1, 1, value);

            baseColor1 = rgb1;
            baseColor2 = rgb2;
            break;

            case 4:

            baseColor1 = { r: 255, g: 255, b: 255 };
            baseColor2 = { r: 255, g: 255, b: 255 };
            break;

            case 5:

            baseColor1 = { r: 153, g: 0, b: 102 };
            baseColor2 = { r: 153, g: 0, b: 102 };
            break;

        }

        var r1 = toHex(Math.floor(baseColor1.r * value));
        var g1 = toHex(Math.floor(baseColor1.g * value));
        var b1 = toHex(Math.floor(baseColor1.b * value));
    
        colors[0] = `01fe000053831000${g1}${b1}${r1}0050000000`;

        var r2 = toHex(Math.floor(baseColor2.r * value));
        var g2 = toHex(Math.floor(baseColor2.g * value));
        var b2 = toHex(Math.floor(baseColor2.b * value));
    
        colors[1] = `01fe000053831000${g2}${b2}${r2}0050000000`;
        
    }, 100);
}

function stopParty() {
    if (interval) clearInterval(interval);
    interval = null;
}



require('async')
.mapSeries(
    [
        ["00:E0:4C:23:3A:E9", 0],
        ["00:E0:4C:C2:59:69", 1]
    ], 
    (address, callback) => {
        device.findSerialPortChannel(address[0], (channel) => {
            bluetooth.connect(address[0], 1, (err, connection) => {
                
                if (err) return callback(err);
                
                connection.write(Buffer.from('3031323334353637', 'hex'), (err, bytesWritten) => {
                    if (err) return callback(err);

                    connection.write(Buffer.from('01fe0000510210000000008000000080', 'hex'), (err, bytesWritten) => {
                        if (err) return callback(err);

                        callback(null, [connection, address[1]]);
                    });
                });
            });
        });
    },
    (err, results) => {
        if (err) throw err;

        setInterval(() => {
            require('async').each(results, (connection) => {
                connection[0].write(Buffer.from(colors[connection[1]], 'hex'), (err) => {
                    if (err) throw err;
                });
            });
        }, 100);

        startParty(results);
        
        app.get('/button1', (req, res) => {
            value += 0.1;
            if (value >= 1) value -= 1;

            res.status(200).end();
        });
        app.get('/button2', (req, res) => {
            rotate = !rotate;

            res.status(200).end();
        });
        app.get('/button3', (req, res) => {
            mode += 1;
            if (mode > 5) mode = 0;

            res.status(200).end();
        });

        app.listen(3000);
    }
);
