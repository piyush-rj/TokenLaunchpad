import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import TokenLaunchpad from "../components/TokenLaunchpad";
import "@solana/wallet-adapter-react-ui/styles.css";


export default function App() {



  return (
    <div className="h-screen w-screen bg-neutral-950 text-white">
      <div className="w-full h-full">
        <ConnectionProvider endpoint="https://api.devnet.solana.com">
          <WalletProvider wallets={[]}>
            <WalletModalProvider>
              <div className="p-10 flex justify-between gap-4">
                <WalletMultiButton />
                <WalletDisconnectButton />
              </div>
              <div className="mt-[230px] flex justify-center items-center">
                <TokenLaunchpad />
              </div>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>
    </div>
  );
}
