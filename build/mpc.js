"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = exports.initialize = void 0;
const torus_js_1 = require("@toruslabs/torus.js");
const TssLib = __importStar(require("@toruslabs/tss-lib-node"));
const mpc_core_kit_1 = require("@web3auth/mpc-core-kit");
const mpc_core_kit_2 = require("@web3auth/mpc-core-kit");
const bn_js_1 = __importDefault(require("bn.js"));
const loglevel_1 = __importDefault(require("loglevel"));
// db save config
const network = mpc_core_kit_2.WEB3AUTH_NETWORK.DEVNET;
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
    factorKey: "74610f613f2e707036a9246316c99fb4b4e9a865bfeeef6dab82ec4a91d03a56"
};
let state;
let tkeyJson;
let metadatajson;
const initialize = async (factorKey) => {
    const instance = new mpc_core_kit_2.Web3AuthMPCCoreKit({
        web3AuthClientId: "torus-key-test",
        web3AuthNetwork: network,
        baseUrl: "http://localhost:3000",
        uxMode: "nodejs",
        tssLib: TssLib,
        sessionTime: 0,
        storageKey: "memory",
        manualSync: true,
    });
    await instance.init();
    await instance.serverSetup(data.oAuthKey, data.signatures, data.verifier, data.verifierId);
    if (instance.status !== mpc_core_kit_2.COREKIT_STATUS.LOGGED_IN) {
        loglevel_1.default.info("not logged in");
        await instance.inputFactorKey(new bn_js_1.default(factorKey, "hex"));
    }
    state = instance.state;
    tkeyJson = instance.tKey.toJSON();
    metadatajson = instance.tKey.metadata.toJSON();
    tkeyJson.metadata = metadatajson;
    return instance;
};
exports.initialize = initialize;
const initializeFromJson = async () => {
    const instance = new mpc_core_kit_2.Web3AuthMPCCoreKit({
        web3AuthClientId: "torus-key-test",
        web3AuthNetwork: network,
        baseUrl: "http://localhost:3000",
        uxMode: "nodejs",
        tssLib: TssLib,
        sessionTime: 0,
        storageKey: new mpc_core_kit_1.MemoryStorage(),
        manualSync: true,
    });
    // console.log(tkeyJson.metadata)
    await instance.init();
    await instance.serverSetupRehydrate({
        state,
        tkeyJson
    });
    return instance;
};
const sign = async (msgHash, key) => {
    // set not rehydration
    const instance = await (0, exports.initialize)(key);
    const instance2 = await initializeFromJson();
    const factor = await instance2.createFactor({
        shareType: mpc_core_kit_1.TssShareType.RECOVERY,
    });
    console.log(factor);
    const result = await instance2.sign(Buffer.from(msgHash, "hex"));
    const share = await instance2.tKey.generateNewShare();
    console.log(share);
    return result;
};
exports.sign = sign;
async function main() {
    let message = "testmsg";
    let msgHash = (0, torus_js_1.keccak256)(Buffer.from(message)).substring(2);
    let result = await (0, exports.sign)(msgHash, data.factorKey);
    console.log(result);
}
main();
