/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");

module.exports = function() {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function(req, res) {
		res.send("Instantiation of Search module - Stef entry");
	});

	return app;
};