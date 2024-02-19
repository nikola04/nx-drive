const express = require('express');
const cookieParser = require('cookie-parser');
//models
const User = require('../models/user');
//libs
const getData = require('../Libs/userdata');

const router = express.Router();
router.use(cookieParser());
router.use(express.json());

router.get('/', async (req, res) => {
    if(req.cookies['authT']){
        const result = await getData(req.cookies['authT'], req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            res.render('account.ejs', { user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } , nav_scripts: scripts('nav', result.language) });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});

module.exports = router;