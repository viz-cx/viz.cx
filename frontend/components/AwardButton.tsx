"use client"

import { useState, useRef, useEffect } from "react"
import { useViz } from "@/contexts/VizContext"
import { makeAward, calculateCurrentEnergy } from "@/lib/viz"
import { isAuthenticated, getLogin, getWif } from "@/lib/auth"

interface AwardButtonProps {
  author: string
  memo: string
  awards: number
  shares: number
}

export default function AwardButton({ author, memo, awards: initialAwards, shares: initialShares }: AwardButtonProps) {
  const { dgp, account, refreshAccount } = useViz()
  const [showPopover, setShowPopover] = useState(false)
  const [energy, setEnergy] = useState(10)
  const [loading, setLoading] = useState(false)
  const [awards, setAwards] = useState(initialAwards)
  const [shares, setShares] = useState(initialShares)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function calculateReward(): string {
    if (!account || !dgp) return "0.00"
    const vesting = parseFloat(account.vesting_shares) +
      parseFloat(account.received_vesting_shares) -
      parseFloat(account.delegated_vesting_shares)
    const currentEnergy = calculateCurrentEnergy(
      new Date(account.last_vote_time + "Z").getTime(),
      account.energy
    )
    const usedEnergy = (currentEnergy * energy) / 100
    const rewardFund = parseFloat(dgp.total_reward_fund.split(" ")[0])
    const rewardShares = parseFloat(dgp.total_reward_shares.split(" ")[0])
    const reward = (vesting * usedEnergy * rewardFund) / (rewardShares * 10000)
    return Math.max(0, reward).toFixed(2)
  }

  async function doAward() {
    if (!isAuthenticated()) return
    setLoading(true)
    try {
      const login = getLogin()
      const wif = getWif()
      await makeAward(wif, login, author, energy * 100, 0, memo)
      setAwards((a) => a + 1)
      setShares((s) => s + parseFloat(calculateReward()))
      await refreshAccount()
      setShowPopover(false)
    } catch (err: any) {
      alert(err?.message || "Award failed")
    }
    setLoading(false)
  }

  return (
    <div className="relative inline-flex items-center gap-2 text-sm" ref={popRef}>
      <button
        onClick={() => isAuthenticated() ? setShowPopover(!showPopover) : alert("Please log in")}
        className="text-gray-500 hover:text-green-600 transition-colors"
        title="Award"
      >
        ▲ {awards}
      </button>
      <span className="text-xs text-gray-400">{shares.toFixed(2)} viz</span>

      {showPopover && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-56 z-10">
          <div className="text-xs text-gray-500 mb-2">
            Energy: {energy}% &middot; Reward: ~{calculateReward()} viz
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="w-full mb-2"
          />
          <button
            onClick={doAward}
            disabled={loading}
            className="w-full py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "..." : `Award ${author}`}
          </button>
        </div>
      )}
    </div>
  )
}
