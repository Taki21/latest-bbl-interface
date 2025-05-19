import { createContext, useContext } from "react";

export const Web3AuthContext = createContext(null);
export const useWeb3Auth = () => useContext(Web3AuthContext);

export function Web3AuthProvider({ children, web3AuthInstance }) {

    if (!web3AuthInstance) {
      throw new Error(
        "Web3AuthInstance must be used within a Web3AuthContext.Provider"
      );
    }

  return (
    <Web3AuthContext.Provider value={web3AuthInstance}>
      {children}
    </Web3AuthContext.Provider>
  );
}