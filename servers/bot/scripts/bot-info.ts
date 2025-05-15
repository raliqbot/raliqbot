// import { CLMM_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
// import { getPoolWithPositionsByWallets } from "@raliqbot/lib";

// import {connection, db} from "../src/instances";
// import {loadWallet} from "../src/controllers/wallets.controller"

// export async function main(){
//     const dbWallets = await db.query.wallets.findMany();

//     const wallets = dbWallets.map(wallet => loadWallet(wallet))
//     const positions = getPoolWithPositionsByWallets(connection, CLMM_PROGRAM_ID, ...wallets);
// }


// main()