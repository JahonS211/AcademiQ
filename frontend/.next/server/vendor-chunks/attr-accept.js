"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/attr-accept";
exports.ids = ["vendor-chunks/attr-accept"];
exports.modules = {

/***/ "(ssr)/./node_modules/attr-accept/dist/es/index.js":
/*!***************************************************!*\
  !*** ./node_modules/attr-accept/dist/es/index.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\r\n\r\nexports.__esModule = true;\r\n\r\nexports[\"default\"] = function (file, acceptedFiles) {\r\n  if (file && acceptedFiles) {\r\n    var acceptedFilesArray = Array.isArray(acceptedFiles) ? acceptedFiles : acceptedFiles.split(',');\r\n\r\n    if (acceptedFilesArray.length === 0) {\r\n      return true;\r\n    }\r\n\r\n    var fileName = file.name || '';\r\n    var mimeType = (file.type || '').toLowerCase();\r\n    var baseMimeType = mimeType.replace(/\\/.*$/, '');\r\n    return acceptedFilesArray.some(function (type) {\r\n      var validType = type.trim().toLowerCase();\r\n\r\n      if (validType.charAt(0) === '.') {\r\n        return fileName.toLowerCase().endsWith(validType);\r\n      } else if (validType.endsWith('/*')) {\r\n        // This is something like a image/* mime type\r\n        return baseMimeType === validType.replace(/\\/.*$/, '');\r\n      }\r\n\r\n      return mimeType === validType;\r\n    });\r\n  }\r\n\r\n  return true;\r\n};\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYXR0ci1hY2NlcHQvZGlzdC9lcy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUNiO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0Esa0JBQWU7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3N0dWRlbnQtcGxhdGZvcm0tZnJvbnRlbmQvLi9ub2RlX21vZHVsZXMvYXR0ci1hY2NlcHQvZGlzdC9lcy9pbmRleC5qcz84NTJmIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuXHJcbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIChmaWxlLCBhY2NlcHRlZEZpbGVzKSB7XHJcbiAgaWYgKGZpbGUgJiYgYWNjZXB0ZWRGaWxlcykge1xyXG4gICAgdmFyIGFjY2VwdGVkRmlsZXNBcnJheSA9IEFycmF5LmlzQXJyYXkoYWNjZXB0ZWRGaWxlcykgPyBhY2NlcHRlZEZpbGVzIDogYWNjZXB0ZWRGaWxlcy5zcGxpdCgnLCcpO1xyXG5cclxuICAgIGlmIChhY2NlcHRlZEZpbGVzQXJyYXkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGUubmFtZSB8fCAnJztcclxuICAgIHZhciBtaW1lVHlwZSA9IChmaWxlLnR5cGUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICB2YXIgYmFzZU1pbWVUeXBlID0gbWltZVR5cGUucmVwbGFjZSgvXFwvLiokLywgJycpO1xyXG4gICAgcmV0dXJuIGFjY2VwdGVkRmlsZXNBcnJheS5zb21lKGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICAgIHZhciB2YWxpZFR5cGUgPSB0eXBlLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgaWYgKHZhbGlkVHlwZS5jaGFyQXQoMCkgPT09ICcuJykge1xyXG4gICAgICAgIHJldHVybiBmaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKHZhbGlkVHlwZSk7XHJcbiAgICAgIH0gZWxzZSBpZiAodmFsaWRUeXBlLmVuZHNXaXRoKCcvKicpKSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBzb21ldGhpbmcgbGlrZSBhIGltYWdlLyogbWltZSB0eXBlXHJcbiAgICAgICAgcmV0dXJuIGJhc2VNaW1lVHlwZSA9PT0gdmFsaWRUeXBlLnJlcGxhY2UoL1xcLy4qJC8sICcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG1pbWVUeXBlID09PSB2YWxpZFR5cGU7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59O1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/attr-accept/dist/es/index.js\n");

/***/ })

};
;