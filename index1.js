import {TssShareType, Web3AuthMPCCoreKit, parseToken} from "@web3auth/mpc-core-kit"
import jwt from "jsonwebtoken";

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

let instance = new Web3AuthMPCCoreKit({
    web3AuthClientId: "torus-key-test",
    web3AuthNetwork: "sapphire_devnet",
    baseUrl: "https://localhost",
    storageKey: "mock"
});

await instance.init({
    handleRedirectResult: false,
});


let {idToken, parsedToken} =  await mockLogin("anyemail6");

await instance.loginWithJWT({
    verifier: "torus-test-health",
    verifierId: parsedToken.email,
    idToken,
})


await instance.createFactor({
    shareType: TssShareType.RECOVERY
});

console.log(instance.getTssFactorPub());

