import {
    EIP7702_DELEGATE_CONTRACT_ADDRESS as contractAddress,
    EIP7702_DELEGATE_CONTRACT_ABI as abi,
} from "./constants";

import { relayerClient } from "./config";

import { IProvider } from "@web3auth/base";

import { bsc } from "viem/chains";
import { createWalletClient, custom, Hex, parseSignature } from "viem";
import { hashAuthorization, verifyAuthorization } from "viem/utils";
import { SignAuthorizationReturnType } from "viem/accounts";

export const getAccount = async (provider: IProvider): Promise<any> => {
    try {
        const walletClient = createWalletClient({
            chain: bsc,
            transport: custom(provider),
        });

        const addresses = await walletClient.getAddresses();

        return addresses[0];
    } catch (error) {
        return error;
    }
}

export const signAuthorization = async (provider: IProvider): Promise<any> => {
    try {
        const account = await getAccount(provider);

        const authorization = await relayerClient.prepareAuthorization({
            account,
            contractAddress,
        })

        const authorizationHash = hashAuthorization(authorization);

        const signature: Hex = (await provider.request({
            method: "eth_sign",
            params: [account, authorizationHash],
        })) as Hex;

        const parsedSignature = parseSignature(signature);

        const signedAuthorization: SignAuthorizationReturnType = {
            ...authorization,
            r: parsedSignature.r,
            s: parsedSignature.s,
            yParity: parsedSignature.yParity,
        };    

        const verified = await verifyAuthorization({
            authorization: signedAuthorization,
            address: account,
            signature: signature
        });

        console.log("verified", verified);

        // return {
        //     signedAuthorization,
        //     signature,
        //     verified,
        // }
        return signedAuthorization;
    } catch (error) {
        return error;
    }
}

export const submitAuthorization = async (provider: IProvider): Promise<any> => {
    try {
        const authorization = await signAuthorization(provider);
        const address = await getAccount(provider);

        const txHash = await relayerClient.writeContract({
            abi,
            address,
            authorizationList: [authorization],
            functionName: "initialize",
        })

        console.log("txHash", txHash);
        return txHash;
    } catch (error) {
        return error;
    }
}

export const ping = async (provider: IProvider): Promise<any> => {
    try {
        const account = await getAccount(provider);

        const txHash = await relayerClient.writeContract({
            abi,
            address: account,
            functionName: "ping9",
        })

        console.log("txHash", txHash);
        return txHash;
    } catch (error) {
        return error;
    }
}