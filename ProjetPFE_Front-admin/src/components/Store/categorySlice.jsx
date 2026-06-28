import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "../../api/axiosConfig"; 


export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      return rejectWithValue("No token found");
    }
    try {
      const response = await api.get("/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("The categories are:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error.response ? error.response.data : error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
    }
  }
);
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (formData, { rejectWithValue }) => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      return rejectWithValue("No token found");
    }
    try {
      const response = await api.post("/categories", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating category:", error.response ? error.response.data : error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to create category.");
    }
  }
);
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, payload }, { rejectWithValue }) => {


    try {
      const response = await api.put(`/categories/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating category:", error.response ? error.response.data : error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to update category.");
    }
  }
);
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async ({ id, deleteSubCategories }, { rejectWithValue, dispatch }) => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      return rejectWithValue("No token found");
    }
    
    try {
      console.log(`Attempting to delete category ${id} with deleteSubCategories=${deleteSubCategories}`);
            const response = await axios.delete(
        `http://localhost:8080/api/categories/${id}?deleteSubCategories=${deleteSubCategories}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Delete response:", response.status, response.data);
      
      setTimeout(() => {
        dispatch(fetchCategories());
      }, 500);
      
      return id;
    } catch (error) {
      console.error("Delete category error:", error);
      
      if (error.response) {
    
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        return rejectWithValue(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        return rejectWithValue("No response received from server");
      } else {
        console.error("Error message:", error.message);
        return rejectWithValue(error.message || "An unknown error occurred");
      }
    }
  }
);

const categorySlice = createSlice({
  name: "categories",
  initialState: {
    categories: [],
    status: "idle", 
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories.push(action.payload); 
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(updateCategory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCategory = action.payload;
        const index = state.categories.findIndex((cat) => cat.id === updatedCategory.id);
        if (index !== -1) {
          state.categories[index] = updatedCategory; 
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.categories = state.categories.filter(
          category => category.id !== action.payload
        );
        state.status = "idle"; 
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      });
      
  },
});

export default categorySlice.reducer;