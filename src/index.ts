import {TssShareType, Web3AuthMPCCoreKit, parseToken} from "@web3auth/mpc-core-kit"
import Web3  from "web3";
import  {provider}  from  'web3-core';

import jwt, {Secret} from "jsonwebtoken";
import * as tss from "tss-lib";

const privateKey = "MEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==";
const jwtPrivateKey: string = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
const alg = "ES256";

export const mockLogin = async (email: string) => {
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


  let opts : jwt.SignOptions = {
    algorithm : alg,
  }
  const token = jwt.sign(payload, jwtPrivateKey, opts);
  const idToken = token;
  const parsedToken = parseToken(idToken);
  return { idToken, parsedToken };
};


async function main () {
  let instance = new Web3AuthMPCCoreKit({
      web3AuthClientId: "torus-key-test",
      web3AuthNetwork: "sapphire_devnet",
      baseUrl: "https://localhost",
      storageKey: "memory",
      uxMode: "nodejs",
      tssLib: tss,
  });

  await instance.init({
      handleRedirectResult: false,
  });


  let {idToken, parsedToken} =  await mockLogin("anyemail8");

  await instance.loginWithJWT({
      verifier: "torus-test-health",
      verifierId: parsedToken.email,
      idToken,
  })


  // await instance.createFactor({
  //     shareType: TssShareType.RECOVERY
  // });

  console.log(instance.getTssFactorPub());


  let provider1 = instance.provider!;
  
  console.log(provider1.sendAsync)

  let web3 = new Web3(provider1! as provider );  
  let addr = await web3.eth.getAccounts();
  const transaction = {
    from: addr[0],
    to: '0xe899f0130FD099c0b896B2cE4E5E15A25b23139a',
    value: '0x1',
    gas: '21000',
    gasPrice: '0x1',
    nonce: 1,
    type: '0x0'
    }
  let result = await web3.eth.signTransaction(transaction)
  console.log(result)

}

main()

