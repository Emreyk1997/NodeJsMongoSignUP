const express = require('express');
const router = new express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer')
const sharp = require('sharp');
const {sendConfirmationEmail, sendCancelationEmail} = require('../emails/account');

const imageMaxSize = 4000000;

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
       await user.save();
       sendConfirmationEmail(user.email, user.name);
       const token = await user.generateAuthToken();
        res.status(201).send({ user, token }); 
    } catch (err) {
        res.status(400).send(err.message)
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.status(200).send({user, token});
    } catch (error) {
        res.status(400).send(error.message ? error.message : error);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        console.log('LOGOUT')
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        });
        await req.user.save();
        res.status(200).send('Logged out');
    } catch (error) {
        res.status(500).send(error.message ? error.message : error);
    }
});

router.post('/users/logoutAllSessions', auth, async (req, res) => {
    try {
        console.log('LOGOUT1')
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send('Logged out from all sessions');
    } catch (error) {
        res.status(500).send(error.message ? error.message : error);
    }
});

const upload = multer({
    //dest: 'avatars', You dont want to save it to file system because every deploy to Heroku erases all of them
    limits: {
        fileSize: imageMaxSize
    },
    fileFilter(req, file, cb) {
        //use with || or use regex
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //send error
            return cb(new Error('Please upload a .jpg, .jpeg or .png files'));
        }
        //accept
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
        //If you dont specify dest in multer, it will take the image to req.file.buffer
        console.log('BUFFER', req.file.buffer.width);
        //This resizes the image to 250X250 with white background
        const buffer = await sharp(req.file.buffer).png().flatten({ background: { r: 255, g: 255, b: 255 }}).resize({width: 250, height: 250, fit: 'contain', background: {r:255,g:255,b:255,alpha:1} }).toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.status(200).send('Avatar uploaded!');
}, (error, req, res, next) => { // This action is for handling middleware (HTML) errors
    res.status(400).send({error: error.message})
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send('Avatar deleted!');
}, (error, req, res, next) => { // This action is for handling middleware (HTML) errors
res.status(400).send({error: error.message})
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error('No image!')
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(400).send(error.message ? error.message : error)
    }
});

router.get('/users/me', auth, async (req, res) => {
    //auth returns user to req.user
    res.status(200).send(req.user);
    // try {
    //   let data = await User.find({});
    //   res.status(200).send(data)  
    // } catch (error) {
    //     res.status(400).send(error.message ? error.message : error)
    // }
    
    // User.find({}).then(data => {
    //     res.status(200).send(data)
    // }).catch(err => res.status(400).send(err.message ? err.message : err))
});

router.get('/users/:email', async (req, res) => {
    try {
        let data = await User.findOne(req.params);
        if(data) {
            return res.status(200).send(data)
        }
    } catch (error) {
        res.status(400).send(error.message ? error.message : error)
    }

});

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findOneAndDelete(req.user.email);
        // if(!user) {
        //     return res.status(400).send('No user with this email to delete');
        // }

        //Easy mongoose remove
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        //dont forget to delete other related things such as Tasks
        //In this example .remove middleware deletes the Tasks
        return res.status(200).send(req.user);

    } catch (error) {
        res.status(500).send(error.message ? error.message : error);
    }
});


router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdated = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((item) => {
        return allowedUpdated.includes(item);
    });
    //Checks if operation is inside the allowed operations list
    if (!isValidOperation) {
        return res.status(400).send('Invalid updates');
    }
    try {
        //Changed because it is a direct db call and passes middleware
        // let user = await User.findOneAndUpdate(req.params, req.body, { new: true, runValidators: true });
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        return res.status(200).send(req.user)
    } catch (error) {
        res.status(400).send(error.message ? error.message : error)
    }

});

/*

// OLD!!!!!!!!!!!
router.patch('/users/:email', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdated = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((item) => {
        return allowedUpdated.includes(item);
    });
    //Checks if operation is inside the allowed operations list
    if (!isValidOperation) {
        return res.status(400).send('Invalid updates');
    }

    try {
        //Changed because it is a direct db call and passes middleware
        // let user = await User.findOneAndUpdate(req.params, req.body, { new: true, runValidators: true });
        let user = await User.findOne(req.params);
        updates.forEach((update) => {
            user[update] = req.body[update];
        });
        await user.save()
        if(user) {
            return res.status(200).send(user)
        } else {
            return res.status(400).send('No user with this email to update');
        }
    } catch (error) {
        res.status(400).send(error.message ? error.message : error)
    }
    // User.findOne(req.params).then(data => {
    //     console.log(data)
    //     if(data) {
    //         return res.status(200).send(data)
    //     }
    //     return res.status(400).send('NO EMAIL')
    // }).catch(err => res.status(400).send(err.message ? err.message : err))
    // User.find({}).then(data => {
    //     res.status(200).send(data)
    // }).catch(err => res.status(400).send(err.message ? err.message : err))
});
*/
module.exports = router;