const db = require('../config/db');

async function getAllSuppliers(req, res) {
    try {
        const [suppliers] = await db.execute(
            'SELECT * FROM suppliers ORDER BY SupplierID DESC'
        );

        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });

    } catch (error) {
        console.error('Error retrieving suppliers:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve suppliers.'
        });
    }
}

async function getSupplierById(req, res) {
    try {
        // Get the supplier ID from the URL
        const supplierId = req.params.id;

        // Search for the supplier in the database
        const [suppliers] = await db.execute(
            'SELECT * FROM suppliers WHERE SupplierID = ?',
            [supplierId]
        );

        // Check whether the supplier exists
        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        // Return the supplier
        res.status(200).json({
            success: true,
            data: suppliers[0]
        });

    } catch (error) {
        console.error('Error retrieving supplier:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve supplier.'
        });
    }
}

async function getSupplierById(req, res) {
    try {
        // Get the supplier ID from the URL
        const supplierId = req.params.id;

        // Search for the supplier in the database
        const [suppliers] = await db.execute(
            'SELECT * FROM suppliers WHERE SupplierID = ?',
            [supplierId]
        );

        // Check whether the supplier exists
        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        // Return the supplier
        res.status(200).json({
            success: true,
            data: suppliers[0]
        });

    } catch (error) {
        console.error('Error retrieving supplier:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve supplier.'
        });
    }
}

async function createSupplier(req, res) {
    try {
        // Receive supplier information from the request
        const {
            BusinessName,
            ContactPerson,
            Phone,
            Province,
            Address
        } = req.body;

        // Check that all required fields are provided
        if (!BusinessName || !ContactPerson || !Phone || !Province || !Address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all supplier details.'
            });
        }

        // Insert the new supplier into the database
        const [result] = await db.execute(
            `INSERT INTO suppliers
            (BusinessName, ContactPerson, Phone, Province, Address)
            VALUES (?, ?, ?, ?, ?)`,
            [BusinessName, ContactPerson, Phone, Province, Address]
        );

        // Respond with the newly created supplier ID
        res.status(201).json({
            success: true,
            message: 'Supplier created successfully.',
            SupplierID: result.insertId
        });

    } catch (error) {
        console.error('Error creating supplier:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to create supplier.'
        });
    }
}

async function updateSupplier(req, res) {
    try {
        // Get supplier ID from the URL
        const supplierId = req.params.id;

        // Receive updated information
        const {
            BusinessName,
            ContactPerson,
            Phone,
            Province,
            Address
        } = req.body;

        // Check that all fields are provided
        if (!BusinessName || !ContactPerson || !Phone || !Province || !Address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all supplier details.'
            });
        }

        // Update supplier in the database
        const [result] = await db.execute(
            `UPDATE suppliers
            SET BusinessName = ?,
                ContactPerson = ?,
                Phone = ?,
                Province = ?,
                Address = ?
            WHERE SupplierID = ?`,
            [
                BusinessName,
                ContactPerson,
                Phone,
                Province,
                Address,
                supplierId
            ]
        );

        // Check whether the supplier exists
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplier updated successfully.'
        });

    } catch (error) {
        console.error('Error updating supplier:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update supplier.'
        });
    }
}

async function deleteSupplier(req, res) {
    try {
        // Get supplier ID from the URL
        const supplierId = req.params.id;

        // Delete supplier from the database
        const [result] = await db.execute(
            'DELETE FROM suppliers WHERE SupplierID = ?',
            [supplierId]
        );

        // Check whether the supplier exists
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting supplier:', error.message);

        // Handle foreign key restriction
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this supplier because purchase records are linked to it.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete supplier.'
        });
    }
}

module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};