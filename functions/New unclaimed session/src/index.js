const sdk = require("node-appwrite");

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'env' - object with environment variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
*/

const LETTERS = 'ABCDEFGHKNPRSTUVXYZ'

module.exports = async function (req, res) {
  const client = new sdk.Client();
  let database = new sdk.Databases(client, 'YOUR_DATABASE_ID');

  if (!req.env['APPWRITE_FUNCTION_ENDPOINT'] || !req.env['APPWRITE_FUNCTION_API_KEY']) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.env['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  }

  try {
    let docs = await database.listDocuments('session')
    let names = []
    for (let i = 0; i < docs.length; i++) {
      names.append(docs[i].$id)
    }
    
    let key = ''
    let found = false

    while (!found) {
      key = generateNewSessionKey(names)
      if (names.includes(key)) {
        found = true
      }
    }
  
    database.createDocument('temp_session', key, {})
  } catch (err) {
    throw err
  }
};

function generateNewSessionKey() {
  let res = ''
  let length = LETTERS.length
  for (let i = 0; i < 4; i++) {
    res += LETTERS.charAt(Math.floor(Math.random() * length))
  }
}