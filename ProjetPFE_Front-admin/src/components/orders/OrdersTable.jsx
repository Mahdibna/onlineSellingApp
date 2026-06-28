import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Eye, X, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig"; // Use the configured Axios instance

// Define all possible status options
const allStatusOptions = [
  { label: 'Processing', value: 'EnCoursDeTraitement' },
  { label: 'Paid and Processing', value: 'PayeEtEnCoursDeTraitement' },
  { label: 'In Transit', value: 'EnTransit' },
  { label: 'Out For Delivery', value: 'EnCoursDeLivraison' },
  { label: 'Delivered', value: 'Livree' },
  { label: 'Delivered and Paid', value: 'LivreeEtPaye' },
  { label: 'Cancelled', value: 'Annulee' },
  { label: 'Return in Progress', value: 'EnRetour' }
];

// Define status options based on payment type
const getStatusOptions = (paymentType) => {
  if (paymentType === 'EnLigne') {
    return allStatusOptions.filter(option => 
      ['PayeEtEnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison', 'Livree', 'Annulee', 'EnRetour'].includes(option.value)
    );
  } else if (paymentType === 'Livraison') {
    return allStatusOptions.filter(option => 
      ['EnCoursDeTraitement', 'EnTransit', 'EnCoursDeLivraison', 'LivreeEtPaye', 'Annulee', 'EnRetour'].includes(option.value)
    );
  }
  return allStatusOptions;
};

const paymentTypeOptions = {
  EnLigne: 'Online',
  Livraison: 'On Delivery'
};

const OrdersTable = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [confirmationData, setConfirmationData] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {                
                // Fetch orders
                const ordersResponse = await api.get(
                    "/commandes/orders/all"
                );
                console.log(" the order data is :" , ordersResponse);
                // Fetch stats
                const statsResponse = await api.get(
                    "/commandes/orders/stats"
                );

                const sortedOrders = ordersResponse.data.sort((a, b) => 
                    new Date(b.date || b.orderDate) - new Date(a.date || a.orderDate)
                );
                
                setOrders(sortedOrders);
                setFilteredOrders(sortedOrders.slice(0, 10));
                setStats(statsResponse.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const applyFilters = () => {
        let result = [...orders];
        
        if (statusFilter !== 'all') {
            result = result.filter(order => order.status === statusFilter);
        }
        
        if (paymentFilter !== 'all') {
            result = result.filter(order => order.paymentType === paymentFilter);
        }
        
        if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            
            result = result.filter(order => {
                const orderDate = new Date(order.date || order.orderDate);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(order => 
                order.orderId.toString().includes(term) || 
                (order.client?.name || order.customer)?.toLowerCase().includes(term)
            );
        }
        
        setFilteredOrders(result.slice(0, 10));
    };

    useEffect(() => {
        applyFilters();
    }, [statusFilter, paymentFilter, dateRange, searchTerm, orders]);

    const handleStatusChange = async (orderId, newStatus) => {
        setConfirmationData({ orderId, newStatus });
    };

    const confirmStatusChange = async (confirmed) => {
        if (confirmed) {
            try {
                await api.put(
                    `/commandes/${confirmationData.orderId}/status`,
                    { newStatus: confirmationData.newStatus }
                );
                
                setOrders(prev => prev.map(order => 
                    order.orderId === confirmationData.orderId 
                        ? { ...order, status: confirmationData.newStatus } 
                        : order
                ));
                
                if (stats) {
                    const statsResponse = await api.get(
                        "/commandes/orders/stats"
                    );
                    setStats(statsResponse.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            }
        }
        setConfirmationData(null);
    };

    const fetchOrderDetails = async (orderId) => {
        setDetailsLoading(true);
        try {
            const response = await api.get(
                `/commandes/${orderId}/details`
            );
            setOrderDetails(response.data);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleViewDetails = async (orderId) => {
        setSelectedOrder(orderId);
        await fetchOrderDetails(orderId);
    };

    const resetFilters = () => {
        setStatusFilter('all');
        setPaymentFilter('all');
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Livree':
            case 'LivreeEtPaye':
                return 'bg-green-100 text-green-800';
            case 'Annulee':
            case 'EnRetour':
                return 'bg-red-100 text-red-800';
            case 'PayeEtEnCoursDeTraitement':
            case 'EnCoursDeTraitement':
                return 'bg-yellow-100 text-yellow-800';
            case 'EnTransit':
            case 'EnCoursDeLivraison':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="text-center py-8">Loading orders...</div>;
    if (error) return <div className="text-red-600 text-center py-8">Error: {error}</div>;

    return (
        <>
            {/* Confirmation Modal */}
            {confirmationData && (
                <motion.div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="p-5 md:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
                                </div>
                                <button 
                                    onClick={() => setConfirmationData(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-gray-600 mb-4 text-sm">
                                Are you sure you want to change order <span className="font-medium">#{confirmationData.orderId}</span> status to {" "}
                                <span className="font-medium">
                                    {allStatusOptions.find(option => option.value === confirmationData.newStatus)?.label || confirmationData.newStatus}
                                </span>?
                            </p>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => confirmStatusChange(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => confirmStatusChange(true)}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <motion.div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-gray-100 max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="p-5 md:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Order #{orderDetails?.orderId}
                                    <span className="ml-2 text-lg text-gray-600">({orderDetails?.orderType})</span>
                                </h2>
                                <button 
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {detailsLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-6">
                                        {/* Client Information */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">CLIENT INFORMATION</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Name</p>
                                                    <p className="text-gray-900">{orderDetails?.client?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Email</p>
                                                    <p className="text-gray-900">{orderDetails?.client?.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Phone</p>
                                                    <p className="text-gray-900">{orderDetails?.client?.tel}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Address */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">DELIVERY ADDRESS</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Street</p>
                                                    <p className="text-gray-900">{orderDetails?.deliveryAddress?.street}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Number</p>
                                                    <p className="text-gray-900">{orderDetails?.deliveryAddress?.number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">City</p>
                                                    <p className="text-gray-900">{orderDetails?.deliveryAddress?.city}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Country</p>
                                                    <p className="text-gray-900">{orderDetails?.deliveryAddress?.country}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-4">ORDER ITEMS</h3>
                                            {orderDetails?.items?.length > 0 ? (
                                                <div className="space-y-4">
                                                    {orderDetails.items.map((item, index) => (
                                                        <div key={index} className="border-b pb-4 last:border-b-0">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium text-gray-900">
                                                                            {item.name}
                                                                        </span>
                                                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                                                                            {item.itemType}
                                                                        </span>
                                                                        <span className="text-sm text-gray-600 ml-auto">
                                                                            Qty: {item.quantity}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {item.itemType === 'pack' && item.packContents && (
                                                                        <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200">
                                                                            <p className="text-sm font-medium text-gray-700 mb-1">Contains:</p>
                                                                            {item.packContents.length > 0 ? (
                                                                                <ul className="list-disc pl-5 space-y-1">
                                                                                    {item.packContents.map((product, idx) => (
                                                                                        <li key={idx} className="text-sm text-gray-600">
                                                                                            {product}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                <p className="text-sm text-gray-500">No products in this pack</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No items in this order</p>
                                            )}
                                        </div>

                                        {/* Order Summary */}
                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm">
                                                    <p className="text-gray-600">
                                                        Order Date: {orderDetails?.orderDate ? new Date(orderDetails.orderDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        Status: <span className={`font-medium px-2 py-1 rounded-md ${getStatusBadgeClass(orderDetails?.status)}`}>
                                                            {allStatusOptions.find(option => option.value === orderDetails?.status)?.label || orderDetails?.status}
                                                        </span>
                                                    </p>
                                                    <p className="text-gray-600">
                                                        Payment: <span className="font-medium">
                                                            {paymentTypeOptions[orderDetails?.paymentType] || orderDetails?.paymentType}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        Total: {orderDetails?.total ? orderDetails.total.toFixed(2) : '0.00'} TND
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}

           

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="w-full sm:w-72 relative">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md whitespace-nowrap flex items-center gap-2"
                        >
                            Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button 
                            onClick={() => navigate("/allorders")}
                            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md whitespace-nowrap"
                        >
                            Show All Orders
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                {showFilters && (
                    <div className="px-4 md:px-6 pb-4 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    {allStatusOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                                <select
                                    className="w-full border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm"
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                >
                                    <option value="all">All Payment Types</option>
                                    <option value="EnLigne">Online</option>
                                    <option value="Livraison">On Delivery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm flex-1"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                    />
                                    <span className="flex items-center">to</span>
                                    <input
                                        type="date"
                                        className="border border-gray-300  text-gray-700 rounded-md px-3 py-2 text-sm flex-1"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <motion.tr
                                        key={order.orderId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900">#{order.orderId}</td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900 capitalize">
                                            {order.orderType?.toLowerCase() || 'N/A'}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                                            {order.client?.name || order.customer || 'N/A'}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                                            {order.total?.toFixed(2) || '0.00'} TND
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <select
                                                className={`text-sm text-gray-900 bg-white border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 ${getStatusBadgeClass(order.status)}`}
                                                value={order.status || ''}
                                                onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                            >
                                                {getStatusOptions(order.paymentType).map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                                            {paymentTypeOptions[order.paymentType] || order.paymentType}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-sm text-gray-500">
                                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 
                                             order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <button
                                                onClick={() => handleViewDetails(order.orderId)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-4 md:px-6 py-4 text-sm text-center text-gray-500">
                                        No orders found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default OrdersTable;