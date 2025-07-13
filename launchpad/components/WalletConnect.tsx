"use client"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletConnect() {
    return <div className="flex items-center gap-4">
        <WalletMultiButton />
        <WalletDisconnectButton />
    </div>
}