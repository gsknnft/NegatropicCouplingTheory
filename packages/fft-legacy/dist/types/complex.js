"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.magnitude = magnitude;
function add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}
function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
}
function multiply(a, b) {
    return [
        a[0] * b[0] - a[1] * b[1],
        a[0] * b[1] + a[1] * b[0]
    ];
}
function magnitude(c) {
    return Math.sqrt(c[0] ** 2 + c[1] ** 2);
}
