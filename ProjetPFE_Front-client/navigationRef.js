// navigationRef.js
import { createRef } from 'react';

// Create a reference to the navigation object
export const navigationRef = createRef();

// Helper function to navigate outside of React components
export function navigate(name, params) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    // If navigation isn't available yet, store the navigation action for later
    // This could happen if trying to redirect before navigation is initialized
    pendingNavigation = { name, params };
  }
}

// Variable to store pending navigation if attempted before navigation is ready
let pendingNavigation = null;

// Function to execute any pending navigation
export function executePendingNavigation() {
  if (pendingNavigation && navigationRef.current) {
    const { name, params } = pendingNavigation;
    navigationRef.current.navigate(name, params);
    pendingNavigation = null;
  }
}