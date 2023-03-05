import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { Buffer } from 'buffer';

import { MarketAddress, MarketAddressABI } from './constants';

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_API_KEY_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = ipfsHttpClient({ 
 host: 'ipfs.infura.io', 
 port: 5001, 
 protocol: 'https', 
 apiPath : '/api/v0',
 headers: { 
   authorization: auth,
  },
});

const dedicatedEndPoint = 'https://visam.infura-ipfs.io';

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
  const nftCurrency = 'ETH';

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_accounts'})

    if(accounts.length) {
        setCurrentAccount(accounts[0]);
    } else {
        console.log('No accounts found.');
    }
  };

  useEffect(() => {
   checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'});

    setCurrentAccount(accounts[0]);

    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    const subdomain = 'https://visam.infura-ipfs.io';
     try{
      const added = await client.add({ content: file });
      const URL = `${subdomain}/ipfs/${added.path}`;
      return URL;
     } catch (error) {
      console.log('Error uploading file to IPFS.');
     }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
  
    if (!name || !description || !price || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });
     
    try {
      const added = await client.add(data);
      const subdomain = 'https://visam.infura-ipfs.io';
      const URL = `${subdomain}/ipfs/${added.path}`;
   
      await createSale(URL, price);

      router.push('/');
      
    } catch (error) {
      console.log('Error uploading file to IPFS.');
    }
  };

  const createSale = async (URL, formInputPrice, isReselling, id) => {
  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  const provider =new ethers.providers.Web3Provider(connection);
  const signer = provider.getSigner();

  const price = ethers.utils.parseUnits(formInputPrice, 'ether');
  const contract = fetchContract(signer);
  const listingPrice = await contract.getListingPrice();

  const transaction = !isReselling 
  ? await contract.createToken(URL, price, { value: listingPrice.toString() })
  : await contract.resellToken(id, price, { value: listingPrice.toString() });

  await transaction.wait();
  };

  const fetchNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.g.alchemy.com/v2/6I3s85vuQUb6y6_aMpjihWp5O25toZVU");
    const contract = fetchContract(provider);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
     const tokenURI = await contract.tokenURI(tokenId);
     const { data: { image, name, description } } = await axios.get(tokenURI);
     const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

     return {
      price,
      tokenId: tokenId.toNumber(),
      seller,
      owner,
      image,
      name,
      description,
      tokenURI,
     }
    }));

    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider =new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data = type === 'fetchItemsListed' 
      ? await contract.fetchItemsListed()
      : await contract.fetchMyNFTs();

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');
   
        return {
         price,
         tokenId: tokenId.toNumber(),
         seller,
         owner,
         image,
         name,
         description,
         tokenURI,
        }
       }));
   
       return items;
  };

  const buyNFT = async (nft) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider =new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });

    await transaction.wait();
  }

  return (
    <NFTContext.Provider value={{ nftCurrency, connectWallet, currentAccount, uploadToIPFS, createNFT, fetchNFTs, fetchMyNFTsOrListedNFTs, buyNFT, createSale }}>
       {children}
    </NFTContext.Provider>
  );
};