import ws from 'ws';
import { createClient } from 'graphql-ws';
import { print } from 'graphql';
import  Crypto  from 'crypto';

// builds an AsyncIterator wrapper around a WS client
// see https://github.com/enisdenjo/graphql-ws#async-iterator
function makeRemoteSubscriber(url) {

  console.log(`Petición a la url:  ${url}`);
  const client = createClient({
    url,
    webSocketImpl: ws,
    options: {
      reconnect: true,
      timeout: 30000,
      inactivityTimeout: 0
    },
   
  });


  return async ({ document, variables }) => {
    const pending = [];
    let deferred = null;
    let error = null;
    let done = false;

    const query = print(document);
    print(`query ${query}`);

    const dispose = client.subscribe({
      query,
      variables,
    },
      {
        next: data => {
          console.log('data');
          pending.push(data);
          deferred && deferred.resolve(false);
        },
        error: err => {
          console.log('err');
          error = err;
          deferred && deferred.reject(error);
        },
        complete: () => {
          console.log('complete');
          done = true;
          deferred && deferred.resolve(true);
        },
      });

    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next() {
        if (done) return { done: true, value: undefined };
        if (error) throw error;
        if (pending.length) return { value: pending.shift() };
        return (await new Promise((resolve, reject) => (deferred = { resolve, reject })))
          ? { done: true, value: undefined }
          : { value: pending.shift() };
      },
      async throw(err) {
        console.log(`err ${err}`);
        throw err;
      },
      async return() {
        dispose();
        return { done: true, value: undefined };
      },
    };




  };
};


export default makeRemoteSubscriber;