/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const flexibleDebtHelper = require("./flexibleDebtHelper");

module.exports = function() {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function(req, res) {
		res.send("Flexible Debt API");
	});

	//for execution of search
	app.get("/company", function(req, res) {
	//	res.send("Instantiation of Services getCompany")
		flexibleDebtHelper.getCompany(req, res);

	});
	return app;
};