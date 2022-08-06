from pydoc import doc
from appwrite.client import Client

# You can remove imports of services you don't use
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.query import Query

import json

"""
  'req' variable has:
    'headers' - object with request headers
    'payload' - object with request body data
    'env' - object with environment variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
"""

def main(req, res):
  client = Client()

  # You can remove services you don't use
  account = Account(client)
  database = Databases(client, 'main')
  users = Users(client)

  if not req.env.get('APPWRITE_FUNCTION_ENDPOINT') or not req.env.get('APPWRITE_FUNCTION_API_KEY'):
    print('Environment variables are not set. Function cannot use Appwrite SDK.')
  else:
    (
    client
      .set_endpoint(req.env.get('APPWRITE_FUNCTION_ENDPOINT', None))
      .set_project(req.env.get('APPWRITE_FUNCTION_PROJECT_ID', None))
      .set_key(req.env.get('APPWRITE_FUNCTION_API_KEY', None))
      .set_self_signed(True)
    )

  try:
    payload = json.loads(req.payload)
    songs = database.list_documents('song', Query.equal('playlist_id', payload['playlist_id']))
    contributors = get_all_contributors(songs, users)

    return res.json({
      "status": 200,
      "contributors": contributors
    })

  except Exception as err:
    return res.json({
      "status": 500,
      "message": err
    })


def get_all_contributors(songs, users: Users):
  
  ids = []
  contributors = []

  for song in songs:
    if song.added_by not in ids:
      ids.append(song.added_by)

  for id in ids:
    user = users.get(id)
    contributors.append(user.name)

  return contributors