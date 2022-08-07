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
export default function (req: any, _res: any) {
  const client = new sdk.Client();

  // You can remove services you don't use
  const database = new sdk.Databases(client, 'main');

  if (!req.env['APPWRITE_FUNCTION_ENDPOINT'] || !req.env['APPWRITE_FUNCTION_API_KEY']) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'] as string)
      .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'] as string)
      .setKey(req.env['APPWRITE_FUNCTION_API_KEY'] as string);
  }

  database.listDocuments('temp_session')
    .then(temps => {
      temps.documents.forEach(temp => {
        const dateCreated = temp.$createdAt * 1000

        // This session has been created more than 1 hour ago, delete it!
        // if (((new Date().getTime()) - dateCreated) < 60 * 60 * 1000) {
        if ((dateCreated + (60 * 60 * 1000) < new Date().getTime())) {
          database.deleteDocument('temp_session', temp.$id)
        }
      })
    })
    .catch(err => {
      console.error(err)
    })
}