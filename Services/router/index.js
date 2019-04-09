"use strict";

module.exports = function(app) {

	// Set API documentation
//	let swaggerUi = require('swagger-ui-express');
//	let swaggerDocument = require('../api/swagger.json');
	let express = require("express");

	//swagger custom view settings
//	let options = {
//		customJs: '/api/static/resources/custom.js',
//		customCss:'.topbar-wrapper img {width: 154px; height: 50px; content:url("/api/static/resources/osr_logo_154x50.png")} .topbar {background-color: black !important} .topbar-wrapper a span {display: none} .opblock-summary-method {background-color: #6b6d6f !important} .opblock.opblock-get {border-color: #6b6d6f !important; background-color: rgba(63, 63, 64, 0.1) !important} .btn.execute.opblock-control__btn {border-color: #27a517 !important; background-color: #27a517 !important} div.opblock-summary.opblock-summary-get {border-color: #6b6d6f !important;} a {color: #d028b2 !important;}'
//	};

	// Set URL paths
	app.use("/node", require("./routes/FlexibleDebt/sampleNodeService")());

	// For Swagger API Doc and resources
//	app.use("/api/static", express.static("api"));
//	app.use("/scv/org/api/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

	// For search api
//	app.use("/scv/org/api/search", require("./routes/search")());

};
