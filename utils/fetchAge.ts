import axios from "axios";

export type WalletAge = {
  years: number;
  months: number;
  displayText: string;
};

export type TokenActivity = {
  sender_address: string;
  wallet_age: WalletAge;
  network: string;
};

export type Network = "ethereum" | "base";

export type GeneralTxItem = {
  timeStamp: string;
};

interface NetworkConfig {
  apiBaseURL: string;
  apiKey: string;
  name: string;
}

function getNetworkConfig(network: Network): NetworkConfig {
  switch (network) {
    case "ethereum":
      return {
        apiBaseURL: "https://api.etherscan.io",
        apiKey: process.env.ETHERSCAN_API_KEY!!,
        name: "Ethereum",
      };
    case "base":
      return {
        apiBaseURL: "https://api.basescan.org",
        apiKey: process.env.BASESCAN_API_KEY!!,
        name: "Base",
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

async function fetchTransactionsV2(
  address: string,
  network: Network,
  startblock: string = "0",
  endblock: string = "latest"
) {
  const config = getNetworkConfig(network);

  // Using v2 API format with additional parameters
  const url = `${config.apiBaseURL}/api`;
  const params = {
    module: "account",
    action: "txlist",
    address: address,
    startblock: startblock,
    endblock: endblock,
    page: 1,
    offset: 10000, // Maximum transactions to fetch
    sort: "asc",
    apikey: config.apiKey,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${config.name} transactions:`, error);
    throw error;
  }
}

function calculateWalletAge(timestamp: string): WalletAge {
  const firstTxDate = new Date(parseInt(timestamp) * 1000);
  const currentDate = new Date();

  // Calculate difference
  let years = currentDate.getFullYear() - firstTxDate.getFullYear();
  let months = currentDate.getMonth() - firstTxDate.getMonth();

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // Handle edge cases
  if (years === 0 && months === 0) {
    return {
      years: 0,
      months: 1,
      displayText: "1 month",
    };
  }

  // Generate display text
  let displayText = "";
  if (years === 0) {
    displayText = `${months} month${months > 1 ? "s" : ""}`;
  } else if (months === 0) {
    displayText = `${years} year${years > 1 ? "s" : ""}`;
  } else {
    displayText = `${years} year${years > 1 ? "s" : ""} ${months} month${
      months > 1 ? "s" : ""
    }`;
  }

  return {
    years,
    months,
    displayText,
  };
}

async function getTransactionsOf(
  address: string,
  network: Network
): Promise<GeneralTxItem[]> {
  const response = await fetchTransactionsV2(address, network);

  if (response.status === "0" && response.message === "No transactions found") {
    return [];
  }

  if (response.message !== "OK") {
    const msg = `${getNetworkConfig(network).name} API error: ${JSON.stringify(
      response
    )}`;
    throw new Error(`${getNetworkConfig(network).name} API failed: ${msg}`);
  }

  return response.result;
}

export async function getTokenActivityBy(
  address: string,
  network: Network = "ethereum"
): Promise<TokenActivity> {
  const transactions = await getTransactionsOf(address, network);
  const walletAge =
    transactions.length > 0
      ? calculateWalletAge(transactions[0].timeStamp)
      : { years: 0, months: 1, displayText: "1 month" }; // Default for wallets with no transactions (new wallet)

  return {
    sender_address: address,
    wallet_age: walletAge,
    network: getNetworkConfig(network).name,
  };
}

// Helper function to get wallet age from multiple networks
export async function getWalletAgeFromAllNetworks(
  address: string
): Promise<TokenActivity[]> {
  const networks: Network[] = ["ethereum", "base"];
  const results: TokenActivity[] = [];

  for (const network of networks) {
    try {
      const activity = await getTokenActivityBy(address, network);
      results.push(activity);
    } catch (error) {
      console.error(`Error fetching from ${network}:`, error);
      // Continue with other networks even if one fails
    }
  }

  return results;
}

// Helper function to get the oldest wallet age across all networks
export async function getOldestWalletAge(
  address: string
): Promise<TokenActivity> {
  const networks: Network[] = ["ethereum", "base"];
  let oldestActivity: TokenActivity | null = null;
  let oldestTimestamp = new Date();

  for (const network of networks) {
    try {
      const transactions = await getTransactionsOf(address, network);
      if (transactions.length > 0) {
        const activityTimestamp = new Date(
          parseInt(transactions[0].timeStamp) * 1000
        );
        if (activityTimestamp < oldestTimestamp) {
          oldestTimestamp = activityTimestamp;
          oldestActivity = {
            sender_address: address,
            wallet_age: calculateWalletAge(transactions[0].timeStamp),
            network: getNetworkConfig(network).name,
          };
        }
      }
    } catch (error) {
      console.error(`Error processing ${network}:`, error);
    }
  }

  return (
    oldestActivity || {
      sender_address: address,
      wallet_age: { years: 0, months: 1, displayText: "1 month" },
      network: "Unknown",
    }
  );
}
