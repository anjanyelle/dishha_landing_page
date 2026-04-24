const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

router.post(
    '/api/register/client',
    [
        body('company_name').notEmpty().withMessage('Company name is required'),
        body('hr_name').notEmpty().withMessage('HR name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').isLength({ min: 10 }).withMessage('Phone must be at least 10 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { company_name, hr_name, email, phone, requirements } = req.body;

        try {
            const emailCheck = await pool.query(
                'SELECT id FROM clients WHERE email = $1',
                [email]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            const result = await pool.query(
                'INSERT INTO clients (company_name, hr_name, email, phone, requirements) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [company_name, hr_name, email, phone, requirements]
            );

            return res.status(201).json({
                success: true,
                message: 'Registration Successful',
                id: result.rows[0].id
            });

        } catch (err) {
            console.error('Error registering client:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

module.exports = router;
