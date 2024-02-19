const jwt = require('jsonwebtoken');
//models
const InvToken = require('../models/invld_tkns');
const User = require('../models/user');

const getData = async (token, ip) => {
    try{
        const user = jwt.verify(token, process.env.JWT_SECRET);
        if(user.email != undefined){
            const email = user.email;
            const result = await User.findOne({ email: email }).lean();
            if(!result) return null;
            else return result;
        }else return null;
    }catch(err){
        try{
            const insert = await InvToken.create({
                type: err.name,
                ip: ip,
                message: err.message
            });
            if(insert) return null;
        }catch(error){
            console.log(error);
            return null;
        }
    }
}
module.exports = getData;