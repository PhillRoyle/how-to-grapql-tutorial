# Queries used in the tutorial

These queries were created in the [Apollo Server Standalone UI](http://localhost:3000/) after running `npm run dev`. They evoled throughout
the tutorial, and additioanl args and return fields may be added.

## Queries
These are 'GET' requests. They are *not* wrapped in authentication for this tutorial

### Fetch All Links
```
query FetchAllLinks {
  fetchAllLinks {
    id
    description
    url
    postedBy {
      name
      links {
        url
        id
      }
      id
      email
    }
    voters {
      name
      id
    }
    createdAt
  }
}
```

#### Fetch All Links **With Filtering**
In tutorial 5, we added (optional) filtering to this API & query. The above query will still work, but to filter, use
```
query FetchAllLinks($filter: String) {
  fetchAllLinks(filter: $filter) {
    url
    id
    description
    voters {
      name
    }
  }
}
```
passing in **variable**: `{"filter": "BBC",}`. The value can be any string or null. Empty string ~= no filter due to node's truthy checking. If the filter string matches nothing, an empty list will be returned (in `Link`, the line `t.nonNull.list.nonNull.field("fetchAllLinks"` means that we can't return null, and any items in the list must be non-null `Link` types, but empty list is allowed).


### Fetch Single Link
```
query FetchSingleLink($fetchSingleLinkId: Int!) {
  fetchSingleLink(id: $fetchSingleLinkId) {
    id
    description
    url
    createdAt
    postedBy {
      name
    }
    voters {
      name
    }
  }
}
```
passing in **variable**: `{"fetchSingleLinkId": 6,}`

## Mutations
These are 'PUT', 'POST', 'DELETE' type requests.

### Unauthenticated
The following allow a user to authenticate

#### Sign Up 
Allows a user to 'register', i.e. creates an entry in the `User` table, and registers a password, from which a token is generated

```
mutation Signup($email: String!, $password: String!, $name: String!) {
  signup(email: $email, password: $password, name: $name) {
    token
    user {
      name
      id
    }
  }
}
```
passing in **variable**: 
```
{
  "email": "non-null",
  "password": "non-null",
  "name": "non-null",
}
```
returns some user info and a JWT token for use in later **authenticated** mutations

#### Log In
Allows a user to 'log in' - retrieves a JWT token based on their password - *not really a mutation?*

```
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      name
      id
    }
  }
}
```
passing in **variable**: 
```
{
  "email": "non-null",
  "password": "non-null",
}
```
returns some user info and a JWT token for use in later **authenticated** mutations

### Authenticated
All of the following mutators make use of the authenitcation framework, and as such, all must have the auth header supplied, with the token
from either [sign up](#sign-up) or [login](#log-in):
`Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.MQ.6sbmlomB3N9JHC6xSeeBGqbCr8Vxi-xZ2mqp6DJ67Kg`

The User is never passed in directly in these queries, instead it's inferred from the JWT bearer token

#### Create a Link
Allows a user to create a 'post':
```
mutation CreateLink($description: String!, $url: String!) {
  createLink(description: $description, url: $url) {
    url
    postedBy {
      name
    }
    description
    createdAt
    id
  }
}
```
passing in **variables**
```
{
  "description": "non-null",
  "url": "non-null",
}
```
and remembering the auth header

### Edit a Link
Allows a user to edit a Link's 'url' and/or 'description' - both are optional fields
```
mutation UpdateLink($updateLinkId: Int!, $description: String, $url: String) {
  updateLink(id: $updateLinkId, description: $description, url: $url) {
    url
    id
    description
  }
}
```
passing in **variables**
```
{
  "description": "optional",
  "url": "optional",
  "updateLinkId": non-null ID
}
```
and remembering the auth header

### Delete a Link
```
mutation DeleteLink($deleteLinkId: Int!) {
  deleteLink(id: $deleteLinkId) {
    voters {
      name
    }
    url
    postedBy {
      name
    }
    id
    description
    createdAt
  }
}
```
passing in **variables**
```
{
  "deleteLinkId": non-null ID
}
```
and remembering the auth header

### Up vote a post
This allows a (signed in user - specified by the bearer token) to 'vote' for a post (Link). It creates an entry in the `Link.voters` list (the entry is the User
who's token it is) *and* an entry in the `User.votes` list (which will be of type 'Link').

```
mutation Vote($linkId: Int!) {
  vote(linkId: $linkId) {
    user {
      name
      id
    }
    link {
      id
      url
      description
    }
  }
}
```
passing in **variables**
```
{
  "linkId": non-null ID
}
```
and remembering the auth header