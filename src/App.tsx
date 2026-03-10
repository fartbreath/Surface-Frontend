import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import VaultStatus from './components/VaultStatus'
import OwnerActions from './components/OwnerActions'
import TraderActions from './components/TraderActions'
import DepositorActions from './components/DepositorActions'
import { useVaultTokens } from './hooks/useVaultTokens'

type Tab = 'status' | 'owner' | 'trader' | 'depositor'

export default function App() {
  const { isConnected } = useAccount()
  const [rawAddress, setRawAddress] = useState('0xa572882C80b276A36Ea3fDBf9Cf21aAF9F4e65CD')
  const [vaultAddress, setVaultAddress] = useState<`0x${string}`>('0xa572882C80b276A36Ea3fDBf9Cf21aAF9F4e65CD')
  const [tab, setTab] = useState<Tab>('status')

  const { vaultSymbol, assetSymbol } = useVaultTokens(vaultAddress)

  const handleLoad = () => {
    if (isAddress(rawAddress)) setVaultAddress(rawAddress as `0x${string}`)
  }

  return (
    <div>
      <div className="header">
        <h1>Surface Vault Manager</h1>
        <ConnectButton />
      </div>

      {/* Vault address picker */}
      <div className="card">
        <h2>Vault Contract</h2>
        <div className="address-input-row">
          <div style={{ flex: 1 }}>
            <label>Contract Address</label>
            <input
              type="text"
              value={rawAddress}
              onChange={e => setRawAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button className="btn btn-gray" onClick={handleLoad}>Load</button>
        </div>
        {vaultAddress && (
          <p style={{ fontSize: '.75rem', color: '#3b82f6', marginTop: '.4rem' }}>
            Loaded: {vaultAddress}
          </p>
        )}
      </div>

      {!isConnected ? (
        <div className="not-connected">
          <p>Connect your wallet to interact with the vault.</p>
        </div>
      ) : (
        <>
          <div className="section-tabs">
            {(['status', 'owner', 'trader', 'depositor'] as Tab[]).map(t => (
              <button
                key={t}
                className={`tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'status'    && <VaultStatus    vaultAddress={vaultAddress} vaultSymbol={vaultSymbol} assetSymbol={assetSymbol} />}
          {tab === 'owner'     && <OwnerActions    vaultAddress={vaultAddress} />}
          {tab === 'trader'    && <TraderActions   vaultAddress={vaultAddress} assetSymbol={assetSymbol} />}
          {tab === 'depositor' && <DepositorActions vaultAddress={vaultAddress} vaultSymbol={vaultSymbol} assetSymbol={assetSymbol} />}
        </>
      )}
    </div>
  )
}
