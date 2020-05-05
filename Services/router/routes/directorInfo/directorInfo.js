/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");
const directorInfoHelper = require("./directorInfoHelper");

module.exports = function() {
	let app = express.Router();

	//root entry path for placeholder
	app.get("/", function(req, res) {
		res.send("Director Information API");
	});

	//for execution of Company
	app.get("/person", function(req, res) {
	//	res.send("Instantiation of Services getCompany")
		directorInfoHelper.getPerson(req, res);
	});	

		//search for director using the scv
	app.get("/scvperson", function(req, res) {
	//	res.send("Instantiation of Services getCompany")
		directorInfoHelper.getScvPerson(req, res);
		
	});

	return app;
};