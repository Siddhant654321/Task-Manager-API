const express = require('express');
const Users = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const sendMail = require('../emails/account');
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        const fileName = file.originalname.split('.');
        if(['jpg', 'png', 'jpeg'].includes(fileName[fileName.length-1])){
            return cb(undefined, true)
        }
        cb(new Error('Unsupported file extension'))
    }
})

router.post('/users', async (req,res) => {
    const newUser = new Users(req.body)
    try{
        await newUser.save();
        const token = await newUser.generateAuthToken();
        res.status(201);
        res.send({user: newUser.getProfileData(), token});
        sendMail.sendWelcomeEmail(newUser.email, newUser.name)
    } catch(e) {
        res.status(400);
        res.send(e);
    }
})

router.post('/users/login', async (req,res) => {
    try{
        const user = await Users.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user: user.getProfileData(), token});
    } catch (e) {
        res.status(400).send();
    }
})


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(value => {
            return req.token != value.token;
        })
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

router.post('/users/logout-everyone', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user.getProfileData());
})

router.patch('/users/me', auth, async (req,res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValid = updates.every((value) => allowedUpdates.includes(value));
    if(!isValid){
        return res.status(400).send({error: 'Invalid updates'});
    }
    try{
        updates.forEach(value => req.user[value] = req.body[value]);
        req.user = await req.user.save();
        if(req.user){
            return res.send(req.user.getProfileData());
        }
        res.status(404).send();
    } catch(e) {
        res.status(400).send(e);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const avatar = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();
    req.user.avatar = avatar;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message});
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    req.user.save();
    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
 try{
    const user = await Users.findById(req.params.id);
    
    if(!user || !user.avatar){
        throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
    } catch (e){ 
        res.status(404).send();
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendMail.sendCancellationEmail(req.user.email, req.user.name);
        return res.send(req.user.getProfileData());
    } catch (e) {
        res.status(500).send();
    }
})


module.exports = router;