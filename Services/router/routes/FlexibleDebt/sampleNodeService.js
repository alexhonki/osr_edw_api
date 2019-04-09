/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");

module.exports = function () {
	const app = express.Router();

	//Hello Router
	app.get("/", function (req, res) {
		res.send("Instantiation of Services from Node Land Okay! -Curtis");
	});

	return app;
};