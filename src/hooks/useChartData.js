'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';
export default function useChartData() {
    const { currentUser } = useAuth();
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!currentUser) return;
  
      const fetchData = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'salesData'));

        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchData();
    }, [currentUser]);
  
    return { chartData, loading };
  }