import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import './Purchases.css';

function Purchases() {

    const [purchases, setPurchases] = useState([]);
    const [purchaseDetails, setPurchaseDetails] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [fruits, setFruits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);

    const [formData, setFormData] = useState({
        SupplierID: '',
        PurchaseDate: new Date().toLocaleDateString('en-CA'),
        Items: [
            {
                FruitID: '',
                PackagingSize: 'SMALL',
                Quantity: '',
                UnitCost: ''
            }
        ]
    });


    // LOAD PURCHASE INFORMATION
    async function loadPurchases() {

        try {
            setLoading(true);
            setError('');

            const results = await Promise.all([
                apiRequest('/purchases', 'GET'),
                apiRequest('/purchase-details', 'GET'),
                apiRequest('/suppliers', 'GET'),
                apiRequest('/fruits', 'GET')
            ]);

            setPurchases(results[0].data || []);
            setPurchaseDetails(results[1].data || []);
            setSuppliers(results[2].data || []);
            setFruits(results[3].data || []);

        } catch (error) {
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }


    useEffect(function() {
        loadPurchases();
    }, []);


    // FORMAT CURRENCY
    function formatMoney(amount) {

        return 'M ' + Number(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    // FORMAT DATE
    function formatDate(date) {

        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleDateString('en-GB');
    }


    // SEARCH PURCHASES
    const filteredPurchases = purchases.filter(function(purchase) {

        const search = searchTerm.toLowerCase();

        return (
            String(purchase.PurchasesID).includes(search) ||
            (purchase.BusinessName || '').toLowerCase().includes(search) ||
            formatDate(purchase.PurchaseDate).includes(search)
        );
    });


    // VIEW PURCHASE DETAILS
    function viewPurchase(purchase) {

        const details = purchaseDetails.filter(function(item) {

            return Number(item.PurchaseID) ===
                Number(purchase.PurchasesID);

        });

        setSelectedPurchase({
            purchase: purchase,
            details: details
        });
    }


    // OPEN PURCHASE FORM
    function openPurchaseForm() {

        setFormData({
            SupplierID: '',
            PurchaseDate: new Date().toLocaleDateString('en-CA'),
            Items: [
                {
                    FruitID: '',
                    PackagingSize: 'SMALL',
                    Quantity: '',
                    UnitCost: ''
                }
            ]
        });

        setFormError('');
        setSuccessMessage('');
        setShowPurchaseForm(true);
    }


    // UPDATE PURCHASE INFORMATION
    function handleFormChange(event) {

        const name = event.target.name;
        const value = event.target.value;

        setFormData(function(previousData) {

            return {
                ...previousData,
                [name]: value
            };

        });
    }


    // UPDATE A PURCHASE ITEM
    function handleItemChange(index, event) {

        const name = event.target.name;
        const value = event.target.value;

        setFormData(function(previousData) {

            const updatedItems = [...previousData.Items];

            updatedItems[index] = {
                ...updatedItems[index],
                [name]: value
            };

            return {
                ...previousData,
                Items: updatedItems
            };

        });
    }


    // ADD ANOTHER PURCHASE ITEM
    function addPurchaseItem() {

        setFormData(function(previousData) {

            return {
                ...previousData,
                Items: [
                    ...previousData.Items,
                    {
                        FruitID: '',
                        PackagingSize: 'SMALL',
                        Quantity: '',
                        UnitCost: ''
                    }
                ]
            };

        });
    }


    // REMOVE A PURCHASE ITEM
    function removePurchaseItem(index) {

        setFormData(function(previousData) {

            const updatedItems = previousData.Items.filter(
                function(item, itemIndex) {
                    return itemIndex !== index;
                }
            );

            return {
                ...previousData,
                Items: updatedItems
            };

        });
    }


    // CALCULATE PURCHASE TOTAL
    function calculateTotal() {

        let total = 0;

        formData.Items.forEach(function(item) {

            const quantity = Number(item.Quantity || 0);
            const unitCost = Number(item.UnitCost || 0);

            total += quantity * unitCost;

        });

        return total;
    }


    // SAVE NEW PURCHASE
    async function handleSubmit(event) {

        event.preventDefault();

        try {

            setSaving(true);
            setFormError('');
            setSuccessMessage('');

            if (!formData.SupplierID) {
                throw new Error('Please select a supplier.');
            }

            if (!formData.PurchaseDate) {
                throw new Error('Please select a purchase date.');
            }

            if (formData.Items.length === 0) {
                throw new Error('Add at least one purchase item.');
            }

            const items = [];

            for (let i = 0; i < formData.Items.length; i++) {

                const item = formData.Items[i];

                if (!item.FruitID) {
                    throw new Error(
                        'Please select a fruit for item ' + (i + 1) + '.'
                    );
                }

                if (
                    !Number.isInteger(Number(item.Quantity)) ||
                    Number(item.Quantity) <= 0
                ) {
                    throw new Error(
                        'Enter a valid quantity for item ' + (i + 1) + '.'
                    );
                }

                if (
                    !Number.isFinite(Number(item.UnitCost)) ||
                    Number(item.UnitCost) <= 0
                ) {
                    throw new Error(
                        'Enter a valid unit cost for item ' + (i + 1) + '.'
                    );
                }

                items.push({
                    FruitID: Number(item.FruitID),
                    Quantity: Number(item.Quantity),
                    UnitCost: Number(item.UnitCost),
                    PackagingSize: item.PackagingSize
                });

            }


            // SEND PURCHASE TO BACKEND
            const result = await apiRequest(
                '/purchase-details/batch',
                'POST',
                {
                    SupplierID: Number(formData.SupplierID),
                    PurchaseDate: formData.PurchaseDate,
                    Items: items
                }
            );


            setSuccessMessage(
                'Purchase #' + result.PurchasesID +
                ' recorded successfully. Total: ' +
                formatMoney(result.TotalAmount)
            );

            await loadPurchases();

            setShowPurchaseForm(false);

        } catch (error) {

            setFormError(error.message);

        } finally {

            setSaving(false);

        }
    }


    // PURCHASE SUMMARY
    let totalPurchases = 0;

    purchases.forEach(function(purchase) {
        totalPurchases += Number(purchase.TotalAmount || 0);
    });

    const uniqueSuppliers = new Set(
        purchases.map(function(item) {
            return item.SupplierID;
        })
    );


    return (

        <div className="purchases-page">

            {/* PAGE HEADING */}
            <div className="purchases-heading">

                <div>
                    <h2>Purchase Management</h2>
                    <p>Monitor fruit purchases from your suppliers.</p>
                </div>

                <div className="purchase-heading-actions">

                    <button
                        className="refresh-button"
                        onClick={loadPurchases}
                        disabled={loading}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        className="purchase-add-button"
                        onClick={openPurchaseForm}
                    >
                        + Record Purchase
                    </button>

                </div>

            </div>


            {/* SUCCESS MESSAGE */}
            {successMessage && (

                <div className="purchase-success-message">
                    {successMessage}
                </div>

            )}


            {/* SUMMARY CARDS */}
            <div className="purchases-stats">

                <div className="purchase-stat-card">

                    <span>Total Purchases</span>

                    <h2>{purchases.length}</h2>

                    <p>Recorded transactions</p>

                </div>


                <div className="purchase-stat-card">

                    <span>Total Purchase Value</span>

                    <h2>{formatMoney(totalPurchases)}</h2>

                    <p>Combined purchase costs</p>

                </div>


                <div className="purchase-stat-card">

                    <span>Suppliers</span>

                    <h2>{uniqueSuppliers.size}</h2>

                    <p>Suppliers represented in purchases</p>

                </div>

            </div>


            {/* PURCHASE HISTORY */}
            <div className="content-card">

                <div className="section-heading">

                    <div>
                        <h2>Purchase History</h2>
                        <p>All recorded supplier purchases</p>
                    </div>

                    <input
                        type="text"
                        className="purchase-search"
                        placeholder="Search purchases..."
                        value={searchTerm}
                        onChange={function(event) {
                            setSearchTerm(event.target.value);
                        }}
                    />

                </div>


                {loading ? (

                    <div className="loading-message">
                        Loading purchase records...
                    </div>

                ) : error ? (

                    <div className="error-message">

                        <strong>Unable to load purchases.</strong>

                        <p>{error}</p>

                        <button
                            className="refresh-button"
                            onClick={loadPurchases}
                        >
                            Try Again
                        </button>

                    </div>

                ) : (

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>
                                    <th>Purchase ID</th>
                                    <th>Supplier</th>
                                    <th>Purchase Date</th>
                                    <th>Total Amount</th>
                                    <th>Action</th>
                                </tr>

                            </thead>


                            <tbody>

                                {filteredPurchases.length === 0 ? (

                                    <tr>
                                        <td colSpan="5" className="empty-table">
                                            No purchase records found.
                                        </td>
                                    </tr>

                                ) : (

                                    filteredPurchases.map(function(purchase) {

                                        return (

                                            <tr key={purchase.PurchasesID}>

                                                <td>
                                                    #{purchase.PurchasesID}
                                                </td>

                                                <td>
                                                    {purchase.BusinessName}
                                                </td>

                                                <td>
                                                    {formatDate(purchase.PurchaseDate)}
                                                </td>

                                                <td>
                                                    {formatMoney(purchase.TotalAmount)}
                                                </td>

                                                <td>

                                                    <button
                                                        className="purchase-view-button"
                                                        onClick={function() {
                                                            viewPurchase(purchase);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>

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


            {/* NEW PURCHASE MODAL */}
            {showPurchaseForm && (

                <div className="purchase-modal-overlay">

                    <div className="purchase-modal purchase-entry-modal">

                        <div className="purchase-modal-header">

                            <div>
                                <h2>Record New Purchase</h2>

                                <p>
                                    Enter supplier and purchased fruit information.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={function() {
                                    setShowPurchaseForm(false);
                                }}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>


                        <form onSubmit={handleSubmit}>

                            {/* SUPPLIER AND DATE */}
                            <div className="purchase-form-section">

                                <h3>Purchase Information</h3>

                                <div className="purchase-form-grid">

                                    <div className="purchase-form-group">

                                        <label>Supplier *</label>

                                        <select
                                            name="SupplierID"
                                            value={formData.SupplierID}
                                            onChange={handleFormChange}
                                            required
                                        >

                                            <option value="">
                                                Select Supplier
                                            </option>

                                            {suppliers.map(function(supplier) {

                                                return (

                                                    <option
                                                        key={supplier.SupplierID}
                                                        value={supplier.SupplierID}
                                                    >
                                                        {supplier.BusinessName}
                                                    </option>

                                                );

                                            })}

                                        </select>

                                    </div>


                                    <div className="purchase-form-group">

                                        <label>Purchase Date *</label>

                                        <input
                                            type="date"
                                            name="PurchaseDate"
                                            value={formData.PurchaseDate}
                                            onChange={handleFormChange}
                                            required
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* PURCHASE ITEMS */}
                            <div className="purchase-form-section">

                                <div className="purchase-items-heading">

                                    <div>
                                        <h3>Purchase Items</h3>

                                        <p>
                                            Add the fruits and quantities purchased.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="purchase-add-item-button"
                                        onClick={addPurchaseItem}
                                    >
                                        + Add Item
                                    </button>

                                </div>


                                {formData.Items.map(function(item, index) {

                                    return (

                                        <div
                                            className="purchase-item-row"
                                            key={index}
                                        >

                                            <div className="purchase-item-number">
                                                Item {index + 1}
                                            </div>


                                            <div className="purchase-item-fields">

                                                <div className="purchase-form-group">

                                                    <label>Fruit *</label>

                                                    <select
                                                        name="FruitID"
                                                        value={item.FruitID}
                                                        onChange={function(event) {
                                                            handleItemChange(index, event);
                                                        }}
                                                        required
                                                    >

                                                        <option value="">
                                                            Select Fruit
                                                        </option>

                                                        {fruits.map(function(fruit) {

                                                            return (

                                                                <option
                                                                    key={fruit.FruitID}
                                                                    value={fruit.FruitID}
                                                                >
                                                                    {fruit.FruitName}
                                                                </option>

                                                            );

                                                        })}

                                                    </select>

                                                </div>


                                                <div className="purchase-form-group">

                                                    <label>Packaging *</label>

                                                    <select
                                                        name="PackagingSize"
                                                        value={item.PackagingSize}
                                                        onChange={function(event) {
                                                            handleItemChange(index, event);
                                                        }}
                                                    >

                                                        <option value="SMALL">SMALL</option>
                                                        <option value="MEDIUM">MEDIUM</option>
                                                        <option value="LARGE">LARGE</option>

                                                    </select>

                                                </div>


                                                <div className="purchase-form-group">

                                                    <label>Quantity *</label>

                                                    <input
                                                        type="number"
                                                        name="Quantity"
                                                        min="1"
                                                        step="1"
                                                        placeholder="Boxes"
                                                        value={item.Quantity}
                                                        onChange={function(event) {
                                                            handleItemChange(index, event);
                                                        }}
                                                        required
                                                    />

                                                </div>


                                                <div className="purchase-form-group">

                                                    <label>Unit Cost (M) *</label>

                                                    <input
                                                        type="number"
                                                        name="UnitCost"
                                                        min="0.01"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={item.UnitCost}
                                                        onChange={function(event) {
                                                            handleItemChange(index, event);
                                                        }}
                                                        required
                                                    />

                                                </div>


                                                <div className="purchase-form-group">

                                                    <label>Subtotal</label>

                                                    <div className="purchase-item-subtotal">

                                                        {formatMoney(
                                                            Number(item.Quantity || 0) *
                                                            Number(item.UnitCost || 0)
                                                        )}

                                                    </div>

                                                </div>


                                                <button
                                                    type="button"
                                                    className="purchase-remove-item"
                                                    onClick={function() {
                                                        removePurchaseItem(index);
                                                    }}
                                                    disabled={formData.Items.length === 1}
                                                    title="Remove item"
                                                >
                                                    ×
                                                </button>

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>


                            {/* TOTAL */}
                            <div className="purchase-total-section">

                                <span>Purchase Total</span>

                                <h2>
                                    {formatMoney(calculateTotal())}
                                </h2>

                            </div>


                            {/* ERROR */}
                            {formError && (

                                <div className="purchase-form-error">
                                    {formError}
                                </div>

                            )}


                            {/* ACTIONS */}
                            <div className="purchase-form-actions">

                                <button
                                    type="button"
                                    className="purchase-cancel-button"
                                    onClick={function() {
                                        setShowPurchaseForm(false);
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="purchase-save-button"
                                    disabled={saving}
                                >

                                    {saving
                                        ? 'Saving Purchase...'
                                        : 'Save Purchase'
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* VIEW PURCHASE DETAILS MODAL */}
            {selectedPurchase && (

                <div className="purchase-modal-overlay">

                    <div className="purchase-modal">

                        <div className="purchase-modal-header">

                            <div>

                                <h2>
                                    Purchase #{selectedPurchase.purchase.PurchasesID}
                                </h2>

                                <p>Purchase transaction details</p>

                            </div>

                            <button
                                type="button"
                                onClick={function() {
                                    setSelectedPurchase(null);
                                }}
                            >
                                ×
                            </button>

                        </div>


                        <div className="purchase-information">

                            <div>
                                <span>Supplier</span>

                                <strong>
                                    {selectedPurchase.purchase.BusinessName}
                                </strong>
                            </div>


                            <div>
                                <span>Purchase Date</span>

                                <strong>
                                    {formatDate(selectedPurchase.purchase.PurchaseDate)}
                                </strong>
                            </div>


                            <div>
                                <span>Total Amount</span>

                                <strong>
                                    {formatMoney(selectedPurchase.purchase.TotalAmount)}
                                </strong>
                            </div>

                        </div>


                        <h3>Purchased Items</h3>


                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Fruit</th>
                                        <th>Packaging</th>
                                        <th>Quantity</th>
                                        <th>Unit Cost</th>
                                        <th>Subtotal</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {selectedPurchase.details.length === 0 ? (

                                        <tr>
                                            <td colSpan="5" className="empty-table">
                                                No purchase items found.
                                            </td>
                                        </tr>

                                    ) : (

                                        selectedPurchase.details.map(function(item) {

                                            return (

                                                <tr key={item.PurchaseDetailID}>

                                                    <td>{item.FruitName}</td>

                                                    <td>{item.PackagingSize}</td>

                                                    <td>{item.Quantity}</td>

                                                    <td>{formatMoney(item.UnitCost)}</td>

                                                    <td>{formatMoney(item.Subtotal)}</td>

                                                </tr>

                                            );

                                        })

                                    )}

                                </tbody>

                            </table>

                        </div>


                        <div className="purchase-modal-footer">

                            <button
                                type="button"
                                onClick={function() {
                                    setSelectedPurchase(null);
                                }}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
}

export default Purchases;