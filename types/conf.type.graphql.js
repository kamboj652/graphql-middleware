import gql from 'graphql-tag';

export const typeDef = gql`
    type Query { 
        heartbeat: String! 
        middlewareVersion: String! 
    }
`;

export const resolvers = {
    Query: {
        heartbeat: () => 'OK',
        middlewareVersion: () => process.env.npm_package_version,       
    },
};