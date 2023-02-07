# how-to-grapql-tutorial
Following the tutorial from [how to graphql](https://www.howtographql.com/typescript-apollo/1-getting-started/).
Take a look at my `oreilly_practical_graphQL` repo for basics

## What is this?
Making a 'hackernews' api

## Steps
1. ran `npx ts-node --transpile-only src/schema` - generated `nexus-typegen.ts` and `schema.graphql` files. NB, to do 
this, had to remove the `"type": "module",` from `package.json`.
2. added scripts to `package.json` --> eg `npm run generate`
   1. `dev` -  start the web server and watch for any changes. Port is supplied, so it starts on
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
      1. `parent` - (or 'root') the result of the *previous* resolver. Queries can be nested (inside the {}), so the 
      first passes result on to the 2nd, etc etc, see [Nesting Queries](#Nesting-Queries)
      2. `args`
      3. `context` - when using prisma (etc) to get the data, we use this to register it to the resolver. A js obj that
      all resolvers in the chain and read/write to, so it allows them to communicate.
      4. `info`
5. Add a `mutator` - ~PUT/POST request. **NB** this is the *inline* method - preferable to user variable-based approach.
   1. create a new one with `mutation { post(url: "bbc.co.uk", description: "BBC") {id}}` - note the `{id}` is the return
   type --> response is `{ "data": { "post": { "id": 4 } } }`
   2. retrieve again with `query { feed { url, description, id }}`
   3. As the data is in a file & memory based, if we re-start the server, these are lost

### Preferable Variable based approach to queries
Rather than the above *inline* approach:
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

## Add Persistence - using Prisma and MySQL
From [how to graphQL](https://www.howtographql.com/typescript-apollo/4-adding-a-database/):
> Next set up a new SQLite to persist the data of incoming GraphQL mutations. Instead of writing SQL directly, 
> you will use Prisma to access your database.

Installed prima (and client), and init it with `npx prisma init`. Prisma is an ORM, containing a schema that allows
it to map to the underlying data nicely. SQLite is a self-contained, serverless, zero-configuration, transactional SQL 
database engine - reads and writes directly to disk, so not lots of set up, in fact prisma can do it:
`npx prisma migrate dev --name "init"` --> creates `dev.db` and `dev.db-journal` - used `schema.prisma` to make a
`Link` DB table.

**NB** can regenerate data using `npx prisma generate`.

### Running it as standalone
Added this stuff in `script.ts` as a separate runner to play with it. To execute, run `npx ts-node src/script.ts`, or 
``npm run prisma:fetch``. This stuff will be moved into Graphql next.

### Hook up to GraphQL

* create a `context.ts` file to hold out context obj (see [Steps](#Steps)).
* add that context to `schema.ts` to provide a `contextType`
* next add the context to the Apollo server in `index.ts` - note that it must be an async function returning the context
* next, make use of the `context.prisma` stuff in the resolvers (in `Link`)
* as we're using prisma (MySQL) rather than a text file, changes are now persisted between restarts

## Auth and Auth
First, need to define the concept of a `User` - add it to the prisma schema - a new `User` model, and adding fileds to `Link` to represent who posted the link...

As we have changed the DB schema, we need to regenerate the auto-gen files. Here we used a named one `prisma:regen-named` (look inside `prisma/migrations`, it gives a migration path, and naming them makes sense).

Next, define the schema as `graphql/User.ts` - note the `links` field is a non-null array of Links, and as it's not simple, we need to add a resolver to fetch that data... Same for `Links` when we add the `postedBy` field. Looks like as it's not a trivial scala value, we need to tell graphQL exactly how to retrieve that from the DB. It uses `parent` to find the _current_ object in the DB, and then gets the specific field from there.

? Does that mean 2 DB queries???

> Note: This interesting syntax where you can traverse and fetch relation fields by chaining the field name (findUnique(...).relationFieldName()) is called the [Fluent API](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#fluent-api) in Prisma


Run `npm run generate` to make `schema.graphql` update to include the new object.

### Implementing `singup` and `login`
Implementing JWT-based authentication, so we'll make an `AuthPayload` type, containing a token, that will be the return type for `signup` and `login` APIs (mutators)


