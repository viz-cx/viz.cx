import { getLastSavedBlock, OpInBlock, OpInBlockModel } from '../models/OpInBlock'
import { VIZ } from '../helpers/viz'

const viz = new VIZ()
var currentBlock: number = 0

export async function startVizParsing() {
    try {
        if (currentBlock === 0) {
            currentBlock = await getLastSavedBlock() + 1
            console.log("Parsing continued from block", currentBlock)
        }
        viz.getDynamicGlobalProperties().then(
            async (resolve: any) => {
                const lastIrreversibleBlock = parseInt(resolve['last_irreversible_block_num'])
                while (lastIrreversibleBlock > currentBlock) {
                    await processNextBlock().then(() => currentBlock++)
                }
            },
            rejectReason => {
                console.log("Unable to start viz parsing: " + rejectReason)
                viz.changeNode()
            }
        ).finally(() => setTimeout(startVizParsing, 15000))
    } catch (e) {
        console.log(e)
        setTimeout(startVizParsing, 15000)
    }
}

async function processNextBlock() {
    await viz.getOpsInBlock(currentBlock, false)
        .then(
            async (result: any) => {
                var operations: OpInBlock[] = []
                for (const i in result) {
                    const o = result[i]
                    var opInBlock = new OpInBlock()
                    if (o.trx_id !== '0000000000000000000000000000000000000000') {
                        opInBlock.trx_id = o.trx_id
                    }
                    opInBlock.block = o.block
                    opInBlock.timestamp = o.timestamp
                    opInBlock.type = o.op[0]
                    opInBlock.obj = o.op[1]
                    operations.push(opInBlock)
                }
                const block = await OpInBlockModel.insertMany(operations)
                if (currentBlock % 10 === 0) {
                    console.log(block)
                }
            },
            _ => {
                viz.changeNode()
            }
        )
}

