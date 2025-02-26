const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Configuration - Edit these values
const ALCHEMY_API_KEY = 'redacted'; // Replace with your Alchemy API key
const CONTRACTS_FILE = './contracts.json'; // Path to your contracts list JSON file
const OUTPUT_DIR = './nft-data';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load contract addresses from JSON file
function loadContractAddresses() {
  try {
    const data = fs.readFileSync(CONTRACTS_FILE, 'utf8');
    const contracts = JSON.parse(data);
    
    if (!Array.isArray(contracts)) {
      throw new Error('Contracts file must contain an array of contract addresses');
    }
    
    return contracts;
  } catch (error) {
    console.error(`Error loading contracts file: ${error.message}`);
    console.log('Please ensure your contracts.json file exists and has the correct format:');
    console.log(`
[
  "0x123456789...",
  "0x987654321...",
  "0xabcdef123..."
]`);
    process.exit(1);
  }
}

// Alchemy API base URL for Polygon
const ALCHEMY_BASE_URL = `https://polygon-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}`;

/**
 * Gets collection metadata for a contract address
 * @param {string} contractAddress - The NFT contract address
 * @returns {Promise<Object>} - Collection metadata
 */
async function getCollectionMetadata(contractAddress) {
  try {
    const url = `${ALCHEMY_BASE_URL}/getContractMetadata?contractAddress=${contractAddress}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching collection metadata: ${error.message}`);
    return { contractMetadata: { name: null, openSea: { collectionName: null } } };
  }
}

/**
 * Gets a sanitized collection name suitable for a filename
 * @param {string} contractAddress - The contract address
 * @param {Object} metadata - Collection metadata
 * @returns {string} - Sanitized collection name
 */
function getCollectionName(contractAddress, metadata) {
  // Try to get the name from metadata
  let name = metadata?.contractMetadata?.name || 
             metadata?.contractMetadata?.openSea?.collectionName || 
             contractAddress;
  
  // Sanitize name for use as a filename
  return name
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fetches NFTs for a given contract address
 * @param {string} contractAddress - The NFT contract address
 * @param {string|null} pageKey - Pagination key for subsequent requests
 * @returns {Promise<Object>} - The API response
 */
async function fetchNFTs(contractAddress, pageKey = null) {
  let url = `${ALCHEMY_BASE_URL}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true`;
  
  if (pageKey) {
    url += `&pageKey=${pageKey}`;
  }
  
  const response = await axios.get(url);
  return response.data;
}

/**
 * Process a collection and save NFT data to a JSON file
 * @param {string} contractAddress - The contract address
 */
async function processCollection(contractAddress) {
  console.log(`Processing collection with contract: ${contractAddress}`);
  
  // Get collection metadata first
  const collectionMetadata = await getCollectionMetadata(contractAddress);
  const collectionName = getCollectionName(contractAddress, collectionMetadata);
  
  console.log(`Collection identified as: ${collectionName}`);
  
  const nftData = [];
  let pageKey = null;
  let hasMorePages = true;
  let count = 0;
  
  // Paginate through all NFTs in the collection
  while (hasMorePages) {
    try {
      const data = await fetchNFTs(contractAddress, pageKey);
      
      // Extract data from the response
      for (const nft of data.nfts) {
        const tokenData = {
          tokenId: nft.id.tokenId,
          name: nft.title || `#${parseInt(nft.id.tokenId, 16)}`,
        };
        
        // Extract additional metadata if available
        if (nft.metadata) {
          if (nft.metadata.image) tokenData.imageUrl = nft.metadata.image;
          
          // Remove the default text from description
          if (nft.metadata.description) {
            let description = nft.metadata.description;
            description = description.replace(/\n\nMinted for free @ uncut\.network\./g, '');
            tokenData.description = description;
          }
          
          if (nft.metadata.external_url) tokenData.externalUrl = nft.metadata.external_url;
          
          // Add any other attributes/metadata that might be useful
          if (nft.metadata.attributes) tokenData.attributes = nft.metadata.attributes;
        }
        
        nftData.push(tokenData);
        count++;
      }
      
      // Check if there are more pages
      if (data.pageKey) {
        pageKey = data.pageKey;
        console.log(`Fetched ${count} NFTs so far. Getting next page...`);
      } else {
        hasMorePages = false;
      }
      
      // Optional: Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching NFTs for ${contractAddress}:`, error.message);
      hasMorePages = false;
    }
  }
  
  // Save the data to a JSON file
  const outputPath = path.join(OUTPUT_DIR, `${collectionName}.json`);
  
  // Add collection metadata to the output
  const outputData = {
    contractAddress,
    collectionName: collectionMetadata?.contractMetadata?.name || collectionName,
    totalNFTs: nftData.length,
    nfts: nftData
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`Saved ${nftData.length} NFTs for ${collectionName} to ${outputPath}`);
}

/**
 * Main function to process all collections
 */
async function main() {
  console.log('Starting NFT data fetcher...');
  
  // Load contract addresses from JSON file
  const contractAddresses = loadContractAddresses();
  console.log(`Loaded ${contractAddresses.length} contract addresses from ${CONTRACTS_FILE}`);
  
  for (const contractAddress of contractAddresses) {
    await processCollection(contractAddress);
  }
  
  console.log('All collections processed successfully!');
}

// Run the script
main().catch(error => {
  console.error('An error occurred:', error);
});