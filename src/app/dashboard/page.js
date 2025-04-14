
'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchData } from '@/store/dataSlice';
import SalesChart from '@/components/charts/LineChart';
import { DataTable } from '@/components/data-table/DataTable';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { redirect } from 'next/navigation';
export default function DashboardPage() {
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); 
  const [lastDoc, setLastDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const lastDocRefs = useRef({});
  const dispatch = useDispatch();
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',  
    direction: 'desc'    
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const PAGE_SIZE = 3; 
  const { items: tableData, status, error: fetchError } = useSelector((state) => state.data);
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser; 
    setCurrentUser(user); 
  }, []);
  useEffect(() => {
    if (!currentUser)  return;
    const fetchData = async () => {
      try {
        let queryConstraints = query(
          collection(db, 'dashboardData'),
          where('userId', '==', currentUser.uid),

          orderBy(sortConfig.field, sortConfig.direction),
          limit(PAGE_SIZE))
        const collectionRef = collection(db, 'dashboardData');       
        const constraints = [
          where('userId', '==', currentUser.uid)
        ];    
        if (dateFilter.startDate) {
          constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(dateFilter.startDate))));
        }
        if (dateFilter.endDate) {
          constraints.push(where('createdAt', '<=', Timestamp.fromDate(new Date(dateFilter.endDate))));
        }       
        constraints.push(orderBy(sortConfig.field, sortConfig.direction));      
        let q = query(collectionRef, ...constraints);  
        if (currentPage > 1 && lastDocRefs.current[currentPage - 1]) {
          q = query(q, startAfter(lastDocRefs.current[currentPage - 1]));
        }
        q = query(q, limit(PAGE_SIZE));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setTableData([]);
          setHasNext(false);
          if (currentPage > 1) {
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
            orderBy(sortConfig.field, sortConfig.direction),

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
  }, [currentUser, currentPage, sortConfig, dateFilter]); 
  const handleLogin =()=>{
    redirect('/login')
  }
  const handleSort = (field) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        field,
        direction: 'desc'
      };
    });
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
  const columns = [
    {
      accessorKey: 'month',
      header: 'Month',
    },
    {
      accessorKey: 'sales',
      header: ({ column }) => (
        <button
          className="flex items-center hover:text-blue-600"
          onClick={() => handleSort('sales')}
        >
          Sales ($)
          {sortConfig.field === 'sales' && (
            <span className="ml-1">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
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
              <button
                onClick={handleLogin}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  Go to login page
              </button>
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
    <div className="p-4 md:p-6 min-h-screen">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Sales Dashboard</h1>
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
      <div className="bg-white p-4 rounded-lg shadow mb-6 overflow-x-auto">
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

      <div className="flex flex-col md:flex-row gap-4 mb-6">

      </div>
      <div className="flex-1 overflow-y-auto mb-4">

        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6 py-2">

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              onChange={(e) => setDateFilter(prev => ({
                ...prev,
                startDate: e.target.value ? new Date(e.target.value) : null
              }))}
              className="border rounded px-3 py-3 w-full"
            />
          </div>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            onChange={(e) => setDateFilter(prev => ({
              ...prev,
              endDate: e.target.value ? new Date(e.target.value) : null
            }))}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <button
          onClick={() => setDateFilter({ startDate: null, endDate: null })}
          className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 mt-auto"
        >
          Clear Filters
        </button>

        </div>
      <div className="flex flex-row justify-center items-center gap-3 py-3 bg-white sticky bottom-0 border-t">
        <button
          onClick={loadPreviousPage}
          
          disabled={!hasPrevious}
          className={`px-4 py-2 rounded-md w-full xs:w-auto ${hasPrevious
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
          className={`px-4 py-2 rounded-md w-full xs:w-auto ${hasNext
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