"""Helper module to VIZ blockchain."""
import random
from typing import Any
from viz import Client as VIZ

nodes = ["wss://node.viz.cx/ws", "wss://viz.lexai.host/ws"]


def change_node(selectFirst=False):
    global viz
    try:
        node = nodes[0] if selectFirst else random.choice(nodes)
        print("Change node to {}".format(node))
        viz = VIZ(node=node)
    except:
        change_node()


change_node(selectFirst=True)


def get_ops_in_block(block, onlyVirtual: bool) -> Any:
    virtualOpsOnly = 1 if onlyVirtual else 0
    return viz.rpc.get_ops_in_block(block, virtualOpsOnly)


def get_dgp() -> Any:
    return viz.rpc.get_dynamic_global_properties()


def get_last_block_in_chain() -> int:
    """Return number of last irreversible block from the VIZ blockchain."""
    result = get_dgp()["last_irreversible_block_num"]
    return int(result)
