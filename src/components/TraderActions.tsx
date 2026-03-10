import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { vaultAbi } from '../vaultAbi'
import { parseUnits, formatUnits } from 'viem'

interface Props { vaultAddress: `0x${string}`; assetSymbol?: string }

function TxBadge({ hash, error, confirming }: { hash?: `0x${string}`; error?: Error | null; confirming?: boolean }) {
  if (error) return <p className="tx-status error">{error.message.slice(0, 120)}</p>
  if (hash)  return <p className="tx-status success">{confirming ? '⏳ ' : '✅ '}Tx: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{hash.slice(0,18)}…</a></p>
  return null
}

export default function TraderActions({ vaultAddress, assetSymbol = '…' }: Props) {
  const contract = { address: vaultAddress, abi: vaultAbi }
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash })
  // button unlocks as soon as wallet submits; tx hash shows confirming state
  const busy = isPending

  const [returnAmount, setReturnAmount] = useState('')

  const { data } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'custodied' },
      { ...contract, functionName: 'custodiedAmount' },
      { ...contract, functionName: 'totalAssets' },
      { ...contract, functionName: 'isInEpoch' },
      { ...contract, functionName: 'asset' },
    ],
    query: { refetchInterval: 10_000 },
  })

  const [custodied, custodiedAmount, totalAssets, isInEpoch, assetAddr] = data?.map(d => d.result) ?? []

  const custodiedFmt = custodiedAmount
    ? Number(formatUnits(custodiedAmount as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '—'
  const totalFmt = totalAssets
    ? Number(formatUnits(totalAssets as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '—'

  return (
    <div>
      {/* Status banner */}
      <div className="card">
        <div className="status-grid">
          <div className="stat"><label>Total Assets ({assetSymbol})</label><span>{totalFmt}</span></div>
          <div className="stat"><label>Custodied ({assetSymbol})</label>     <span>{custodiedFmt}</span></div>
          <div className="stat"><label>In Epoch</label>             <span>{isInEpoch ? '✅ Yes' : '❌ No'}</span></div>
          <div className="stat"><label>Funds Custodied</label>      <span>{custodied ? '✅ Yes' : '❌ No'}</span></div>
        </div>
      </div>

      {/* Custody Funds */}
      <div className="card">
        <h3>Custody Funds</h3>
        <p style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '.75rem' }}>
          Transfers all vault assets to the trader wallet. Only callable during an active epoch.
        </p>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={busy || !!custodied}
            onClick={() => { reset(); writeContract({ ...contract, functionName: 'custodyFunds' }) }}
          >
            {busy ? 'Sending…' : 'Custody Funds'}
          </button>
        </div>
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>

      <hr className="divider" />

      {/* Return Funds */}
      <div className="card">
        <h3>Return Funds</h3>
        <p style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '.75rem' }}>
          Approve the vault to pull tokens first (or pre-approve in Depositor tab), then enter the amount to return.
        </p>
        <label>Amount to Return (human amount)</label>
        <input
          type="number"
          step="any"
          min="0"
          placeholder={custodiedFmt !== '—' ? `Custodied: ${custodiedFmt}` : 'e.g. 1000.5'}
          value={returnAmount}
          onChange={e => setReturnAmount(e.target.value)}
        />
        <div className="btn-row">
          <button
            className="btn btn-success"
            disabled={busy || !custodied || !returnAmount}
            onClick={() => {
              reset()
              writeContract({ ...contract, functionName: 'returnFunds', args: [parseUnits(returnAmount, 18)] })
            }}
          >
            {busy ? 'Sending…' : 'Return Funds'}
          </button>
          <button
            className="btn btn-gray"
            disabled={busy || !returnAmount || !assetAddr}
            onClick={() => {
              reset()
              // approve vault to pull returnAmount from trader
              writeContract({
                address: assetAddr as `0x${string}`,
                abi: vaultAbi,
                functionName: 'approve',
                args: [vaultAddress, parseUnits(returnAmount, 18)],
              })
            }}
          >
            Approve Vault First
          </button>
        </div>
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>
    </div>
  )
}
