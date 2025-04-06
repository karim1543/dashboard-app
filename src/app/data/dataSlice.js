import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

export const fetchData = createAsyncThunk('data/fetchData', async () => {
  const querySnapshot = await getDocs(collection(db, 'dashboardData'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    items: [],
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
        state.items = action.payload;
      });
  }
});

export default dataSlice.reducer;