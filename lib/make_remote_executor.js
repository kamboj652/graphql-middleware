import { fetch } from 'cross-fetch';
import { print } from 'graphql';
import { AbortController } from 'abort-controller';

// Builds a remote schema executor function,
// customize any way that you need (auth, headers, etc).
// Expects to recieve an object with "document" and "variable" params,
// and asynchronously returns a JSON response from the remote.
function makeRemoteExecutor(url, { timeout = 5000 } = {}) {
  return async ({ document, variables, context }) => {

    console.log(`Petición a la url:  ${url}`);
    //console.log("context " + JSON.stringify(context));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const query = typeof document === 'string' ? document : print(document);
      const fetchResult = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': context ? context.authorization :'',
          'Accept-Encoding': context ?context["accept-encoding"] : '',
          'Accept-Language': context ? context["accept-language"] : ''
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      return await fetchResult.json();

    } catch (err) {
      throw err.name === 'AbortError' ? new Error(`Request exceeded timeout of ${timeout}`) : err;
    } finally {
      clearTimeout(timeoutId);
    }
  };
};

export default makeRemoteExecutor;
