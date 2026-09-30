import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8085",
  realm: "keystone",
  clientId: "keystone-react",
});

export default keycloak;