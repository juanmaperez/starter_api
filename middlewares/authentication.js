
const express = require('express')

const SECRET = require('../config/config').Secret;

const jwt = require('jsonwebtoken');

// Middleware for verify token
exports.verifyToken = function (req, res, next){
    
    // const token = req.query.token;
    const token = req.headers.authorization;

    jwt.verify(token, SECRET, (err, decoded)=>{
        if(err){
            return res.status(401).json({
                ok: false,
                message: 'Unauthorized. Token not valid',
                errors: err
            })
        }

        // Decoded return data about the user who made the request
        // and we could use it to verify other things or know who created, deleted or updated whatever.
        req.user = decoded.user;
        return next();
    })
}