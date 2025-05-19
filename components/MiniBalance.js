"use client";

import { RiCopperCoinLine } from "react-icons/ri";
import { useAccount, useReadContract } from 'wagmi';
import { BBLTOKEN_CONTRACT, BBLTOKEN_ABI } from '@/contracts/BBLToken';
import { useEffect, useState } from 'react';
import { formatUnits } from "viem";

export default function MiniBalance() {
    const { address } = useAccount();
    const [balance, setBalance] = useState('0.00');

    const result = useReadContract({
        address: BBLTOKEN_CONTRACT,
        abi: BBLTOKEN_ABI,
        functionName: 'balanceOf',
        args: [address],
        enabled: !!address,
    });

    useEffect(() => {
        if (result) {
            console.log('result', result.data);
            const bal = result.data ? formatUnits(result.data, 6) : '0.00';
            console.log('bal', bal);
            setBalance(bal);
        }
    }, [result]);

    return (
        <div className='flex items-center justify-center space-x-1 bg-primary py-2 pl-2 pr-3 rounded-xl text-sm'>
            <RiCopperCoinLine size={20} />
            <h1 className='font-bold'>{balance} BBL</h1>
        </div>
    );
}
