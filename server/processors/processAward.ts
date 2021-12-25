import { BlockchainAward } from "models/BlockchainAward"

export async function processAward(data: BlockchainAward) {
    console.log("Process award: " + JSON.stringify(data))
}
