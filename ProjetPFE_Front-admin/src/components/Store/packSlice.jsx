import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { createAction } from '@reduxjs/toolkit';
import api from "../../api/axiosConfig"; 

export const fetchPacks = createAsyncThunk('packs/fetchAll', async () => {
  const token = localStorage.getItem("jwt");
  const { data } = await api.get('/packs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("the packs are " , data);
  return data;
});
export const optimisticDisponibilityUpdate = createAction("packs/optimisticDisponibilityUpdate");

export const createPack = createAsyncThunk('packs/create', async (formData) => {
  try {
    const response = await api.post('/packs', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
});
export const getPackById = createAsyncThunk('packs/getById', async (id) => {
  const { data } = await api.get(`/packs/${id}`);
  return data;
});
export const updatePack = createAsyncThunk('packs/update', async ({ id, formData }) => {
    try {
      const response = await api.put(`/packs/${id}`, formData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: error.message };
      console.error("Update error details:", errorData);
      throw errorData;
    }
  });
export const deletePack = createAsyncThunk('packs/delete', async (id) => {
  await api.delete(`/packs/${id}`);
  return id;
});
export const updatePackDisponibility = createAsyncThunk(
  "packs/updateDisponibility",
  async ({ id, disponibility }, { rejectWithValue }) => {  
    try {
      const response = await api.patch(
        `/packs/${id}/disponibility?disponibility=${disponibility}`
      );
      console.log("the disponibility is : " , response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
const packsSlice = createSlice({
  name: 'packs',
  initialState: { 
    items: [], 
    currentPack: null,
    status: 'idle', 
    error: null 
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPacks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPacks.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.items = payload;
      })
      .addCase(fetchPacks.rejected, (state, { error }) => {
        state.status = 'failed';
        state.error = error.message;
      })
      .addCase(getPackById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getPackById.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.currentPack = payload;
      })
      .addCase(getPackById.rejected, (state, { error }) => {
        state.status = 'failed';
        state.error = error.message;
      })
      .addCase(createPack.fulfilled, (state, { payload }) => {
        state.items.push(payload);
      })
      .addCase(updatePack.fulfilled, (state, { payload }) => {
        const index = state.items.findIndex(p => p.id === payload.id);
        if (index >= 0) state.items[index] = payload;
        state.currentPack = payload;
      })
      .addCase(deletePack.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(p => p.id !== payload);
        if (state.currentPack?.id === payload) {
          state.currentPack = null;
        }
      }) .addCase(optimisticDisponibilityUpdate, (state, { payload }) => {
        const index = state.items.findIndex((p) => p.id === payload.id);
        if (index !== -1) {
          state.items[index].disponibility = payload.disponibility;
        }
      }).addCase(updatePackDisponibility.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export default packsSlice.reducer;