// gallery.js - Main gallery JavaScript
// Global variables
let collections = [];
let currentCollection = null;
let currentImages = [];
let currentImageIndex = 0;

// Wait for the DOM to be fully loaded before executing code
document.addEventListener('DOMContentLoaded', function() {
  initializeGallery();
});

// Initialize the gallery by loading all collections
async function initializeGallery() {
  try {
    // Start with local collections
    collections = [...COLLECTIONS_CONFIG.local];
    
    // Load each NFT collection from JSON
    for (const nftCollection of COLLECTIONS_CONFIG.nft) {
      try {
        const response = await fetch(`nft-data/${nftCollection}.json`);
        const data = await response.json();
        
        // Format the NFT collection data for our gallery
        collections.push({
          id: `nft-${nftCollection}`,
          title: data.collectionName || nftCollection,
          description: `NFT Collection: ${data.collectionName || nftCollection}`,
          imageType: "nft",
          contractAddress: data.contractAddress,
          nfts: data.nfts.map(nft => ({
            tokenId: nft.tokenId,
            title: nft.name,
            url: nft.imageUrl,
            description: nft.description
          }))
        });
        
        console.log(`Loaded NFT collection: ${nftCollection}`);
      } catch (error) {
        console.error(`Error loading NFT collection ${nftCollection}:`, error);
      }
    }
    
    // Create tabs for each collection
    createCollectionTabs();
    
    // Load the first collection by default
    if (collections.length > 0) {
      loadCollection(collections[0].id);
    }
  } catch (error) {
    console.error('Error initializing gallery:', error);
    document.getElementById('gallery-container').innerHTML = 
      '<p class="error-message">Unable to load gallery collections. Please try again later.</p>';
  }
}

// Function to create tabs for each collection
function createCollectionTabs() {
  const tabsContainer = document.getElementById('collection-tabs');
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = '';
  
  collections.forEach(collection => {
    const tab = document.createElement('div');
    tab.className = 'collection-tab';
    tab.textContent = collection.title;
    tab.dataset.collectionId = collection.id;
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.collection-tab').forEach(t => {
        t.classList.remove('active');
      });
      // Add active class to clicked tab
      tab.classList.add('active');
      // Load the collection
      loadCollection(collection.id);
    });
    
    tabsContainer.appendChild(tab);
  });
  
  // Set the first tab as active by default
  if (collections.length > 0) {
    tabsContainer.querySelector('.collection-tab').classList.add('active');
  }
}

// Function to load a specific collection
function loadCollection(collectionId) {
  // Find the collection data
  currentCollection = collections.find(c => c.id === collectionId);
  if (!currentCollection) return;
  
  // Update the gallery based on collection type
  if (currentCollection.imageType === 'local') {
    loadLocalCollection();
  } else if (currentCollection.imageType === 'nft') {
    loadNFTCollection();
  }
}

// Function to load images from a local collection
function loadLocalCollection() {
  const container = document.getElementById('gallery-container');
  if (!container || !currentCollection) return;
  
  container.innerHTML = '';
  currentImages = [];
  
  // Generate image paths for local collection
  for (let i = 1; i <= currentCollection.count; i++) {
    const paddedNumber = String(i).padStart(3, '0');
    const imgSrc = `${currentCollection.path}/${paddedNumber}.${currentCollection.fileExtension}`;
    const imgAlt = `${currentCollection.title} - Artwork ${i}`;
    
    // Add to currentImages array for modal navigation
    currentImages.push({
      src: imgSrc,
      title: `Artwork ${i}`,
      description: `From the ${currentCollection.title} collection`
    });
    
    // Create gallery item
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    // Add aspect ratio container if specified
    if (currentCollection.aspectRatio) {
      // Extract values and convert to CSS-friendly format
      const ratio = currentCollection.aspectRatio.replace(':', '-');
      galleryItem.classList.add(`aspect-container-${ratio}`);
    }
    
    galleryItem.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}" loading="lazy">`;
    
    // Add click event to open modal
    galleryItem.addEventListener('click', function() {
      openModal(i - 1); // Index is 0-based
    });
    
    container.appendChild(galleryItem);
  }
}

// Function to load images from NFT collection
function loadNFTCollection() {
  const container = document.getElementById('gallery-container');
  if (!container || !currentCollection || !currentCollection.nfts) return;
  
  container.innerHTML = '';
  currentImages = [];
  
  // Loop through NFT images
  currentCollection.nfts.forEach((nft, index) => {
    // Prepare additional NFT info if available
    const nftInfo = nft.tokenId ? 
      `<div class="nft-info">Token ${nft.tokenId}</div>` : '';
    
    // Add to currentImages array for modal navigation
    currentImages.push({
      src: nft.url,
      title: nft.title || `Artwork ${index + 1}`,
      description: nft.description || `From the ${currentCollection.title} collection`,
      tokenId: nft.tokenId || null,
      contractAddress: currentCollection.contractAddress || null
    });
    
    // Create gallery item
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    galleryItem.innerHTML = `
      <img src="${nft.url}" alt="${nft.title}" loading="lazy">
      ${nftInfo}
    `;
    
    // Add click event to open modal
    galleryItem.addEventListener('click', function() {
      openModal(index);
    });
    
    container.appendChild(galleryItem);
  });
}

// Function to open the artwork modal
function openModal(index) {
  const modal = document.getElementById('artwork-modal');
  if (!modal || currentImages.length === 0) return;
  
  currentImageIndex = index;
  updateModalContent();
  
  modal.style.display = 'flex';
  
  // Set up event listeners
  // Close modal when clicking the X
  document.querySelector('.close-modal').onclick = function() {
    closeModal();
  };
  
  // Close modal when clicking outside the image
  modal.onclick = function(e) {
    if (e.target === modal) {
      closeModal();
    }
  };
  
  // Navigation buttons
  document.getElementById('prev-button').onclick = showPreviousImage;
  document.getElementById('next-button').onclick = showNextImage;
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeyPress);
}

// Update the modal content based on the current image index
function updateModalContent() {
  if (currentImages.length === 0) return;
  
  const image = currentImages[currentImageIndex];
  const imageNumber = currentImageIndex + 1; // Convert to 1-based for display
  
  document.getElementById('modal-image').src = image.src;
  document.getElementById('modal-title').textContent = image.title;
  document.getElementById('modal-description').textContent = image.description || '';
  document.getElementById('image-counter').textContent = `${imageNumber} / ${currentImages.length}`;
  
  // Add NFT-specific info if available
  const modalContent = document.querySelector('.modal-content');
  
  // Remove any existing NFT info
  const existingNftInfo = modalContent.querySelector('.nft-details');
  if (existingNftInfo) {
    existingNftInfo.remove();
  }
  
  // Add NFT details if this is from a blockchain
  if (image.tokenId && image.contractAddress) {
    const nftDetails = document.createElement('div');
    nftDetails.className = 'nft-details';
    nftDetails.innerHTML = `
      <div class="nft-metadata">
        <span class="nft-label">Token ID:</span> ${image.tokenId}
      </div>
      <div class="nft-links">
        <a href="https://opensea.io/assets/matic/${image.contractAddress}/${image.tokenId}" 
           target="_blank" rel="noopener noreferrer" class="nft-link">
           View on OpenSea
        </a>
        <a href="https://polygonscan.com/token/${image.contractAddress}?a=${image.tokenId}" 
           target="_blank" rel="noopener noreferrer" class="nft-link">
           View on PolygonScan
        </a>
      </div>
    `;
    
    // Insert before the navigation controls
    const modalNav = modalContent.querySelector('.modal-navigation');
    modalContent.insertBefore(nftDetails, modalNav);
  }
}

// Show previous image
function showPreviousImage() {
  currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
  updateModalContent();
}

// Show next image
function showNextImage() {
  currentImageIndex = (currentImageIndex + 1) % currentImages.length;
  updateModalContent();
}

// Handle keyboard navigation
function handleKeyPress(e) {
  if (document.getElementById('artwork-modal').style.display !== 'flex') return;
  
  if (e.key === 'ArrowLeft') {
    showPreviousImage();
  } else if (e.key === 'ArrowRight') {
    showNextImage();
  } else if (e.key === 'Escape') {
    closeModal();
  }
}

// Close modal and clean up event listeners
function closeModal() {
  document.getElementById('artwork-modal').style.display = 'none';
  document.removeEventListener('keydown', handleKeyPress);
}