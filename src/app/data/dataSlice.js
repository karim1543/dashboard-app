// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../../lib/firebase/config';

// export const fetchData = createAsyncThunk('data/fetchData', async () => {
//   const querySnapshot = await getDocs(collection(db, 'dashboardData'));
//   return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
// });

// const dataSlice = createSlice({
//   name: 'data',
//   initialState: {
//     items: [],
//     status: 'idle'
//   },
//   reducers: {},
//   extraReducers: (builder) => { 
//     builder
//       .addCase(fetchData.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(fetchData.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.items = action.payload;
//       });
//   }
// });

// export default dataSlice.reducer;
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

  // If there is a last document (for pagination), use it to start fetching from the next document
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }

  const querySnapshot = await getDocs(q);
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

  // Return only the necessary data (e.g., document ID and data)
  // const newData = querySnapshot.docs.map(doc => ({
    
  //   id: doc.id,
  //   ...doc.data(),
  //   createdAt: docData.createdAt ? docData.createdAt.toMillis() : null
  // }));
  const newData = querySnapshot.docs.map(doc => {
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData,
      // Convert Timestamp to milliseconds or ISO string
      createdAt: docData.createdAt ? docData.createdAt.toMillis() : null
    };
  });
  return {
    data: newData,
    lastDocId: lastDoc ? lastDoc.id : null, // Storing only the last document ID
  };
});

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    items: [],
    lastDocId: null, // Only store the document ID
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
        state.lastDocId = action.payload.lastDocId; // Update lastDocId, not the full snapshot
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.status = 'failed';
        console.error(action.error.message);
      });
  }
});

export default dataSlice.reducer;
