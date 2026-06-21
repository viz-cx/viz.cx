'use client'
import type { ReactNode } from 'react'
import { WalletProvider, useWallet } from '@/lib/wallet'
import { ConnectModal } from './ConnectModal'

function ModalMount() {
  const { modalOpen, closeModal, modalMode } = useWallet()
  return <ConnectModal open={modalOpen} onClose={closeModal} mode={modalMode} />
}

export function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      {children}
      <ModalMount />
    </WalletProvider>
  )
}
