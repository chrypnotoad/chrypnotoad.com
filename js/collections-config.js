// collections-config.js - Configuration file for collections
const COLLECTIONS_CONFIG = {
    // Local collection with PNG images
    local: [
      {
        id: "collection1",
        title: "Oracle Deck",
        description: "chrypnotoad oracle deck",
        imageType: "local",
        path: "images/collection1",
        fileExtension: "png",
        count: 50,
        aspectRatio: "832:1440"
      }
    ],
    
    // NFT collections (JSON files in the nft-data directory)
    nft: [
      "aurelia-prime",
      "capture-protocol",
      "celestial-dreamscapes",
      "chrypno-cult",
      "david",
      "deep-shadow-portraits",
      "fashionpunk",
      "greyscale",
      "monoliths",
      "niji-guys",
      "pepe-by-chryponotoad",
      "pyramid",
      "quiet-ripples-in-a-cosmic-pool",
      "scenes-from-an-epic",
      "space-time-latent-patches",
      "tarot",
      "toadallions",
      "zain"
    ]
  };