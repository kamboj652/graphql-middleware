import { RESTDataSource } from 'apollo-datasource-rest';

class ResthAPI extends RESTDataSource {

    constructor() {
        super(); 
        this.baseURL = 'http://localhost:8080'
    }

    willSendRequest(request) {
        console.log("willSendRequest");
        
        request.headers.set('Authorization', this.context.authorization);
        request.headers.set('Content-Type', "application/json");
        request.headers.set("Accept-Language", this.context["accept-language"]);
    }
   


    async getData() {
        return this.get('data');
    }

}

export default { AuthAPI }