import { configureStore } from "@reduxjs/toolkit";
import clientReducer from "./clientSlice";
import productReducer from "./productSlice";
import categoryReducer from "./categorySlice";
import packReducer from "./packSlice";

const store = configureStore({
  reducer: {
    clients: clientReducer,
    products: productReducer,
    categories: categoryReducer,
    packs: packReducer,
  },
});

export default store;