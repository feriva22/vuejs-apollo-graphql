import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import AuthPlugin from "./plugins/auth";

//use VueApollo plugin
import VueApollo from "vue-apollo";

//apollo library for call grapql API 
import ApolloClient from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { InMemoryCache } from "apollo-cache-inmemory";

// New Imports
import { split } from 'apollo-link'
import { getMainDefinition } from 'apollo-utilities'


Vue.use(AuthPlugin);
Vue.use(VueApollo); //use vueapollo by default

Vue.config.productionTip = false;

//create function for get token on header
const getHeaders = () => {
  const headers = {};
  const token = window.localStorage.getItem('apollo-token');
  if(token){
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

//create a http link to connect graphql API server https://hasura.io/learn/graphql
const httpLink = new HttpLink({
  //absolute url for http link 
  uri: 'https://hasura.io/learn/graphql',
  fetch,
  headers: getHeaders()
});


//create websocket link to connect graphql API with websocket protocol
// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: 'wss://hasura.io/learn/graphql',
  options: {
    reconnect: true,
    timeout: 30000,
    connectionParams: () => {
      return { headers: getHeaders() };
    },
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
  },
  wsLink,
  httpLink
);

//create ApolloClient obj for every call graphql query 
const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache({ //use cache so for same request and same response cache
    addTypename: true
  })
});

//create provider apollo so all child on component vue can use Apollo client instance
const apolloProvider = new VueApollo({
  defaultClient: client,
});

new Vue({
  router,
  apolloProvider, // insert provider to component Vue
  render: h => h(App)
}).$mount("#app");
