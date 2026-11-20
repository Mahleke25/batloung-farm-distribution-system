import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Modal from '../components/Modal';
import './Vendors.css';

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return year + '-' + month + '-' + day;
}

const emptyForm = {
    VendorName: '',
    PhoneNumber: '',
    Location: '',
    RegistrationDate: getToday()
};

function Vendors() {

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    async function loadVendors() {

        try {
            setLoading(true);
            setError('');

            const result = await apiRequest('/vendors', 'GET');

            setVendors(result.data || []);

        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    useEffect(function() {
        loadVendors();
    }, []);

    function openAddModal() {

        setEditingVendor(null);

        setFormData({
            ...emptyForm,
            RegistrationDate: getToday()
        });

        setFormError('');
        setShowModal(true);
    }

    function openEditModal(vendor) {

        setEditingVendor(vendor);

        setFormData({
            VendorName: vendor.VendorName || '',
            PhoneNumber: vendor.PhoneNumber || '',
            Location: vendor.Location || '',
            RegistrationDate: vendor.RegistrationDate
                ? String(vendor.RegistrationDate).slice(0, 10)
                : getToday()
        });

        setFormError('');
        setShowModal(true);
    }

    function closeModal() {

        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingVendor(null);
        setFormData({ ...emptyForm });
        setFormError('');
    }

    function handleChange(event) {

        const { name, value } = event.target;

        setFormData(function(previousData) {
            return {
                ...previousData,
                [name]: value
            };
        });
    }

    async function handleSubmit(event) {

        event.preventDefault();

        if (
            !formData.VendorName.trim() ||
            !formData.PhoneNumber.trim() ||
            !formData.Location.trim() ||
            !formData.RegistrationDate
        ) {
            setFormError('Please complete all required fields.');
            return;
        }

        try {

            setSaving(true);
            setFormError('');
            setSuccess('');

            if (editingVendor) {

                await apiRequest(
                    '/vendors/' + editingVendor.VendorID,
                    'PUT',
                    formData
                );

                setSuccess('Vendor updated successfully.');

            } else {

                await apiRequest(
                    '/vendors',
                    'POST',
                    formData
                );

                setSuccess('Vendor registered successfully.');
            }

            setShowModal(false);
            setEditingVendor(null);

            await loadVendors();

        } catch (error) {

            setFormError(error.message);

        } finally {

            setSaving(false);
        }
    }

    async function deleteVendor(vendor) {

        const confirmed = window.confirm(
            'Are you sure you want to delete ' +
            vendor.VendorName + '?'
        );

        if (!confirmed) {
            return;
        }

        try {

            setError('');
            setSuccess('');

            await apiRequest(
                '/vendors/' + vendor.VendorID,
                'DELETE'
            );

            setSuccess('Vendor deleted successfully.');

            await loadVendors();

        } catch (error) {

            setError(error.message);
        }
    }

const filteredVendors = vendors.filter(function(vendor) {
    const search = searchTerm.toLowerCase();
    const phoneSearch = searchTerm.replace(/\s/g, '').toLowerCase();

    const vendorName = (vendor.VendorName || '').toLowerCase();
    const vendorPhone = (vendor.PhoneNumber || '')
        .replace(/\s/g, '')
        .toLowerCase();
    const vendorLocation = (vendor.Location || '').toLowerCase();

    return (
        vendorName.includes(search) ||
        vendorPhone.includes(phoneSearch) ||
        vendorLocation.includes(search)
    );
});

    function formatDate(date) {

        if (!date) {
            return '-';
        }

        const dateString = String(date).slice(0, 10);
        const parts = dateString.split('-');

        if (parts.length !== 3) {
            return dateString;
        }

        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    const uniqueLocations = new Set(
        vendors.map(function(vendor) {
            return vendor.Location;
        })
    );

    return (

        <div className="vendors-page">

            <div className="vendors-header">

                <div>
                    <h1>Vendors</h1>

                    <p>
                        Manage retailers and businesses purchasing
                        from Batloung Farm.
                    </p>
                </div>

                <button
                    type="button"
                    className="vendor-primary-button"
                    onClick={openAddModal}
                >
                    + Register Vendor
                </button>

            </div>


            {success && (
                <div className="vendor-success">
                    {success}
                </div>
            )}

            {error && (
                <div className="vendor-error">
                    {error}
                </div>
            )}


            <div className="vendor-summary">

                <div className="vendor-summary-card">
                    <span>Registered Vendors</span>
                    <strong>{vendors.length}</strong>
                </div>

                <div className="vendor-summary-card">
                    <span>Recorded Locations</span>
                    <strong>{uniqueLocations.size}</strong>
                </div>

            </div>


            <div className="vendor-table-section">

                <div className="vendor-table-heading">

                    <div>
                        <h2>Vendor Records</h2>

                        <p>
                            View and manage registered business customers.
                        </p>
                    </div>

                    <input
                        type="text"
                        className="vendor-search"
                        placeholder="Search name, phone or location..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                    />

                </div>


                {loading ? (

                    <p className="vendor-message">
                        Loading vendors...
                    </p>

                ) : filteredVendors.length === 0 ? (

                    <p className="vendor-message">
                        No vendor records found.
                    </p>

                ) : (

                    <div className="vendor-table-wrapper">

                        <table className="vendor-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Vendor Name</th>
                                    <th>Phone Number</th>
                                    <th>Location</th>
                                    <th>Registration Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredVendors.map(function(vendor) {

                                    return (

                                        <tr key={vendor.VendorID}>

                                            <td>
                                                {vendor.VendorID}
                                            </td>

                                            <td className="vendor-name">
                                                {vendor.VendorName}
                                            </td>

                                            <td>
                                                {vendor.PhoneNumber}
                                            </td>

                                            <td>
                                                {vendor.Location}
                                            </td>

                                            <td>
                                                {formatDate(vendor.RegistrationDate)}
                                            </td>

                                            <td>

                                                <div className="vendor-actions">

                                                    <button
                                                        type="button"
                                                        className="vendor-edit-button"
                                                        onClick={function() {
                                                            openEditModal(vendor);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="vendor-delete-button"
                                                        onClick={function() {
                                                            deleteVendor(vendor);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {showModal && (

                <Modal
                    title={
                        editingVendor
                            ? 'Edit Vendor'
                            : 'Register New Vendor'
                    }
                    onClose={closeModal}
                >

                    <form onSubmit={handleSubmit}>

                        {formError && (
                            <div className="vendor-error">
                                {formError}
                            </div>
                        )}


                        <div className="vendor-form-group">

                            <label>Vendor / Business Name *</label>

                            <input
                                type="text"
                                name="VendorName"
                                value={formData.VendorName}
                                onChange={handleChange}
                                placeholder="Enter business name"
                                required
                            />

                        </div>


                        <div className="vendor-form-group">

                            <label>Phone Number *</label>

                            <input
                                type="tel"
                                name="PhoneNumber"
                                value={formData.PhoneNumber}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                required
                            />

                        </div>


                        <div className="vendor-form-group">

                            <label>Business Location *</label>

                            <input
                                type="text"
                                name="Location"
                                value={formData.Location}
                                onChange={handleChange}
                                placeholder="Enter business location"
                                required
                            />

                        </div>


                        <div className="vendor-form-group">

                            <label>Registration Date *</label>

                            <input
                                type="date"
                                name="RegistrationDate"
                                value={formData.RegistrationDate}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        <div className="vendor-form-actions">

                            <button
                                type="button"
                                className="vendor-cancel-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="vendor-primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingVendor
                                        ? 'Update Vendor'
                                        : 'Register Vendor'
                                }
                            </button>

                        </div>

                    </form>

                </Modal>

            )}

        </div>
    );
}

export default Vendors;