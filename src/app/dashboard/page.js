// src/app/dashboard/page.js
'use client';
import { useState, useEffect,useRef } from 'react';
import { collection, getDocs, query, where,limit, startAfter ,orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import SalesChart from '@/components/charts/LineChart';
import { DataTable } from '@/components/data-table/DataTable';
import { getAuth ,onAuthStateChanged } from 'firebase/auth';
const columns = [
  {
    accessorKey: 'month',
    header: 'Month',
  },
  {
    accessorKey: 'sales',
    header: ({ column }) => (
      <button
        className="flex items-center"
        onClick={() => handleSort('sales')}
      >
        Sales ($)
        {sortField === 'sales' && (
          <span className="ml-1">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(row.getValue('sales'))}
      </span>
    ),
  },
  {
    accessorKey: 'users',
    header: 'Active Users',
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Recorded',
    cell: ({ row }) => (
  
    <span>
    {row.getValue('createdAt') ? new Date(row.getValue('createdAt')).toDateString() : 'N/A'}
  </span>
    ),
  }
];
export default function DashboardPage() {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // For authenticated user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [lastDoc, setLastDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const lastDocRefs = useRef({});
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  const [sortField, setSortField] = useState('sales'); // Field to sort by
  const PAGE_SIZE = 3; // Number of items per page
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    const user = auth.currentUser; // Get the currently logged-in user
    setCurrentUser(user); // Set the currentUser state
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    if (!currentUser) return; // If no user is logged in, do not proceed

    const fetchData = async () => {
      try {
        let q = query(
          collection(db, 'dashboardData'),
          where('userId', '==', currentUser.uid),
          // orderBy('createdAt', 'desc'),
          orderBy(sortField, sortDirection),
          limit(PAGE_SIZE))
        
        // If we're going to a specific page that exists in our history
        if (lastDocRefs.current[currentPage - 1]) {
          q = query(q, startAfter(lastDocRefs.current[currentPage - 1]));
        }
       

        const querySnapshot = await getDocs(q);      
        if (querySnapshot.empty) {
          setTableData([]);
          setHasNext(false);
          if (currentPage > 1) {
            // If we hit an empty page but we're not on page 1, go back
            setCurrentPage(prev => prev - 1);
          }
          return;
        }

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        lastDocRefs.current[currentPage] = lastVisible;
        const newSalesData = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt ? new Date(docData.createdAt.seconds * 1000).toDateString() : 'N/A'
          };
        });
        if (querySnapshot.docs.length === PAGE_SIZE) {
          const nextQ = query(
            collection(db, 'dashboardData'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(1))
          const nextSnapshot = await getDocs(nextQ);
          setHasNext(!nextSnapshot.empty);
        } else {
          setHasNext(false);
        }
        setHasPrevious(currentPage > 1);
        const filteredData = newSalesData.filter(item => item.month && item.sales !== undefined);
        const formattedChartData = {
          labels: filteredData.map(item => item.month),
          datasets: [{
            label: 'Monthly Sales ($)',
            data: filteredData.map(item => item.sales),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4
          }]
        };
        console.log('Formatted Chart Data:', formattedChartData);
        setChartData(formattedChartData);
        setTableData(filteredData);    
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  },  [currentUser, currentPage, sortField, sortDirection]); // Dependency on currentUser ensures fetch happens when the user is logged in
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
    lastDocRefs.current = {};
  };
  const loadNextPage = () => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const loadPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    
      setLastDoc(null);
    }
  };
  
  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You must be logged in to view the dashboard.
              </p>
            </div>
          </div>
        </div>
       
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading dashboard data...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">    
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
    );
  }
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome, {currentUser.email}
        </div>
      </div>     
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Monthly Sales Trend</h2>
        {chartData ? (
          <SalesChart data={chartData} />
        ) : (
          <p className="text-gray-500 py-8 text-center">No sales data available</p>
        )}
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Sales Records</h2>
        {tableData.length > 0 ? (
          <DataTable 
            columns={columns} 
            data={tableData}
            className="border rounded-lg overflow-hidden"
          />
        ) : (
          <p className="text-gray-500 py-8 text-center">No records found</p>
        )}
      </div>
      <div className="flex justify-center items-center mt-4 space-x-4">
        <button 
          onClick={loadPreviousPage} 
          
          disabled={!hasPrevious}
          className={`px-4 py-2 rounded-md ${
            hasPrevious 
              ? 'bg-blue-500 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {currentPage}</span>
        <button 
          onClick={loadNextPage} 
          disabled={!hasNext}
          className={`px-4 py-2 rounded-md ${
            hasNext 
              ? 'bg-blue-500 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}