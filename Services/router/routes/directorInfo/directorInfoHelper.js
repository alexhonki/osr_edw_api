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
    
    let asicFilter = "";
    
    if (oQuery.abn !== "" && oQuery.acn !== "") {
    	asicFilter = "(org.ABN = '" + oQuery.abn + "' OR ORG_NUMBER = '" + oQuery.acn + "')";
    }
    
    if (oQuery.abn !== "" && oQuery.acn == "") {
    	asicFilter = "org.ABN = '" + oQuery.abn + "'";
    }
    
    if (oQuery.abn == "" && oQuery.acn !== "") {
    	asicFilter = "ORG_NUMBER = '" + oQuery.acn + "'";
    }
    
    //check for completely empty search with nothing 

	if (oQuery.abn == "" && oQuery.acn == ""){
		oResponse.type("application/json").status(200).send("No query parameters");
		return;
	}
	
    return asicFilter;
    }, 
   
    _getCurrentAsicOrgFile: function (oResponse){
    	let currentAsicOrg = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ORGANISATION\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicOrg;							
    	
    },
    _getCurrentAsicXrefFile: function (oResponse){
    	let currentAsicXref = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.scv.org.foundation.db.staging.synonyms::ASIC_XREF\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";	
		return currentAsicXref;						
    	
    },
    _getCurrentAsicPerFile: function (oResponse){
    	let currentAsicPer = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_PERSON\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicPer;						
    	
    },
    _getCurrentAsicComFile: function (oResponse){
    	let currentAsicCom = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.scv.org.foundation.db.staging.synonyms::ASIC_COMPANY_REGISTER\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicCom;							
    
    	
    },
    _getCurrentAsicAddrFile: function (oResponse){
    	let currentAsicAdd = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ADDRESS\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicAdd;
    	
    },
  
	_generateDirectorPersonStatement: function (oPayload){
		
		let directorPersonQuery = 	"SELECT DISTINCT "+
										"org.\"ORG_NUMBER\", "+
										"org.\"ABN\", "+
										"org.\"STD_FIRM\", "+
										"comp.\"ORG_STATUS\", "+
										"org.\"REGN_END_DT\", "+
										"pers.\"PERSON_NUM\", "+
										"pers.\"BIRTH_DT\", "+
										"pers.\"GIVEN_NAME1\" as \"STD_PERSON_GN\", "+
										"pers.\"GIVEN_NAME2\" as \"STD_PERSON_GN2\", "+
										"pers.\"SURNAME\" as \"STD_PERSON_FN_FULL\" "+
									"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+
									"INNER JOIN \"osr.scv.org.foundation.db.staging.synonyms::ASIC_COMPANY_REGISTER\" as comp "+
									"ON org.\"ORG_NUMBER\" = comp.ACN "+
										"INNER JOIN  \"osr.scv.org.foundation.db.staging.synonyms::ASIC_XREF\" as xref "+
										"ON CONCAT('O',RIGHT(CONCAT('0000000000', org.\"ORG_NUMBER\"), 9)) = xref.\"OWNER_SOURCE_ID\" "+
											"INNER JOIN \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_PERSON\" as pers "+
											"ON RIGHT(xref.\"MEMBER_SOURCE_ID\",9) = pers.\"PERSON_NUM\" "+
									"where xref.XREF_ROLE = 'DR' "+
									"AND org.ORG_END_DATE = '999999' "+
									"AND xref.REC_END_DATE = '999999' "+
									"AND "+ oPayload + " " + 
									"AND org.NAME = " + this._getCurrentAsicOrgFile() + " AND  xref.NAME = " + this._getCurrentAsicXrefFile() + " AND (pers.NAME = " + this._getCurrentAsicPerFile() + " OR pers.NAME is NULL)" + " AND  comp.NAME = " + this._getCurrentAsicComFile() ;
									
		return directorPersonQuery;


	},  

	getPerson: function(oRequest, oResponse) {
 
    let sASICQuery = this._checkRequest(oRequest, oResponse, oRequest.query);
	let directorPersonQuery = this._generateDirectorPersonStatement(sASICQuery);				
					

    let client = oRequest.db;
    let oController = this;
    async.waterfall([

      function prepare(callback) {
        client.prepare(
          directorPersonQuery,
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
  },
 
  };