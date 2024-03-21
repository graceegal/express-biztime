"use strict";

const express = require("express");
const db = require('../db');

const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();


/**
 * GET request to /companies, return JSON: {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});




/**
 * GET request to /companies -- for companies code
 * return JSON: {company: {code, name, description}}
 */
router.get("/:code", async function (req, res, next) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
         FROM companies
         WHERE code = $1`, [code]);



  const company = results.rows;
  
  if (company.length === 0) {
    throw new NotFoundError("Company code does not exist.");
  }
  return res.json({ company });
});




module.exports = router;