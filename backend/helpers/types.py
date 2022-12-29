from enum import Enum


class OpType(str, Enum):
    custom = "custom"
    benefactor_award = "benefactor_award"
    receive_award = "receive_award"
    witness_reward = "witness_reward"

    def __str__(self) -> str:
        return str(self.value)


ops_custom = [OpType.custom]

ops_shares = [
    OpType.benefactor_award,
    OpType.receive_award,
    OpType.witness_reward,
]
