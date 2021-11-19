import gql from 'graphql-tag';

export const typeDef = gql` 

    extend type Query{
        getData(id: String!): String        
    }
    
    type Mutation{    
        changeData(request: String): String!
        
    }
`;

let performRequest = (apiEndpoint, func, args) => {
    console.debug(`apiEndpoingt ${apiEndpoint} , func ${func},  args: ${args} ` );    
    let promise = apiEndpoint[func](args);
    promise.then((resp) => {
        console.debug("Response:");
        console.debug(resp)
    }).catch((error) => {
        console.debug("Response Error:");
        console.debug(error);
    });
    return promise;
};

export const resolvers = {
    Mutation: {
        changeData: (root, args, { dataSources }) => {
            return performRequest(dataSources.restAPI, "authToken", args);
        },       
    },

    Query: {
        getData: (root, args, { dataSources }) => {
            return performRequest(dataSources.restAPI, "data", args);
        },

    },

    
   
}