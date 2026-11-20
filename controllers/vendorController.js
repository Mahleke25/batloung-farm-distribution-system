const db = require('../config/db');

// GET all vendors
async function getAllVendors(req, res) {
    try {
        const [vendors] = await db.execute(
            'SELECT * FROM vendors ORDER BY VendorID DESC'
        );

        res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors
        });

    } catch (error) {
        console.error('Error retrieving vendors:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vendors.'
        });
    }
}


// GET vendor by ID
async function getVendorById(req, res) {
    try {
        const vendorId = req.params.id;

        const [vendors] = await db.execute(
            'SELECT * FROM vendors WHERE VendorID = ?',
            [vendorId]
        );

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: vendors[0]
        });

    } catch (error) {
        console.error('Error retrieving vendor:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve vendor.'
        });
    }
}


// SEARCH vendors by name, phone number or location
async function searchVendors(req, res) {
    try {
        const searchTerm = req.query.q;

        if (!searchTerm || !searchTerm.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search term using ?q='
            });
        }

        const searchValue = '%' + searchTerm.trim() + '%';
        const phoneSearchValue = '%' + searchTerm.replace(/\s/g, '') + '%';

        const [vendors] = await db.execute(
            `SELECT * FROM vendors
             WHERE VendorName LIKE ?
             OR REPLACE(PhoneNumber, ' ', '') LIKE ?
             OR Location LIKE ?
             ORDER BY VendorID DESC`,
            [searchValue, phoneSearchValue, searchValue]
        );

        res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors
        });

    } catch (error) {
        console.error('Error searching vendors:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to search vendors.'
        });
    }
}


// POST create a new vendor
async function createVendor(req, res) {
    try {
        const {
            VendorName,
            PhoneNumber,
            Location,
            RegistrationDate
        } = req.body;

        if (!VendorName || !PhoneNumber || !Location || !RegistrationDate) {
            return res.status(400).json({
                success: false,
                message: 'Vendor name, phone number, location and registration date are required.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO vendors
            (VendorName, PhoneNumber, Location, RegistrationDate)
            VALUES (?, ?, ?, ?)`,
            [VendorName, PhoneNumber, Location, RegistrationDate]
        );

        res.status(201).json({
            success: true,
            message: 'Vendor registered successfully.',
            VendorID: result.insertId
        });

    } catch (error) {
        console.error('Error creating vendor:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to register vendor.'
        });
    }
}


// PUT update a vendor
async function updateVendor(req, res) {
    try {
        const vendorId = req.params.id;

        const {
            VendorName,
            PhoneNumber,
            Location,
            RegistrationDate
        } = req.body;

        if (!VendorName || !PhoneNumber || !Location || !RegistrationDate) {
            return res.status(400).json({
                success: false,
                message: 'Vendor name, phone number, location and registration date are required.'
            });
        }

        const [result] = await db.execute(
            `UPDATE vendors
            SET VendorName = ?,
                PhoneNumber = ?,
                Location = ?,
                RegistrationDate = ?
            WHERE VendorID = ?`,
            [VendorName, PhoneNumber, Location, RegistrationDate, vendorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vendor updated successfully.'
        });

    } catch (error) {
        console.error('Error updating vendor:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to update vendor.'
        });
    }
}


// DELETE a vendor
async function deleteVendor(req, res) {
    try {
        const vendorId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM vendors WHERE VendorID = ?',
            [vendorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vendor deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting vendor:', error.message);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this vendor because the vendor has existing sales records.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete vendor.'
        });
    }
}


// Export all controller functions
module.exports = {
    getAllVendors,
    getVendorById,
    searchVendors,
    createVendor,
    updateVendor,
    deleteVendor
};