import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import { Briefcase, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import api from "../../api/axiosConfig";

const PartnerApplications = ({ onApplicationsCountChange }) => {
    const [partnerApplications, setPartnerApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [currentApplication, setCurrentApplication] = useState(null);
    const [actionResult, setActionResult] = useState({ success: false, message: '' });
    
    const [rejectionReasonInput, setRejectionReasonInput] = useState('');
    const rejectionInputRef = useRef(null);

    useEffect(() => {
        fetchPartnerApplications();
    }, []);

    const fetchPartnerApplications = async () => {
        try {
            const response = await api.get('/partner-applications/admin/pending');
            setPartnerApplications(response.data);
            if (onApplicationsCountChange) {
                onApplicationsCountChange(response.data.length);
            }
        } catch (err) {
            console.error('Failed to load partner applications', err);
            setError('Failed to load partner applications');
        } finally {
            setLoading(false);
        }
    };

    const openApproveModal = (application) => {
        setCurrentApplication(application);
        setModalType('approve');
        setIsModalOpen(true);
    };

    const openRejectModal = (application) => {
        setCurrentApplication(application);
        setModalType('reject');
        setRejectionReasonInput('');
        if (rejectionInputRef.current) {
            rejectionInputRef.current.value = '';
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType('');
        setCurrentApplication(null);
        setRejectionReasonInput('');
    };

    const showResultModal = (success, message) => {
        setActionResult({ success, message });
        setModalType('result');
    };

    const handleApproveApplication = async () => {
        try {
            await api.put(`/partner-applications/admin/${currentApplication.id}/approve`, {});
            setPartnerApplications(prevApplications => 
                prevApplications.filter(app => app.id !== currentApplication.id)
            );
            if (onApplicationsCountChange) {
                onApplicationsCountChange(partnerApplications.length - 1);
            }
            closeModal();
            showResultModal(true, 'Application approved successfully');
        } catch (err) {
            console.error('Failed to approve application', err);
            closeModal();
            showResultModal(false, 'Failed to approve application');
        }
    };

    const handleRejectApplication = async () => {
        const reason = rejectionReasonInput.trim() || rejectionInputRef.current?.value?.trim() || '';
        if (!reason) return;
        
        try {
            await api.put(`/partner-applications/admin/${currentApplication.id}/reject`, null, {
                params: { rejectionReason: reason }
            });
            setPartnerApplications(prevApplications => 
                prevApplications.filter(app => app.id !== currentApplication.id)
            );
            if (onApplicationsCountChange) {
                onApplicationsCountChange(partnerApplications.length - 1);
            }
            closeModal();
            showResultModal(true, 'Application rejected successfully');
        } catch (err) {
            console.error('Failed to reject application', err);
            closeModal();
            showResultModal(false, 'Failed to reject application');
        }
    };

    const Modal = () => {
        if (!isModalOpen && modalType !== 'result') return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    {modalType === 'approve' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">Approve Application</h3>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-gray-700">
                                    Are you sure you want to approve the application from <span className="font-semibold">{currentApplication?.businessName}</span>?
                                </p>
                                <p className="text-gray-500 text-sm mt-2">
                                    This will give them partner status and create their partner account.
                                </p>
                            </div>
                            <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApproveApplication}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Approve
                                </button>
                            </div>
                        </>
                    )}

                    {modalType === 'reject' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">Reject Application</h3>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-gray-700 mb-3">
                                    You're about to reject the application from <span className="font-semibold">{currentApplication?.businessName}</span>.
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason (required)
                                </label>
                                <textarea
                                    ref={rejectionInputRef}
                                    defaultValue=""
                                    rows="3"
                                    className="shadow-sm focus:ring-amber-500 focus:border-amber-500 text-gray-700 block w-full sm:text-sm border border-gray-300 rounded-md p-2 resize-none"
                                    placeholder="Please provide a reason for rejection"
                                    autoFocus
                                ></textarea>
                                {rejectionReasonInput.trim() === '' && rejectionInputRef.current?.value?.trim() === '' && (
                                    <p className="mt-1 text-sm text-red-600">
                                        A rejection reason is required
                                    </p>
                                )}
                            </div>
                            <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectApplication}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Reject
                                </button>
                            </div>
                        </>
                    )}

                    {modalType === 'result' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    {actionResult.success ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                    )}
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {actionResult.success ? 'Success' : 'Error'}
                                    </h3>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <p className={`text-${actionResult.success ? 'green' : 'red'}-700`}>
                                    {actionResult.message}
                                </p>
                            </div>
                            <div className="px-6 py-3 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    onClick={() => setModalType('')}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'N/A';
    }
};

    return (
        <motion.div
            className="bg-white shadow rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            <Modal />
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center">
                <Briefcase className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Partner Applications
                </h3>
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                    {partnerApplications.length}
                </span>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
            ) : error ? (
                <div className="p-6 text-center text-red-500">
                    {error}
                </div>
            ) : partnerApplications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                    No pending partner applications
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {partnerApplications.map((application) => (
                                <tr key={application.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {application.businessName || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {application.businessAddress || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {application.clientName || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {application.clientEmail || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {application.contactPerson || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {application.contactPhone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(application.submissionDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openApproveModal(application)}
                                            className="text-green-600 hover:text-green-900 hover:underline mr-4 flex items-center"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(application)}
                                            className="text-red-600 hover:text-red-900 hover:underline flex items-center"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};

export default PartnerApplications;