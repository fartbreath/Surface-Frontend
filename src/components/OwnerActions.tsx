import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { vaultAbi } from '../vaultAbi'
import { parseUnits } from 'viem'

interface Props { vaultAddress: `0x${string}` }

function TxBadge({ hash, error, confirming }: { hash?: `0x${string}`; error?: Error | null; confirming?: boolean }) {
  if (error) return <p className="tx-status error">{error.message.slice(0, 120)}</p>
  if (hash)  return <p className="tx-status success">{confirming ? '⏳ ' : '✅ '}Tx: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{hash.slice(0,18)}…</a></p>
  return null
}

// Each card gets its own hook so they're fully independent
function useAction() {
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash })
  return { writeContract, hash, error, isPending, confirming, reset }
}

export default function OwnerActions({ vaultAddress }: Props) {
  const contract = { address: vaultAddress, abi: vaultAbi }

  const epochAction   = useAction()
  const maxDepAction  = useAction()
  const traderAction  = useAction()
  const wlAction      = useAction()
  const wlAssetAction = useAction()

  // ---- startEpoch ----
  const [fundingStart, setFundingStart] = useState('')
  const [epochStart,   setEpochStart]   = useState('')
  const [epochEnd,     setEpochEnd]     = useState('')

  // ---- setMaxDeposits ----
  const [maxDep, setMaxDep] = useState('')

  // ---- setTrader ----
  const [newTrader, setNewTrader] = useState('')

  // ---- whitelist ----
  const [wlUser,    setWlUser]    = useState('')
  const [wlStatus,  setWlStatus]  = useState(true)
  const [wlAsset,   setWlAsset]   = useState('')
  const [wlBalance, setWlBalance] = useState('')

  function toUnix(s: string) { return BigInt(Math.floor(new Date(s).getTime() / 1000)) }

  return (
    <div>
      {/* Start Epoch */}
      <div className="card">
        <h3>Start Epoch</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label>Funding Start</label>
            <input type="datetime-local" value={fundingStart} onChange={e => setFundingStart(e.target.value)} />
          </div>
          <div>
            <label>Epoch Start</label>
            <input type="datetime-local" value={epochStart} onChange={e => setEpochStart(e.target.value)} />
          </div>
          <div>
            <label>Epoch End</label>
            <input type="datetime-local" value={epochEnd} onChange={e => setEpochEnd(e.target.value)} />
          </div>
        </div>
        {fundingStart && epochStart && epochEnd && (
          <p style={{ fontSize: '.78rem', color: '#64748b', marginTop: '.6rem' }}>
            Funding: {new Date(fundingStart).toLocaleString()} →
            Epoch: {new Date(epochStart).toLocaleString()} →
            End: {new Date(epochEnd).toLocaleString()}
          </p>
        )}
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={epochAction.isPending || !fundingStart || !epochStart || !epochEnd}
            onClick={() => {
              epochAction.reset()
              epochAction.writeContract({ ...contract, functionName: 'startEpoch', args: [toUnix(fundingStart), toUnix(epochStart), toUnix(epochEnd)] })
            }}
          >
            {epochAction.isPending ? 'Confirm in wallet…' : 'Start Epoch'}
          </button>
        </div>
        <TxBadge hash={epochAction.hash} error={epochAction.error} confirming={epochAction.confirming} />
      </div>

      <hr className="divider" />

      {/* Set Max Deposits */}
      <div className="card">
        <h3>Set Max Deposits</h3>
        <label>New Max (human amount, e.g. 1 000 000)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 1000000" value={maxDep} onChange={e => setMaxDep(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={maxDepAction.isPending || !maxDep}
            onClick={() => {
              maxDepAction.reset()
              maxDepAction.writeContract({ ...contract, functionName: 'setMaxDeposits', args: [parseUnits(maxDep, 18)] })
            }}
          >
            {maxDepAction.isPending ? 'Confirm in wallet…' : 'Set Max Deposits'}
          </button>
        </div>
        <TxBadge hash={maxDepAction.hash} error={maxDepAction.error} confirming={maxDepAction.confirming} />
      </div>

      <hr className="divider" />

      {/* Set Trader */}
      <div className="card">
        <h3>Set Trader</h3>
        <label>New Trader Address</label>
        <input type="text" placeholder="0x..." value={newTrader} onChange={e => setNewTrader(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={traderAction.isPending || !newTrader}
            onClick={() => {
              traderAction.reset()
              traderAction.writeContract({ ...contract, functionName: 'setTrader', args: [newTrader as `0x${string}`] })
            }}
          >
            {traderAction.isPending ? 'Confirm in wallet…' : 'Set Trader'}
          </button>
        </div>
        <TxBadge hash={traderAction.hash} error={traderAction.error} confirming={traderAction.confirming} />
      </div>

      <hr className="divider" />

      {/* Whitelist */}
      <div className="card">
        <h3>Whitelist User</h3>
        <label>User Address</label>
        <input type="text" placeholder="0x..." value={wlUser} onChange={e => setWlUser(e.target.value)} />
        <label>Status</label>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '.4rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: 0 }}>
            <input type="radio" checked={wlStatus} onChange={() => setWlStatus(true)} /> Whitelist
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: 0 }}>
            <input type="radio" checked={!wlStatus} onChange={() => setWlStatus(false)} /> Remove
          </label>
        </div>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={wlAction.isPending || !wlUser}
            onClick={() => {
              wlAction.reset()
              wlAction.writeContract({ ...contract, functionName: 'setWhitelistStatus', args: [wlUser as `0x${string}`, wlStatus] })
            }}
          >
            {wlAction.isPending ? 'Confirm in wallet…' : 'Apply'}
          </button>
        </div>
        <TxBadge hash={wlAction.hash} error={wlAction.error} confirming={wlAction.confirming} />
      </div>

      <hr className="divider" />

      {/* Whitelist Asset */}
      <div className="card">
        <h3>Token-Based Whitelist</h3>
        <label>Whitelist Asset Address (zero to disable)</label>
        <input type="text" placeholder="0x..." value={wlAsset} onChange={e => setWlAsset(e.target.value)} />
        <label>Min Balance Required (human amount)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 1000" value={wlBalance} onChange={e => setWlBalance(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={wlAssetAction.isPending || !wlAsset}
            onClick={() => {
              wlAssetAction.reset()
              wlAssetAction.writeContract({ ...contract, functionName: 'setWhitelistAsset', args: [wlAsset as `0x${string}`] })
            }}
          >
            {wlAssetAction.isPending ? 'Confirm in wallet…' : 'Set Asset'}
          </button>
          <button
            className="btn btn-gray"
            disabled={wlAssetAction.isPending || !wlBalance}
            onClick={() => {
              wlAssetAction.reset()
              wlAssetAction.writeContract({ ...contract, functionName: 'setWhitelistBalance', args: [parseUnits(wlBalance, 18)] })
            }}
          >
            {wlAssetAction.isPending ? 'Confirm in wallet…' : 'Set Balance'}
          </button>
        </div>
        <TxBadge hash={wlAssetAction.hash} error={wlAssetAction.error} confirming={wlAssetAction.confirming} />
      </div>
    </div>
  )
}
