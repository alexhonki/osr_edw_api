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

	_generateCompanyStatement: function (oPayload){
		
		let companyQuery = 	"SELECT DISTINCT "+
								"org.\"ORG_NUMBER\", "+
								"org.\"ABN\", "+
								"org.\"STD_FIRM\", "+
								"comp.\"ORG_STATUS\", "+
								"org.\"REGN_END_DT\" "+
							"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+
								"INNER JOIN \"osr.scv.org.foundation.db.staging.synonyms::ASIC_COMPANY_REGISTER\" as comp "+
								"ON org.\"ORG_NUMBER\" = comp.ACN "+
									"INNER JOIN (SELECT \"ABN\", \"ACN\" FROM (SELECT * FROM ("+ oPayload +"))) as rms "+
									"ON (CASE WHEN org.\"ABN\" = '' THEN NULL ELSE org.ABN END) = IFNULL(rms.\"ABN\",'') OR (CASE WHEN org.\"ORG_NUMBER\" = '' THEN NULL ELSE org.ORG_NUMBER END) = IFNULL(rms.\"ACN\",'') "+
									"WHERE org.\"ORG_END_DATE\" = '999999' "+
									"AND org.NAME = " + this._getCurrentAsicOrgFile() + " AND  comp.NAME = " + this._getCurrentAsicComFile();
		
		return companyQuery;
		
		
	},  
	
	_generateDirectorStatement: function (oPayload){
	
	let directorQuery = 		"SELECT DISTINCT "+
								"org.ORG_NUMBER, "+
								"org.ABN, "+
								"org.STD_FIRM, "+
								"comp.ORG_STATUS, "+
								"org.REGN_END_DT, "+
								"xref.OWNER_SOURCE_ID, "+
								"xref.XREF_ROLE, "+
								"xref.MEMBER_SOURCE_ID, "+
								"xref.ROLE_START_DT, "+
								"xref.XREF_END_DT, "+
								"addr.STD_ADDR_COUNTRY_NAME, "+
								"addr.STD_ADDR_LOCALITY, "+
								"addr.STD_ADDR_REGION, "+
								"addr.STD_ADDR_POSTCODE1, "+
								"addr.STD_ADDR_POSTCODE2, "+
								"addr.STD_ADDR_BUILDING_NAME, "+
								"addr.STD_ADDR_PRIM_NAME, "+
								"addr.STD_ADDR_PRIM_TYPE, "+
								"addr.STD_ADDR_PRIM_PREFIX, "+
								"addr.STD_ADDR_PRIM_POSTFIX, "+
								"addr.STD_ADDR_PRIM_NUMBER, "+
								"addr.STD_ADDR_SINGLE_ADDRESS, "+
								"addr.STD_ADDR_COUNTRY_2CHAR, "+
								"pers.PERSON_NUM, "+
								"pers.BIRTH_DT, "+
								"pers.STD_PERSON_GN, "+
								"'' as STD_PERSON_GN2, "+
								"pers.STD_PERSON_FN_FULL "+
							"FROM \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ORGANISATION\" as org "+
								"INNER JOIN \"osr.scv.org.foundation.db.staging.synonyms::ASIC_COMPANY_REGISTER\" as comp "+
								"ON org.\"ORG_NUMBER\" = comp.ACN "+
									"INNER JOIN  \"osr.scv.org.foundation.db.staging.synonyms::ASIC_XREF\" as xref "+
									"ON CONCAT('O',RIGHT(CONCAT('0000000000', org.ORG_NUMBER), 9)) = xref.OWNER_SOURCE_ID "+
										"INNER JOIN \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_ADDRESS\" as addr "+
										"ON xref.ADDRESS_NUM = addr.ADDRESS_NUMBER "+
											"LEFT OUTER JOIN \"osr.scv.org.foundation.db.propagation.synonyms::ASIC_PERSON\" as pers "+
											"ON RIGHT(xref.\"MEMBER_SOURCE_ID\",9) = pers.\"PERSON_NUM\" "+
												"INNER JOIN (SELECT ABN, ACN FROM (SELECT * FROM ("+ oPayload +"))) as rms "+
												"ON (CASE WHEN org.ABN = '' THEN NULL ELSE org.ABN END) = IFNULL(rms.ABN,'') OR (CASE WHEN org.ORG_NUMBER = '' THEN NULL ELSE org.ORG_NUMBER END) = IFNULL(rms.ACN,'') "+
											"where xref.XREF_ROLE IN ('DR','PA','RG') "+
											"AND org.ORG_END_DATE = '999999' "+
											"AND xref.REC_END_DATE = '999999' "+
											"AND org.NAME = " + this._getCurrentAsicOrgFile() + " AND  xref.NAME = " + this._getCurrentAsicXrefFile() + " AND  (pers.NAME = " + this._getCurrentAsicPerFile() + " OR pers.NAME is NULL)" + " AND comp.NAME = " + this._getCurrentAsicComFile()  + " AND  addr.NAME = " + this._getCurrentAsicAddrFile(); ;
	return directorQuery;
	
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
  },
  
	getDirector: function(oRequest, oResponse) {
 
    let sRMSQuery = this._checkRequest(oRequest, oResponse, oRequest.query);
	let directorQuery = this._generateDirectorStatement(sRMSQuery);				
					

    let client = oRequest.db;
    let oController = this;
    async.waterfall([

      function prepare(callback) {
        client.prepare(
          directorQuery,
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
          let oFinalResult = results
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