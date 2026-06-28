import api from "../../api/axiosConfig"; 
const BASE_URL = "/superadmin"; 

export const getAdmins = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error("No token found");

    try {
        const response = await api.get(`${BASE_URL}/admins`);
       
        if (response && response.data) {
            return response.data; 
        } else {
            throw new Error("No data received from the server.");
        }
    } catch (error) {
        console.error("Error fetching admins:", error.response ? error.response.data : error.message);
        throw error;  
    }
};

export const addAdmin = async (adminData) => {
    try {
        const response = await api.post(
            `${BASE_URL}/admins`, 
            adminData
        );
        return response.data;
    } catch (error) {
        console.error("Error adding admin:", error);
        throw error;
    }
};
export const updateAdmin = async (adminId, adminData) => {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error("No token found");

    try {
        const response = await api.put(
            `${BASE_URL}/admins/${adminId}`,
            adminData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating admin:", error);
        throw error;
    }
};
export const deleteAdmin = async (adminId) => {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error("No token found");

    try {
        const response = await api.delete(`/superadmin/admins/${adminId}`);
        if (response && response.data) {
            return response.data;
        } else {
            throw new Error("No data received from the server.");
        }
    } catch (error) {
        console.error("Error deleting admin:", error.response ? error.response.data : error.message);
        throw error;
    }
    
};


