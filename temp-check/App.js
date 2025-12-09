// src/App.js


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = App;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require("react-router-dom");

var _contextAuthContext = require("./context/AuthContext");

var _contextPlaybackContext = require("./context/PlaybackContext");

var _AppRoutes = require("./AppRoutes");

var _AppRoutes2 = _interopRequireDefault(_AppRoutes);

require("./index.css");

// Tailwind or global styles

function App() {
  return _react2["default"].createElement(
    _contextAuthContext.AuthProvider,
    null,
    _react2["default"].createElement(
      _contextPlaybackContext.PlaybackProvider,
      null,
      _react2["default"].createElement(
        _reactRouterDom.BrowserRouter,
        null,
        _react2["default"].createElement(_AppRoutes2["default"], null)
      )
    )
  );
}

module.exports = exports["default"];