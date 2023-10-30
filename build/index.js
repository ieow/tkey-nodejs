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
exports.mockLogin = void 0;
const mpc_core_kit_1 = require("@web3auth/mpc-core-kit");
const web3_1 = __importDefault(require("web3"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tss = __importStar(require("@toruslabs/tss-lib-node"));
const privateKey = "MEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCCD7oLrcKae+jVZPGx52Cb/lKhdKxpXjl9eGNa1MlY57A==";
const jwtPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
const alg = "ES256";
const mockLogin = async (email) => {
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
    let opts = {
        algorithm: alg,
    };
    const token = jsonwebtoken_1.default.sign(payload, jwtPrivateKey, opts);
    const idToken = token;
    const parsedToken = (0, mpc_core_kit_1.parseToken)(idToken);
    return { idToken, parsedToken };
};
exports.mockLogin = mockLogin;
async function main() {
    let instance = new mpc_core_kit_1.Web3AuthMPCCoreKit({
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
    let { idToken, parsedToken } = await (0, exports.mockLogin)("anyemail9");
    await instance.loginWithJWT({
        verifier: "torus-test-health",
        verifierId: parsedToken.email,
        idToken,
    });
    console.log(instance.state);
    // await instance.createFactor({
    //     shareType: TssShareType.RECOVERY
    // });
    console.log(instance.getTssFactorPub());
    let provider1 = instance.provider;
    console.log(provider1.sendAsync);
    let web3 = new web3_1.default(provider1);
    let addr = await web3.eth.getAccounts();
    const transaction = {
        from: addr[0],
        to: '0xe899f0130FD099c0b896B2cE4E5E15A25b23139a',
        value: '0x1',
        gas: '21000',
        gasPrice: '0x1',
        nonce: 1,
        type: '0x0'
    };
    let result = await web3.eth.signTransaction(transaction);
    console.log(result);
}
main();
