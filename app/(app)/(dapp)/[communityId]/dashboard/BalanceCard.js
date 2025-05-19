import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useReadContract, useSendTransaction } from 'wagmi';
import { BBLTOKEN_CONTRACT, BBLTOKEN_ABI } from '@/contracts/BBLToken';
import { useState, useEffect } from 'react';
import { RiCopperCoinLine } from "react-icons/ri";
import QRCode from 'react-qr-code';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatUnits } from 'viem';

export default function BalanceCard() {
    const { address } = useAccount();
    const [balance, setBalance] = useState('0.00');
    const { data } = useReadContract({
        address: BBLTOKEN_CONTRACT,
        abi: BBLTOKEN_ABI,
        functionName: 'balanceOf',
        args: [address],
        enabled: !!address,
    });

    useEffect(() => {
        if (data) {
            const bal = data ? formatUnits(data, 6) : '0.00';
            setBalance(bal);
        }
    }, [data]);

    const { sendTransaction } = useSendTransaction();
    const handleSend = () => {
        // Logic for sending tokens can be added here
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>BBL Token Balance</CardTitle>
                <CardDescription>Your current BBL token balance and actions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='flex items-center justify-between py-3'>
                    <div className="flex items-center space-x-3">
                        <Avatar>
                            <AvatarFallback>0x</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="font-bold text-lg">{balance} BBL</h1>
                            <p className="text-sm text-gray-400">Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="">
                                    Send
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send BBL Tokens</DialogTitle>
                                    <DialogDescription>Enter the recipient address and amount to send.</DialogDescription>
                                </DialogHeader>
                                {/* Form for sending tokens can be added here */}
                                <div className="flex flex-col space-y-4">
                                    <input type="text" placeholder="Recipient Address" className="p-2 rounded-md bg-gray-800 text-white" />
                                    <input type="number" placeholder="Amount" className="p-2 rounded-md bg-gray-800 text-white" />
                                    <Button className="bg-primary text-white px-3 py-1 rounded-md" onClick={handleSend}>
                                        Confirm Send
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-white px-3 py-1 rounded-md">
                                    Receive
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Receive BBL Tokens</DialogTitle>
                                    <DialogDescription>Scan the QR code below to receive BBL tokens.</DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center mt-4">
                                    <QRCode value={address || ''} size={150} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
