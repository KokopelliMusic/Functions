import { Query } from "https://deno.land/x/appwrite@5.0.1/mod.ts";
import { sdk, sipapu } from "./deps.ts";

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

  if (!payload.session_id) {
    return res.json({
      status: 500,
      error: 'session_id missing from request payload'
    })
  }

  if (!payload.playlist_id) {
    return res.json({
      status: 500,
      error: 'playlist_id missing from request payload'
    })
  }

  if (!payload.user_id) {
    return res.json({
      status: 500,
      error: 'user_id missing from request payload'
    })
  }

  try {
    const session = await database.listDocuments('temp_session', [
      Query.equal('session_id', payload.session_id)
    ])

    if (session.total === 0) {
      return res.json({
        status: 400,
        message: 'No sessions found with that session_id'
      })
    }

    const user = await users.get(payload.user_id);

    // since there can only be one session with that id, select the first one
    const session_id = session.documents[0].$id

    // Create a new team for this session
    await teams.create(session_id, session_id)

    // and add this user to it.
    await teams.createMembership(session_id, user.email, [], req.env['APPWRITE_FUNCTION_ENDPOINT'])
  
    // Create the session in the database, giving r/w permission to everyone in the team.
    await database.createDocument('session', session_id, {
      settings: JSON.stringify(sipapu.DEFAULT_SETTINGS),
      playlist_id: payload.playlist_id,
      user_id: payload.user_id,
      users: [payload.user_id]
    }, 
      [`team:${session_id}`], 
      [`team:${session_id}`]
    )

    await database.deleteDocument('temp_session', session_id)

    return res.json({
      status: 200,
      session_id: session_id
    })

  } catch (err) {
    
    return res.json({
      status: 500,
      message: err.message
    })
  
  }
}