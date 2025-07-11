"use client"
import TokenLaunchpadMain from "@/components";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



export default function Home() {
  return (
    <div className="h-screen w-screen bg-neutral-950 text-white">
      <div className="w-full h-full">
        <ConnectionProvider endpoint="https://api.devnet.solana.com">
          <WalletProvider wallets={[]} autoConnect>
            <WalletModalProvider>
              <div className="p-10 flex justify-between gap-4">
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
              <div className="mt-[230px] flex justify-center items-center">
                <TokenLaunchpadMain />
              </div>
              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                pauseOnHover
                draggable
                theme="dark"
              />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>
    </div>
  );
}
