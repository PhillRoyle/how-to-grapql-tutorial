# Queries used in the tutorial

These queries were created in the [Apollo Server Standalone UI](http://localhost:3000/) after running `npm run dev`. They evoled throughout
the tutorial, and additioanl args and return fields may be added.

## Queries

These are 'GET' requests. They are *not* wrapped in authentication for this tutorial

### Fetch All Links

```Typescript
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

```Typescript
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

#### Fetch All Links **with pagination**

We also add pagination, with take & skip as limit & offset:

```Typescript
query FetchAllLinks($filter: String, $skip: Int, $take: Int) {
  fetchAllLinks(filter: $filter, skip: $skip, take: $take) {
    url
    id
    description
    voters {
      name
    }
  }
}
```

passing in **variable**: `{"filter": "","take": 3, "skip": 1}`. Take &/or Skip can be present or not. If only 'take' if provided, the query will return 3 items, starting at 0; if only 'skip' is provided, it will return *all* items, except the first (as 1 was passed).

#### Fetch All Links **with sorting**

We also add sorting, which can take zero or more fields to sort over, and sort options of `asc` or `desc`:

```Typescript
query FetchAllLinks($orderBy: [LinkOrderByInput!]) {
  fetchAllLinks(orderBy: $orderBy) {
    url
    id
    description
    voters {
      name
    }
  }
}
```

passing in **variable**:

```Typescript
{
  "orderBy": [
    { "url": "asc",},
    { "description": "desc",}
  ]
}
```

If no args are passed, we sort based on ID (or not at all?) If one is passed, sort (asc or desc) on that, and if, in this case, two Links have the same url, we further sort based on description.

### Fetch Single Link

```Typescript
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

### Fetch Feed

```Typescript
query LinkFeed {
  LinkFeed {
    links {
      url
      description
      id
    }
    count
    id
  }
}
```

this simple version has no args (sort, paginate, filter), so just returns all links, a count, and a 'query ID' based on the args passed in.

---

## Mutations

These are 'PUT', 'POST', 'DELETE' type requests.

### Unauthenticated

The following allow a user to authenticate

#### Sign Up

Allows a user to 'register', i.e. creates an entry in the `User` table, and registers a password, from which a token is generated

```Typescript
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

```Typescript
{
  "email": "non-null",
  "password": "non-null",
  "name": "non-null",
}
```

returns some user info and a JWT token for use in later **authenticated** mutations

#### Log In

Allows a user to 'log in' - retrieves a JWT token based on their password - *not really a mutation?*

```Typescript
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

```Typescript
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

```Typescript
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

```Typescript
{
  "description": "non-null",
  "url": "non-null",
}
```

and remembering the auth header

### Edit a Link

Allows a user to edit a Link's 'url' and/or 'description' - both are optional fields

```Typescript
mutation UpdateLink($updateLinkId: Int!, $description: String, $url: String) {
  updateLink(id: $updateLinkId, description: $description, url: $url) {
    url
    id
    description
  }
}
```

passing in **variables**

```Typescript
{
  "description": "optional",
  "url": "optional",
  "updateLinkId": non-null ID
}
```

and remembering the auth header

### Delete a Link

```Typescript
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

```Typescript
{
  "deleteLinkId": non-null ID
}
```

and remembering the auth header

### Up vote a post

This allows a (signed in user - specified by the bearer token) to 'vote' for a post (Link). It creates an entry in the `Link.voters` list (the entry is the User
who's token it is) *and* an entry in the `User.votes` list (which will be of type 'Link').

```Typescript
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

```Typescript
{
  "linkId": non-null ID
}
```

and remembering the auth header
