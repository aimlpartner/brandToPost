import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductDNA } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType, logSilentError } from '../lib/firestore-error';

interface ProductContextType {
  products: ProductDNA[];
  activeProduct: ProductDNA | null;
  setActiveProductId: (id: string) => void;
  addProduct: (name: string) => void;
  updateProduct: (id: string, data: Partial<ProductDNA>) => void;
  deleteProduct: (id: string) => void;
}

export const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<ProductDNA[]>([]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Load from local storage for non-logged-in users
      const stored = localStorage.getItem('products');
      if (stored) {
        try {
          const localProducts: ProductDNA[] = JSON.parse(stored);
          setProducts(localProducts);
          const storedActive = localStorage.getItem('activeProductId_guest');
          if (storedActive && localProducts.find(p => p.id === storedActive)) {
            setActiveProductId(storedActive);
          } else if (localProducts.length > 0) {
            setActiveProductId(localProducts[0].id);
            localStorage.setItem('activeProductId_guest', localProducts[0].id);
          }
        } catch (e) {
          logSilentError(e as Error, { context: "parseLocalProducts" });
          setProducts([]);
          setActiveProductId(null);
        }
      } else {
        setProducts([]);
        setActiveProductId(null);
      }
      setIsLoaded(true);
      return;
    }

    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductDNA));
      
      if (fetchedProducts.length === 0) {
        // Try to migrate from local storage
        const stored = localStorage.getItem('products');
        if (stored) {
          try {
            const localProducts: ProductDNA[] = JSON.parse(stored);
            for (const p of localProducts) {
              const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              try {
                await setDoc(doc(db, 'products', newId), { ...p, id: newId, userId: user.uid });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `products/${newId}`);
              }
            }
            localStorage.removeItem('products'); // Clean up after migration
            localStorage.removeItem('activeProductId_guest');
            return; // Wait for the next snapshot
          } catch (e) {
            logSilentError(e as Error, { context: "migrateLocalProducts" });
            localStorage.removeItem('products'); // Clean up invalid data
          }
        } else {
          // Create default product
          const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          const defaultProduct: ProductDNA = { id: newId, userId: user.uid, name: 'My Product', website: '', positioning: '', audience: '', tone: '', stage: '', visualStyle: '' };
          try {
            await setDoc(doc(db, 'products', newId), defaultProduct);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `products/${newId}`);
          }
          return; // Wait for the next snapshot
        }
      }

      setProducts(fetchedProducts);
      
      const storedActive = localStorage.getItem(`activeProductId_${user.uid}`);
      if (storedActive && fetchedProducts.find(p => p.id === storedActive)) {
        setActiveProductId(storedActive);
      } else if (fetchedProducts.length > 0) {
        setActiveProductId(fetchedProducts[0].id);
        localStorage.setItem(`activeProductId_${user.uid}`, fetchedProducts[0].id);
      }
      setIsLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const addProduct = async (name: string) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newProduct: ProductDNA = { id, userId: user?.uid || 'guest', name, website: '', positioning: '', audience: '', tone: '', stage: '', visualStyle: '' };
    
    if (!user) {
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setActiveProductId(id);
      localStorage.setItem('activeProductId_guest', id);
      return;
    }

    try {
      await setDoc(doc(db, 'products', id), newProduct);
      setActiveProductId(id);
      localStorage.setItem(`activeProductId_${user.uid}`, id);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${id}`);
    }
  };

  const updateProduct = async (id: string, data: Partial<ProductDNA>) => {
    if (!user) {
      const updatedProducts = products.map(p => p.id === id ? { ...p, ...data } : p);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      return;
    }

    try {
      await updateDoc(doc(db, 'products', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      const remaining = products.filter(p => p.id !== id);
      setProducts(remaining);
      localStorage.setItem('products', JSON.stringify(remaining));
      
      // Delete associated campaigns from local storage
      const storedCampaigns = localStorage.getItem('campaigns');
      if (storedCampaigns) {
        try {
          const campaigns = JSON.parse(storedCampaigns);
          const remainingCampaigns = campaigns.filter((c: any) => c.productId !== id);
          localStorage.setItem('campaigns', JSON.stringify(remainingCampaigns));
        } catch (e) {
          logSilentError(e as Error, { context: "parseLocalCampaignsForDeletion" });
        }
      }

      if (activeProductId === id && remaining.length > 0) {
        setActiveProductId(remaining[0].id);
        localStorage.setItem('activeProductId_guest', remaining[0].id);
      } else if (remaining.length === 0) {
        setActiveProductId(null);
        localStorage.removeItem('activeProductId_guest');
      }
      return;
    }

    try {
      // Delete associated campaigns from Firestore
      const campaignsQuery = query(
        collection(db, 'campaigns'), 
        where('userId', '==', user.uid),
        where('productId', '==', id)
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const deleteCampaignsPromises = campaignsSnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deleteCampaignsPromises);

      // Delete the product
      await deleteDoc(doc(db, 'products', id));
      
      if (activeProductId === id) {
        const remaining = products.filter(p => p.id !== id);
        if (remaining.length > 0) {
          setActiveProductId(remaining[0].id);
          localStorage.setItem(`activeProductId_${user.uid}`, remaining[0].id);
        } else {
          setActiveProductId(null);
          localStorage.removeItem(`activeProductId_${user.uid}`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const activeProduct = products.find(p => p.id === activeProductId) || null;

  if (!isLoaded) return null;

  return (
    <ProductContext.Provider value={{ 
      products, 
      activeProduct, 
      setActiveProductId: (id) => { 
        setActiveProductId(id); 
        if (user) localStorage.setItem(`activeProductId_${user.uid}`, id); 
      }, 
      addProduct, 
      updateProduct, 
      deleteProduct 
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};
