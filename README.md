# how-to-grapql-tutorial

Following the tutorial from [how to graphql](https://www.howtographql.com/typescript-apollo/1-getting-started/).
Take a look at my `oreilly_practical_graphQL` repo for basics

## What is this?

Making a 'hackernews' api. 
It has concepts of users signing up and logging in, 'links' that people have 'posted', containing a url and description, and a mechanism for 'voting' on links that you like. We'll also add authentication, persistence, filtering, sorting, etc.

To view the queries used (in [prisma client](http://localhost:3000/), started with `npm run dev`), look at [query fixtures](./src/queries-fixtures.md).

## Get Started
* install dependencies `npm i`
* build the solution `npm run build/compile`
* generate graphQL schema `npm run generate`
* start [prisma client](http://localhost:3000/) `npm run dev`
* optinally, look at the data in prisma studio - [localhost:5555](http://localhost:5555/) - `npx prisma studio`

## 1. Basic CRUD

1. ran `npx ts-node --transpile-only src/schema` - generated `nexus-typegen.ts` and `schema.graphql` files. NB, to do
   this, had to remove the `"type": "module",` from `package.json`.
2. added scripts to `package.json` --> eg `npm run generate`
   1. `dev` - start the web server and watch for any changes. Port is supplied, so it starts on
      [localhost:<port>](http://localhost:3000/), with the query I defined (generated into `schema.graphql`).
   2. `generate` - updates generated files when there are any changes in your Nexus code. **NB** I switched this to
      `tsnd --transpile-only src/schema.ts`
3. Defined `Links` schema type (under `graphql/Links.ts`), imported into `schema.ts` (while server was running), and
   it auto-added to `schema.graphql`.
4. Next, create a `links` query to return all the `Links` objects
   1. In `Links`, `resolve` is the name of the resolver function - the implementation for a GraphQL field. Every
      field on each type (including the root types) has a resolver function. It knows where to get data from, and how to
      package it up before returning. Each schema type (i.e. Query) has a resolver
   2. Each resolver has 4 args
      1. `parent` - (or 'root') the result of the _previous_ resolver. Queries can be nested (inside the {}), so the
         first passes result on to the 2nd, etc etc, see [Nesting Queries](#Nesting-Queries)
      2. `args`
      3. `context` - when using prisma (etc) to get the data, we use this to register it to the resolver. A js obj that
         all resolvers in the chain and read/write to, so it allows them to communicate.
      4. `info`
5. Add a `mutator` - ~PUT/POST request. **NB** this is the _inline_ method - preferable to user variable-based approach.
   1. create a new one with `mutation { post(url: "bbc.co.uk", description: "BBC") {id}}` - note the `{id}` is the return
      type --> response is `{ "data": { "post": { "id": 4 } } }`
   2. retrieve again with `query { feed { url, description, id }}`
   3. As the data is in a file & memory based, if we re-start the server, these are lost

### Preferable Variable based approach to queries

Rather than the above _inline_ approach:

```agsl
mutation { post(url: "bbc.co.uk", description: "BBC") {id}}
```

try

```agsl
mutation Post($description: String!, $url: String!) {
  post(description: $description, url: $url) {
    description
    url
    id
  }
}
```

with variables passed in (in lower tab in Apollo) like

```
{
  "description": "bbc",
  "url": "bbc.co.uk"
}
```

similarly

```agsl
mutation Delete($deleteId: Int!) {
  delete(id: $deleteId) {
    url
    id
    description
  }
}
// with variables
{
  "deleteId": 6
}
```

### Nesting Queries

The following

```agsl
query {
  feed {
    id
    url
    description
  }
}
```

has 2 levels (2 sets of `{}`). On the first level, it invokes the feed resolver and returns the entire data stored in
`links` For the second execution level, the GraphQL server is smart enough to invoke the resolvers of the `Link` type
(because thanks to the schema, it knows that feed returns a list/array of `Link` elements) for each element inside the
list that was returned on the previous resolver level. Therefore, in the resolvers for the three fields in the `Link`
type (`id`, `description` and `url`), the incoming parent object is the element inside the links array.

## GraphQL Schema

> At the core of every GraphQL API, there is a GraphQL schema, defined in the GraphQL Schema Definition Language (SDL)
>
> Every GraphQL schema has three special root types: Query, Mutation, and Subscription (NB see `oreilly_practical_graphQL`
> for more info). The fields on these root types are called root fields and define the available API operations.

### Workflow

1. Define the components of your schema (types, fields, root object types, etc) using Nexus.
2. Generate the GraphQL SDL and types.
3. Implement the corresponding resolver functions for the added fields.

---

## 2. Add Persistence - using Prisma and MySQL

From [how to graphQL](https://www.howtographql.com/typescript-apollo/4-adding-a-database/):

> Next set up a new SQLite to persist the data of incoming GraphQL mutations. Instead of writing SQL directly,
> you will use Prisma to access your database.

Installed prima (and client), and init it with `npx prisma init`. Prisma is an ORM, containing a schema that allows
it to map to the underlying data nicely. SQLite is a self-contained, serverless, zero-configuration, transactional SQL
database engine - reads and writes directly to disk, so not lots of set up, in fact prisma can do it:
`npx prisma migrate dev --name "init"` --> creates `dev.db` and `dev.db-journal` - used `schema.prisma` to make a
`Link` DB table.

### Prisma UI
Prisma includes [Prisma Studio](https://github.com/prisma/studio) that gives a UI to tables, data, and relationships. 
To access it, write `npx prisma studio`, it'll open on [localhost:5555](http://localhost:5555/). 

**NB** can regenerate data using `npx prisma generate`.

### Running it as standalone

Added this stuff in `script.ts` as a separate runner to play with it. To execute, run `npx ts-node src/script.ts`, or
`npm run prisma:fetch`. This stuff will be moved into Graphql next.

### Hook up to GraphQL

- create a `context.ts` file to hold out context obj (see [Steps](#Steps)).
- add that context to `schema.ts` to provide a `contextType`
- next add the context to the Apollo server in `index.ts` - note that it must be an async function returning the context
- next, make use of the `context.prisma` stuff in the resolvers (in `Link`)
- as we're using prisma (MySQL) rather than a text file, changes are now persisted between restarts

---

## 3. Auth and Auth

First, need to define the concept of a `User` - add it to the prisma schema - a new `User` model, and adding fileds to `Link` to represent who posted the link...

As we have changed the DB schema, we need to regenerate the auto-gen files. Here we used a named one `prisma:regen-named` (look inside `prisma/migrations`, it gives a migration path, and naming them makes sense).

Next, define the schema as `graphql/User.ts` - note the `links` field is a non-null array of Links, and as it's not simple, we need to add a resolver to fetch that data... Same for `Links` when we add the `postedBy` field. Looks like as it's not a trivial scala value, we need to tell graphQL exactly how to retrieve that from the DB. It uses `parent` to find the _current_ object in the DB, and then gets the specific field from there.

? Does that mean 2 DB queries???

> Note: This interesting syntax where you can traverse and fetch relation fields by chaining the field name (findUnique(...).relationFieldName()) is called the [Fluent API](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#fluent-api) in Prisma

Run `npm run generate` to make `schema.graphql` update to include the new object.

### Implementing `singup` and `login`

Implementing JWT-based authentication, so we'll make an `AuthPayload` type, containing a token, that will be the return type for `signup` and `login` APIs (mutators). These variously create a user, with encrypted password, retrieve user, compare passwords, and both return JWTs.

Install `bcrypt` and `jsonwebtoken` (and types), then create `Auth.ts` to hold the authPayload.

### Adding Authentication to the server

Need to add tioken decoding fn to `utils/auth.ts` too. Next, resolvers don't have access to incoming resquests (in order to get the `Authorization` header), so we'll pass it in the `context` object, by getting the request.

Once done, need to actually use this shit, so pass into all the resolvers (choosing to only add to mutators for this example)...

Run the server again with

```
npm run build/compile
npm run generate
npm run dev
```

go to [localhost:3000](http://localhost:3000/).

Should still be able to retrieve the full list of posts (links), but if you try to create one, you should get an unauthorised error.

Run a `signup` mutation (see `schema.graphql` for the list Mutations & Queries) with user info. It _should_ spit out a token.

Grab the token and try the `createLink` mutation aghain, but before sending it, add a header `Authorization`: `Bearer <token>` and send.

This time, it should be successful _and_, the link should be linked to the user who created it!

---

## 4. Voting and Customer Scalars

### Add voting
An enhancement to both Link and User schemas - a user can now upvote a post (link). That means that each Link should record who's voted for it, 
and each user should know which Links they've voted for. All of this should be done behind our authentication too.

1. modified `schema.prisma` to include additional table fields (and relationships)
2. re-generate the *database* schemas with `npx prisma migrate dev --name "add-vote-relation"`
3. create `graphql/Vote` type and mutator
4. regenerate the *graphql* schema with `npm run generate` (and check out `schema.graphql` to see the new vote API)
5. add `voters` field to `Link` and `votes` to `User`
6. run it (`npm run dev`) and so long as you have an auth token (sign in or log in) in headers, can add a 'vote' to a Link.
7. checking in Prisma Studio (`npx prisma studio`) shows the nice updates

### Custom Scalars
Generally, these are primitive, but we might want to define more complex ones, eg the `url` in `Link` is a string, but we might want to change it to `Url` type
to add in nice validation, etc.

> The benefit of scalars is that they simultaneously define the representation and validation for the primitive data types in your API.

Due to the above, our custom scalars need to define how to de/serialise data (uses `GraphQLScalarType`). There are a load of predefined ones in 
`graphql-scalars`, i.e. `DateTime`.

1. add the new lib to `package.json`
2. import the right lib in `graphql/scalars/Date` and add to the `index.ts` export list
3. add to the `Link` type definition in a `createdAt` field
4. regenerate the *graphql* schema with `npm run generate` (and check out `schema.graphql` to see the new scalar, and field in Link)
5. use the `fetchAllLinks` query, and the new field should be populated (taken from prisma metadata!!?)

---

## 5 Filtering, Pagination, and Sorting
GraphQL lets you add params to queries to adjust what's returned.

I *assume* this is a SQL-style filter, where only the data required is returned, rather than a dynamoDB-style filter where it's *all* returned and filtered on the server.

In this case, Prisma does lots of the work to make it simpler. 

### Filtering
We'll add a `filter: string` parameter to the `fetchAllLinks` API. It should only return Link elements whose `url` or `description` match the filter. Next, we define a `where` clause, making sure that we check for filter being present as it's optional. Inside that, simply check whether the filter string is a substring of url or description.

### Pagination

#### Overview of methods
There are two main approaches to pagination (although both are similar):
1. Limit-Offset. Largely used for page 1, page 2, page 3,... style pagination. You provide the `limit` - how many items to return - and the `offset` - where to start from, so in SQL `SELECT * FROM posts ORDER BY created_at LIMIT 10 OFFSET 2500;` we'd get the next 10 posts, starting at post 2500 - 2501 - 2510. As we know how many fit on a 'page' (10), a REST API could just supply the page number `GET https://meta.discourse.org/latest.json?page=2`
**NOTE** in prisma, it's termed 'take' and 'skip' 😫 Take == limit - how many items you take after the start index; Skip == Offset - how many elements are skipped before you start taking.
2. Cursor-based. Better suited for non-static content, or infinite scroll, where the items don't always stay in the same order. Here, each item has some unique ID that can be referenced (the `cursor`), and we simply ask for x number of items *after* that. So for SQL, using `created_at` as our cursor:
```
SELECT * FROM posts
WHERE created_at < $after
ORDER BY created_at LIMIT $page_size;
```
and the REST API could be `GET example.com/posts?after=153135&count=25`

[This](https://www.apollographql.com/blog/graphql/pagination/understanding-pagination-rest-graphql-and-relay/) has a nice summary.

#### Exercise
* add `take` and `skip` args to the `fetchAllLinks` API, again optional.
* run `npm run generate` so that the new args are added to the `schema.graphql` file, and are available to the resolver.
* add them beneath the `where` clause, remembering that they're optional.
* `npm run dev` and test with the new args and variables

### Pagination
* create an inputObjectType in `Link`, and an enum to provide sorting options
> LinkOrderByInput represents the criteria by which that the list of Link elements can be sorted. The Sort enum is used to define the sorting order.
* add an `orderBy` field to the `fetchAllLinks` API. Note that this take a list, so we can provide multiple sorting options, i.e. start with `url`, and if 2 entries have the same url, sort further by `createdAt`
* run `npm run generate` to update `schema.graphql`
* add an `orderBy` clause beneath the `where` and pagination fields in the resolver
* `npm run dev` and test with the new args and variables

### Link Feed
Added a new API `LinkFeed`. The [tutorial](https://www.howtographql.com/typescript-apollo/8-filtering-pagination-and-sorting/) says to add it to the `Link` type and refactor the return, but it felt different.
* created a new type `Feed`
* defined resolver (with basic 'fetch all links' query)
* ran `npm run generate`
* the query works