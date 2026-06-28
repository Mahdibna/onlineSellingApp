import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axiosConfig";
export const fetchClients = createAsyncThunk("clients/fetchClients", async () => {
  const token = localStorage.getItem("jwt");
  if (!token) {
    throw new Error("No token found");
  }

  try {
    const response = await api.get("/clients/all");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching clients:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : "Failed to fetch clients");
  }
});

const clientSlice = createSlice({
  name: "clients",
  initialState: {
    clients: [],
    status: "idle", 
    error: null,
  },
  reducers: {
    updateClient: (state, action) => {
      const updatedClient = action.payload;
      state.clients = state.clients.map((client) =>
        client.clientInfoResponse?.id === updatedClient.clientInfoResponse?.id ? updatedClient : client
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
        state.clients = []; 
      });
  },
});

export const { updateClient } = clientSlice.actions;
export default clientSlice.reducer;