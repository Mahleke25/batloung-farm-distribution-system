import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Modal from '../components/Modal';
import './Suppliers.css';

function Suppliers() {

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const [saving, setSaving] = useState(false);

    const emptyForm = {
        BusinessName: '',
        ContactPerson: '',
        Phone: '',
        Province: '',
        Address: ''
    };

    const [formData, setFormData] = useState(emptyForm);

    const provinces = [
        'Gauteng',
        'Free State',
        'KwaZulu-Natal',
        'Western Cape',
        'Eastern Cape',
        'Limpopo',
        'Mpumalanga',
        'North West'
    ];

    // LOAD SUPPLIERS
    async function loadSuppliers() {
        try {
            setLoading(true);
            setError('');

            const result = await apiRequest('/suppliers', 'GET');

            setSuppliers(result.data || []);

        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    useEffect(function() {
        loadSuppliers();
    }, []);

    // FORM INPUT HANDLING
    function handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setFormData(function(previousData) {
            return {
                ...previousData,
                [name]: value
            };
        });
    }

    // OPEN ADD MODAL
    function openAddModal() {
        setEditingSupplier(null);
        setFormData(emptyForm);
        setError('');
        setSuccess('');
        setShowModal(true);
    }

    // OPEN EDIT MODAL
    function openEditModal(supplier) {
        setEditingSupplier(supplier);

        setFormData({
            BusinessName: supplier.BusinessName || '',
            ContactPerson: supplier.ContactPerson || '',
            Phone: supplier.Phone || '',
            Province: supplier.Province || '',
            Address: supplier.Address || ''
        });

        setError('');
        setSuccess('');
        setShowModal(true);
    }

    // CLOSE MODAL
    function closeModal() {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingSupplier(null);
        setFormData(emptyForm);
        setError('');
    }

    // SAVE SUPPLIER
    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (
            !formData.BusinessName.trim() ||
            !formData.ContactPerson.trim() ||
            !formData.Phone.trim() ||
            !formData.Province ||
            !formData.Address.trim()
        ) {
            setError('Please complete all supplier fields.');
            return;
        }

        try {
            setSaving(true);

            if (editingSupplier) {

                await apiRequest(
                    '/suppliers/' + editingSupplier.SupplierID,
                    'PUT',
                    formData
                );

                setSuccess('Supplier updated successfully.');

            } else {

                await apiRequest(
                    '/suppliers',
                    'POST',
                    formData
                );

                setSuccess('Supplier registered successfully.');
            }

            await loadSuppliers();

            setShowModal(false);
            setEditingSupplier(null);
            setFormData(emptyForm);

        } catch (error) {
            setError(error.message);

        } finally {
            setSaving(false);
        }
    }

    // DELETE SUPPLIER
    async function handleDelete(supplier) {

        const confirmed = window.confirm(
            'Are you sure you want to delete ' +
            supplier.BusinessName +
            '?'
        );

        if (!confirmed) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await apiRequest(
                '/suppliers/' + supplier.SupplierID,
                'DELETE'
            );

            setSuccess('Supplier deleted successfully.');

            await loadSuppliers();

        } catch (error) {
            setError(error.message);
        }
    }

    // SEARCH SUPPLIERS
    const filteredSuppliers = suppliers.filter(function(supplier) {

        const search = searchTerm.toLowerCase();

        return (
            supplier.BusinessName.toLowerCase().includes(search) ||
            supplier.ContactPerson.toLowerCase().includes(search) ||
            supplier.Phone.toLowerCase().includes(search) ||
            supplier.Province.toLowerCase().includes(search) ||
            supplier.Address.toLowerCase().includes(search)
        );
    });

    return (
        <div className="suppliers-page">

            {/* PAGE HEADER */}
            <div className="suppliers-heading">

                <div>
                    <h2>Supplier Management</h2>

                    <p>
                        Register and manage fruit suppliers
                        across South African provinces.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={openAddModal}
                >
                    + Add Supplier
                </button>

            </div>


            {/* NOTIFICATIONS */}
            {success && (
                <div className="success-alert">
                    {success}
                    <button onClick={function() {
                        setSuccess('');
                    }}>
                        ×
                    </button>
                </div>
            )}

            {error && !showModal && (
                <div className="error-alert">
                    {error}
                    <button onClick={function() {
                        setError('');
                    }}>
                        ×
                    </button>
                </div>
            )}


            {/* SUPPLIER SUMMARY */}
            <div className="supplier-summary">

                <div className="summary-box">
                    <span>Total Registered Suppliers</span>
                    <h2>{suppliers.length}</h2>
                </div>

                <div className="summary-box">
                    <span>Provinces Represented</span>

                    <h2>
                        {new Set(
                            suppliers.map(function(supplier) {
                                return supplier.Province;
                            })
                        ).size}
                    </h2>
                </div>

            </div>


            {/* SUPPLIER TABLE */}
            <div className="suppliers-card">

                <div className="suppliers-toolbar">

                    <div>
                        <h3>Registered Suppliers</h3>

                        <p>
                            Supplier records stored in the database.
                        </p>
                    </div>

                    <input
                        type="text"
                        className="supplier-search"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                    />

                </div>


                {loading ? (

                    <div className="supplier-message">
                        Loading suppliers...
                    </div>

                ) : error && suppliers.length === 0 ? (

                    <div className="supplier-message error-text">
                        {error}

                        <button
                            className="primary-button"
                            onClick={loadSuppliers}
                        >
                            Try Again
                        </button>
                    </div>

                ) : (

                    <div className="table-container">

                        <table className="suppliers-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Business Name</th>
                                    <th>Contact Person</th>
                                    <th>Phone</th>
                                    <th>Province</th>
                                    <th>Address</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredSuppliers.length === 0 ? (

                                    <tr>
                                        <td colSpan="7" className="empty-table">
                                            No matching suppliers found.
                                        </td>
                                    </tr>

                                ) : (

                                    filteredSuppliers.map(function(supplier) {

                                        return (
                                            <tr key={supplier.SupplierID}>

                                                <td>
                                                    #{supplier.SupplierID}
                                                </td>

                                                <td className="business-name">
                                                    {supplier.BusinessName}
                                                </td>

                                                <td>
                                                    {supplier.ContactPerson}
                                                </td>

                                                <td>
                                                    {supplier.Phone}
                                                </td>

                                                <td>
                                                    <span className="province-badge">
                                                        {supplier.Province}
                                                    </span>
                                                </td>

                                                <td>
                                                    {supplier.Address}
                                                </td>

                                                <td>
                                                    <div className="action-buttons">

                                                        <button
                                                            className="edit-button"
                                                            onClick={function() {
                                                                openEditModal(supplier);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="delete-button"
                                                            onClick={function() {
                                                                handleDelete(supplier);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* ADD / EDIT MODAL */}
            {showModal && (

                <Modal
                    title={
                        editingSupplier
                            ? 'Edit Supplier'
                            : 'Register New Supplier'
                    }
                    onClose={closeModal}
                    size="large"
                >

                    <form onSubmit={handleSubmit}>

                        <div className="form-grid">

                            <div className="form-group">
                                <label>Business Name *</label>

                                <input
                                    type="text"
                                    name="BusinessName"
                                    value={formData.BusinessName}
                                    onChange={handleChange}
                                    placeholder="Enter business name"
                                    maxLength="150"
                                    required
                                />
                            </div>


                            <div className="form-group">
                                <label>Contact Person *</label>

                                <input
                                    type="text"
                                    name="ContactPerson"
                                    value={formData.ContactPerson}
                                    onChange={handleChange}
                                    placeholder="Enter contact person"
                                    maxLength="100"
                                    required
                                />
                            </div>


                            <div className="form-group">
                                <label>Phone Number *</label>

                                <input
                                    type="tel"
                                    name="Phone"
                                    value={formData.Phone}
                                    onChange={handleChange}
                                    placeholder="e.g. +27 11 555 0101"
                                    maxLength="20"
                                    required
                                />
                            </div>


                            <div className="form-group">
                                <label>Province *</label>

                                <select
                                    name="Province"
                                    value={formData.Province}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select province
                                    </option>

                                    {provinces.map(function(province) {
                                        return (
                                            <option
                                                key={province}
                                                value={province}
                                            >
                                                {province}
                                            </option>
                                        );
                                    })}

                                </select>
                            </div>


                            <div className="form-group full-width">
                                <label>Business Address *</label>

                                <textarea
                                    name="Address"
                                    value={formData.Address}
                                    onChange={handleChange}
                                    placeholder="Enter business address"
                                    maxLength="255"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>

                        </div>


                        {error && (
                            <div className="form-error">
                                {error}
                            </div>
                        )}


                        <div className="modal-actions">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingSupplier
                                        ? 'Update Supplier'
                                        : 'Register Supplier'
                                }
                            </button>

                        </div>

                    </form>

                </Modal>

            )}

        </div>
    );
}

export default Suppliers;