const express = require('express')

const loginRouter = express();
const User = require('../models/user');

// Bcrypt for passwords
const bcrypt = require('bcryptjs');
const salt = 10;

//config info
const SECRET = require('../config/config').Secret;
const GOOGLE_ID = require('../config/config').GOOGLE_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

// GOOGLE AUTH
const { OAuth2Client } = require('google-auth-library');

const jwt = require('jsonwebtoken');

loginRouter.post('/', (req, res)=>{
    
    const body = req.body;

    User.findOne({email: body.email}, (err, user)=>{
        if(err){
            return res.status(500).json({
                ok: false,
                message: 'Error getting user',
                errors: err,
            })
        }

        if(!user){
            return res.status(400).json({
                ok: false,
                message: 'Email or password incorrects email',
                errors: err
            })
        }

        if( !bcrypt.compareSync(body.password, user.password) ){
            return res.status(400).json({
                ok: false,
                message: 'Email or password incorrects pass',
                errors: err
            })
        }

        user.password = 'Not displayed';
        // Creating token
        const token = jwt.sign({ user: user}, SECRET, {expiresIn: 14400}); // 4 horas

        return res.status(200).json({
            ok: true,
            token: token,
            user: user
        })
    })
    
})

loginRouter.post('/google', (req, res, next) =>{
    
    const client = new OAuth2Client(GOOGLE_ID, '');
    const token = req.body.token || '';


    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // If request specified a G Suite domain:
        //const domain = payload['hd'];

        User.findByIdAndRemove({email: payload.email}, (err, user)=>{
            if(err){
                return res.status(500).json({
                    ok:false,
                    message: "Error with this user",
                    errors: err
                })
            }
            if(user){
                if(!user.google){
                    return res.status(400).json({
                        ok:false,
                        message: "You should authenticate with google",
                        errors: err
                    })
                } else {
                    user.password = 'Not displayed';
                    // Creating token
                    const token = jwt.sign({ user: user}, SECRET, {expiresIn: 14400}); // 4 horas
            
                    return res.status(200).json({
                        ok: true,
                        token: token,
                        user: user
                    })
                }
            }else{
                const user = new User();

                user.name = payload.name;
                user.email = payload.email;
                user.password = '.';
                user.img = payload.picture;

                user.save((err, user)=> {
                    if(err){
                        return res.status(500).json({
                            ok:false,
                            message: "Error creating user",
                            errors: err
                        })
                    }

                    const token = jwt.sign({ user: user}, SECRET, {expiresIn: 14400}); // 4 horas
                    
                    return res.status(200).json({
                        ok: true,
                        token: token,
                        user: user
                    })

                })
            }
        })

      }
      verify().catch((err)=>{
          return res.status(401).json({
              ok: false,
              message: 'Unauthorized user',
              errors: err
          })
      });
})

module.exports = loginRouter;
