"use strict";

const request = require("supertest");

const db = require('../db');
const app = require('../app');

let testCompany;

beforeEach(async function() {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple', 'Makes computers')
    RETURNING code, name`);
  testCompany = result.rows[0];
});



/** GET /companies - returns `{companies: [company, ...]}` */

describe("GET /companies", function () {
  test("Gets companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
});


/** GET /companies/[id] - return data about one company: `{company: company} (value company includes empty invoices )` */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({
      "company": {
        "code": "apple",
        "name": "Apple",
        "description": "Makes computers",
        "invoices": []
    } });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});


/** POST /companies - create & return `{company}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
        .post(`/companies`)
        .send({
          "code": "new",
          "name": "New",
          "description": "new company ..."
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        "company": {
        "code": "new",
        "name": "New",
        "description": "new company ..."
      }
    });

    // test db
    const result = await db.query(
      `SELECT *
        FROM companies
        WHERE name = 'New'`);
    expect(result.rows.length).toEqual(1);
  });

  test("400 if empty", async function () {
    const resp = await request(app)
        .post(`/companies`)
        .send();
    expect(resp.statusCode).toEqual(400);
  });
});