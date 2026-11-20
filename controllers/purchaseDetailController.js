const db = require('../config/db');

// GET all purchase details
async function getAllPurchaseDetails(req, res) {
    try {
        const [details] = await db.execute(
            `SELECT
                pd.PurchaseDetailID,
                pd.PurchaseID,
                pd.FruitID,
                f.FruitName,
                pd.Quantity,
                pd.UnitCost,
                pd.PackagingSize,
                (pd.Quantity * pd.UnitCost) AS Subtotal
            FROM purchase_details pd
            JOIN fruits f ON pd.FruitID = f.FruitID
            ORDER BY pd.PurchaseDetailID DESC`
        );

        res.status(200).json({
            success: true,
            count: details.length,
            data: details
        });

    } catch (error) {
        console.error('Get purchase details error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase details.'
        });
    }
}


// GET one purchase detail by ID
async function getPurchaseDetailById(req, res) {
    try {
        const id = req.params.id;

        const [details] = await db.execute(
            `SELECT
                pd.PurchaseDetailID,
                pd.PurchaseID,
                pd.FruitID,
                f.FruitName,
                pd.Quantity,
                pd.UnitCost,
                pd.PackagingSize,
                (pd.Quantity * pd.UnitCost) AS Subtotal
            FROM purchase_details pd
            JOIN fruits f ON pd.FruitID = f.FruitID
            WHERE pd.PurchaseDetailID = ?`,
            [id]
        );

        if (details.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Purchase detail not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: details[0]
        });

    } catch (error) {
        console.error('Get purchase detail error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase detail.'
        });
    }
}


// CREATE one purchase detail
async function createPurchaseDetail(req, res) {
    let connection;

    try {
        const {
            PurchaseID,
            FruitID,
            Quantity,
            UnitCost,
            PackagingSize
        } = req.body;

        const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

        if (
            !Number.isInteger(Number(PurchaseID)) || Number(PurchaseID) <= 0 ||
            !Number.isInteger(Number(FruitID)) || Number(FruitID) <= 0 ||
            !Number.isInteger(Number(Quantity)) || Number(Quantity) <= 0 ||
            !Number.isFinite(Number(UnitCost)) || Number(UnitCost) <= 0 ||
            !validSizes.includes(PackagingSize)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Provide valid PurchaseID, FruitID, positive Quantity, positive UnitCost and PackagingSize.'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Check purchase
        const [purchases] = await connection.execute(
            'SELECT PurchasesID FROM purchases WHERE PurchasesID = ? FOR UPDATE',
            [PurchaseID]
        );

        if (purchases.length === 0) {
            const error = new Error('Purchase not found.');
            error.statusCode = 404;
            throw error;
        }

        // Check fruit
        const [fruits] = await connection.execute(
            'SELECT FruitID FROM fruits WHERE FruitID = ?',
            [FruitID]
        );

        if (fruits.length === 0) {
            const error = new Error('Fruit not found.');
            error.statusCode = 404;
            throw error;
        }

        // Lock stock record
        const [stock] = await connection.execute(
            `SELECT StockID
             FROM stock
             WHERE FruitID = ? AND PackagingSize = ?
             FOR UPDATE`,
            [FruitID, PackagingSize]
        );

        if (stock.length === 0) {
            const error = new Error('Stock record not found for this fruit and packaging size.');
            error.statusCode = 404;
            throw error;
        }

        // Insert purchase detail
        const [result] = await connection.execute(
            `INSERT INTO purchase_details
            (PurchaseID, FruitID, Quantity, UnitCost, PackagingSize)
            VALUES (?, ?, ?, ?, ?)`,
            [
                PurchaseID,
                FruitID,
                Quantity,
                UnitCost,
                PackagingSize
            ]
        );

        // Increase stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity + ?
             WHERE StockID = ?`,
            [Quantity, stock[0].StockID]
        );

        // Recalculate purchase total
        await connection.execute(
            `UPDATE purchases
             SET TotalAmount = (
                 SELECT COALESCE(SUM(Quantity * UnitCost), 0)
                 FROM purchase_details
                 WHERE PurchaseID = ?
             )
             WHERE PurchasesID = ?`,
            [PurchaseID, PurchaseID]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Purchase detail created successfully. Stock and purchase total updated.',
            PurchaseDetailID: result.insertId
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Create purchase detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create purchase detail.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// UPDATE a purchase detail
async function updatePurchaseDetail(req, res) {
    let connection;

    try {
        const id = req.params.id;

        const {
            PurchaseID,
            FruitID,
            Quantity,
            UnitCost,
            PackagingSize
        } = req.body;

        const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

        if (
            !Number.isInteger(Number(PurchaseID)) || Number(PurchaseID) <= 0 ||
            !Number.isInteger(Number(FruitID)) || Number(FruitID) <= 0 ||
            !Number.isInteger(Number(Quantity)) || Number(Quantity) <= 0 ||
            !Number.isFinite(Number(UnitCost)) || Number(UnitCost) <= 0 ||
            !validSizes.includes(PackagingSize)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Provide valid PurchaseID, FruitID, positive Quantity, positive UnitCost and PackagingSize.'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Find existing purchase detail
        const [oldDetails] = await connection.execute(
            `SELECT *
             FROM purchase_details
             WHERE PurchaseDetailID = ?
             FOR UPDATE`,
            [id]
        );

        if (oldDetails.length === 0) {
            const error = new Error('Purchase detail not found.');
            error.statusCode = 404;
            throw error;
        }

        const oldDetail = oldDetails[0];

        // Check new purchase
        const [purchases] = await connection.execute(
            'SELECT PurchasesID FROM purchases WHERE PurchasesID = ? FOR UPDATE',
            [PurchaseID]
        );

        if (purchases.length === 0) {
            const error = new Error('Purchase not found.');
            error.statusCode = 404;
            throw error;
        }

        // Check fruit
        const [fruits] = await connection.execute(
            'SELECT FruitID FROM fruits WHERE FruitID = ?',
            [FruitID]
        );

        if (fruits.length === 0) {
            const error = new Error('Fruit not found.');
            error.statusCode = 404;
            throw error;
        }

        // Lock new stock
        const [newStock] = await connection.execute(
            `SELECT StockID
             FROM stock
             WHERE FruitID = ? AND PackagingSize = ?
             FOR UPDATE`,
            [FruitID, PackagingSize]
        );

        if (newStock.length === 0) {
            const error = new Error('Stock record not found for this fruit and packaging size.');
            error.statusCode = 404;
            throw error;
        }

        // Remove old purchased quantity from stock.
        // This is allowed only if the quantity has not already been sold.
        const [stockUpdate] = await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity - ?
             WHERE FruitID = ?
             AND PackagingSize = ?
             AND AvailableQuantity >= ?`,
            [
                oldDetail.Quantity,
                oldDetail.FruitID,
                oldDetail.PackagingSize,
                oldDetail.Quantity
            ]
        );

        if (stockUpdate.affectedRows === 0) {
            const error = new Error(
                'Cannot update this purchase detail because some of its stock has already been sold.'
            );
            error.statusCode = 409;
            throw error;
        }

        // Add new quantity to stock
        await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity + ?
             WHERE StockID = ?`,
            [Quantity, newStock[0].StockID]
        );

        // Update purchase detail
        await connection.execute(
            `UPDATE purchase_details
             SET PurchaseID = ?,
                 FruitID = ?,
                 Quantity = ?,
                 UnitCost = ?,
                 PackagingSize = ?
             WHERE PurchaseDetailID = ?`,
            [
                PurchaseID,
                FruitID,
                Quantity,
                UnitCost,
                PackagingSize,
                id
            ]
        );

        // Recalculate old purchase total
        await connection.execute(
            `UPDATE purchases
             SET TotalAmount = (
                 SELECT COALESCE(SUM(Quantity * UnitCost), 0)
                 FROM purchase_details
                 WHERE PurchaseID = ?
             )
             WHERE PurchasesID = ?`,
            [oldDetail.PurchaseID, oldDetail.PurchaseID]
        );

        // Recalculate new purchase total if it is different
        if (Number(PurchaseID) !== Number(oldDetail.PurchaseID)) {
            await connection.execute(
                `UPDATE purchases
                 SET TotalAmount = (
                     SELECT COALESCE(SUM(Quantity * UnitCost), 0)
                     FROM purchase_details
                     WHERE PurchaseID = ?
                 )
                 WHERE PurchasesID = ?`,
                [PurchaseID, PurchaseID]
            );
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Purchase detail updated successfully. Stock and purchase totals recalculated.'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Update purchase detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to update purchase detail.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// DELETE a purchase detail
async function deletePurchaseDetail(req, res) {
    let connection;

    try {
        const id = req.params.id;

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Find purchase detail
        const [details] = await connection.execute(
            `SELECT *
             FROM purchase_details
             WHERE PurchaseDetailID = ?
             FOR UPDATE`,
            [id]
        );

        if (details.length === 0) {
            const error = new Error('Purchase detail not found.');
            error.statusCode = 404;
            throw error;
        }

        const detail = details[0];

        // Reverse stock increase, only if stock is still available
        const [stockUpdate] = await connection.execute(
            `UPDATE stock
             SET AvailableQuantity = AvailableQuantity - ?
             WHERE FruitID = ?
             AND PackagingSize = ?
             AND AvailableQuantity >= ?`,
            [
                detail.Quantity,
                detail.FruitID,
                detail.PackagingSize,
                detail.Quantity
            ]
        );

        if (stockUpdate.affectedRows === 0) {
            const error = new Error(
                'Cannot delete this purchase detail because some of its stock has already been sold.'
            );
            error.statusCode = 409;
            throw error;
        }

        // Delete detail
        await connection.execute(
            'DELETE FROM purchase_details WHERE PurchaseDetailID = ?',
            [id]
        );

        // Recalculate purchase total
        await connection.execute(
            `UPDATE purchases
             SET TotalAmount = (
                 SELECT COALESCE(SUM(Quantity * UnitCost), 0)
                 FROM purchase_details
                 WHERE PurchaseID = ?
             )
             WHERE PurchasesID = ?`,
            [detail.PurchaseID, detail.PurchaseID]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Purchase detail deleted successfully. Stock and purchase total updated.'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Delete purchase detail error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to delete purchase detail.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// CREATE one purchase containing multiple fruit items
async function createBatchPurchase(req, res) {
    let connection;

    try {
        const {
            SupplierID,
            PurchaseDate,
            Items
        } = req.body;

        const validSizes = ['SMALL', 'MEDIUM', 'LARGE'];

        // Validate purchase information
        if (
            !Number.isInteger(Number(SupplierID)) ||
            Number(SupplierID) <= 0 ||
            !PurchaseDate ||
            !Array.isArray(Items) ||
            Items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'SupplierID, PurchaseDate and at least one purchase item are required.'
            });
        }

        // Validate every item
        for (let i = 0; i < Items.length; i++) {
            const item = Items[i];

            if (
                !item ||
                !Number.isInteger(Number(item.FruitID)) ||
                Number(item.FruitID) <= 0 ||
                !Number.isInteger(Number(item.Quantity)) ||
                Number(item.Quantity) <= 0 ||
                !Number.isFinite(Number(item.UnitCost)) ||
                Number(item.UnitCost) <= 0 ||
                !validSizes.includes(item.PackagingSize)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Every item must have a valid FruitID, positive Quantity, positive UnitCost and valid PackagingSize.',
                    invalidItem: i + 1
                });
            }
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // Check supplier
        const [suppliers] = await connection.execute(
            'SELECT SupplierID FROM suppliers WHERE SupplierID = ?',
            [Number(SupplierID)]
        );

        if (suppliers.length === 0) {
            const error = new Error('Supplier not found.');
            error.statusCode = 404;
            throw error;
        }

        // Combine repeated fruit and packaging combinations
        const combinedItems = {};

        for (let i = 0; i < Items.length; i++) {
            const item = Items[i];

            const key = Number(item.FruitID) + '-' + item.PackagingSize;

            if (!combinedItems[key]) {
                combinedItems[key] = {
                    FruitID: Number(item.FruitID),
                    PackagingSize: item.PackagingSize,
                    Quantity: 0,
                    UnitCost: Number(item.UnitCost)
                };
            } else if (
                combinedItems[key].UnitCost !== Number(item.UnitCost)
            ) {
                const error = new Error(
                    'Repeated fruit and packaging items must have the same UnitCost.'
                );
                error.statusCode = 400;
                throw error;
            }

            combinedItems[key].Quantity += Number(item.Quantity);
        }

        const purchaseItems = Object.values(combinedItems);

        // Sort items before locking stock records
        purchaseItems.sort(function(a, b) {
            if (a.FruitID !== b.FruitID) {
                return a.FruitID - b.FruitID;
            }

            return a.PackagingSize.localeCompare(b.PackagingSize);
        });

        let totalAmount = 0;

        // Check and lock all stock records
        for (let i = 0; i < purchaseItems.length; i++) {
            const item = purchaseItems[i];

            // Check fruit exists
            const [fruits] = await connection.execute(
                'SELECT FruitID FROM fruits WHERE FruitID = ?',
                [item.FruitID]
            );

            if (fruits.length === 0) {
                const error = new Error(
                    'Fruit not found for FruitID ' + item.FruitID + '.'
                );
                error.statusCode = 404;
                throw error;
            }

            // Lock stock record
            const [stock] = await connection.execute(
                `SELECT StockID
                 FROM stock
                 WHERE FruitID = ? AND PackagingSize = ?
                 FOR UPDATE`,
                [item.FruitID, item.PackagingSize]
            );

            if (stock.length === 0) {
                const error = new Error(
                    'Stock record not found for FruitID ' +
                    item.FruitID + ' (' + item.PackagingSize + ').'
                );
                error.statusCode = 404;
                throw error;
            }

            item.StockID = stock[0].StockID;

            totalAmount += item.Quantity * item.UnitCost;
        }

        // Create purchase header
        const [purchaseResult] = await connection.execute(
            `INSERT INTO purchases
             (SupplierID, PurchaseDate, TotalAmount)
             VALUES (?, ?, ?)`,
            [
                Number(SupplierID),
                PurchaseDate,
                totalAmount
            ]
        );

        const purchaseID = purchaseResult.insertId;

        // Insert every purchase detail and increase stock
        for (let i = 0; i < purchaseItems.length; i++) {
            const item = purchaseItems[i];

            await connection.execute(
                `INSERT INTO purchase_details
                 (PurchaseID, FruitID, Quantity, UnitCost, PackagingSize)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    purchaseID,
                    item.FruitID,
                    item.Quantity,
                    item.UnitCost,
                    item.PackagingSize
                ]
            );

            await connection.execute(
                `UPDATE stock
                 SET AvailableQuantity = AvailableQuantity + ?
                 WHERE StockID = ?`,
                [
                    item.Quantity,
                    item.StockID
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Multiple-item purchase created successfully.',
            PurchasesID: purchaseID,
            TotalAmount: totalAmount,
            ItemsProcessed: purchaseItems.length
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Batch purchase error:', error.message);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to create multiple-item purchase. All changes were rolled back.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// Export controller functions
module.exports = {
    getAllPurchaseDetails,
    getPurchaseDetailById,
    createPurchaseDetail,
    updatePurchaseDetail,
    deletePurchaseDetail,
    createBatchPurchase
};