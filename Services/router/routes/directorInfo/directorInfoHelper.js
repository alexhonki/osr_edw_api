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
    
     _checkScvRequest: function(oRequest, oResponse, oQuery) {
    // different query param that could come in
    // oQuery.abn;
    // oQuery.acn;
    //do check for each variable being passed on.
    
    let scvFilter = "";
    
    if (oQuery.abn !== "" && oQuery.acn !== "") {
    //	scvFilter = "(b.ABN = '" + oQuery.abn + "' OR b.ACN = '" + oQuery.acn + "')";
    	scvFilter = "(CASE WHEN org.ABN = '' THEN scv.ABN ELSE org.ABN END = '" + oQuery.abn + "' OR org.ORG_NUMBER = '" + oQuery.acn + "') ";
    }
    
    if (oQuery.abn !== "" && oQuery.acn == "") {
    //	scvFilter = "b.ABN = '" + oQuery.abn + "'";
    	scvFilter = "(CASE WHEN org.ABN = '' THEN scv.ABN ELSE org.ABN END = '" + oQuery.abn + "') ";
    }
    
    if (oQuery.abn == "" && oQuery.acn !== "") {
    //	scvFilter = "b.ACN = '" + oQuery.acn + "'";
    	scvFilter = "org.ORG_NUMBER = '" + oQuery.acn + "' ";
    }
    
    //check for completely empty search with nothing 

	if (oQuery.abn == "" && oQuery.acn == ""){
		oResponse.type("application/json").status(200).send("No query parameters");
		return;
	}
	
    return scvFilter;
    }, 
   
    _getCurrentAsicOrgFile: function (oResponse){
    	let currentAsicOrg = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.api.db.propagation.synonyms::ASIC_ORGANISATION\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicOrg;							
    	
    },
    _getCurrentAsicXrefFile: function (oResponse){
    	let currentAsicXref = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.api.db.source.synonyms::ASIC_XREF\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";	
		return currentAsicXref;						
    	
    },
    _getCurrentAsicPerFile: function (oResponse){
    	let currentAsicPer = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.api.db.propagation.synonyms::ASIC_PERSON\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicPer;						
    	
    },
    _getCurrentAsicComFile: function (oResponse){
    	let currentAsicCom = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.api.db.staging.synonyms::ASIC_COMPANY_REGISTER\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicCom;							
    
    	
    },
    _getCurrentAsicAddrFile: function (oResponse){
    	let currentAsicAdd = 	"(SELECT NAME FROM ( "+
									"SELECT TOP 1 DISTINCT "+
										"\"NAME\", "+
										"MAX (\"Z_RUN_SEQ_ID\") "+
									"FROM \"osr.api.db.propagation.synonyms::ASIC_ADDRESS\" "+
									"GROUP BY NAME  "+
									"ORDER BY MAX (\"Z_RUN_SEQ_ID\") DESC)) ";
		return currentAsicAdd;
    	
    },
  
	_generateDirectorPersonStatement: function (oPayload){
		
		let directorPersonQuery = 	"SELECT DISTINCT "+
										"org.\"ORG_NUMBER\", "+
										"org.\"ABN\", "+
										"org.\"STD_FIRM\", "+
										"COALESCE(comp.ORG_STATUS, org.ORG_STATUS) AS ORG_STATUS, "+
										"org.\"REGN_END_DT\", "+
										"pers.\"PERSON_NUM\", "+
										"pers.\"BIRTH_DT\", "+
										"pers.\"GIVEN_NAME1\" as \"STD_PERSON_GN\", "+
										"pers.\"GIVEN_NAME2\" as \"STD_PERSON_GN2\", "+
										"pers.\"SURNAME\" as \"STD_PERSON_FN_FULL\" "+
									"FROM \"osr.api.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+
									"LEFT OUTER JOIN \"osr.api.db.staging.synonyms::ASIC_COMPANY_REGISTER\" as comp "+
									"ON org.\"ORG_NUMBER\" = comp.ACN "+
										"INNER JOIN  \"osr.api.db.source.synonyms::ASIC_XREF\" as xref "+
										"ON CONCAT('O',RIGHT(CONCAT('0000000000', org.\"ORG_NUMBER\"), 9)) = xref.\"OWNER_SOURCE_ID\" "+
											"INNER JOIN \"osr.api.db.propagation.synonyms::ASIC_PERSON\" as pers "+
											"ON RIGHT(xref.\"MEMBER_SOURCE_ID\",9) = pers.\"PERSON_NUM\" "+
									"where xref.XREF_ROLE = 'DR' "+
									"AND org.ORG_END_DATE = '999999' "+
									"AND xref.REC_END_DT = '9999-12-31' "+
									"AND xref.XREF_END_DT = '9999-12-31' "+
									"AND "+ oPayload + " " + 
									"AND org.NAME = " + this._getCurrentAsicOrgFile() + " AND  xref.NAME = " + this._getCurrentAsicXrefFile() + " AND (pers.NAME = " + this._getCurrentAsicPerFile() + " OR pers.NAME is NULL)"  ;
									
		return directorPersonQuery;


	},  
	_generateScvDirectorPersonStatement: function (oPayload){
	
		let directorScvPersonQuery = 	"SELECT DISTINCT "+
											"scvorg.SCV_ID, "+
											"bp.source_id as PARTNER, "+
											"scvorg.\"ORG_NUMBER\", "+
											"scvorg.\"ABN\", "+
											"scvorg.\"STD_FIRM\", "+
											"COALESCE(comp.ORG_STATUS, scvorg.ORG_STATUS) AS ORG_STATUS, "+
											"scvorg.\"REGN_END_DT\", "+
											"pers.\"PERSON_NUM\", "+
											"pers.\"BIRTH_DT\", "+
											"pers.\"GIVEN_NAME1\" as \"STD_PERSON_GN\", "+
											"pers.\"GIVEN_NAME2\" as \"STD_PERSON_GN2\", "+
											"pers.\"SURNAME\" as \"STD_PERSON_FN_FULL\" "+
										"FROM ( "+
											"SELECT DISTINCT "+
											"scv.SCV_ID, "+
											"org.ORG_NUMBER, "+
											"CASE WHEN org.ABN = '' THEN scv.ABN ELSE org.ABN END as ABN, "+
											"org.STD_FIRM, "+
											"org.ORG_STATUS, "+
											"org.REGN_END_DT, "+
											"ORG_END_DATE, "+
											"org.NAME "+
											"from \"osr.api.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+ 
											"LEFT OUTER JOIN (select distinct scv_id, abn, acn from \"osr.api.db.synonyms::SCV_Organisation\" where ABN IS NOT NULL) as scv "+
											"on org.ORG_NUMBER = scv.ACN "+
											"where "+ 
											"(CASE WHEN org.ABN = '' THEN scv.ABN ELSE org.ABN END = '41075007500' OR org.ORG_NUMBER = '108574054') "+
										") as scvorg "+	
										 "LEFT OUTER JOIN (select distinct "+
																"scv_id, "+ 
																"source_id "+ 
															"from \"osr.api.db.synonyms::SCV_Organisation\" "+
															"where source = 'RMS' "+
															")as bp "+
													"on scvorg.scv_id = bp.scv_id "+
									"LEFT OUTER JOIN \"osr.api.db.staging.synonyms::ASIC_COMPANY_REGISTER\" as comp "+
									"ON scvorg.\"ORG_NUMBER\" = comp.ACN "+
										"INNER JOIN  \"osr.api.db.source.synonyms::ASIC_XREF\" as xref "+
										"ON CONCAT('O',RIGHT(CONCAT('0000000000', scvorg.\"ORG_NUMBER\"), 9)) = xref.\"OWNER_SOURCE_ID\" "+
											"INNER JOIN \"osr.api.db.propagation.synonyms::ASIC_PERSON\" as pers "+
											"ON RIGHT(xref.\"MEMBER_SOURCE_ID\",9) = pers.\"PERSON_NUM\" "+
									"where xref.XREF_ROLE = 'DR' "+
									"AND scvorg.ORG_END_DATE = '999999' "+
									"AND xref.REC_END_DT = '9999-12-31' "+
									"AND xref.XREF_END_DT = '9999-12-31' "+
									"AND scvorg.NAME = " + this._getCurrentAsicOrgFile() + " AND  xref.NAME = " + this._getCurrentAsicXrefFile() + " AND (pers.NAME = " + this._getCurrentAsicPerFile() + " OR pers.NAME is NULL) "+
									"ORDER BY scvorg.SCV_ID";
								
		return directorScvPersonQuery;


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
  
  	getScvPerson: function(oRequest, oResponse) {
 
    let sScvQuery = this._checkScvRequest(oRequest, oResponse, oRequest.query);
	let directorPersonQuery = this._generateScvDirectorPersonStatement(sScvQuery);				
					

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