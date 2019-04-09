/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
//const express = require("express");
const async = require("async");

module.exports = function() {
  let app = express.Router();

  //Hello Router
  app.get("/", function(req, res) {
    res.send("Instantiation of Services from Node Land Okay! -Curtis");
  });
/*
  //Simple Database Select - Async Waterfall
  app.get("/endpoint1", function(req, res) {
    let client = req.db;
    async.waterfall([

      function prepare(callback) {
        client.prepare("SELECT TOP 10 PARTNER, TYPE, BU_GROUP,NAME_ORG1,NAME_ORG2,NAME_ORG3,NAME_ORG4,Z_SOURCE_SYS FROM \"osr.scv.org.foundation.db.Views::CV_RMSMaster\" ",
          function(err, statement) {
            callback(null, err, statement);
          });
      },
*/
      function execute(err, statement, callback) {
        statement.exec([], function(execErr, results) {
          callback(null, execErr, results);
        });
      },
      function response(err, results, callback) {
        if (err) {
          res.type("text/plain").status(500).send("ERROR: " + err.toString());
          return;
        } else {
          let result = JSON.stringify({
            Objects: results
          });
          res.type("application/json").status(200).send(result);
        }
        callback();
      }
    ]);
  });

  return app;
};
