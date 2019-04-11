/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
const express = require("express");
const async = require("async");

module.exports = {
   
    _checkRequest: function(oRequest, oResponse, oQuery) {
    // different query param that could come in
    // oQuery.partner;
    // oQuery.abn;
    // oQuery.acn;
    //do check for each variable being passed on.
    
    let rmsFilter = "";
    
    if (oQuery.partner !== "" && oQuery.abn !== "" && oQuery.acn !== "") {
    	rmsFilter = "PARTNER = " + oQuery.partner + " AND IDNUMBER IN ('" + oQuery.abn + "','" + oQuery.acn + "')";
    }
    
    if (oQuery.partner !== "" && oQuery.abn !== "" && oQuery.acn == "") {
    	rmsFilter = "PARTNER = " + oQuery.partner + " AND IDNUMBER = '" + oQuery.abn  +"'" ;
    }
    
    if (oQuery.partner !== "" && oQuery.abn == "" && oQuery.acn !== "") {
    	rmsFilter = "PARTNER = " + oQuery.partner + " AND IDNUMBER = '" + oQuery.acn +"'" ;
    }
    
    if (oQuery.partner !== "" && oQuery.abn == "" && oQuery.acn == "") {
    	rmsFilter = "PARTNER = " + oQuery.partner  ;
    }
    
    if (oQuery.partner == "" && oQuery.abn !== "" && oQuery.acn !== "") {
    	rmsFilter = "IDNUMBER IN ('" + oQuery.abn + "','" + oQuery.acn + "')";
    }
    
    if (oQuery.partner == "" && oQuery.abn !== "" && oQuery.acn == "") {
    	rmsFilter = "IDNUMBER = '" + oQuery.abn +"'"  ;
    }
    
    if (oQuery.partner== "" && oQuery.abn == "" && oQuery.acn !== "") {
    	rmsFilter = "IDNUMBER = '" + oQuery.acn  +"'" ;
    }
    
    //check for completely empty search with nothing 

	if (oQuery.partner== "" && oQuery.abn == "" && oQuery.acn == ""){
		oResponse.type("application/json").status(200).send("No query parameters");
		return;
	}
	
	rmsFilter =		"SELECT "+
					"PARTNER, "+ 
					"(CASE WHEN  TYPE = 'ZABN' THEN IDNUMBER ELSE NULL END) AS ABN, "+
					"(CASE WHEN  TYPE = 'ZACN' THEN IDNUMBER ELSE NULL END) AS ACN "+
					"FROM \"osr.scv.org.foundation.db.staging.synonyms::RMS_BUT0ID\" "+
					"where TYPE IN ('ZABN','ZACN') AND " + rmsFilter;
    return rmsFilter;
    }, 
  
	_generateCompanyStatement: function (oPayload){
		
		let companyQuery = 	"SELECT DISTINCT "+
								"org.\"ORG_NUMBER\", "+
								"org.\"ABN\", "+
								"org.\"STD_FIRM\", "+
								"org.\"ORG_STATUS\", "+
								"org.\"ORG_END_DATE\", "+
								"org.\"REGN_END_DT\" "+
							"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+
								"INNER JOIN (SELECT \"ABN\", \"ACN\" FROM (SELECT * FROM ("+ oPayload +"))) as rms "+
								"ON (CASE WHEN org.\"ABN\" = '' THEN NULL ELSE org.ABN END) = IFNULL(rms.\"ABN\",'') OR (CASE WHEN org.\"ORG_NUMBER\" = '' THEN NULL ELSE org.ORG_NUMBER END) = IFNULL(rms.\"ACN\",'') "+
								"WHERE org.\"ORG_END_DATE\" = '999999' ";
		
		return companyQuery;
		
		
	},   
   
    
	getCompany: function(oRequest, oResponse) {
 
    let sRMSQuery = this._checkRequest(oRequest, oResponse, oRequest.query);
	let companyQuery = this._generateCompanyStatement(sRMSQuery);				
					

    let client = oRequest.db;
    let oController = this;
    async.waterfall([

      function prepare(callback) {
        client.prepare(
          companyQuery,
          function(err, statement) {
            callback(null, err, statement);
          });
      },

      function execute(err, statement, callback) {
        statement.exec([], function(execErr, results) {
          callback(null, execErr, results);
        });
      },
      function response(err, results, callback) {
        if (err) {
          oResponse.type("text/plain").status(500).send("ERROR: " + err.toString());
          return;
        } else {
          let oFinalResult = results//oController.transformRMSpartner(results);
          let result = JSON.stringify({
            Total: results.length,
            Results: oFinalResult
          });
          oResponse.type("application/json").status(200).send(result);
        }
        callback(null, results);
      }
    ], function(err, result) {
      let temp = 1;
    });

//	let sRMSQuery = "SELECT TOP 1 PARTNER, TYPE, NAME_ORG1"+
//					"FROM \"osr.scv.org.foundation.db.propagation.synonyms::RMS_BUT000_ORG\" ";
//	return sRMSQuery;
  }
	

  };