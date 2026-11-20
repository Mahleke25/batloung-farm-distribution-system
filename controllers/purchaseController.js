const db = require('../config/db');

// GET all purchases
async function getAllPurchases(req, res) {
    try {
        const [purchases] = await db.execute(
            `SELECT
                p.PurchasesID,
                p.SupplierID,
                s.BusinessName,
                p.PurchaseDate,
                p.TotalAmount
            FROM purchases p
            JOIN suppliers s ON p.SupplierID = s.SupplierID
            ORDER BY p.PurchasesID DESC`
        );

        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases
        });

    } catch (error) {
        console.error('Error retrieving purchases:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchases.'
        });
    }
}


// GET purchase by ID
async function getPurchaseById(req, res) {
    try {
        const purchaseId = req.params.id;

        const [purchases] = await db.execute(
            `SELECT
                p.PurchasesID,
                p.SupplierID,
                s.BusinessName,
                p.PurchaseDate,
                p.TotalAmount
            FROM purchases p
            JOIN suppliers s ON p.SupplierID = s.SupplierID
            WHERE p.PurchasesID = ?`,
            [purchaseId]
        );

        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: purchases[0]
        });

    } catch (error) {
        console.error('Error retrieving purchase:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase.'
        });
    }
}


// POST create a new purchase
async function createPurchase(req, res) {
    try {
        const { SupplierID, PurchaseDate } = req.body;

        if (!SupplierID || !PurchaseDate) {
            return res.status(400).json({
                success: false,
                message: 'Supplier ID and purchase date are required.'
            });
        }

        // Check whether the supplier exists
        const [suppliers] = await db.execute(
            'SELECT SupplierID FROM suppliers WHERE SupplierID = ?',
            [SupplierID]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        // Create the purchase header
        const [result] = await db.execute(
            `INSERT INTO purchases
            (SupplierID, PurchaseDate, TotalAmount)
            VALUES (?, ?, 0.00)`,
            [SupplierID, PurchaseDate]
        );

        res.status(201).json({
            success: true,
            message: 'Purchase created successfully. Add purchase details to calculate its total.',
            PurchasesID: result.insertId,
            TotalAmount: 0.00
        });

    } catch (error) {
        console.error('Error creating purchase:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to create purchase.'
        });
    }
}


// PUT update a purchase
async function updatePurchase(req, res) {
    try {
        const purchaseId = req.params.id;
        const { SupplierID, PurchaseDate } = req.body;

        if (!SupplierID || !PurchaseDate) {
            return res.status(400).json({
                success: false,
                message: 'Supplier ID and purchase date are required.'
            });
        }

        // Check whether the supplier exists
        const [suppliers] = await db.execute(
            'SELECT SupplierID FROM suppliers WHERE SupplierID = ?',
            [SupplierID]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        const [result] = await db.execute(
            `UPDATE purchases
            SET SupplierID = ?,
                PurchaseDate = ?
            WHERE PurchasesID = ?`,
            [SupplierID, PurchaseDate, purchaseId]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.execute(
                'SELECT PurchasesID FROM purchases WHERE PurchasesID = ?',
                [purchaseId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Purchase not found.'
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Purchase updated successfully.'
        });

    } catch (error) {
        console.error('Error updating purchase:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update purchase.'
        });
    }
}


// DELETE a purchase
async function deletePurchase(req, res) {
    try {
        const purchaseId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM purchases WHERE PurchasesID = ?',
            [purchaseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Purchase deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting purchase:', error.message);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this purchase because it contains purchase detail records.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete purchase.'
        });
    }
}


// Export all controller functions
module.exports = {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
};