const { Router } = require('express');
const User = require('../model/report');
const router = Router();

router.post('/user', async (req, res) => {
    const { FullName, email, content } = req.body;

    try {
      
        if (!FullName || !email || !content) {
            return res.render('/', { error: 'All fields are required!' });
        }

   
        await User.create({ FullName, email, content });
        return res.redirect('/');
    } catch (error) {
        console.error('Error creating report:', error);

 
        const errorMessage = error.code === 11000
            ? 'Email already exists. Please use a different one!'
            : 'User registration failed. Try again!';
        return res.render('/', { error: errorMessage });
    }
});

module.exports = router;