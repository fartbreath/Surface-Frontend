import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContracts, useAccount } from 'wagmi'
import { vaultAbi } from '../vaultAbi'
import { parseUnits, formatUnits } from 'viem'

interface Props { vaultAddress: `0x${string}` }

function TxBadge({ hash, error, confirming }: { hash?: `0x${string}`; error?: Error | null; confirming?: boolean }) {
  if (error) return <p className="tx-status error">{error.message.slice(0, 120)}</p>
  if (hash)  return <p className="tx-status success">{confirming ? '⏳ ' : '✅ '}Tx: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{hash.slice(0,18)}…</a></p>
  return null
}

export default function DepositorActions({ vaultAddress }: Props) {
  const { address: account } = useAccount()
  const contract = { address: vaultAddress, abi: vaultAbi }
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract()
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash })
  const busy = isPending

  const [depositAmt,  setDepositAmt]  = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [redeemAmt ,  setRedeemAmt]   = useState('')
  const [approveAmt,  setApproveAmt]  = useState('')

  const { data } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'asset' },
      { ...contract, functionName: 'isFunding' },
      { ...contract, functionName: 'custodied' },
      { ...contract, functionName: 'totalAssets' },
      ...(account ? [
        { ...contract, functionName: 'balanceOf', args: [account] },
        { ...contract, functionName: 'convertToAssets', args: [10n ** 18n] },
      ] : []),
    ],
    query: { refetchInterval: 10_000 },
  })

  const [assetAddr, isFunding, custodied, totalAssets, shares, pricePerShare] = data?.map(d => d.result) ?? []

  function fmt(v: unknown) {
    if (v === undefined || v === null) return '—'
    return Number(formatUnits(v as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 })
  }

  return (
    <div>
      {/* My position */}
      <div className="card">
        <div className="status-grid">
          <div className="stat"><label>My Shares (sfFROG)</label>    <span>{fmt(shares)}</span></div>
          <div className="stat"><label>Value per Share</label>        <span>{fmt(pricePerShare)} FROG</span></div>
          <div className="stat"><label>Funding Window Open</label>    <span>{isFunding ? '✅ Yes' : '❌ No'}</span></div>
          <div className="stat"><label>Total Assets in Vault</label>  <span>{fmt(totalAssets)}</span></div>
        </div>
      </div>

      {/* Approve asset */}
      <div className="card">
        <h3>1. Approve Asset</h3>
        <p style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '.75rem' }}>
          Allow the vault to pull tokens from your wallet before depositing.
        </p>
        <label>Amount to Approve (human amount)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 1000" value={approveAmt} onChange={e => setApproveAmt(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-gray"
            disabled={busy || !approveAmt || !assetAddr}
            onClick={() => {
              reset()
              writeContract({
                address: assetAddr as `0x${string}`,
                abi: vaultAbi,
                functionName: 'approve',
                args: [vaultAddress, parseUnits(approveAmt, 18)],
              })
            }}
          >
            {busy ? 'Sending…' : 'Approve'}
          </button>
        </div>
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>

      <hr className="divider" />

      {/* Deposit */}
      <div className="card">
        <h3>2. Deposit</h3>
        <label>Amount to Deposit (human amount)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 500" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-success"
            disabled={busy || !depositAmt || !account || !isFunding}
            onClick={() => {
              reset()
              writeContract({ ...contract, functionName: 'deposit', args: [parseUnits(depositAmt, 18), account!] })
            }}
          >
            {busy ? 'Sending…' : 'Deposit'}
          </button>
        </div>
        {!isFunding && <p className="tx-status">Deposits are only open during the funding window.</p>}
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>

      <hr className="divider" />

      {/* Withdraw */}
      <div className="card">
        <h3>Withdraw Assets</h3>
        <label>Assets to Withdraw (human amount)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 200" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-danger"
            disabled={busy || !withdrawAmt || !account || !!custodied}
            onClick={() => {
              reset()
              writeContract({ ...contract, functionName: 'withdraw', args: [parseUnits(withdrawAmt, 18), account!, account!] })
            }}
          >
            {busy ? 'Sending…' : 'Withdraw'}
          </button>
        </div>
        {!!custodied && <p className="tx-status">Cannot withdraw while funds are custodied.</p>}
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>

      <hr className="divider" />

      {/* Redeem shares */}
      <div className="card">
        <h3>Redeem Shares</h3>
        <label>Shares to Redeem (human amount)</label>
        <input type="number" step="any" min="0" placeholder="e.g. 100" value={redeemAmt} onChange={e => setRedeemAmt(e.target.value)} />
        <div className="btn-row">
          <button
            className="btn btn-danger"
            disabled={busy || !redeemAmt || !account || !!custodied}
            onClick={() => {
              reset()
              writeContract({ ...contract, functionName: 'redeem', args: [parseUnits(redeemAmt, 18), account!, account!] })
            }}
          >
            {busy ? 'Sending…' : 'Redeem'}
          </button>
        </div>
        <TxBadge hash={hash} error={error} confirming={confirming} />
      </div>
    </div>
  )
}
