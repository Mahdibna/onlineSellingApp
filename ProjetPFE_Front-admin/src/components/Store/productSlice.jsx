import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axiosConfig"; 

export const fetchProducts = createAsyncThunk("products/fetchProducts", async () => {
  const token = localStorage.getItem("jwt");
  if (!token) {
    throw new Error("No token found");
  }

  try {
    const response = await api.get("/Products");
    console.log("the products are ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : "Failed to fetch products");
  }
});
const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    status: "idle", 
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
        state.products = []; // Clear products on failure (optional)
      });
  },
});

export default productSlice.reducer;