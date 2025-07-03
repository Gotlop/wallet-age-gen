# Wallet Age Image Generator

This project generates dynamic images displaying Ethereum wallet addresses with their calculated age based on their first transaction. It creates a visually appealing card-style representation with tilted text and a clean design.

## Features

- Generates custom artwork based on Ethereum wallet addresses
- Displays wallet age in years and months in a modern card format
- Supports multiple networks (Ethereum, Base)
- Dynamic text positioning with rotation effects
- Separate lines for years and months when both are present
- Clean black text on template background

## Prerequisites

- Node.js 18+
- Required assets in `/public`:
  - satoshi.ttf (custom font)
  - template.png (background template)
- Dependencies:
  - canvas
  - @vercel/node
  - axios
  - Other utilities for blockchain data fetching

## API Usage

The API endpoint accepts an Ethereum address and returns a PNG image with the wallet's age information:

### Parameters

- `address` (required): Ethereum wallet address (0x...)
- `network` (optional): "ethereum" or "base" (default: "ethereum")
- `useOldest` (optional): "true" to get oldest age across all networks (default: "false")

### Example Usage

```
GET /api?address=0x1234...&network=ethereum
GET /api?address=0x1234...&useOldest=true
```

## Wallet Age Format

The wallet age is displayed in separate format:

- **Both years and months**: Displayed on two lines (e.g., "2 years" on first line, "3 months" on second line)
- **Only years**: Single line display (e.g., "2 years")
- **Only months**: Single line display (e.g., "5 months")

## Supported Networks

- Ethereum (Etherscan API)
- Base (Basescan API)

## Environment Variables

Required API keys:

- `ETHERSCAN_API_KEY`: For Ethereum network data
- `BASESCAN_API_KEY`: For Base network data
# wallet-age-gen
