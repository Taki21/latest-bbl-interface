// Web3Auth Libraries
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, UX_MODE } from "@web3auth/base";
import { Chain } from "wagmi/chains";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { AccountAbstractionProvider, KernelSmartAccount, SafeSmartAccount } from "@web3auth/account-abstraction-provider";

export function Web3AuthConnectorInstance(web3AuthInstance, provider) {
  return new Web3AuthConnector({
    web3AuthInstance,
    loginParams: {
      loginProvider: provider,
    },
  });
}

export function Web3AuthInstance(chains) {
  // Create Web3Auth Instance
  const name = "BBL";
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorerUrl: chains[0].blockExplorers?.default.url[0],
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

  const web3AuthInstance = new Web3AuthNoModal({
    clientId: "BEbV53dD1PMIzVp6jM2m4FfbuPN1HhcAMe4Sgh5ioZ63fBp27zy10eL5wsgyblniJ9p0pgI4r9PRCKszix14u5U",
    chainConfig,
    privateKeyProvider,
    uiConfig: {
      appName: name,
      defaultLanguage: "en",
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      mode: "light",
    },
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    // enableLogging: true,
  });

  const authAdapter = new AuthAdapter({
    adapterSettings: {
      uxMode: UX_MODE.REDIRECT,
    }
  });

  web3AuthInstance.configureAdapter(authAdapter);

  const walletServicesPlugin = new WalletServicesPlugin({
    walletInitOptions: {
      whiteLabel: {
        showWidgetButton: false,
      }
    }
  });
  web3AuthInstance.addPlugin(walletServicesPlugin);

  return web3AuthInstance;
}