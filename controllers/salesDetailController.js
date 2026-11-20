const db = require('../config/db');

// Helper: Recalculate sale total and payment status
async function recalculateSale(connection, saleID) {

    const [totals] = await connection.execute(
        `SELECT
            s.AmountPaid,
            COALESCE(SUM(sd.Quantity * sd.UnitPrice), 0) AS NewTotal
         FROM sales s
         LEFT JOIN sales_details sd ON s.SaleID = sd.SaleID
         WHERE s.SaleID = ?
         GROUP BY s.SaleID`,
        [saleID]
    );

    if (totals.length === 0) {
        throw new Error('Sale not found.');
    }

    const totalAmount = Number(totals[0].NewTotal);
    const amountPaid = Number(totals[0].AmountPaid);

    if (amountPaid > totalAmount) {
        const error = new Error(
            'The updated sale total cannot be less than the amount already paid.'
        );

        error.statusCode = 409;
        throw error;
    }

    let paymentStatus = 'UNPAID';

    if (amountPaid > 0 && amountPaid === totalAmount && totalAmount > 0) {
        paymentStatus = 'PAID';
    } else if (amountPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
    }

    await connection.execute(
        `UPDATE sales
         SET TotalAmount = ?, PaymentStatus = ?
         WHERE SaleID = ?`,
        [totalAmount, paymentStatus, saleID]
    );
}


// GET all sales details
async function getAllSalesDetails(req, res) {

    try {

        const [rows] = await db.execute(
            `SELECT
                sd.SaleDetailID,
                sd.SaleID,
                v.VendorName,
                sd.FruitID,
                f.FruitName,
                sd.PackagingSize,
                sd.Quantity,
                sd.UnitPrice,
                (sd.Quantity * sd.UnitPrice) AS Subtotal
             FROM sales_details sd
             JOIN sales s ON sd.SaleID = s.SaleID
             JOIN vendors v ON s.VendorID = v.VendorID
             JOIN fruits f ON sd.FruitID = f.FruitID
             ORDER BY sd.SaleDetailID DESC`
        );

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error('Get sales details error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sales details.'
        });
    }
}


// GET one sales detail by ID
async function getSaleDetailById(req, res) {

    try {

        const detailID = req.params.id;

        const [rows] = await db.execute(
            `SELECT
                sd.SaleDetailID,
                sd.SaleID,
                v.VendorName,
                sd.FruitID,
                f.FruitName,
                sd.PackagingSize,
                sd.Quantity,
                sd.UnitPrice,
                (sd.Quantity * sd.UnitPrice) AS Subtotal
             FROM sales_details sd
             JOIN sales s ON sd.SaleID = s.SaleID
             JOIN vendors v ON s.VendorID = v.VendorID
             JOIN fruits f ON sd.FruitID = f.FruitID
             WHERE sd.SaleDetailID = ?`,
            [detailID]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales detail not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {

        console.error('Get sale detail error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve sales detail.'
        });
    }
}


// CREATE one sales detail
async function createSaleDetail(req, res) {

    const { SaleID, FruitID, PackagingSize, Quantity } = req.body;

    const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

    if (!SaleID || !FruitID || !PackagingSize ||
        !Number.isInteger(Number(Quantity)) || Number(Quantity) <= 0) {

        return res.status(400).json({
            success: false,
            message: 'SaleID, FruitID, valid PackagingSize and positive Quantity are required.'
        });
    }

    if (!validSizes.includes(PackagingSize)) {

        return res.status(400).json({
            success: false,
            message: 'PackagingSize must be SMALL, MEDIUM or LARGE.'
        });
    }

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Lock the sale
        const [sales] = await connection.execute(
            'SELECT SaleID FROM sales WHERE SaleID = ? FOR UPDATE',
            [SaleID]
        );

        if (sales.length === 0) {
            const error = new Error('Sale not found.');
            error.statusCode = 404;
            throw error;
        }

        // Check the fruit
        const [fruits] = await connection.execute(
            'SELECT FruitID FROM fruits WHERE FruitID = ?',
            [FruitID]
        );

        if (fruits.length === 0) {
            const error = new Error('Fruit not found.');
            error.statusCode = 404;
            throw error;
        }

        // Lock stock
        const [stock] = await connection.execute(
            `SELECT StockID, AvailableQuantity, SellingPrice
             FROM stock
             WHERE FruitID = ? AND PackagingSize = ?
             FOR UPDATE`,
            [FruitID, PackagingSize]
        );

        if (stock.length === 0) {
            const error = new Error('Stock record not found.');
            error.statusCode = 404;
            throw error;
        }

        const availableQuantity = Number(stock[0].AvailableQuantity);

        if (availableQuantity < Number(Quantity)) {
            const error = new Error(
                'Insufficient stock. Available quantity: ' + availableQuantity
            );

            error.statusCode = 409;
            throw error;
        }

        const unitPrice = Number(stock[0].SellingPrice);

        // Insert sales detail
        const [result] = await connection.execute(
            `INSERT INTO sales_details
             (SaleID, FruitID, PackagingSize, Quantity, UnitPrice)
             VALUES (?, ?, ?, ?, ?)`,
            [SaleID, FruitID, PackagingSize, Quantity, unitPrice]
        );

        // Deduct stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity - ?
             WHERE StockID = ?`,
            [Quantity, stock[0].StockID]
        );

        await recalculateSale(connection, SaleID);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Sales detail created successfully. Stock and sale total updated.',
            SaleDetailID: result.insertId
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Create sales detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create sales detail.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
}


// UPDATE a sales detail
async function updateSaleDetail(req, res) {

    const detailID = req.params.id;

    const { SaleID, FruitID, PackagingSize, Quantity } = req.body;

    const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

    if (!SaleID || !FruitID || !PackagingSize ||
        !Number.isInteger(Number(Quantity)) || Number(Quantity) <= 0) {

        return res.status(400).json({
            success: false,
            message: 'SaleID, FruitID, valid PackagingSize and positive Quantity are required.'
        });
    }

    if (!validSizes.includes(PackagingSize)) {

        return res.status(400).json({
            success: false,
            message: 'PackagingSize must be SMALL, MEDIUM or LARGE.'
        });
    }

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Find old detail
        const [oldDetails] = await connection.execute(
            'SELECT * FROM sales_details WHERE SaleDetailID = ? FOR UPDATE',
            [detailID]
        );

        if (oldDetails.length === 0) {
            const error = new Error('Sales detail not found.');
            error.statusCode = 404;
            throw error;
        }

        const oldDetail = oldDetails[0];

        // Lock old sale
        await connection.execute(
            'SELECT SaleID FROM sales WHERE SaleID = ? FOR UPDATE',
            [oldDetail.SaleID]
        );

        // Check new sale if different
        if (Number(SaleID) !== Number(oldDetail.SaleID)) {

            const [newSale] = await connection.execute(
                'SELECT SaleID FROM sales WHERE SaleID = ? FOR UPDATE',
                [SaleID]
            );

            if (newSale.length === 0) {
                const error = new Error('New sale not found.');
                error.statusCode = 404;
                throw error;
            }
        }

        // Restore old stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity + ?
             WHERE FruitID = ? AND PackagingSize = ?`,
            [
                oldDetail.Quantity,
                oldDetail.FruitID,
                oldDetail.PackagingSize
            ]
        );

        // Find new stock
        const [stock] = await connection.execute(
            `SELECT StockID, AvailableQuantity, SellingPrice
             FROM stock
             WHERE FruitID = ? AND PackagingSize = ?
             FOR UPDATE`,
            [FruitID, PackagingSize]
        );

        if (stock.length === 0) {
            const error = new Error('Stock record not found.');
            error.statusCode = 404;
            throw error;
        }

        if (Number(stock[0].AvailableQuantity) < Number(Quantity)) {
            const error = new Error('Insufficient stock for the updated quantity.');
            error.statusCode = 409;
            throw error;
        }

        const unitPrice = Number(stock[0].SellingPrice);

        // Update detail
        await connection.execute(
            `UPDATE sales_details
             SET SaleID = ?,
                 FruitID = ?,
                 PackagingSize = ?,
                 Quantity = ?,
                 UnitPrice = ?
             WHERE SaleDetailID = ?`,
            [SaleID, FruitID, PackagingSize, Quantity, unitPrice, detailID]
        );

        // Deduct new stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity - ?
             WHERE StockID = ?`,
            [Quantity, stock[0].StockID]
        );

        await recalculateSale(connection, oldDetail.SaleID);

        if (Number(SaleID) !== Number(oldDetail.SaleID)) {
            await recalculateSale(connection, SaleID);
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Sales detail updated successfully. Stock and sale totals updated.'
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Update sales detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to update sales detail.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
}


// DELETE a sales detail
async function deleteSaleDetail(req, res) {

    const detailID = req.params.id;

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Find detail
        const [details] = await connection.execute(
            'SELECT * FROM sales_details WHERE SaleDetailID = ? FOR UPDATE',
            [detailID]
        );

        if (details.length === 0) {
            const error = new Error('Sales detail not found.');
            error.statusCode = 404;
            throw error;
        }

        const detail = details[0];

        // Lock sale
        await connection.execute(
            'SELECT SaleID FROM sales WHERE SaleID = ? FOR UPDATE',
            [detail.SaleID]
        );

        // Restore stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity + ?
             WHERE FruitID = ? AND PackagingSize = ?`,
            [
                detail.Quantity,
                detail.FruitID,
                detail.PackagingSize
            ]
        );

        // Delete detail
        await connection.execute(
            'DELETE FROM sales_details WHERE SaleDetailID = ?',
            [detailID]
        );

        await recalculateSale(connection, detail.SaleID);

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Sales detail deleted successfully. Stock and sale total restored.'
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Delete sales detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to delete sales detail.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
}


// CREATE a sale containing multiple fruit items
async function createBatchSale(req, res) {

    const { VendorID, SaleDate, PaymentMethod, Items } = req.body;

    const validMethods = ['CASH', 'MOBILE_MONEY', 'CREDIT'];
    const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

    // Validate sale information
    if (!VendorID || !SaleDate || !PaymentMethod ||
        !Array.isArray(Items) || Items.length === 0) {

        return res.status(400).json({
            success: false,
            message: 'VendorID, SaleDate, PaymentMethod and at least one item are required.'
        });
    }

    if (!Number.isInteger(Number(VendorID)) || Number(VendorID) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'VendorID must be a positive integer.'
        });
    }

    if (!validMethods.includes(PaymentMethod)) {
        return res.status(400).json({
            success: false,
            message: 'PaymentMethod must be CASH, MOBILE_MONEY or CREDIT.'
        });
    }

    // Validate every item
    for (let i = 0; i < Items.length; i++) {

        const item = Items[i];

        if (!Number.isInteger(Number(item.FruitID)) ||
            Number(item.FruitID) <= 0 ||
            !validSizes.includes(item.PackagingSize) ||
            !Number.isInteger(Number(item.Quantity)) ||
            Number(item.Quantity) <= 0) {

            return res.status(400).json({
                success: false,
                message: 'Every item must have a valid FruitID, PackagingSize and positive Quantity.',
                invalidItem: i + 1
            });
        }
    }

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Check vendor
        const [vendors] = await connection.execute(
            'SELECT VendorID FROM vendors WHERE VendorID = ?',
            [Number(VendorID)]
        );

        if (vendors.length === 0) {
            const error = new Error('Vendor not found.');
            error.statusCode = 404;
            throw error;
        }

        // Combine duplicate fruit and packaging combinations
        const combinedItems = {};

        for (let i = 0; i < Items.length; i++) {

            const item = Items[i];

            const key = Number(item.FruitID) + '-' + item.PackagingSize;

            if (!combinedItems[key]) {
                combinedItems[key] = {
                    FruitID: Number(item.FruitID),
                    PackagingSize: item.PackagingSize,
                    Quantity: 0
                };
            }

            combinedItems[key].Quantity += Number(item.Quantity);
        }

        const saleItems = Object.values(combinedItems);

        // Sort stock records before locking them
        saleItems.sort(function(a, b) {

            if (a.FruitID !== b.FruitID) {
                return a.FruitID - b.FruitID;
            }

            return a.PackagingSize.localeCompare(b.PackagingSize);
        });

        let totalAmount = 0;

        // Check and lock ALL stock before creating the sale
        for (let i = 0; i < saleItems.length; i++) {

            const item = saleItems[i];

            const [stock] = await connection.execute(
                `SELECT StockID, AvailableQuantity, SellingPrice
                 FROM stock
                 WHERE FruitID = ? AND PackagingSize = ?
                 FOR UPDATE`,
                [item.FruitID, item.PackagingSize]
            );

            if (stock.length === 0) {
                const error = new Error(
                    'Stock record not found for FruitID ' +
                    item.FruitID + ' and ' + item.PackagingSize + '.'
                );

                error.statusCode = 404;
                throw error;
            }

            const availableQuantity = Number(stock[0].AvailableQuantity);

            if (availableQuantity < item.Quantity) {
                const error = new Error(
                    'Insufficient stock for FruitID ' +
                    item.FruitID + ' (' + item.PackagingSize +
                    '). Available: ' + availableQuantity +
                    ', Requested: ' + item.Quantity
                );

                error.statusCode = 409;
                throw error;
            }

            item.StockID = stock[0].StockID;
            item.UnitPrice = Number(stock[0].SellingPrice);

            totalAmount += item.Quantity * item.UnitPrice;
        }

        // Create sale header after all stock checks pass
        const [saleResult] = await connection.execute(
            `INSERT INTO sales
             (VendorID, SaleDate, PaymentStatus, TotalAmount,
              PaymentMethod, AmountPaid)
             VALUES (?, ?, 'UNPAID', ?, ?, 0)`,
            [Number(VendorID), SaleDate, totalAmount, PaymentMethod]
        );

        const saleID = saleResult.insertId;

        // Insert every detail and deduct stock
        for (let i = 0; i < saleItems.length; i++) {

            const item = saleItems[i];

            await connection.execute(
                `INSERT INTO sales_details
                 (SaleID, FruitID, PackagingSize, Quantity, UnitPrice)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    saleID,
                    item.FruitID,
                    item.PackagingSize,
                    item.Quantity,
                    item.UnitPrice
                ]
            );

            await connection.execute(
                `UPDATE stock
                 SET AvailableQuantity = AvailableQuantity - ?
                 WHERE StockID = ?`,
                [item.Quantity, item.StockID]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Multiple-item sale created successfully.',
            SaleID: saleID,
            TotalAmount: totalAmount,
            PaymentStatus: 'UNPAID',
            AmountPaid: 0,
            ItemsProcessed: saleItems.length
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Batch sale error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create multiple-item sale. All changes were rolled back.'
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
}


// Export controller functions
module.exports = {
    getAllSalesDetails,
    getSaleDetailById,
    createSaleDetail,
    updateSaleDetail,
    deleteSaleDetail,
    createBatchSale
};