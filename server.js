const express = require("express");

const app = express();

const path = require("path");

const fs = require("fs");

const axios = require("axios");

const bodyParser = require("body-parser");

//fetch content from company_data.json
const companyData = JSON.parse(fs.readFileSync("company_data.json", "utf-8"));

//fetch content from emails.json

const emailData = JSON.parse(fs.readFileSync("emails.json", "utf-8"));

//fetch content form test.json
const test = JSON.parse(fs.readFileSync("test.json", "utf-8"));

//api call to get company data
app.get("/api/companies", (req, res) => {
  res.json(companyData);
});

//api call to get email data
app.get("/api/emails", (req, res) => {
  res.json(emailData);
});

//api call to get email data
app.get("/api/test", (req, res) => {
  res.json(test);
});

//api call to excecute companies.js
//api call to execute companies.js
app.get("/api/scrape", (req, res) => {
  const { spawn } = require("child_process");
  const child = spawn("node", ["companies.js"]);

  let output = "";

  child.stdout.on("data", (data) => {
    output += data.toString();
    console.log(`stdout:\n${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr:\n${data}`);
  });

  child.on("close", (code) => {
    console.log(`companies.js exited with code ${code}`);

    if (code === 0) {
      const jsonResponse = {
        status: "success",
        message: "companies.js executed successfully",
        output: output
      };
      res.status(200).json(jsonResponse);
    } else {
      const jsonResponse = {
        status: "error",
        message: `companies.js exited with code ${code}`,
        output: output
      };
      res.status(500).json(jsonResponse);
    }
  });
});
// route to kcbstk.js
app.get("/api/kcbstk", (req, res) => {
  const { spawn } = require("child_process");
  const child = spawn("node", ["kcbstk.js"]);

  let output = "";

  child.stdout.on("data", (data) => {
    output += data.toString();
    console.log(`stdout:\n${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr:\n${data}`);
  });

  child.on("close", (code) => {
    console.log(`kcbstk.js exited with code ${code}`);

    if (code === 0) {
      const jsonResponse = {
        status: "success",
        message: "kcbstk.js executed successfully",
        output: output
      };
      res.status(200).json(jsonResponse);
    } else {
      const jsonResponse = {
        status: "error",
        message: `kcbstk.js exited with code ${code}`,
        output: output
      };
      res.status(500).json(jsonResponse);
    }
  });
});
//server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
