import { Session } from "https://esm.sh/v90/sipapu-2@2.2.2/dist/index.d.ts";
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

  // You can remove services you don't use
  const database = new sdk.Databases(client, 'main');
  const teams = new sdk.Teams(client);
  const users = new sdk.Users(client);

  if (!req.env['APPWRITE_FUNCTION_ENDPOINT'] || !req.env['APPWRITE_FUNCTION_API_KEY']) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.env['APPWRITE_FUNCTION_ENDPOINT'] as string)
      .setProject(req.env['APPWRITE_FUNCTION_PROJECT_ID'] as string)
      .setKey(req.env['APPWRITE_FUNCTION_API_KEY'] as string);
  }

  const payload = JSON.parse(req.payload)
  const session_id = payload.session_id
  const user_id    = payload.user_id

  if (!session_id || !user_id) {
    return res.json({
      status: 400,
      error: 'session_id or user_id missing from the payload'
    }, 400)
  }

  try {
    const session = (await database.getDocument('session', session_id)) as unknown as Session

    const temp = [user_id]
    
    const usersArray = temp.concat(session.users)

    await database.updateDocument('session', session_id, { users: usersArray })

    // add the user to the team
    const user = await users.get(user_id)
    await teams.createMembership(session_id, user.email, [], req.env['APPWRITE_FUNCTION_ENDPOINT'])

    return res.json({
      status: 200,
      message: 'Successfully joined session: ' + session_id
    })
  } catch (err) {
    res.json({
      status: 500,
      error: err.message
    }, 500)
  }
}