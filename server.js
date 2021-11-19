import waitOn from 'wait-on';
import express from 'express';
import pkg from 'lodash';
import { ApolloServer, gql } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { introspectSchema } from '@graphql-tools/wrap';
import { stitchSchemas } from '@graphql-tools/stitch';
import makeRemoteExecutor from './lib/make_remote_executor.js';
import makeRemoteSubscriber from './lib/make_remote_subscriber.js';
import restDatasource from './datasources/restDatasource.js';


const { RESTAPI } = restDatasource;


import { typeDef as Conf, resolvers as confResolvers } from "./types/conf.type.graphql.js";
import { typeDef as Rest, resolvers as restResolvers } from "./types/login.type.graphql.js";

const { merge } = pkg;


const fullSchema = makeExecutableSchema({
  typeDefs: [ Rest, Conf],
  resolvers: merge(confResolvers, restResolvers)
});

export const allRESTSchemas = { schema: fullSchema };

//build the combined schema
export const gatewayRESTSchema = stitchSchemas({
  subschemas: [
    allRESTSchemas
  ]
});



async function makeGatewaySchema() {
  // Make remote executors:
  // these are simple functions that query a remote GraphQL API for JSON.


  const allSchemas = [];
  allSchemas.push(
    { schema: gatewayRESTSchema }
  );

  //For local 


  const urls = [
    {
      "url": 'http://localhost:8080/graphql',
      "subs": 'ws://localhost:8080/graphql'
    },
    {
      "url": 'https://n7b67.sse.codesandbox.io/graphql',
    }
  ]



  for (const obj of urls) {

    try {

      const exec = makeRemoteExecutor(obj.url);
      const remoteSchemas = await introspectSchema(exec);


      //Si falla la conexión al protocolo http, se salta la excepción y no comprueba la subscripción
      if (obj.subs) {
        allSchemas.push({
          schema: remoteSchemas,
          executor: exec,
          subscriber: makeRemoteSubscriber(obj.subs)
        })
      } else {
        allSchemas.push({
          schema: remoteSchemas,
          executor: exec
        })
      }

    } catch (err) {
      console.error(` >>>> error on makeGatewaySchema: ${err} <<<<`);
    }
  }



  //console.debug(` allSchemas ${JSON.stringify(allSchemas)}`);
  return stitchSchemas({
    subschemas: allSchemas,
  });
}


waitOn({ resources: [''] }, async () => {
  const schema = await makeGatewaySchema();

  try {
    const server = new ApolloServer({
      schema: schema,
      introspection: true,
      dataSources: () => ({
        authAPI: new AuthAPI()
      }),
      context: ({ req }) => {

        if (req) { // Prevent error when using Websocket connection          
          //console.log(`req ${JSON.stringify(req)}`);
          return {
            "authorization": req.headers.authorization || '',
            "accept-encoding": req.headers["accept-encoding"] || '',
            "accept-language": req.headers["accept-language"] || ''
          };
        } else {
          return {
            "ws": "ApolloLink" // Only trace pourposes
          }
        }
      },
      formatError: (err) => {
        console.log(`err ${err}`);

        // Don't give the specific errors to the client.
        if (err.extensions && err.extensions.exception) {
          err.extensions.exception.stacktrace = null;
        }

        if (err.extensions && err.extensions.response && err.extensions.response.body && err.extensions.response.body.error_description &&
          err.extensions.response.body.error_description === 'Bad credentials') {
          if (err.extensions && err.extensions.code) {
            err.extensions.code = 'UNAUTHENTICATED';
          }
        }
        // Otherwise return the original error.  The error can also
        // be manipulated in other ways, so long as it's returned.
        return err;
      },
      plugins: [
        {
          async serverWillStart() {
            console.log('Server Starting!');
          }
        }
      ]
    });

    server.listen(4000).then(() => {
      console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
      console.log(`🚀 Subscription endpoint ready at ws://localhost:4000${server.graphqlPath}`);
    });


  } catch (error) {
    console.error("error schema" + error);
  }

});





