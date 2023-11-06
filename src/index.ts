import Web3  from "web3";
import  {provider}  from  'web3-core';

import jwt, {Secret} from "jsonwebtoken";
import * as tss from "@toruslabs/tss-lib-node";
import { keccak256 } from "@toruslabs/torus.js";
// import { sign, refreshTSSShares } from "./mpc-remote";
import BN from "bn.js";
import { generatePrivate } from "@toruslabs/eccrypto";


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
    sub: email,
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

  let phoneNumber = "+60123456789"
  await instance.init({
      handleRedirectResult: false,
  });


  let {idToken, parsedToken} =  await mockLogin("anyemail12");

  await instance.loginWithJWT({
      verifier: "torus-test-health",
      verifierId: parsedToken.email,
      idToken,
  })
  
  let smsInstance = new SmsService({
    smsbackendUrl : "http://localhost:3021",
    coreKitInstance: instance,
  })

  let description = smsInstance.getDescriptionsAndUpdate();
  console.log(description)

  let factorPub;
  let shareStore;
  if (description) {
    
    // start sms 
      const { metadataPubKey } = instance.getKeyDetails();
      const address = `${metadataPubKey.x.toString(16, 64)}${metadataPubKey.y.toString(16, 64)}`;
    let result = await smsInstance.requestSMSOTP(address);
    console.log(result)
    // verify sms
    // let verifiedResult = await smsInstance.verifySMSOTPRemote(description.key, result!);
    let verifiedResult = await smsInstance.verifySMSOTPRemote(address, result!);
    await instance.setupRemoteClient(verifiedResult);

    // let shareStore = await instance.tKey.storageLayer.getMetadata({privKey: mockPkeyfromDatabase});
    // console.log( "sharestore" )
    // console.log(shareStore)
    // let point = Point.fromPrivateKey(pkey!)
    // factorPub = point.toBufferSEC1(true).toString("hex") 
    // await instance.setupRemoteClient({
    //   remoteClientUrl: "http://localhost:3021",
    //   remoteFactorPub: factorPub,
    //   metadataShare: JSON.stringify(shareStore),
    //   signature: "",
    //   tssShareIndex: "2",
    // })
  } else {
    // preparing data for setting up remote client
    const mockPkeyfromDatabase = new BN("a7961b9769a9efb4cd8ca22a60cf48c9c9074db31aa896ba364a62038612c378", "hex")
    let pkey = mockPkeyfromDatabase
    await instance.inputFactorKey(pkey)
    console.log(await instance.tKey.getTSSShare(pkey))


    // start sms
    let result = await smsInstance.registerSmsOTP( instance.tKey.privKey, phoneNumber);
    console.log(result)
    let {metadataPubKey} = instance.getKeyDetails();
    
    const address = `${metadataPubKey.x.toString(16, 64)}${metadataPubKey.y.toString(16, 64)}`;
    // verify sm
    let remoteFactorKey = new BN(generatePrivate());
    let verifiedResult = await smsInstance.addSmsRecovery( address, result!, remoteFactorKey);
    console.log(verifiedResult)

    // register for sms
    await instance.createFactor({
      factorKey: remoteFactorKey,
      shareType: TssShareType.RECOVERY,
      additionalMetadata : {
        phoneNumber,
        authenticator : "sms", // smsInstance.autheticatorType
      }
    });

    // update sms instance
    smsInstance.getDescriptionsAndUpdate();
    
  }

  // await instance.createFactor({
  //     shareType: TssShareType.RECOVERY
  // });
  // await instance.createFactor({
  //   shareType: TssShareType.DEVICE
  // });

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

  console.log(instance.state.remoteClient)
  let partial = await instance.remoteSign(msgHashBuffer);
  // let result2 = await sign(msgHashBuffer, partial, pkey!)

  console.log(partial)



  // pre-refresh()
  // refresh()

}

main()

