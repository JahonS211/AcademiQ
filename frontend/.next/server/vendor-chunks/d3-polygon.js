"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/d3-polygon";
exports.ids = ["vendor-chunks/d3-polygon"];
exports.modules = {

/***/ "(ssr)/./node_modules/d3-polygon/src/area.js":
/*!*********************************************!*\
  !*** ./node_modules/d3-polygon/src/area.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(polygon) {\n  var i = -1,\n      n = polygon.length,\n      a,\n      b = polygon[n - 1],\n      area = 0;\n\n  while (++i < n) {\n    a = b;\n    b = polygon[i];\n    area += a[1] * b[0] - a[0] * b[1];\n  }\n\n  return area / 2;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZDMtcG9seWdvbi9zcmMvYXJlYS5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUEsNkJBQWUsb0NBQVM7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zdHVkZW50LXBsYXRmb3JtLWZyb250ZW5kLy4vbm9kZV9tb2R1bGVzL2QzLXBvbHlnb24vc3JjL2FyZWEuanM/MDM5NyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihwb2x5Z29uKSB7XG4gIHZhciBpID0gLTEsXG4gICAgICBuID0gcG9seWdvbi5sZW5ndGgsXG4gICAgICBhLFxuICAgICAgYiA9IHBvbHlnb25bbiAtIDFdLFxuICAgICAgYXJlYSA9IDA7XG5cbiAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICBhID0gYjtcbiAgICBiID0gcG9seWdvbltpXTtcbiAgICBhcmVhICs9IGFbMV0gKiBiWzBdIC0gYVswXSAqIGJbMV07XG4gIH1cblxuICByZXR1cm4gYXJlYSAvIDI7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/d3-polygon/src/area.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/d3-polygon/src/centroid.js":
/*!*************************************************!*\
  !*** ./node_modules/d3-polygon/src/centroid.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(polygon) {\n  var i = -1,\n      n = polygon.length,\n      x = 0,\n      y = 0,\n      a,\n      b = polygon[n - 1],\n      c,\n      k = 0;\n\n  while (++i < n) {\n    a = b;\n    b = polygon[i];\n    k += c = a[0] * b[1] - b[0] * a[1];\n    x += (a[0] + b[0]) * c;\n    y += (a[1] + b[1]) * c;\n  }\n\n  return k *= 3, [x / k, y / k];\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZDMtcG9seWdvbi9zcmMvY2VudHJvaWQuanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFBLDZCQUFlLG9DQUFTO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3N0dWRlbnQtcGxhdGZvcm0tZnJvbnRlbmQvLi9ub2RlX21vZHVsZXMvZDMtcG9seWdvbi9zcmMvY2VudHJvaWQuanM/YjY0NSJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbihwb2x5Z29uKSB7XG4gIHZhciBpID0gLTEsXG4gICAgICBuID0gcG9seWdvbi5sZW5ndGgsXG4gICAgICB4ID0gMCxcbiAgICAgIHkgPSAwLFxuICAgICAgYSxcbiAgICAgIGIgPSBwb2x5Z29uW24gLSAxXSxcbiAgICAgIGMsXG4gICAgICBrID0gMDtcblxuICB3aGlsZSAoKytpIDwgbikge1xuICAgIGEgPSBiO1xuICAgIGIgPSBwb2x5Z29uW2ldO1xuICAgIGsgKz0gYyA9IGFbMF0gKiBiWzFdIC0gYlswXSAqIGFbMV07XG4gICAgeCArPSAoYVswXSArIGJbMF0pICogYztcbiAgICB5ICs9IChhWzFdICsgYlsxXSkgKiBjO1xuICB9XG5cbiAgcmV0dXJuIGsgKj0gMywgW3ggLyBrLCB5IC8ga107XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/d3-polygon/src/centroid.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/d3-polygon/src/length.js":
/*!***********************************************!*\
  !*** ./node_modules/d3-polygon/src/length.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(polygon) {\n  var i = -1,\n      n = polygon.length,\n      b = polygon[n - 1],\n      xa,\n      ya,\n      xb = b[0],\n      yb = b[1],\n      perimeter = 0;\n\n  while (++i < n) {\n    xa = xb;\n    ya = yb;\n    b = polygon[i];\n    xb = b[0];\n    yb = b[1];\n    xa -= xb;\n    ya -= yb;\n    perimeter += Math.sqrt(xa * xa + ya * ya);\n  }\n\n  return perimeter;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZDMtcG9seWdvbi9zcmMvbGVuZ3RoLmpzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQSw2QkFBZSxvQ0FBUztBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zdHVkZW50LXBsYXRmb3JtLWZyb250ZW5kLy4vbm9kZV9tb2R1bGVzL2QzLXBvbHlnb24vc3JjL2xlbmd0aC5qcz82ZTg5Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgdmFyIGkgPSAtMSxcbiAgICAgIG4gPSBwb2x5Z29uLmxlbmd0aCxcbiAgICAgIGIgPSBwb2x5Z29uW24gLSAxXSxcbiAgICAgIHhhLFxuICAgICAgeWEsXG4gICAgICB4YiA9IGJbMF0sXG4gICAgICB5YiA9IGJbMV0sXG4gICAgICBwZXJpbWV0ZXIgPSAwO1xuXG4gIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgeGEgPSB4YjtcbiAgICB5YSA9IHliO1xuICAgIGIgPSBwb2x5Z29uW2ldO1xuICAgIHhiID0gYlswXTtcbiAgICB5YiA9IGJbMV07XG4gICAgeGEgLT0geGI7XG4gICAgeWEgLT0geWI7XG4gICAgcGVyaW1ldGVyICs9IE1hdGguc3FydCh4YSAqIHhhICsgeWEgKiB5YSk7XG4gIH1cblxuICByZXR1cm4gcGVyaW1ldGVyO1xufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/d3-polygon/src/length.js\n");

/***/ })

};
;