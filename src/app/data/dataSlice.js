
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

export const fetchData = createAsyncThunk('data/fetchData', async ({ userId, sortField, sortDirection, pageSize, startAfterDoc }) => {
  let q = query(
    collection(db, 'dashboardData'),
    where('userId', '==', userId),
    orderBy(sortField, sortDirection),
    limit(pageSize)
  );


  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  const querySnapshot = await getDocs(q);
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];


  const newData = querySnapshot.docs.map(doc => {
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData,
    
      createdAt: docData.createdAt ? docData.createdAt.toMillis() : null
    };
  });
  return {
    data: newData,
    lastDocId: lastDoc ? lastDoc.id : null, 
  };
});

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    items: [],
    lastDocId: null, 
    status: 'idle'
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.lastDocId = action.payload.lastDocId; 
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.status = 'failed';
        console.error(action.error.message);
      });
  }
});

export default dataSlice.reducer;
