"use strict";

const express = require("express");
const db = require('../db');

const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();





/**
 * GET request to /invoices, return JSON: {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices
         ORDER BY id`);
  const invoices = results.rows;
  return res.json({ invoices });
});





/**
 * GET request to /companies -- for companies code
 * return JSON: {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 */
router.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
         FROM invoices
         WHERE id = $1`, [id]);
  const invoice = iResults.rows[0];

  if (!invoice) throw new NotFoundError(`Invoice does not exist : ${req.params.id}.`);

  const cResults = await db.query(
    `SELECT code, name, description
         FROM companies
         WHERE code = $1`, [invoice.comp_code]);
  const company = cResults.rows[0];
  invoice.company = company;
  const { comp_code, ...newInvoice } = invoice;

  //TODO: let newInvoice = invoice.filter(obj => obj.key !== obj.comp_code);
  return res.json({ newInvoice });
});




/** Create new invoice, returning JSON:
 * {invoice: {id, comp_code, amt, paid,
 * add_date, paid_date}}
 *
 * Accepts JSON body: {comp_code, amt}
*/

router.post("/", async function (req, res, next) {
  if (!req.body) throw new BadRequestError('Missing invoice information.');

  const { comp_code, amt } = req.body;

  const comp_code_results = await db.query(
    `SELECT code
         FROM companies
         WHERE code = $1`,
         [comp_code]);
  const comp = comp_code_results.rows[0];
  if (!comp) throw new NotFoundError('Invalid company.');

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid,
           add_date, paid_date`,
    [comp_code, amt],
  );

  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});


/** Update invoice, returning {invoice: {id, comp_code, amt, paid, add_date, paid_date}};
 * Accepts JSON body: {amt}
*/

router.put("/:id", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const { amt } = req.body;

  const result = await db.query(
    `UPDATE invoices
           SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id],
  );
  const invoice = result.rows[0];

  if (!invoice) throw new NotFoundError(`Invoice does not exist : ${req.params.id}.`);

  return res.json({ invoice });
});


module.exports = router;