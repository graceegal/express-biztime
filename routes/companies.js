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
         FROM companies
         ORDER BY name`);
  const companies = results.rows;
  return res.json({ companies });
});




/**
 * GET request to /companies -- for companies code
 * return JSON: {company: {code, name, description, invoices: [id, ...]}}
 */
router.get("/:code", async function (req, res, next) {
  const code = req.params.code;

  const cResults = await db.query(
    `SELECT code, name, description
         FROM companies
         WHERE code = $1`, [code]);
  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`Company does not exist : ${req.params.code}.`);

  const iResults = await db.query(
    `SELECT id
      FROM invoices
      WHERE comp_code = $1`, [code]);
  company.invoices = iResults.rows.map(i => i.id);

  return res.json({ company });
});




/** Create new company, returning JSON: {company: {code, name, description}};
 * Accepts JSON body: {code, name, description}
*/

router.post("/", async function (req, res, next) {
  if (!req.body) throw new BadRequestError('Missing company information.');

  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description],
  );
  const company = result.rows[0];
  return res.status(201).json({ company });
});



/** Update company, returning {company: {code, name, description}};
 * Accepts JSON body: {name, description}
*/

router.put("/:code", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
           SET name=$1,
           description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, req.params.code],
  );
  const company = result.rows[0];

  if (!company) throw new NotFoundError(`Company does not exist : ${req.params.code} .`);

  return res.json({ company });
});


/** Delete company, returning JSON: {status: "deleted"};
 * Takes in company code as URL parameter.
 */
router.delete("/:code", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`,
    [req.params.code],
  );
  const results = result.rows[0];

  if (!results) throw new NotFoundError(`Company does not exist : ${req.params.code} .`);
  return res.json({ status: "deleted" });
});


module.exports = router;