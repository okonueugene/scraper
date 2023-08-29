const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");
const { response } = require("express");

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  //delete the file if it exists
  if (fs.existsSync("company_data.json" || "raw_data.json")) {
    fs.unlinkSync("company_data.json");
    fs.unlinkSync("raw_data.json");
  }

  try {
    const baseUrl =
      "https://www.dnb.com/business-directory/company-information.manufacturing.ke.na.nairobi.html?page=";
    const pagesToScrape = 2;
    const outputFileName = "company_data.json";
    const emailsFileName = "emails.json";
    const rawData = "raw_data.json";

    let scrapedData = [];

    if (fs.existsSync(outputFileName)) {
      const existingData = fs.readFileSync(outputFileName, "utf-8");
      scrapedData = JSON.parse(existingData);
    }

    // Load the domain parts from emails.json
    const emailData = JSON.parse(fs.readFileSync(emailsFileName, "utf-8"));

    console.log("Loaded email data:", emailData, emailData.length);
    // const emailDomainParts = emailData.flatMap((entry) => {
    //   const email = entry.email;
    //   const domainPart = email.split("@")[1];
    //   return domainPart
    //     .split(".")
    //     .slice(0, -1)
    //     .map((part) => part.toLowerCase());
    // });
    // console.log("Loaded email domain parts:", emailDomainParts);

    // // Function to find a matching email based on company name
    // function findMatchingEmail(companyName) {
    //   const companyNameParts = companyName.split(" ");
    //   for (const entry of emailData) {
    //     const email = entry.email;
    //     const domainPart = email.split("@")[1];
    //     if (
    //       companyNameParts.some((part) =>
    //         domainPart.includes(part.toLowerCase())
    //       )
    //     ) {
    //       return email;
    //     }
    //   }
    //   return null; // No matching email found
    // }

    // //remove any items with lenght less than 3
    // emailDomainParts.forEach((part, index) => {
    //   if (part.length < 3) {
    //     emailDomainParts.splice(index, 1);
    //   }
    // });

    for (let pageNumber = 1; pageNumber <= pagesToScrape; pageNumber++) {
      const url = baseUrl + pageNumber;
      const page = await browser.newPage();
      await page.goto(url);

      // Wait for the page to be fully loaded
      await page.waitForLoadState("domcontentloaded");

      // Wait for the data to be visible
      await page.waitForSelector("#companyResults .data", { timeout: 30000 });

      // Extract company information
      const companyData = await page.evaluate(() => {
        const companies = Array.from(
          document.querySelectorAll("#companyResults .data")
        );

        return companies.map((company) => {
          const name = company.querySelector(".col-md-6 a").textContent.trim();
          const location = company
            .querySelector(".col-md-4")
            .textContent.trim()
            .split(":")[1];
          const salesRevenue = company
            .querySelector(".col-md-2.last")
            .textContent.trim()
            .replace(/\n/g, "")
            .replace(/\s/g, "")
            .replace(/[^\d\.]/g, "");

          return {
            name: name.replace(/\n/g, ""), // Remove newline characters
            location: location.replace(/\n/g, "").replace(/\s+/g, " "), // Remove newline characters and extra spaces
            salesRevenue: `$${salesRevenue}M`
          };
        });
      });

      console.log("Scraped data:", companyData);

      // Append the data to the rawData file
      const existingRawData = fs.existsSync(rawData)
        ? JSON.parse(fs.readFileSync(rawData, "utf-8"))
        : [];
      const newData = existingRawData.concat(companyData);
      fs.writeFileSync(rawData, JSON.stringify(newData, null, 2));

      console.log("Raw data has been saved to", rawData);

      // Create a new array of company data with emails
      const companiesWithEmails = [];

      for (const company of companyData) {
        const matchingEmail =
          emailData.find((entry) => entry.name === company.name)?.email || null;

        if (matchingEmail) {
          companiesWithEmails.push({
            ...company,
            email: matchingEmail
          });
        }
      }

      fs.writeFileSync(
        outputFileName,
        JSON.stringify(companiesWithEmails, null, 2)
      );

      // // Filter company data based on similarity of domain parts
      // const filteredData = companyData.filter((company) => {
      //   const companyNameParts = company.name.split(" ");
      //   return companyNameParts.some((namePart) => {
      //     return emailDomainParts.includes(namePart.toLowerCase());
      //   });
      // });

      // // Map filteredData to include matching email addresses
      // const dataWithMatchingEmails = filteredData.map((company) => {
      //   const matchingEmail = findMatchingEmail(company.name);
      //   if (matchingEmail) {
      //     company.email = matchingEmail;
      //   }
      //   return company;
      // });

      // scrapedData = scrapedData.concat(dataWithMatchingEmails);
      // const uniqueData = Array.from(
      //   new Set(scrapedData.map(JSON.stringify))
      // ).map(JSON.parse);

      // fs.writeFileSync(outputFileName, JSON.stringify(uniqueData, null, 2));

      // await page.close();
    }

    console.log("Scraped data has been saved to", outputFileName);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
})();
