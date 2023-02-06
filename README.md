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
   field on each type (including the root types) has a resolver function


## GraphQL Schema
> At the core of every GraphQL API, there is a GraphQL schema, defined in the GraphQL Schema Definition Language (SDL)
> 
> Every GraphQL schema has three special root types: Query, Mutation, and Subscription (NB see `oreilly_practical_graphQL` 
> for more info). The fields on these root types are called root fields and define the available API operations.

### Workflow
1. Define the components of your schema (types, fields, root object types, etc) using Nexus. 
2. Generate the GraphQL SDL and types. 
3. Implement the corresponding resolver functions for the added fields.




