import ThresholdKey from "@tkey/core/dist/types/core";
import { TorusStorageLayer } from "@tkey/storage-layer-torus";
import { SfaServiceProvider } from "@tkey/service-provider-sfa";
import jwt from "jsonwebtoken";

const ThresholdKey = require("@tkey/core").default;
const { TorusStorageLayer } = require("@tkey/storage-layer-torus");
const { SfaServiceProvider } = require("@tkey/service-provider-sfa");
const jwt = require("jsonwebtoken");

const privateKey = "MEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==";
const jwtPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
const alg = "ES256";

export const mockLogin = async (email) => {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "torus-key-test",
    aud: "torus-key-test",
    name: email,
    email,
    scope: "email",
    iat,
    eat: iat + 120,
  };

  const algo = {
    expiresIn: 120,
    algorithm: alg,
  };

  const token = jwt.sign(payload, jwtPrivateKey, algo);
  const idToken = token;
  const parsedToken = parseToken(idToken);
  return { idToken, parsedToken };
};

let {idToken, parsedToken} =  mockLogin("anyemail");
let verifier = "torus-test-health";
let verifierId = parsedToken.email;


let storageLayer = new TorusStorageLayer({hostUrl: "https://metadata.tor.us"});
let serviceProvider = new SfaServiceProvider({
    web3AuthOptions: {
        network: "testnet",
        showTorusButton: false,
    },
});
await serviceProvider.connect({
    verifier,
    verifierId,
    idToken,
    // subVerifierInfoArray?: TorusSubVerifierInfo[];
    // serverTimeOffset?: number;
})
let tkey = new ThresholdKey({
    serviceProvider,
    storageLayer,
});

// First time login or initialize()
let keyDetails = await tkey.initialize();
console.log(keyDetails);
let result1 = await tkey.reconstructKey( );
console.log(result1)
console.log("privKey", tkey.privKey);

let shareDetail = await tkey.generateNewShare();
let shareStore = await tkey.outputShare(shareDetail.newShareIndex);
let shareStoreString = shareStore.toJSON();
// save shareStoreString to database

let shareDetail2 = await tkey.generateNewShare();
let shareStore2 = await tkey.outputShare(shareDetail2.newShareIndex);
let shareStoreString2 = shareStore2.toJSON();
// save shareStoreString2 to database2 


// ReLogin
let newTkey = new ThresholdKey({
    serviceProvider,
    storageLayer,
});

let newKeyDetails = await newTkey.initialize();
console.log(newKeyDetails);
// load shareStoreString from database
let shareStorefromJson = ShareStore.fromJSON(shareStoreString);
await newTkey.inputShare(shareStorefromJson);
// load shareStoreString2 from database2
let shareStore2fromJson = ShareStore.fromJSON(shareStoreString2);
await newTkey.inputShare(shareStore2fromJson);

let result2 = await newTkey.reconstructKey();
console.log(result2)
console.log("privKey new instance: ", newTkey.privKey);

