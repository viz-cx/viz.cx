import { BlockchainAward } from 'models/BlockchainAward'
import { VIZ } from '../lib/viz'
import { processAward } from './processors/processAward'

const viz = new VIZ()
var currentBlock: number = 0

export function startVizParsing() {
    var promises = Promise.all([viz.getDynamicGlobalProperties()])
    if (currentBlock === 0) {
        promises = Promise.all([
            viz.getDynamicGlobalProperties(),
            // getLatestBlock(),
        ])
    }
    promises.then(
        async resolve => {
            const lastIrreversibleBlock = parseInt(resolve[0]['last_irreversible_block_num'])
            if (currentBlock === 0) {
                // TODO: get saved currentBlock 
                if (process.env.NODE_ENV !== "production") {
                    currentBlock = lastIrreversibleBlock - 10
                }
                console.log("Parsing continued from block", currentBlock)
            }
            while (lastIrreversibleBlock > currentBlock) {
                await processNextBlock().then(() => currentBlock++)
            }
        },
        rejectReason => {
            console.log("Unable to start viz parsing: " + rejectReason)
            viz.changeNode()
        }
    ).finally(() => setTimeout(startVizParsing, 15000))
}

async function processNextBlock() {
    await viz.getOpsInBlock(currentBlock)
        .then(
            result => {
                for (const i in result) {
                    const operation = result[i].op[0]
                    if (operation === 'receive_award') {
                        const awardOperation = result[i].op[1] as BlockchainAward
                        processAward(awardOperation)
                    }
                }
            },
            rejected => {
                console.log("Rejected: ", rejected)
                viz.changeNode()
            }
        )
}

