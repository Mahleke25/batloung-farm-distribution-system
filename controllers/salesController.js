const db = require('../config/db');

// GET all sales
async function getAllSales(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT
                s.SaleID,
                s.VendorID,
                v.VendorName,
                s.SaleDate,
                s.TotalAmount,
                s.AmountPaid,
                (s.TotalAmount - s.AmountPaid) AS OutstandingBalance,
                s.PaymentStatus,
                s.PaymentMethod
            FROM sales s
            JOIN vendors v ON s.VendorID = v.VendorID
            ORDER BY s.SaleID DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('Get sales error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sales.'
        });
    }
}


// GET one sale by SaleID
async function getSaleById(req, res) {
    try {
        const saleID = req.params.id;

        const [rows] = await db.execute(
            `SELECT
                s.SaleID,
                s.VendorID,
                v.VendorName,
                s.SaleDate,
                s.TotalAmount,
                s.AmountPaid,
                (s.TotalAmount - s.AmountPaid) AS OutstandingBalance,
                s.PaymentStatus,
                s.PaymentMethod
            FROM sales s
            JOIN vendors v ON s.VendorID = v.VendorID
            WHERE s.SaleID = ?`,
            [saleID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Get sale by ID error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sale.'
        });
    }
}


// CREATE a sale
async function createSale(req, res) {
    try {
        const {
            VendorID,
            SaleDate,
            PaymentMethod,
            AmountPaid = 0
        } = req.body;

        if (!VendorID || !SaleDate || !PaymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'VendorID, SaleDate and PaymentMethod are required.'
            });
        }

        const validMethods = ['CASH', 'MOBILE_MONEY', 'CREDIT'];

        if (!validMethods.includes(PaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'PaymentMethod must be CASH, MOBILE_MONEY or CREDIT.'
            });
        }

        if (!Number.isFinite(Number(AmountPaid)) || Number(AmountPaid) < 0) {
            return res.status(400).json({
                success: false,
                message: 'AmountPaid must be zero or greater.'
            });
        }

        const [vendor] = await db.execute(
            'SELECT VendorID FROM vendors WHERE VendorID = ?',
            [VendorID]
        );

        if (vendor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO sales
            (VendorID, SaleDate, PaymentStatus, TotalAmount, PaymentMethod, AmountPaid)
            VALUES (?, ?, 'UNPAID', 0.00, ?, ?)`,
            [VendorID, SaleDate, PaymentMethod, AmountPaid]
        );

        res.status(201).json({
            success: true,
            message: 'Sale created successfully. Add sale details to calculate the total.',
            SaleID: result.insertId
        });

    } catch (error) {
        console.error('Create sale error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to create sale.'
        });
    }
}


// UPDATE sale information and payment
async function updateSale(req, res) {
    try {
        const saleID = req.params.id;

        const {
            VendorID,
            SaleDate,
            PaymentMethod,
            AmountPaid
        } = req.body;

        if (!VendorID || !SaleDate || !PaymentMethod ||
            AmountPaid === undefined) {

            return res.status(400).json({
                success: false,
                message: 'VendorID, SaleDate, PaymentMethod and AmountPaid are required.'
            });
        }

        const validMethods = ['CASH', 'MOBILE_MONEY', 'CREDIT'];

        if (!validMethods.includes(PaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid PaymentMethod.'
            });
        }

        if (!Number.isFinite(Number(AmountPaid)) || Number(AmountPaid) < 0) {
            return res.status(400).json({
                success: false,
                message: 'AmountPaid must be zero or greater.'
            });
        }

        const [sale] = await db.execute(
            'SELECT TotalAmount FROM sales WHERE SaleID = ?',
            [saleID]
        );

        if (sale.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        if (Number(AmountPaid) > Number(sale[0].TotalAmount)) {
            return res.status(400).json({
                success: false,
                message: 'AmountPaid cannot exceed the sale total.'
            });
        }

        const [vendor] = await db.execute(
            'SELECT VendorID FROM vendors WHERE VendorID = ?',
            [VendorID]
        );

        if (vendor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        let paymentStatus = 'UNPAID';

        if (Number(AmountPaid) === Number(sale[0].TotalAmount) &&
            Number(sale[0].TotalAmount) > 0) {

            paymentStatus = 'PAID';

        } else if (Number(AmountPaid) > 0) {

            paymentStatus = 'PARTIALLY_PAID';
        }

        await db.execute(
            `UPDATE sales
            SET VendorID = ?,
                SaleDate = ?,
                PaymentMethod = ?,
                AmountPaid = ?,
                PaymentStatus = ?
            WHERE SaleID = ?`,
            [
                VendorID,
                SaleDate,
                PaymentMethod,
                AmountPaid,
                paymentStatus,
                saleID
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Sale updated successfully.',
            PaymentStatus: paymentStatus
        });

    } catch (error) {
        console.error('Update sale error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update sale.'
        });
    }
}


// DELETE a sale
async function deleteSale(req, res) {
    try {
        const saleID = req.params.id;

        const [sale] = await db.execute(
            'SELECT SaleID FROM sales WHERE SaleID = ?',
            [saleID]
        );

        if (sale.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        const [details] = await db.execute(
            'SELECT SaleDetailID FROM sales_details WHERE SaleID = ?',
            [saleID]
        );

        if (details.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this sale while sale details exist. Delete the sale details first.'
            });
        }

        await db.execute(
            'DELETE FROM sales WHERE SaleID = ?',
            [saleID]
        );

        res.status(200).json({
            success: true,
            message: 'Sale deleted successfully.'
        });

    } catch (error) {
        console.error('Delete sale error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to delete sale.'
        });
    }
}


// Export controller functions
module.exports = {
    getAllSales,
    getSaleById,
    createSale,
    updateSale,
    deleteSale
};