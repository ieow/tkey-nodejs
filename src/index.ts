import {Point, TssShareType, Web3AuthMPCCoreKit, parseToken} from "@web3auth/mpc-core-kit"
import Web3  from "web3";
import  {provider}  from  'web3-core';

import jwt, {Secret} from "jsonwebtoken";
import * as tss from "@toruslabs/tss-lib-node";
import { keccak256 } from "@toruslabs/torus.js";
import { sign, refreshTSSShares } from "./mpc-remote";

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
      
  }, "http://localhost:3021/api/mpc");

  await instance.init({
      handleRedirectResult: false,
  });


  let {idToken, parsedToken} =  await mockLogin("anyemail11");

  await instance.loginWithJWT({
      verifier: "torus-test-health",
      verifierId: parsedToken.email,
      idToken,
  })
  console.log(instance.state)


  await instance.createFactor({
      shareType: TssShareType.RECOVERY
  });

  console.log(instance.getTssFactorPub());
  console.log("factorKey: ", instance.state.factorKey?.toString("hex"));


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


  let msg = "hello world"
  let msgBuffer = Buffer.from(msg, "utf-8");
  let msgHash = keccak256(msgBuffer).substring(2);
  let msgHashBuffer = Buffer.from(msgHash, "hex");

  let pkey = instance.state.factorKey?.toString("hex")
  let point = Point.fromPrivateKey(pkey!)

  let partial = await instance.remoteSign(msgHashBuffer, point.toBufferSEC1(true).toString("hex") );
  // let result2 = await sign(msgHashBuffer, partial, pkey!)

  console.log(partial)



  // pre-refresh()
  // refresh()

}

main()

