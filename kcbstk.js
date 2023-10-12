const axios = require("axios");

// Replace these variables with your actual values
const CONSUMER_KEY = "LcbJqOZAj4c5QRIPDd9sGJg67qrSC2uh";
const CONSUMER_SECRET = "RC77fow6aPiGF6Hk";
const GENERATE_ACCESS_TOKEN_URL =
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const STORE_NUMBER = "174379";
const PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const STK_PUSH_URL =
  "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
const PHONE_NUMBER = "254725614560";
const CALLBACK_URL = "https://api.optitech.co.ke/api/deliverance/confirmation";

async function generateAccessToken() {
  const credentials = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`
  ).toString("base64");
  try {
    const {
      data: { access_token }
    } = await axios.get(GENERATE_ACCESS_TOKEN_URL, {
      headers: {
        Authorization: `Basic ${credentials}`
      }
    });
    return access_token.replace(/\n/g, ""); // Remove newline characters
  } catch (error) {
    console.error(error);
  }
}

async function stkPush() {
  const access_token = await generateAccessToken();

  const requestData = {
    BusinessShortCode: STORE_NUMBER,
    Password: Buffer.from(
      `${STORE_NUMBER}${PASSKEY}${new Date()
        .toISOString()
        .replace(/[-:.T]/g, "")}`
    ).toString("base64"),
    Timestamp: new Date()
      .toISOString()
      .replace(/[-:.T]/g, "")
      .slice(0, 14),
    TransactionType: "CustomerPayBillOnline",
    Amount: "1",
    PartyA: PHONE_NUMBER,
    PartyB: STORE_NUMBER,
    PhoneNumber: PHONE_NUMBER,
    CallBackURL: CALLBACK_URL,
    AccountReference: "Test",
    TransactionDesc: "Test"
  };

  try {
    const response = await axios.post(STK_PUSH_URL, requestData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`
      }
    });

    console.log(response.data);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

stkPush();
