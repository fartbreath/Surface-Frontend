import { useReadContracts } from 'wagmi'
import { vaultAbi } from '../vaultAbi'
import { formatUnits } from 'viem'

interface Props { vaultAddress: `0x${string}` }

function fmt(val: bigint | undefined, dec = 18) {
  if (val === undefined) return '…'
  return Number(formatUnits(val, dec)).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function addrShort(a: string | undefined) {
  if (!a) return '…'
  return a.slice(0, 6) + '…' + a.slice(-4)
}

function tsToLocal(ts: number) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString()
}

export default function VaultStatus({ vaultAddress }: Props) {
  const contract = { address: vaultAddress, abi: vaultAbi }

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'asset' },
      { ...contract, functionName: 'trader' },
      { ...contract, functionName: 'owner' },
      { ...contract, functionName: 'started' },
      { ...contract, functionName: 'custodied' },
      { ...contract, functionName: 'custodiedAmount' },
      { ...contract, functionName: 'maxDeposits' },
      { ...contract, functionName: 'totalDeposits' },
      { ...contract, functionName: 'totalAssets' },
      { ...contract, functionName: 'totalSupply' },
      { ...contract, functionName: 'getCurrentEpoch' },
      { ...contract, functionName: 'getCurrentEpochInfo' },
      { ...contract, functionName: 'isFunding' },
      { ...contract, functionName: 'isInEpoch' },
    ],
    query: { refetchInterval: 10_000 },
  })

  const [
    asset, trader, owner, started, custodied, custodiedAmount,
    maxDeposits, totalDeposits, totalAssets, totalSupply,
    currentEpoch, epochInfo, isFunding, isInEpoch,
  ] = data?.map(d => d.result) ?? []

  const epoch = epochInfo as { fundingStart: bigint; epochStart: bigint; epochEnd: bigint } | undefined

  const now = Math.floor(Date.now() / 1000)

  type Phase = 'idle' | 'scheduled' | 'funding' | 'epoch-funds-in' | 'trading' | 'unwinding' | 'withdrawals-open'

  function currentPhase(): Phase {
    if (custodied && !isInEpoch)                               return 'unwinding'
    if (isInEpoch && custodied)                                return 'trading'
    if (isInEpoch && !custodied)                               return 'epoch-funds-in'
    if (isFunding)                                             return 'funding'
    if (started && epoch && now < Number(epoch.fundingStart))  return 'scheduled'
    if (started)                                               return 'withdrawals-open'
    return 'idle'
  }

  const active = currentPhase()

  const phases: { id: Phase; label: string; color: string }[] = [
    { id: 'idle',             label: 'Idle',              color: '#475569' },
    { id: 'scheduled',        label: 'Scheduled',         color: '#64748b' },
    { id: 'funding',          label: 'Funding',           color: '#d97706' },
    { id: 'epoch-funds-in',   label: 'Epoch (Funds In)',  color: '#2563eb' },
    { id: 'trading',          label: 'Trading',           color: '#dc2626' },
    { id: 'unwinding',        label: 'Unwinding',         color: '#ea580c' },
    { id: 'withdrawals-open', label: 'Withdrawals Open',  color: '#16a34a' },
  ]

  function depositsLabel() {
    if (isFunding) return <span className="badge badge-green">Deposits Open</span>
    if (started && epoch && now < Number(epoch.fundingStart))
      return <span className="badge badge-gray">Deposits Open {tsToLocal(Number(epoch.fundingStart))}</span>
    return <span className="badge badge-gray">Deposits Closed</span>
  }

  function withdrawalsLabel() {
    if (isInEpoch || custodied) return <span className="badge badge-red">Withdrawals Locked</span>
    return <span className="badge badge-green">Withdrawals Open</span>
  }

  if (isLoading) return <div className="card">Loading vault data…</div>

  return (
    <div>
      <div className="card">
        <h3>Phase</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
          {phases.map((p, i) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{
                padding: '.25rem .75rem',
                borderRadius: 20,
                fontSize: '.78rem',
                fontWeight: active === p.id ? 700 : 400,
                background: active === p.id ? p.color + '33' : 'transparent',
                color: active === p.id ? p.color : '#334155',
                border: `1px solid ${active === p.id ? p.color : '#1e2a3a'}`,
                boxShadow: active === p.id ? `0 0 8px ${p.color}55` : 'none',
                transition: 'all .2s',
              }}>
                {active === p.id ? '● ' : ''}{p.label}
              </span>
              {i < phases.length - 1 && (
                <span style={{ color: '#1e2a3a', fontSize: '.7rem' }}>›</span>
              )}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '.75rem' }}>
          {depositsLabel()}
          {withdrawalsLabel()}
          {custodied
            ? <span className="badge badge-red">Funds Custodied</span>
            : <span className="badge badge-green">Funds In Vault</span>
          }
        </div>
      </div>

      <div className="card">
        <h3>Addresses</h3>
        <div className="status-grid">
          <div className="stat"><label>Owner</label>        <span title={String(owner)}>{addrShort(String(owner))}</span></div>
          <div className="stat"><label>Trader</label>       <span title={String(trader)}>{addrShort(String(trader))}</span></div>
          <div className="stat"><label>Asset (ERC-20)</label><span title={String(asset)}>{addrShort(String(asset))}</span></div>
        </div>
      </div>

      <div className="card">
        <h3>Balances</h3>
        <div className="status-grid">
          <div className="stat"><label>Total Assets</label>      <span>{fmt(totalAssets as bigint)}</span></div>
          <div className="stat"><label>Total Deposits</label>    <span>{fmt(totalDeposits as bigint)}</span></div>
          <div className="stat"><label>Max Deposits</label>      <span>{fmt(maxDeposits as bigint)}</span></div>
          <div className="stat"><label>Total Shares</label>      <span>{fmt(totalSupply as bigint)}</span></div>
          <div className="stat"><label>Custodied Amount</label>  <span>{fmt(custodiedAmount as bigint)}</span></div>
        </div>
      </div>

      <div className="card">
        <h3>Epoch #{String(currentEpoch ?? '—')}</h3>
        <div className="status-grid">
          <div className="stat"><label>Funding Start</label> <span>{epoch ? tsToLocal(Number(epoch.fundingStart)) : '—'}</span></div>
          <div className="stat"><label>Epoch Start</label>   <span>{epoch ? tsToLocal(Number(epoch.epochStart))  : '—'}</span></div>
          <div className="stat"><label>Epoch End</label>     <span>{epoch ? tsToLocal(Number(epoch.epochEnd))    : '—'}</span></div>
        </div>
      </div>
    </div>
  )
}
