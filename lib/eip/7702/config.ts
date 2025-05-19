import {
    createWalletClient,
    http
} from "viem";

import { base } from "viem/chains";

import { privateKeyToAccount } from "viem/accounts";

// export const relayer = privateKeyToAccount(`0x${process.env.TEST_RELAYER_KEY}`);
export const relayer = privateKeyToAccount(``);

export const relayerClient = createWalletClient({
    account: relayer,
    chain: base,
    transport: http(),
})