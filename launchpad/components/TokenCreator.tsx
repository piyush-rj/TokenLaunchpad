"use client";

import { useState } from "react";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { toast } from "react-toastify";
import { uploadFileToIPFS, uploadJSONToPinata } from "@/utils/config";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { Rocket, Coins, Upload, AlertCircle, Check, Copy } from "lucide-react";
import MintToken from "./MintToken";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export default function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [mintKeypair, setMintKeypair] = useState<Keypair | null>(null);
    const [decimals, setDecimals] = useState<number>(9);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [tokenMetadata, setTokenMetadata] = useState({
        name: "",
        symbol: "",
        decimals: "9",
        imageUrl: "",
    });

    const [isCreating, setIsCreating] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const isFormValid = tokenMetadata.name && tokenMetadata.symbol;

    const handleClick = async () => {
        try {
            if (!wallet || !wallet.publicKey) {
                toast.error("Connect your wallet");
                return;
            }

            setIsCreating(true);

            const mintKeypair = Keypair.generate();
            const lamports = await getMinimumBalanceForRentExemptMint(connection);

            // Use the decimals from the input
            const tokenDecimals = parseInt(tokenMetadata.decimals) || 9;

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    lamports,
                    space: MINT_SIZE,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMint2Instruction(
                    mintKeypair.publicKey,
                    tokenDecimals,
                    wallet.publicKey,
                    wallet.publicKey
                )
            );

            let imageUrl = "";
            if (imageFile) {
                try {
                    console.log("Uploading image to IPFS...");
                    imageUrl = await uploadFileToIPFS(imageFile);
                    console.log("Image uploaded, URL:", imageUrl);

                    if (imageUrl.startsWith("ipfs://")) {
                        imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                    }

                    setTokenMetadata((prev) => ({ ...prev, imageUrl }));
                } catch (error) {
                    console.error("Image upload failed:", error);
                    toast.error("Failed to upload image. Proceeding without image.");
                    imageUrl = "";
                }
            }

            const metadataJSON = {
                name: tokenMetadata.name,
                symbol: tokenMetadata.symbol,
                image: imageUrl,
                properties: {
                    files: imageUrl ? [{ uri: imageUrl, type: imageFile?.type }] : [],
                    category: "image",
                },
            };

            console.log("Uploading metadata to IPFS...");
            const metadataURL = await uploadJSONToPinata(metadataJSON);
            console.log("Metadata uploaded, URL:", metadataURL);

            let finalURI = metadataURL;
            if (metadataURL.startsWith("ipfs://")) {
                finalURI = metadataURL.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            }

            const [metadataPDA] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mintKeypair.publicKey.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID
            );

            const metadataIx = createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataPDA,
                    mint: mintKeypair.publicKey,
                    mintAuthority: wallet.publicKey,
                    payer: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                },
                {
                    createMetadataAccountArgsV3: {
                        data: {
                            name: tokenMetadata.name,
                            symbol: tokenMetadata.symbol,
                            uri: finalURI,
                            sellerFeeBasisPoints: 0,
                            creators: null,
                            collection: null,
                            uses: null,
                        },
                        isMutable: true,
                        collectionDetails: null,
                    },
                }
            );

            transaction.add(metadataIx);

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;
            transaction.partialSign(mintKeypair);

            const txSig = await wallet.sendTransaction(transaction, connection);
            setMintKeypair(mintKeypair);
            toast.success(`Token Created! Tx: ${txSig}`);
        } catch (err) {
            console.error("Token creation error:", err);
            toast.error("Failed to create token");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                setImageFile(file);
            } else {
                toast.error("Please select an image file");
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setImageFile(file);
            } else {
                toast.error("Please select an image file");
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Address copied to clipboard!");
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <div className="w-full">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">

                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-2">
                                <div className="p-3 bg-zinc-800 rounded-full">
                                    <Rocket className="w-6 h-6 text-zinc-400" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-100">Token Launchpad</h1>
                            <p className="text-sm text-zinc-500">
                                Create your custom token on Solana
                            </p>
                        </div>


                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                    Token Name
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-3.5 text-zinc-600 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Enter token name"
                                        value={tokenMetadata.name}
                                        onChange={(e) =>
                                            setTokenMetadata((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all duration-200"
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                        Token Symbol
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-zinc-600 font-mono text-sm">
                                            $
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Symbol (e.g., SBX)"
                                            value={tokenMetadata.symbol}
                                            onChange={(e) =>
                                                setTokenMetadata((prev) => ({
                                                    ...prev,
                                                    symbol: e.target.value.toUpperCase(),
                                                }))
                                            }
                                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all duration-200 uppercase"
                                            maxLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                        Decimals
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="9"
                                            value={tokenMetadata.decimals}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "" || (parseInt(value) >= 0 && parseInt(value) <= 9)) {
                                                    setTokenMetadata((prev) => ({
                                                        ...prev,
                                                        decimals: value,
                                                    }));
                                                }
                                            }}
                                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all duration-200"
                                            min="0"
                                            max="9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                    Token Image
                                </label>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${dragActive
                                        ? "border-zinc-600 bg-zinc-800/50"
                                        : "border-zinc-700 bg-zinc-800/20 hover:bg-zinc-800/40"
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileInput}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    {imageFile ? (
                                        <div className="flex items-center justify-center space-x-3">
                                            <div className="p-1 bg-zinc-700 rounded-full">
                                                <Check className="w-3 h-3 text-zinc-300" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-zinc-300 text-sm font-medium">
                                                    {imageFile.name}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Upload className="w-8 h-8 text-zinc-600 mx-auto" />
                                            <div>
                                                <p className="text-zinc-400 text-sm mb-1">
                                                    Drop image here or click to browse
                                                </p>
                                                <p className="text-xs text-zinc-600">
                                                    PNG, JPG, GIF up to 10MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {mintKeypair && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">
                                        Mint Account Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={mintKeypair.publicKey.toString()}
                                            readOnly
                                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 transition-all duration-200 font-mono"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(mintKeypair.publicKey.toString())}
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-300 transition-colors"
                                        >
                                            <Copy className="w-4 h-4 cursor-pointer" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isFormValid && (
                                <div className="flex items-center space-x-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs">Please fill in all required fields</span>
                                </div>
                            )}

                            <button
                                id="launch-button"
                                onClick={handleClick}
                                disabled={!isFormValid || isCreating}
                                className={`w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${isFormValid && !isCreating
                                    ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300"
                                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                    }`}
                            >
                                {isCreating ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                                        <span>Creating Token...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2 cursor-pointer">
                                        <Rocket className="w-4 h-4" />
                                        <span>Launch Token</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    {mintKeypair && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                            <div className="text-center space-y-2 mb-6">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 bg-zinc-800 rounded-full">
                                        <Coins className="w-6 h-6 text-zinc-400" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-100">Mint Tokens</h2>
                                <p className="text-sm text-zinc-500">
                                    Mint tokens to your wallet
                                </p>
                            </div>
                            <MintToken mintPubkey={mintKeypair.publicKey} decimals={parseInt(tokenMetadata.decimals) || 9} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}