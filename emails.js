const { default: axios } = require("axios");
const fs = require("fs");

const rawData = fs.readFileSync("raw_data.json", "utf-8");
const companyData = JSON.parse(rawData);

const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Function to find the best matching email for a company
function findBestMatchingEmail(companyName, emails) {
  let bestMatch = null;
  let bestMatchScore = 0;

  const companyNameAcronyms = getAcronyms(companyName.toLowerCase());

  // Names to exclude
  const excludedNames = [
    "john doe",
    "jane doe",
    "richard roe",
    "mary major",
    "john stiles",
    "james doe",
    "judy doe",
    "john q. public",
    "joe public",
    "joe bloggs",
    "john smith",
    "john.doe",
    "jane.doe",
    "richard.roe",
    "mary.major",
    "john.stiles",
    "james.doe",
    "judy.doe",
    "john q. public",
    "joe.public",
    "joe.bloggs",
    "john.smith",
    "jdoe",
    "batman",
    "superman",
    "spiderman",
    "ironman",
    "doe-j",
    "Finance.AP.KE",
    "J.Smith",
    "J.Doe"
  ];

  for (const email of emails) {
    const emailDomain = email.split("@")[1].split(".")[0].toLowerCase();

    // Exclude certain email domains
    if (emailDomain === "gmail") {
      continue;
    }

    //only allow emails with .com ,org, .co.ke , .ea , .net , .edu , .ac
    if (
      emailDomain === "com" ||
      emailDomain === "org" ||
      emailDomain === "co.ke" ||
      emailDomain === "ea" ||
      emailDomain === "net" ||
      emailDomain === "edu" ||
      emailDomain === "ac"
    ) {
      continue;
    }

    // Check if the email name is in the excluded names
    const emailName = email.split("@")[0].toLowerCase();
    if (excludedNames.includes(emailName)) {
      continue;
    }

    let matchScore = 0;

    // Check for exact domain match
    if (emailDomain === companyNameAcronyms[0]) {
      matchScore = companyNameAcronyms[0].length;
    } else {
      for (const acronym of companyNameAcronyms) {
        if (emailDomain.includes(acronym)) {
          matchScore += acronym.length;
        }
      }
    }

    if (matchScore > bestMatchScore) {
      bestMatch = email;
      bestMatchScore = matchScore;
    }
  }

  return bestMatch;
}

function getAcronyms(text) {
  const words = text.split(" ");
  const acronyms = [];

  for (const word of words) {
    const firstLetter = word[0];
    if (firstLetter.match(/[a-zA-Z]/)) {
      acronyms.push(firstLetter);
    }
  }

  return acronyms;
}

async function getEmailsForCompany(companyName) {
  const searchQuery = encodeURIComponent(companyName + " email Address");

  try {
    const response = await axios.get(
      `https://www.google.com/search?q=${searchQuery}`
    );
    const emails = response.data.match(regex);

    if (emails && emails.length > 0) {
      const bestMatch = findBestMatchingEmail(companyName, emails);
      return bestMatch;
    } else {
      return null;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

async function processCompanyData() {
  const companiesWithEmails = [];

  for (const company of companyData) {
    const matchingEmail = await getEmailsForCompany(company.name);

    if (matchingEmail) {
      companiesWithEmails.push({
        ...company,
        email: matchingEmail
      });
    }
  }

  fs.writeFileSync(
    "companies_with_emails.json",
    JSON.stringify(companiesWithEmails, null, 2)
  );
}

processCompanyData();
