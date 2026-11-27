const express = require('express');
const { ACADEMIC_STRUCTURE } = require('../config/academic-data.js');

const router = express.Router();

// عامة (بدون protect) لأن صفحة التسجيل محتاجاها قبل ما يبقى فيه token
router.get('/structure', (req, res) => {
    res.status(200).json({ status: 'success', data: { structure: ACADEMIC_STRUCTURE } });
});

module.exports = router;