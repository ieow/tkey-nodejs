import ThresholdKey from "@tkey/core";
import { ShareStore } from "@tkey/common-types";
import { TorusStorageLayer } from "@tkey/storage-layer-torus";
// import { SfaServiceProvider } from "@tkey/service-provider-sfa";
import { TorusServiceProvider } from "@tkey/service-provider-torus";
import jwt from "jsonwebtoken";
import Torus from "@toruslabs/torus.js";

// const ThresholdKey = require("@tkey/core").default;
// const { TorusStorageLayer } = require("@tkey/storage-layer-torus");
// const { SfaServiceProvider } = require("@tkey/service-provider-sfa");
// const jwt = require("jsonwebtoken");
function parseToken(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");
    return JSON.parse(atob(base64 || ""));
}

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

let {idToken, parsedToken} =  await mockLogin("anyemail6");
let verifier = "torus-test-health";
let verifierId = parsedToken.email;


let storageLayer = new TorusStorageLayer({hostUrl: "https://metadata.tor.us"});
let serviceProvider = new TorusServiceProvider({
    customAuthArgs: {
        network: "sapphire_devnet",   
        web3AuthClientId : "torus-key-test",
        baseUrl: "https://localhost",
        skipSw: true,
        uxMode: "redirect"
    }
});
await serviceProvider.init({skipSw: true, skipInit: true});
let torusKey = await serviceProvider.customAuthInstance.getTorusKey(verifier, verifierId, {verifier_id: verifierId}, idToken)
serviceProvider.postboxKey = Torus.getPostboxKey(torusKey)

// let serviceProvider = new SfaServiceProvider({
//     web3AuthOptions: {
//         network: "sapphire_devnet",
//         showTorusButton: false,
//         clientId: "Client ID"
//     },
// });

// await serviceProvider.init({});
// await serviceProvider.connect({
//     verifier,
//     verifierId,
//     idToken,
//     // subVerifierInfoArray?: TorusSubVerifierInfo[];
//     // serverTimeOffset?: number;
// })
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
let shareStore = await tkey.outputShareStore(shareDetail.newShareIndex);
let shareStoreString = shareStore.toJSON();
// save shareStoreString to database

let shareDetail2 = await tkey.generateNewShare();
let shareStore2 = await tkey.outputShareStore(shareDetail2.newShareIndex);
let shareStoreString2 = shareStore2.toJSON();
// save shareStoreString2 to database2 

// ReLogin
let newTkey = new ThresholdKey({
    serviceProvider,
    storageLayer,
});

let newKeyDetails = await newTkey.initialize();
// load shareStoreString from database
let shareStorefromJson = ShareStore.fromJSON( shareStoreString);
await newTkey.inputShareStore(shareStorefromJson);
// load shareStoreString2 from database2
let shareStore2fromJson = ShareStore.fromJSON(shareStoreString2);
await newTkey.inputShareStore(shareStore2fromJson);

let result2 = await newTkey.reconstructKey();
console.log(result2)
console.log("privKey new instance: ", newTkey.privKey);

