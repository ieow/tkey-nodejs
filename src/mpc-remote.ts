
import * as TssLibNode from "@toruslabs/tss-lib-node";
import { SCALAR_LEN , Point } from "@web3auth/mpc-core-kit";
import BN from "bn.js";

import { Client, utils as tssUtils } from "@toruslabs/tss-client";
import { kCombinations, keccak256 } from "@toruslabs/torus.js";
import { Point as TkeyPoint, decrypt, FactorEnc } from "@tkey-mpc/common-types";
import { generatePrivate } from "@toruslabs/eccrypto";
import { PointHex, RSSClient, ecPoint, hexPoint } from "@toruslabs/rss-client";
import { dotProduct, getLagrangeCoeffs } from "@tkey-mpc/core";
import { ec as EC } from "elliptic";
// const SCALAR_LEN


export const ecCurve = new EC("secp256k1");
// function required
export function scalarBNToBufferSEC1(s: BN): Buffer {
    return s.toArrayLike(Buffer, "be", SCALAR_LEN);
}

const computeTssShare = async (factorKey: BN,  factorEnc : FactorEnc ,  tssCommits: TkeyPoint[],   opts?: { threshold: number }): Promise<{ tssIndex: number; tssShare: BN }> => {
    console.log(factorEnc);
    const { userEnc, serverEncs, tssIndex, type } = factorEnc;
    const userDecryption  = await decrypt(Buffer.from(factorKey.toString(16, 64), "hex"), userEnc);
    const serverDecryptions = await Promise.all(
      serverEncs.map((factorEnc) => {
        if (factorEnc === null) return null;
        return decrypt(Buffer.from(factorKey.toString(16, 64), "hex"), factorEnc);
      })
    );
    const tssShareBufs = ([userDecryption] as (Buffer| null) []).concat(serverDecryptions);

    const tssShareBNs = tssShareBufs.map((buf) => {
      if (buf === null) return null;
      return new BN(buf.toString("hex"), "hex");
    });
    // const tssCommits = this.getTSSCommits();

    const userDec = tssShareBNs[0];
    if ( userDec === null) throw new Error("user decryption does not match tss commitments...");

    if (type === "direct") {
      const tssSharePub = ecCurve.g.mul(userDec);
      const tssCommitA0 = ecCurve.keyFromPublic({ x: tssCommits[0].x.toString(16, 64), y: tssCommits[0].y.toString(16, 64) }).getPublic();
      const tssCommitA1 = ecCurve.keyFromPublic({ x: tssCommits[1].x.toString(16, 64), y: tssCommits[1].y.toString(16, 64) }).getPublic();
      let _tssSharePub = tssCommitA0;
      for (let j = 0; j < tssIndex; j++) {
        _tssSharePub = _tssSharePub.add(tssCommitA1);
      }

      if (tssSharePub.getX().cmp(_tssSharePub.getX()) === 0 && tssSharePub.getY().cmp(_tssSharePub.getY()) === 0) {
        return { tssIndex, tssShare: userDec };
      }
      throw new Error("user decryption does not match tss commitments...");
    }

    if (type === "hierarchical") {
      const serverDecs = tssShareBNs.slice(1); // 5 elems
      const serverIndexes = new Array(serverDecs.length).fill(null).map((_, i) => i + 1);

      const { threshold } = opts || {};

      const combis = kCombinations(serverDecs.length, threshold || Math.ceil(serverDecs.length / 2));
      for (let i = 0; i < combis.length; i++) {
        const combi = combis[i];
        const selectedServerDecs = serverDecs.filter((_, j) => combi.indexOf(j) > -1);
        if (selectedServerDecs.includes(null)) continue;

        const selectedServerIndexes = serverIndexes.filter((_, j) => combi.indexOf(j) > -1);
        const serverLagrangeCoeffs = selectedServerIndexes.map((x) => getLagrangeCoeffs(selectedServerIndexes, x));
        const serverInterpolated = dotProduct(serverLagrangeCoeffs, selectedServerDecs as BN[], ecCurve.n as BN);
        const lagrangeCoeffs = [getLagrangeCoeffs([1, 99], 1), getLagrangeCoeffs([1, 99], 99)];
        const tssShare = dotProduct(lagrangeCoeffs, [serverInterpolated, userDec], ecCurve.n as BN);
        const tssSharePub = ecCurve.g.mul(tssShare);
        const tssCommitA0 = ecCurve.keyFromPublic({ x: tssCommits[0].x.toString(16, 64), y: tssCommits[0].y.toString(16, 64) }).getPublic();
        const tssCommitA1 = ecCurve.keyFromPublic({ x: tssCommits[1].x.toString(16, 64), y: tssCommits[1].y.toString(16, 64) }).getPublic();
        let _tssSharePub = tssCommitA0;
        for (let j = 0; j < tssIndex; j++) {
          _tssSharePub = _tssSharePub.add(tssCommitA1);
        }
        if (tssSharePub.getX().cmp(_tssSharePub.getX()) === 0 && tssSharePub.getY().cmp(_tssSharePub.getY()) === 0) {
          return { tssIndex, tssShare };
        }
      }
    }
    throw new Error("could not find any combination of server decryptions that match tss commitments...");
  }

type dataType =
  {
    factorEnc ?: FactorEnc,
    sessionId:  string,
    tssNonce: number,
    nodeIndexes: number[],
    tssCommits: TkeyPoint[],

    signatures: string[],

    serverEndpoints : {
      endpoints : string[],
      tssWSEndpoints : string[] ,
      partyIndexes : number[]
    }

}

export const sign = async (msgHash: Buffer, dataRequired:dataType , factorKey: string) => {
  let { sessionId, signatures, nodeIndexes, tssCommits, factorEnc} = dataRequired;

  const {tssIndex :tssShareIndex , tssShare} = await computeTssShare( new BN (factorKey, "hex"), 
    factorEnc!,
    tssCommits)

  let tssPubKey = Point.fromTkeyPoint(tssCommits[0]).toBufferSEC1(false).subarray(1);
  

  const { endpoints, tssWSEndpoints, partyIndexes } = dataRequired.serverEndpoints;

  const randomSessionNonce = keccak256(Buffer.from(generatePrivate().toString("hex") + Date.now(), "utf8")).substring(2)
  const currentSession = `${sessionId}${randomSessionNonce}`;
  let tss = TssLibNode

  // setup mock shares, sockets and tss wasm files.
  const [sockets] = await Promise.all([tssUtils.setupSockets(tssWSEndpoints, randomSessionNonce)]);

  const participatingServerDKGIndexes = nodeIndexes;
  const dklsCoeff = tssUtils.getDKLSCoeff(true, participatingServerDKGIndexes, tssShareIndex as number);
  const denormalisedShare = dklsCoeff.mul(tssShare).umod(ecCurve.curve.n);

  const share = scalarBNToBufferSEC1(denormalisedShare).toString("base64");

  if (!currentSession) {
    throw new Error(`sessionAuth does not exist ${currentSession}`);
  }

  if (!signatures) {
    throw new Error(`Signature does not exist ${signatures}`);
  }

  const tssImportUrl = "not needed as the worker is not being used"
  const clientIndex = partyIndexes.at(-1)!;
  const client = new Client(currentSession, clientIndex, partyIndexes, endpoints, sockets, share, tssPubKey.toString("base64"), true, tssImportUrl);
  const serverCoeffs: Record<number, string> = {};
  for (let i = 0; i < participatingServerDKGIndexes.length; i++) {
    const serverIndex = participatingServerDKGIndexes[i];
    serverCoeffs[serverIndex] = tssUtils.getDKLSCoeff(false, participatingServerDKGIndexes, tssShareIndex as number, serverIndex).toString("hex");
  }

  // @ts-ignore
  client.precompute(tss, { signatures: signatures, server_coeffs: serverCoeffs });
  await client.ready();

  // @ts-ignore
  let { r, s, recoveryParam } = await client.sign(tss, Buffer.from(msgHash).toString("base64"), true, "", "keccak256", {
    signatures: signatures,
  });

  if (recoveryParam < 27) {
    recoveryParam += 27;
  }

  // @ts-ignore
  await client.cleanup(tss, { signatures: signatures, server_coeffs: serverCoeffs });
  return { v: recoveryParam, r: scalarBNToBufferSEC1(r), s: scalarBNToBufferSEC1(s) };
};


interface refreshRemoteTssType {
  // from client
  factorEnc: FactorEnc,

  factorPubs: TkeyPoint[],
  targetIndexes: number[],
  verifierNameVerifierId: string,
  
  tssTag : string,
  tssCommits : TkeyPoint[],
  tssNonce : number,
  newTSSServerPub : TkeyPoint,
  // nodeIndexes : number[],

  serverOpts: {
    serverEndpoints: string[];
    serverPubKeys: PointHex[];
    serverThreshold: number;
    selectedServers: number[];
    authSignatures: string[];
  },
}

interface refreshRemoteTssReturnType {
  tssTag: string;
  tssNonce: number;
  tssPolyCommits: TkeyPoint[];
  factorPubs: TkeyPoint[];
  factorEncs: {
      [factorPubID: string]: FactorEnc;
  }
}
export const refreshTSSShares = async (
  dataRequired : refreshRemoteTssType,
  // from server
  factorKey: string,
) : Promise<refreshRemoteTssReturnType> => {
  const {tssCommits, tssTag, tssNonce, verifierNameVerifierId, newTSSServerPub, factorEnc, serverOpts, targetIndexes,  factorPubs } = dataRequired

  if (tssCommits.length === 0) throw Error(`tssCommits is empty`);
  const tssPubKeyPoint = tssCommits[0];
  const tssPubKey = hexPoint(tssPubKeyPoint);
  const { serverEndpoints, serverPubKeys, serverThreshold, selectedServers, authSignatures } = serverOpts;

  if (factorPubs.length === 0) throw new Error(`factorPubs is empty`);

  const oldLabel = `${verifierNameVerifierId}\u0015${tssTag}\u0016${tssNonce}`;
  const newLabel = `${verifierNameVerifierId}\u0015${tssTag}\u0016${tssNonce + 1}`;

  let finalSelectedServers = selectedServers;


  const {tssIndex, tssShare } = await computeTssShare(new BN(factorKey, "hex"), factorEnc, tssCommits);

  const rssClient = new RSSClient({
    serverEndpoints,
    serverPubKeys,
    serverThreshold,
    tssPubKey,
  });

  const refreshResponses = await rssClient.refresh({
    factorPubs: factorPubs.map((f) => hexPoint(f)),
    targetIndexes,
    oldLabel,
    newLabel,
    sigs: authSignatures,
    dkgNewPub: hexPoint(newTSSServerPub),
    inputShare: tssShare,
    inputIndex: tssIndex,
    selectedServers: finalSelectedServers,
  });

  const secondCommit = ecPoint(hexPoint(newTSSServerPub)).add(ecPoint(tssPubKey).neg());
  const newTSSCommits = [
    TkeyPoint.fromJSON(tssPubKey),
    TkeyPoint.fromJSON({ x: secondCommit.getX().toString(16, 64), y: secondCommit.getY().toString(16, 64) }),
  ];
  const factorEncs: {
    [factorPubID: string]: FactorEnc;
  } = {};
  for (let i = 0; i < refreshResponses.length; i++) {
    const refreshResponse = refreshResponses[i];
    if (refreshResponse.factorPub.x === null) {
      throw new Error("factorPub is null");
    }
    factorEncs[refreshResponse.factorPub.x.padStart(64, "0")] = {
      type: "hierarchical",
      tssIndex: refreshResponse.targetIndex,
      userEnc: refreshResponse.userFactorEnc,
      serverEncs: refreshResponse.serverFactorEncs,
    };
  }

  return { tssTag , tssNonce: tssNonce + 1, tssPolyCommits: newTSSCommits, factorPubs, factorEncs }
}  