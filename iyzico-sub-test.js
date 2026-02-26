require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const https = require('https');

const apiKey = process.env.IYZICO_API_KEY;
const secretKey = process.env.IYZICO_SECRET_KEY;
// Base URL in the user's project is most likely api.iyzipay.com based on the previous error log
const baseUrl = 'https://api.iyzipay.com';

if (!apiKey || !secretKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const randomKey = crypto.randomBytes(8).toString('hex');
const endpoint = '/v2/subscription/products?page=1&count=10';

const dataToSign = randomKey + endpoint;
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(dataToSign, 'utf8');
const encryptedData = hmac.digest('hex');
const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${encryptedData}`;
const headerValue = `IYZWSv2 ${Buffer.from(authorizationString).toString('base64')}`;

const url = new URL(baseUrl + endpoint);

const req = https.request(url, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': headerValue,
        'x-iyzi-rnd': randomKey
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', JSON.stringify(JSON.parse(data), null, 2));
    });
});

req.on('error', e => console.error(e));
req.end();
