import { ShareStore, StringifiedType } from "@tkey/common-types";
import { Metadata } from "@tkey/core";
import ThresholdKey from "@tkey/core/dist/types/core";
import { keccak256 } from "@toruslabs/torus.js";
import * as TssLib from "@toruslabs/tss-lib-node";
import { FactorKeyTypeShareDescription, MemoryStorage, TssShareType } from "@web3auth/mpc-core-kit";
import { COREKIT_STATUS, WEB3AUTH_NETWORK, Web3AuthMPCCoreKit, Web3AuthState } from "@web3auth/mpc-core-kit";
import BN from "bn.js";
import log from "loglevel";
// db save config
const network = WEB3AUTH_NETWORK.DEVNET;

// get the factorkey
// maybe get the tkeyshare
// maybe get the oauthShare
// tkey.tojson tkeyfromjson
//
// oAuthKey: '4768ce9eb481d0a39b6de6ff909561c31cc0ca2e13e9de86aec2f33d8b108524',
// userInfo: {
//   iss: 'torus-key-test',
//   aud: 'torus-key-test',
//   name: 'anyemail9',
//   email: 'anyemail9',
//   scope: 'email',
//   iat: 1698305401,
//   eat: 1698305521,
//   verifier: 'torus-test-health',
//   verifierId: 'anyemail9'
// },
// signatures: [
//   '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"e413485a1bca8300d6f2fef2c2755358b474377ebe3b15a2568dddf4274f568e5dad29eb8352f4b99e027a8c516a8d691277a02229198e039d365503075323fa1c"}',
//   '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"ac5715d837bbe1f9cd75dea7e3ee906e7da547b16f60d52208ffbf77933e0b184adbf7bc65b49fd6c317c431f3e5f0ebdf0f4ba090adf7c490b89b0e06b4489b1c"}',
//   '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"9356ea4b72a1d5786b6b5eb157711d23683b4bf42b3132fb33e417ab0540d6026ae33fa28110d9f7c49dad1f10d8f3701ce7f4b26b381d7c96ffb6a6b5737a1f1b"}'
// ],
// tssShareIndex: 2,
// tssPubKey: <Buffer 04 5e 90 83 d7 67 da 83 11 3e 3c d9 55 71 ea 56 29 17 23 fa 14 97 bb 9c 7e 2f 04 55 99 22 95 c9 7d 09 38 25 8f 75 75 09 5b 4a ef ef fc 41 9f 50 0b 5f ... 15 more bytes>,
// factorKey: <BN: 74610f613f2e707036a9246316c99fb4b4e9a865bfeeef6dab82ec4a91d03a56>
const data = {
    oAuthKey: '4768ce9eb481d0a39b6de6ff909561c31cc0ca2e13e9de86aec2f33d8b108524',
    userInfo: {
      iss: 'torus-key-test',
      aud: 'torus-key-test',
      name: 'anyemail9',
      email: 'anyemail9',
      scope: 'email',
      iat: 1698305401,
      eat: 1698305521,
      verifier: 'torus-test-health',
      verifierId: 'anyemail9'
    },
    signatures: [
      '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"e413485a1bca8300d6f2fef2c2755358b474377ebe3b15a2568dddf4274f568e5dad29eb8352f4b99e027a8c516a8d691277a02229198e039d365503075323fa1c"}',
      '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"ac5715d837bbe1f9cd75dea7e3ee906e7da547b16f60d52208ffbf77933e0b184adbf7bc65b49fd6c317c431f3e5f0ebdf0f4ba090adf7c490b89b0e06b4489b1c"}',
      '{"data":"eyJleHAiOjE2OTgzOTE4MDIsInRlbXBfa2V5X3giOiJlY2ZhNGYzYzBjZTZiZTY1ZDhmYzM2NjllMmVlOTRiZGQxZWYyMWU0ODcxYzEzMWE1NTMxYzk2NTYyZTdlMTI0IiwidGVtcF9rZXlfeSI6IjM4MTI4MzYzYmNhZjE3MzE5OTFmOGNhMDhhNTYzYzQxYzc3MTAyODE4MGZhYmQ3YWZjMDg4OWFiNTgxMTA4ODUiLCJ2ZXJpZmllcl9uYW1lIjoidG9ydXMtdGVzdC1oZWFsdGgiLCJ2ZXJpZmllcl9pZCI6ImFueWVtYWlsOSIsInNjb3BlIjoiIn0=","sig":"9356ea4b72a1d5786b6b5eb157711d23683b4bf42b3132fb33e417ab0540d6026ae33fa28110d9f7c49dad1f10d8f3701ce7f4b26b381d7c96ffb6a6b5737a1f1b"}'
    ],
    verifier: 'torus-test-health',
    verifierId: 'anyemail9',
    // tssShareIndex: 2,
    // tssPubKey: <Buffer 04 5e 90 83 d7 67 da 83 11 3e 3c d9 55 71 ea 56 29 17 23 fa 14 97 bb 9c 7e 2f 04 55 99 22 95 c9 7d 09 38 25 8f 75 75 09 5b 4a ef ef fc 41 9f 50 0b 5f ... 15 more bytes>,
    // factorKey: <BN: 74610f613f2e707036a9246316c99fb4b4e9a865bfeeef6dab82ec4a91d03a56>
    factorKey : "74610f613f2e707036a9246316c99fb4b4e9a865bfeeef6dab82ec4a91d03a56"
}

let stateStr: string ;
let tkeyJsonStr : string; 
export const initialize = async (factorKey: string) => {
  const instance = new Web3AuthMPCCoreKit({
    web3AuthClientId: "torus-key-test",
    web3AuthNetwork: network,
    baseUrl: "http://localhost:3000",
    uxMode: "nodejs",
    tssLib: TssLib,
    sessionTime: 0,
    storageKey: "memory",
    manualSync: true,
  });
  await instance.init()
  await instance.serverSetup(
    data.oAuthKey,
    data.signatures,
    data.verifier,
    data.verifierId,
  );

  if (instance.status !== COREKIT_STATUS.LOGGED_IN) {
    log.info("not logged in");
    await instance.inputFactorKey(new BN(factorKey, "hex"));
  }

  let state = instance.state;
  let tkeyJson = instance.tKey.toJSON();
  let metadatajson = instance.tKey.metadata.toJSON();
  tkeyJson.metadata = metadatajson;

  stateStr = JSON.stringify(state);
  tkeyJsonStr = JSON.stringify(tkeyJson);
  return instance;
};


const initializeFromJson = async () => {
  const instance = new Web3AuthMPCCoreKit({
    web3AuthClientId: "torus-key-test",
    web3AuthNetwork: network,
    baseUrl: "http://localhost:3000",
    uxMode: "nodejs",
    tssLib: TssLib,
    sessionTime: 0,
    storageKey: new MemoryStorage(),
    manualSync: true,
  });

  // console.log(tkeyJson.metadata)
  let state = JSON.parse(stateStr);
  let tkeyJson = JSON.parse(tkeyJsonStr);

  await instance.init() 
  await instance.serverSetupRehydrate({
    state,
    tkeyJson
  } ) 

  return instance;

}

export const sign = async (msgHash: string, key: string) => {
  // set not rehydration
  const instance = await initialize(key);

  const instance2 = await initializeFromJson();
  
  // const factor = await instance2.createFactor({
  //   shareType : TssShareType.RECOVERY,
  // })
  // console.log(factor)

  const result = await instance2.sign(Buffer.from(msgHash, "hex"));
  // const result =""
  console.log(instance2.tKey._localMetadataTransitions)
  return result;
};



async function main () {
    let message = "testmsg"
    let msgHash = keccak256( Buffer.from(message) ).substring(2)
    let result = await sign( msgHash, data.factorKey);
    console.log(result)
}

main()