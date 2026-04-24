const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

router.post(
    '/api/register/candidate',
    [
        body('full_name').notEmpty().withMessage('Full name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').isLength({ min: 10 }).withMessage('Phone must be at least 10 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { full_name, email, phone, location, skills, experience, resume_text } = req.body;

        try {
            const emailCheck = await pool.query(
                'SELECT id FROM candidates WHERE email = $1',
                [email]
            );

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            const result = await pool.query(
                'INSERT INTO candidates (full_name, email, phone, location, skills, experience, resume_text) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [full_name, email, phone, location, skills, experience, resume_text || null]
            );

            return res.status(201).json({
                success: true,
                message: 'Registration Successful',
                id: result.rows[0].id
            });

        } catch (err) {
            console.error('Error registering candidate:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
);

module.exports = router;
