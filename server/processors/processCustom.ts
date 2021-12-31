import { BlockchainCustom } from "models/BlockchainCustom"

export async function processCustom(data: BlockchainCustom) {
    console.log("Process custom: " + JSON.stringify(data))
}
