"use client";

import { useState, useEffect, useRef } from "react";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { toast } from "react-toastify";
import { uploadFileToIPFS, uploadJSONToPinata } from "@/utils/config";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { Rocket, Coins, Upload, AlertCircle, Check } from "lucide-react";

declare global {
    interface Window {
        gsap: typeof import("gsap");
    }
}

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export default function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [tokenMetadata, setTokenMetadata] = useState({
        name: "",
        symbol: "",
        imageUrl: "",
    });

    const [isCreating, setIsCreating] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const containerRef = useRef(null);
    const cardRef = useRef(null);
    const titleRef = useRef(null);
    const inputRefs = useRef<HTMLDivElement[]>([]);

    const isFormValid = tokenMetadata.name && tokenMetadata.symbol;

    useEffect(() => {
        const gsap = window.gsap;
        if (!gsap) return;

        gsap.set([cardRef.current, titleRef.current], { opacity: 0, y: 30 });
        gsap.set(inputRefs.current, { opacity: 0, x: -20 });

        const tl = gsap.timeline();

        tl.to(cardRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
        })
            .to(
                titleRef.current,
                { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                "-=0.4"
            )
            .to(
                inputRefs.current,
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out",
                },
                "-=0.3"
            );
    }, []);

    const handleClick = async () => {
        try {
            if (!wallet || !wallet.publicKey) {
                toast.error("Connect your wallet");
                return;
            }

            setIsCreating(true);

            const mintKeypair = Keypair.generate();
            const lamports = await getMinimumBalanceForRentExemptMint(connection);

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
                    9,
                    wallet.publicKey,
                    wallet.publicKey
                )
            );

            let imageUrl = "";
            if (imageFile) {
                imageUrl = await uploadFileToIPFS(imageFile);
                imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                setTokenMetadata((prev) => ({ ...prev, imageUrl }));
            }

            const metadataJSON = {
                name: tokenMetadata.name,
                symbol: tokenMetadata.symbol,
                image: imageUrl,
                properties: {
                    files: [{ uri: imageUrl, type: imageFile?.type }],
                    category: "image",
                },
            };

            const metadataURL = await uploadJSONToPinata(metadataJSON);
            const finalURI = metadataURL.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");

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
            setImageFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" />
            <div className="w-full px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
                <div ref={containerRef} className="w-full">
                    <div
                        ref={cardRef}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
                    >
                        {/* Header */}
                        <div ref={titleRef} className="text-center space-y-2">
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

                        {/* Inputs */}
                        <div className="space-y-6">
                            {/* Name */}
                            <div ref={(el) => { (inputRefs.current[0] = el!) }} className="space-y-2">
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

                            {/* Symbol */}
                            <div ref={(el) => { (inputRefs.current[1] = el!) }} className="space-y-2">
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

                            {/* Image Upload */}
                            <div ref={(el) => { (inputRefs.current[2] = el!) }} className="space-y-2">
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
                                        onChange={(e) =>
                                            e.target.files && setImageFile(e.target.files[0])
                                        }
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

                            {/* Validation */}
                            {!isFormValid && (
                                <div
                                    ref={(el) => { (inputRefs.current[3] = el!) }}
                                    className="flex items-center space-x-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs">Please fill in all required fields</span>
                                </div>
                            )}

                            {/* Button */}
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
                                    <div className="flex items-center justify-center space-x-2">
                                        <Rocket className="w-4 h-4" />
                                        <span>Launch Token</span>
                                    </div>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}