import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSave } from 'react-icons/fa';

const Settings = () => {
    const [companyInfo, setCompanyInfo] = useState({
        company_name: '',
        address: '',
        phone_number: '',
        email: '',
        gstin: '',
        default_print_format: 'A4',
        logo_path: '',
        signature_path: '',
        bank_name: '',
        bank_account_no: '',
        ifsc_code: '',
        account_holder_name: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [signatureFile, setSignatureFile] = useState(null);

    const API_BASE_URL = 'https://rajugariventures.com/sbr-pos';

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/server/api/company_info.php`);
            setCompanyInfo(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch company info.');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyInfo(prevInfo => ({
            ...prevInfo,
            [name]: value
        }));
    };

    const handleFileChange = (e, fileType) => {
        if (fileType === 'logo') {
            setLogoFile(e.target.files[0]);
        } else if (fileType === 'signature') {
            setSignatureFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const formData = new FormData();
            for (const key in companyInfo) {
                formData.append(key, companyInfo[key]);
            }
            if (logoFile) {
                formData.append('logo_file', logoFile);
            }
            if (signatureFile) {
                formData.append('signature_file', signatureFile);
            }
            
            const response = await axios.post(`${API_BASE_URL}/server/api/company_info.php`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('Settings saved successfully!');
            fetchCompanyInfo(); // Refresh data
        } catch (err) {
            console.error(err);
            setMessage('Failed to save settings.');
        }
    };

    if (loading) return <div className="text-center p-4">Loading settings...</div>;
    if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Company Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="company_name" className="block text-gray-700">Company Name</label>
                            <input type="text" id="company_name" name="company_name" value={companyInfo.company_name} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="address" className="block text-gray-700">Address</label>
                            <input type="text" id="address" name="address" value={companyInfo.address} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone_number" className="block text-gray-700">Phone Number</label>
                            <input type="text" id="phone_number" name="phone_number" value={companyInfo.phone_number} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-gray-700">Email</label>
                            <input type="email" id="email" name="email" value={companyInfo.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="gstin" className="block text-gray-700">GSTIN</label>
                            <input type="text" id="gstin" name="gstin" value={companyInfo.gstin} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="default_print_format" className="block text-gray-700">Default Print Format</label>
                            <select id="default_print_format" name="default_print_format" value={companyInfo.default_print_format} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue">
                                <option value="A4">A4 (Detailed)</option>
                                <option value="80mm">80mm Thermal (Compact)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="logo">Company Logo</label>
                            <input
                                type="file"
                                id="logo"
                                name="logo_file"
                                onChange={(e) => handleFileChange(e, 'logo')}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            />
                            {companyInfo.logo_path && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Current Logo:</p>
                                    <img src={`${API_BASE_URL}/server/${companyInfo.logo_path}`} alt="Company Logo" className="h-16 w-auto object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="signature">Signature</label>
                            <input
                                type="file"
                                id="signature"
                                name="signature_file"
                                onChange={(e) => handleFileChange(e, 'signature')}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            />
                            {companyInfo.signature_path && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Current Signature:</p>
                                    <img src={`${API_BASE_URL}/server/${companyInfo.signature_path}`} alt="Signature" className="h-16 w-auto object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Bank Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="bank_name" className="block text-gray-700">Bank Name</label>
                            <input type="text" id="bank_name" name="bank_name" value={companyInfo.bank_name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="bank_account_no" className="block text-gray-700">Bank Account No.</label>
                            <input type="text" id="bank_account_no" name="bank_account_no" value={companyInfo.bank_account_no} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="ifsc_code" className="block text-gray-700">IFSC Code</label>
                            <input type="text" id="ifsc_code" name="ifsc_code" value={companyInfo.ifsc_code} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="account_holder_name" className="block text-gray-700">Account Holder Name</label>
                            <input type="text" id="account_holder_name" name="account_holder_name" value={companyInfo.account_holder_name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue" />
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    className="flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg font-bold hover:bg-secondary-blue transition-colors"
                >
                    <FaSave className="mr-2" /> Save Settings
                </button>
            </form>
        </div>
    );
};

export default Settings;