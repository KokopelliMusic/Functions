import { sdk } from "./deps.ts";

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
// deno-lint-ignore no-explicit-any
export default async function (req: any, res: any) {
  const client = new sdk.Client();
  const LETTERS = 'ABCDEFGHKNPRSTUVXYZ'

  const database = new sdk.Databases(client, 'main');

  if (!req.env['APPWRITE_FUNCTION_ENDPOINT'] || !req.env['APPWRITE_FUNCTION_API_KEY']) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'] as string)
      .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'] as string)
      .setKey(req.env['APPWRITE_FUNCTION_API_KEY'] as string);
  }

  try {
    const docs = await database.listDocuments('session')
    const names: string[] = []
    for (let i = 0; i < docs.total; i++) {
      names.push(docs.documents[i].$id)
    }
    
    let key = ''
    let found = false

    while (!found) {
      key = ''

      for (let i = 0; i < 4; i++) {
        key += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length))
      }

      if (!names.includes(key)) {
        found = true
      }
    }
  
    await database.createDocument('temp_session', key, {
      session_id: key
    })

    res.json({
      status: 200,
      session_id: key
    })
  } catch (err) {
    console.error(err)
    res.json({
      status: 500,
      error: err.message
    })
  }
}