const express = require('express');
const fs = require('fs');
const path = require('path')
const upload = require('express-fileupload');
const process = require('process');
const mongodb = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const paypal = require('paypal-rest-sdk');
const zip = require('express-zip');
const fse = require('fs-extra');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const {ThrottleGroup} = require("stream-throttle");
const { v1: uuidv1,v4: uuidv4 } = require('uuid');
//const schedule = require('node-schedule');
require('dotenv/config');
const Files = require('./models/files');
const User = require('./models/user');
const Payment = require('./models/payments');
const Login = require('./models/logins');
const Share = require('./models/shares');
const cors = require('cors');
const app = express();
const vhost = require('vhost');
//const sharp = require('sharp');
const account = require('./routes/account')
const resize = require('./Libs/resize');
const sendEmail = require('./Libs/email');
const getData = require('./Libs/userdata');
const { moveAll, copyAll } = require('./Libs/files');
const scripts = require('./scripts/drive');

app.use(express.static(__dirname + '/public'))
//app.use(vhost('ncloud.net', express.static(__dirname + '/public')))
//
app.use(express.json());
app.use(upload());
app.use(cookieParser());
app.use(cors({
    origin: '*'
}))

path.dirname(process.execPath)

app.set("views", "./views")
app.set('view engine', 'ejs')

// app.use('/account', account);

mongodb.connect(process.env.DB_CONN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

paypal.configure({
    mode: 'sandbox', //sandbox or live
    client_id: 'AbF0TQZUfI3qHKCLrizCXhsGHbgs3EP5YMeigrtbWRfaRI0eFwA7yyEp5YoGhg8d5L-0c4Py1k2ZR7J8',
    client_secret: 'ELs944H7cCwkevXvkAcQVmH0eDYCbVUdb5wDYfwrGoYh24flesY8R4phlULSnvdhAWWL2mv4TCQcmFoX'
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PWD
    }
});

const getTypeByExt = (e) => {
    if(e == 'png' || e == 'jpg' || e == 'jpeg' || e == 'gif' || e == 'jpg' || e == 'webp' || e == 'tiff' || e == 'tif' || e == 'bmp')
        return {type: 'image', mime: 'image/' + e };
    else if(e == 'pdf')
        return {type: 'application', mime: 'application/pdf'};
    else if(e == 'svg')
        return {type: 'image', mime: 'image/svg+xml'};
    else if(e == 'mp4' || e == '3gp')
        return {type: 'video', mime: 'video/' + e};
    else if(e == 'avi')
        return {type: 'video', mime: 'video/x-msvideo'};
    else if(e == 'wmv')
        return {type: 'video', mime: 'video/x-ms-wmv'};
    else if(e == 'm3u8')
        return {type: 'application', mime: 'application/x-mpegURL'};
    else if(e == 'mp3')
        return {type: 'audio', mime: 'audio/' + e};
    else if(e == 'amr')
        return {type: 'audio', mime: 'audio/amr-wb'};
    else if(e == 'm4a')
        return {type: 'audio', mime: 'audio/mp4'};
    return {type: 'application', mime: 'application/octet-stream'};
}

const checkForPerms = async (file, user_id) => {
    if(file.owner_id == user_id) return true;
    else{
        //check is file shared with user
        const file_share = await Share.findOne({ file_id: file._id, shared_with: user_id }).lean();
        if(file_share) return true;
        else{
            //check if directory is shared
            const dirs = file.path.split('/').filter(el => { if(el.length > 0) return el; });
            for(let i = dirs.length - 1; i >= 0; i++){
                const dir = await Files.findOne({ name: dirs[i] }).lean();
                if(dir){
                    const dir_share = await Share.findOne({ file_id: dir._id }).lean();
                    if(dir_share){
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
const getPath = async (dir_name) => {
    dir_name = dir_name.replace('/', '');
    const paths = [];
    const dir = await Files.findOne({ name: dir_name, folder: true }).lean();
    if(dir){
        let path = dir.path;
        path = path.split('/').filter(el => { if(el != ' ') return el.trim(); });
        for(let i = 0; i < path.length; i++){
            const folder = await Files.findOne({ name: path[i] });
            paths.push({ name: folder.givenName, path: folder.name });
        };
        paths.push({ name: dir.givenName, path: dir.name });
    }
    return paths;
}
app.post('/find_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            if(req.body.name){
                const folder = req.body.name;
                const file = await Files.findOne({ _id: folder }).lean();
                let path = file.path;
                if(path == '/') path += file.name;
                else path += '/' + file.name;
                await Files.updateOne({ _id: file._id }, { entered: Date.now() });
                return res.json({ status: 'OK', name: file.name });
            }else return res.json({ status: 'ERROR', error: 'Error in sent data.' })
        }else return res.json({ status: 'ERROR', error: 'Not logged in!' });
    }else return res.json({ status: 'ERROR', error: 'Not logged in!' })
})
app.post('/get_suggested', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const files = await Files.find({ owner_id: result._id, deleted: false, folder: false }).sort({ entered: -1 }).limit(16).lean();
            const len = files.length;
            for(let i = 0; i < len; i++){
                for(let j = 0; j < len; j++){
                    if(files[j].entered_times < files[i].entered_times){
                        const temp = files[j];
                        files[j] = files[i];
                        files[i] = temp;
                    }
                }
            }
            const sortedData = [];
            const f_len = (files.length < 9) ? files.length : 9; 
            for(let i = 0; i < f_len; i++){
                const file = files[i];
                sortedData.push({ id: file.name, name: file.givenName, type: file.file_type, favorite: file.favorite, entered_date: file.entered, ext: file.ext, size: file.file_size, date: file.createdAt });
            }
            return res.json({ status: 'OK', data: sortedData });
        }else return res.json({ status: 'ERROR', error: 'Not logged in!' });
    }else return res.json({ status: 'ERROR', error: 'Not logged in!' })
});
app.post('/search', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const query = req.body.query;
            if(query.length > 0){
                const results = await Files.find({ owner_id: result._id, givenName: { $regex: query, $options: 'i' }, deleted: false }).limit(7).sort({ entered: -1 }).lean();
                const data = [];
                results.forEach(res => {
                    let type = 'file';
                    if(res.folder)  type = 'folder';
                    else type = res.file_type;
                    data.push({ id: res._id, name_id: res.name, name: res.givenName, favorite: res.favorite, type: type, ext: res.ext });
                })
                return res.json({ status: 'OK', data: data });
            }else{
                const results = await Files.find({ owner_id: result._id, deleted: false }).limit(7).sort({ entered: -1 }).lean();
                const data = [];
                results.forEach(res => {
                    let type = 'file';
                    if(res.folder)  type = 'folder';
                    else type = res.file_type;
                    data.push({ id: res._id, name_id: res.name, name: res.givenName, favorite: res.favorite, type: type, ext: res.ext });
                });
                return res.json({ status: 'OK', data: data });
            }
        }else return res.json({ status: 'ERROR', error: 'Not logged in!' });
    }else return res.json({ status: 'ERROR', error: 'Not logged in!' })
})
app.post('/upload_file', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            try{
                if(!req.files) {
                    res.send({
                        status: false,
                        message: 'No file uploaded'
                    });
                } else {
                    const req_len = req.files.files_arr.length;
                    const blob = req.files.document;
                    let upload_path = JSON.parse(Buffer.from(blob.data,'binary').toString()).path;
                    if(upload_path == "") upload_path = '/';
                    if(upload_path != "/"){
                        const dir = await Files.findOne({ name: upload_path }).lean();
                        if(dir) upload_path = dir.path + '/' + dir.name;
                        else return res.send({ status: 'error', error: 'Directory do not exists.' });
                    }
                    const uploaded_files = [];
                    if(req_len > 0){
                        req.files.files_arr.forEach(file => {
                            uploaded_files.push(file);
                        })
                    }else uploaded_files.push(req.files.files_arr);
                    const up_len = uploaded_files.length;
                    const files = [];
                    const errors = [];
                    for(let i = 0; i < up_len; i++){
                        const file = uploaded_files[i];
                        const plan = result.payment_plan;
                        let max = 0;
                        if(plan === 1) max = process.env.PLAN_1;
                        else if(plan === 2) max = process.env.PLAN_2;
                        else if(plan === 3) max = process.env.PLAN_3;
                        else max = process.env.PLAN_0;
                        const used = result.used_space;
                        if(used + file.size <= max){
                            await User.updateOne({ _id: result._id }, { $inc: { used_space: file.size } });
                            let id = uuidv4();
                            const split = (file.name).split('.');
                            const ext = split[split.length - 1];
                            id += '.' + ext;
                            const fileCType = getTypeByExt(ext);
                            file.mv(`./uploads/user${result._id}` + '/' + upload_path + '/' + id);
                            Files.create({
                                owner_id: result._id,
                                givenName: file.name,
                                name: id,
                                path: upload_path,
                                folder: false,
                                ext: ext,
                                file_size: file.size,
                                file_type: fileCType.type,
                                contentType: fileCType.mime
                            });
                            files.push({ id: id, name: file.name });
                        }else errors.push({ name: file.name });
                    }
                    return res.send({ status: 'success', files: files, n_upl: errors });
                }
            }catch(err){
                return res.send({ status: 'error', error: err.code, message: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/api/login', async (req, res) => {
    const { f_email, f_pass } = req.body;
    const result = await User.findOne({ email: f_email }).lean();
    if(result /*&& result.verified_email*/)
        bcrypt.compare(f_pass, result.password).then(async resp => {
            if(resp){
                const token = jwt.sign({
                    email: result.email
                }, process.env.JWT_SECRET, { expiresIn: '7d' });
                const ua = req.headers['user-agent'] || '';
                const create = await Login.create({
                    user_id: result._id,
                    ip: req.header('x-forwarded-for') || req.connection.remoteAddress,
                    userAgent: ua
                })
                var expiryDate = new Date(Number(new Date()) + (1000 * 60 * 60 * 24 * 7)); 
                res.cookie('authT', token, { expires: expiryDate, httpOnly: true }) 
                return res.json({ status: 'OK' });
            }else return res.json({ status: 'ERROR', error: 'Invalid creditionals!' });
        });
    else if(result && !result.verified_email) return res.json({ status: 'ERROR', code: 'UNVF', error: 'User is not verified!' });
    else return res.json({ status: 'ERROR', error: 'Invalid creditionals!' });
});
const validatePswd = pass => {
    const regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$');
    return regex.test(pass);
}
const sendVerificationMail = async (recipient, token) => {
    const user = await User.findOne({ email: recipient }).lean();
    if(user != null){
        const time_now = Date.now();
        if(user.verification_email_expire_date == null || user.verification_email_expire_date >= time_now){
            const new_expire_date = new Date();
            new_expire_date.setMinutes(new_expire_date.getMinutes() + 10);
            const upd = await User.updateOne({ email: recipient }, { $set: { verification_email_expire_date: new_expire_date } }).lean();
            message = {
                to: recipient,
                subject: "Email Verification",
                html: `<p style="font-size: 18px; color: #212121; font-family: 'Roboto'; margin-bottom: 32px;">Hello <b>${user.f_name}</b>!</p><p style="color: #212121">Verify Email by clicking link bellow:</p><a href="http://ncloud.net/verify_email/${user.email}/${token}">http://ncloud.net/verify_email/${user.email}/${token}</a>`
            }
            if(upd) {
                  const mailOptions = {
                    from: 'no-reply@ncloud.net',
                    to: message.to,
                    subject: message.subject,
                    html: message.html
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
            }
        }
    }
}
app.get('/verify_email', (req, res) => {
    res.render('verify_email.ejs');
})
app.get('/verify_email/:email/:token', async (req, res) => {
    const email = req.params.email;
    const token = req.params.token;
    const user = await User.findOne({ email: email }).lean();
    if(user != null){
        if(user.verification_email_expire_date != null && user.verification_email_expire_date >= new Date()){
            if(user.email_verification_token == token && user.email_verification_token != null && user.email_verification_token != ""){
                //token is valid
                //reset attempts
                const upd = await User.updateOne({ email: email }, { $set : { verified_email: true } }).lean();
                if(upd) return res.redirect('/login/'+email);
                else return res.json({ status: 'ERROR', error: 'An Error has occured!' });
            }else if(user.email_verification_token == null){
                return res.json({ status: 'ERROR', error: 'Token is not valid, Resend Email!' });
            }else{
                //user token is not valid
                //probably add one more attempt
                //if attempt is greater than 3:
                //  reset token
                //  block for 1minute(first time, second time)
                //  block for 3minutes(third time)
                //  block for 5minutes(fourth time)
                //  block for 15minutes(every other try)
                return res.json({ status: 'ERROR', error: 'Token is not valid!' });
            }
        }else{
            //token expired
            console.log(user.verification_email_expire_date >= new Date())
            const new_expire_date = new Date();
            new_expire_date.setMinutes(new_expire_date.getMinutes() + 10);
            const upd = await User.updateOne({ email: email }, { $set : { email_verification_token: "", verification_email_expire_date: new_expire_date, email_verification_token: null } }).lean();
            if(upd) return res.json({ status: 'ERROR', error: 'Token Expired!' });
            else {
                console.log('expired token, update error.')
                return res.json({ status: 'ERROR', error: 'Token Expired!' });
            }
        }
    }else return res.json({ status: 'ERROR', error: 'Not Found' });
});
app.post('/api/register', async (req, res) => {
    const { f_email, f_pass, f_name } = req.body;
    if(f_email && f_email.length > 0 && f_name && f_name.length > 0){
        if(validatePswd(f_pass)){
            const result = await User.findOne({ email: f_email }).lean();
            if(!result){
                try{
                    const hash = bcrypt.hashSync(f_pass, 11);
                    if(hash) {
                        const token = uuidv4();
                        const save = await User.create({ 
                            email: f_email,
                            password: hash,
                            f_name: f_name,
                            email_verification_token: token
                        });
                        if(save) {
                            const user_id = save.id;
                            try{
                                fs.mkdirSync(`./uploads/user${user_id}`,'0777', true);
                                //const sent = await sendVerificationMail(f_email, token);
                                const sent = true;
                                if(sent) {
                                    const token = jwt.sign({
                                        email: f_email
                                    }, process.env.JWT_SECRET, { expiresIn: '7d' });
                                    const ua = req.headers['user-agent'] || '';
                                    const create = await Login.create({
                                        user_id: result._id,
                                        ip: req.header('x-forwarded-for') || req.connection.remoteAddress,
                                        userAgent: ua
                                    })
                                    var expiryDate = new Date(Number(new Date()) + (1000 * 60 * 60 * 24 * 7)); 
                                    res.cookie('authT', token, { expires: expiryDate, httpOnly: true }) 
                                    return res.json({ status: 'OK' });
                                }else return res.json({ status: 'OK' });
                            }catch(err){
                                return res.json({ status: 'ERROR', error: 'An unexpected error has occured!' })
                            }
                        }else return res.json({ status: 'ERROR', error: 'An unexpected error has occured!' })
                    }else return res.json({ status: 'ERROR', error: 'An unexpected error has occured!' });
                }catch(err){
                    console.log(err);
                    return res.send(err);
                }
            }else return res.json({ status: 'ERROR', error: 'Email Already Registered!' });
        }else return res.json({ status: 'ERROR', error: 'Password is not Valid!' });
    }else return res.json({ status: 'ERROR', error: 'Please fill all Fields!' });
});
app.post('/copy_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const ids = req.body.data;
            try{
                const docs = [];
                let user_storage = null;
                const failed = [];
                const ids_len = ids.length;
                for(let i = 0; i < ids_len;i++){
                    const id = ids[i];
                    const file_info = await Files.findOne({ name: id, owner_id: result._id }).lean();
                    const plan = result.payment_plan;
                    let max = 0;
                    if(plan === 1) max = process.env.PLAN_1;
                    else if(plan === 2) max = process.env.PLAN_2;
                    else if(plan === 3) max = process.env.PLAN_3;
                    else max = process.env.PLAN_0;
                    const used = result.used_space;
                    const totalUsed = getTotalSize(`./uploads/user${result._id}/`);
                    await User.updateOne({ _id: result._id }, { $set: { used_space: totalUsed } }).lean();
                    let file_size = file_info.file_size;
                    if(file_info.folder) file_size = getTotalSize(`./uploads/user${result._id}/` + file_info.path + '/' + file_info.name);
                    if(totalUsed + file_size <= max){
                        user_storage = { used: totalUsed + file_size, max: max };
                        const update = await User.updateOne({ _id: result._id }, { $set: { used_space: used + file_info.file_size } });
                        if(!file_info.folder){
                            await Files.updateOne({ name: id, owner_id: result._id }, { $set: { have_copies: true, copied: file_info.copied + 1 } }).lean();
                            let file_path = file_info.path;
                            if(file_path == '/') file_path = '';
                            const new_id = uuidv4();
                            const file_name = file_info.givenName;
                            const splitted = file_name.split('.');
                            let new_name = '';
                            const spl_len = splitted.length;
                            if(spl_len > 1){
                                for(let i = 0; i < spl_len - 1; i++){
                                    new_name += splitted[i];
                                    if(i < splitted.length - 2){
                                        new_name += '.';
                                    }
                                }
                            }else new_name = file_info.givenName;
                            if(file_info.have_copies){
                                const num = file_info.copied;
                                new_name += ` - Copy (${num}).`;
                            }else new_name += ' - Copy.';
                            new_name += file_info.ext;
                            const n_file = await Files.create({
                                owner_id: result._id,
                                givenName: new_name,
                                name: new_id + '.' + file_info.ext,
                                path: file_info.path,
                                ext: file_info.ext,
                                copy_of: file_info.name,
                                file_type: file_info.file_type,
                                file_size: file_info.file_size,
                                contentType: file_info.contentType,
                                folder: false
                            });
                            const main_path = `./uploads/user${result._id}`;
                            fs.copyFileSync(main_path + file_path + '/' + file_info.name, main_path + file_path + '/' + new_id + '.' + file_info.ext);
                            if(n_file) docs.push({ id: n_file.name, name: n_file.givenName, type: n_file.file_type, favorite: false, ext: n_file.ext, size: n_file.file_size, date: n_file.createdAt });
                        }else{
                            const dir = await copyAll(file_info.path ,file_info.name, result._id);
                            if(dir) {
                                dir.size = file_size;
                                docs.push(dir);
                            }
                        }
                    }else failed.push(id);
                }
                return res.json({ status: 'OK', failed: failed, user_storage: user_storage, error: false, docs: docs });
            }catch(err){
                console.log(err)
                return res.json({ status: 'ERROR', error: true, msg: err })
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/rm_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const ids = req.body.data;
            try{
                const ids_len = ids.length;
                for(let i = 0; i < ids_len;i++){
                    const id = ids[i];
                    const upd = await Files.updateOne({ name: id, owner_id: result._id }, { $set: { deleted: true }}).lean();
                }
                return res.json({ status: 'OK' });
            }catch(err){
                return res.json({ status: 'ERROR', error: err })
            }
            return res.json({ status: 'ERROR', error: 'INVALID DATA' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/recover_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const ids = req.body.data;
            try{
                const ids_len = ids.length;
                for(let i = 0; i < ids_len;i++){
                    const id = ids[i];
                    const upd = await Files.updateOne({ name: id }, { $set: { deleted: false }}).lean();
                }
                return res.json({ status: 'OK' });
            }catch(err){
                return res.json({ status: 'ERROR', error: err })
            }
            return res.json({ status: 'ERROR', error: 'INVALID DATA' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/mk_file', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const body = req.body;
            const name = body.fileName;
            let file_path = body.path;
            if(body.path == "") file_path = '/';
            try{
                const id = uuidv4();
                const create = await Files.create({ 
                    owner_id: result._id,
                    givenName: name + '.txt',
                    name: id + '.txt',
                    path: file_path,
                    ext: 'txt',
                    file_type: 'text',
                    contentType: 'text/plain',
                    folder: false
                });
                const path = './uploads/' + `user${result._id}` + file_path + '/' + id + '.txt';
                const data = "////////////////////////////////////\n///This file is created on NCloud///\n////////////////////////////////////\n";
                fs.writeFileSync(path, data);
                return res.json({ status: 'OK' });
            }catch(err){
                return res.json({ status: 'ERROR', code: err.code });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})

app.post('/mk_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const body = req.body;
            const name = body.fileName;
            let dir_path = body.path;
            if(body.path == "") dir_path = '/';
            try{
                const id = uuidv4();
                if(dir_path != '/'){
                    const folder = await Files.findOne({ name: dir_path, owner_id: result._id }).lean();
                    if(folder != null){
                        if(folder.path == '/') dir_path = '/' + folder.name;
                        else dir_path = folder.path + '/' + folder.name;
                        const create = await Files.create({ 
                            owner_id: result._id,
                            givenName: name,
                            name: id,
                            path: dir_path,
                            folder: true
                        });
                        const dir = './uploads/' + `user${result._id}` + dir_path + '/' + id;
                        fs.mkdirSync(dir);
                        return res.json({ status: 'OK', folder: { id: create.name, name: create.givenName, favorite: create.favorite, size: 0, date: create.createdAt } });
                    }return res.json({ status: 'ERROR', error: 'Directory do not exists.'  });
                }else{
                    const create = await Files.create({ 
                        owner_id: result._id,
                        givenName: name,
                        name: id,
                        path: dir_path,
                        folder: true
                    });
                    const dir = './uploads/' + `user${result._id}` + dir_path + '/' + id;
                    fs.mkdirSync(dir);
                    return res.json({ status: 'OK', folder: { id: create.name, name: create.givenName, favorite: create.favorite, size: 0, date: create.createdAt } });
                }
            }catch(err){
                return res.json({ status: 'ERROR', code: err.code });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
const getAllFiles = function(dirPath, arrayOfFiles = []) {
    files = fs.readdirSync(dirPath)
    files.forEach(function(file) {
        if(fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, file))
        }
    });
    return arrayOfFiles
}
const getAllDirs = function(dirPath, arrayOfFiles = []) {
    files = fs.readdirSync(dirPath) 
    files.forEach(function(file) {
        if(fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles.push(dirPath + "/" + file);
            arrayOfFiles = getAllDirs(dirPath + "/" + file, arrayOfFiles)
        }
    });
    return arrayOfFiles
}
const getTotalSize = function(directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath)
    let totalSize = 0
    arrayOfFiles.forEach(function(filePath) {
      totalSize += fs.statSync(filePath).size
    })
    return totalSize
}
app.post('/getMemoryStat', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            try{
                const totalUsed = getTotalSize(`./uploads/user${result._id}/`);
                const plan = result.payment_plan;
                let max = 0;
                if(plan === 1) max = process.env.PLAN_1;
                else if(plan === 2) max = process.env.PLAN_2;
                else if(plan === 3) max = process.env.PLAN_3;
                else max = process.env.PLAN_0;
                return res.json({ error: false, used: totalUsed, max: max });
            }catch(err){
                return res.json({ error: true, msg: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/add_fav', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const files = req.body.data;
            const files_len = files.length;
            for(let i = 0; i < files_len;i++){
                const file = files[i];
                await Files.updateOne({ name: file, owner_id: result._id }, { $set: { favorite: true } });
            }
            res.json({ status: 'OK' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/rm_fav', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const files = req.body.data;
            const files_len = files.length;
            for(let i = 0; i < files_len;i++){
                const file = files[i];
                await Files.updateOne({ name: file, owner_id: result._id }, { $set: { favorite: false } });
            }
            res.json({ status: 'OK' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/rnm_f', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const new_n = req.body.new_n;
            const file_id = req.body.file;
            const upd = await Files.updateOne({ name: file_id, owner_id: result._id }, { $set: { givenName: new_n } });
            if(upd) return res.json({ status: 'OK' });
            else return res.json({ status: 'ERROR', error: 'File do not exist!' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/mv_files', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            if(req.body.from && req.body.to){
                const { from, to } = req.body;
                if(from != to){
                    const main_path = `./uploads/user${result._id}`;
                    const frm_len = from.length;
                    const errors_arr = [];
                    for(let i = 0; i < frm_len; i++){
                        try{
                            const item_id = from[i];
                            const item_info = await Files.findOne({ owner_id: result._id, name: item_id });
                            if(item_info){
                                if(!item_info.folder){
                                    let new_path = item_info.path;
                                    if(item_info.path == '/') new_path = item_info.path;
                                    else new_path = item_info.path + '/';
                                    const update = await Files.updateOne({ owner_id: result._id, name: item_id }, { $set: {
                                    path: new_path + to
                                    }})
                                    if(update) fse.moveSync(main_path + new_path + item_info.name,main_path + new_path + to + '/' + item_info.name, { overwrite: true });
                                }else{
                                    const dir = await Files.findOne({ name: to, owner_id: result._id }).lean();
                                    if(dir != null && dir.folder){
                                        const errors = await moveAll(item_info, dir, main_path);
                                        if(errors.length > 0) errors.forEach(err => {
                                            errors_arr.push(err);
                                        })
                                    }
                                }
                            }else errors_arr.push({ error:'file do not exists', id: from[i] });
                        }catch(err){
                            errors_arr.push(err);
                        }
                    }
                    return res.json({ status: 'OK', errors: errors_arr });
                }else return res.json({ status: 'ERROR', error: 'Cannot move in same directory.' });
            }else return res.json({ status: 'ERROR' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/get_privileged', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const file = req.body.file;
            if(file){
                const have_access = [];
                const file_info = await Files.findOne({ name: file, owner_id: result._id }).lean();
                if(file_info){
                    have_access.push({ email: result.email, name: result.f_name, me: true});
                    const shares = await Share.find({ file_id: file_info._id }).lean();
                    const shares_len = shares.length;
                    for(let i = 0; i < shares_len; i++){
                        const user = await User.findOne({ _id: shares[i].shared_with });
                        if(user) have_access.push({ email: user.email, name: user.f_name, role: null });
                    }
                    return res.json({ status: 'OK', allowed: have_access });
                }
            }
            return res.json({ status: 'ERROR' })
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/remove_shared', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const file = req.body.file;
            const shared_to = req.body.shared_to;
            if(file && shared_to){
                const file_db = await Files.findOne({ name: file, owner_id: result._id }).lean();
                const user = await User.findOne({ email: shared_to }).lean();
                if(user && file_db){
                    const del = await Share.deleteOne({ shared_with: user._id, file_id: file_db._id });
                    if(del) return res.json({ status: 'OK' });
                }
            }
            return res.json({ status: 'ERROR' })
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/share_file_to', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const file = req.body.file;
            const share_to = req.body.users;
            const users_len = share_to.length;
            if(users_len > 0 && file.length > 0){
                const file_db = await Files.findOne({ name: file, owner_id: result._id }).lean();
                if(file_db) {
                    const errors = [];
                    const successed = [];
                    const not_exist = [];
                    for(let i = 0; i < users_len; i++){
                        const user_email = share_to[i];
                        if(user_email != result.email){
                            const user = await User.findOne({ email: user_email }).lean();
                            if(user){
                                const shared_already = await Share.findOne({ file_id: file_db._id, shared_with: user._id }).lean();
                                if(shared_already == null){
                                    const new_share = await Share.create({
                                        file_id: mongodb.Types.ObjectId(file_db._id),
                                        shared_by: mongodb.Types.ObjectId(result._id),
                                        shared_with: mongodb.Types.ObjectId(user._id),
                                        path: '/'
                                    });
                                    successed.push({ email: user.email, name: user.f_name });
                                }else errors.push(user_email);
                            }else not_exist.push(user_email);
                        }else errors.push(user_email);
                    }
                    return res.json({ status: 'OK', success: successed, already_shared: errors, do_not_exist: not_exist });
                }
                return res.json({ status: 'ERROR', error: 'File do not exists!' });
            }
            return res.json({ status: 'ERROR' })
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/get_shared', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            try{
                let path = req.body.path;
                if(path == undefined || path.length == 0) path = "/";
                const paths = await getPath(path);
                const files_arr = [];
                const folders = [];
                if(path == '/') {
                    const files = await Share.find({ shared_with: result._id, path: '/' }).lean();
                    const len = files.length;
                    for(let i = 0; i < len; i++){
                        const file_id = files[i].file_id;
                        const db = await Files.findOne({ _id: file_id }).lean();
                        if(db){
                            if(db.folder){
                                const size =  getTotalSize(`./uploads/user${db.owner_id}` + db.path + '/' + db.name);
                                folders.push({ id: db.name, name: db.givenName, favorite: db.favorite, size: result.used_space, size: size, date: db.createdAt });
                            }else{
                                const split = (db.name).split('.');
                                const ext = split[split.length - 1];
                                let img_s = { w: 550, h: 550 };
                                if(db.file_type == 'image' && db.width && db.height){
                                    img_s.w = db.width;
                                    img_s.h = db.height;
                                }
                                files_arr.push({ id: db.name, name: db.givenName, type: db.file_type, img_size: img_s, favorite: db.favorite, ext: db.ext, size: db.file_size, date: db.createdAt });
                            }
                        }
                    }
                }else{
                    const dirs = path.split('/').filter(el => { if(el.length > 0) return el; });
                    const last_dir = dirs[dirs.length - 1];
                    let have_perms = false;
                    for(let i = dirs.length - 1; i >= 0; i--){
                        const file_db = await Files.findOne({ name: dirs[i] }).lean();
                        if(file_db){
                            const shared = await Share.findOne({ file_id: file_db._id, shared_with: result._id }).lean();
                            if(shared){
                                have_perms = true;
                                break;
                            }
                        }
                    }
                    if(have_perms){
                        const reg = new RegExp(`${last_dir}`);
                        const dir_files = await Files.find({ path: { $regex: reg }});
                        const len = dir_files.length;
                        for(let i = 0; i < len; i++){
                            const db = dir_files[i];
                            if(db){
                                if(db.folder){
                                    const size =  getTotalSize(`./uploads/user${db.owner_id}` + db.path + '/' + db.name);
                                    folders.push({ id: db.name, name: db.givenName, favorite: db.favorite, size: result.used_space, size: size, date: db.createdAt });
                                }else{
                                    const split = (db.name).split('.');
                                    const ext = split[split.length - 1];
                                    let img_s = { w: 550, h: 550 };
                                    if(db.file_type == 'image' && db.width && db.height){
                                        img_s.w = db.width;
                                        img_s.h = db.height;
                                    }
                                    files_arr.push({ id: db.name, name: db.givenName, type: db.file_type, img_size: img_s, favorite: db.favorite, ext: db.ext, size: db.file_size, date: db.createdAt });
                                }
                            }
                        }
                    }
                }
                return res.json({ status: 'OK', folders: folders, files: files_arr, path: paths });
            }catch(err) {
                console.log(err)
                return res.json({ status: 'ERROR', code: err.code, msg: 'An error has occurred!' });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/get_dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            if(req.body.path && req.body.sort){
                let body = req.body.path;
                if(body == '') body = '/'
                const sortby = (req.body.sort == -1) ? -1 : 1;
                const folders = [];
                const files = [];
                const errors = [];
                let dir = await Files.findOne({ owner_id: result._id, deleted: false, name: body }).sort({ givenName: sortby }).lean();
                const filesDB = (body != '/') ? await Files.find({ owner_id: result._id, deleted: false, path: {$regex: dir.name + '$'}}).lean() : await Files.find({ owner_id: result._id, deleted: false, path: '/' }).sort({ givenName: sortby }).lean();
                const paths = await getPath(body);
                if(filesDB){
                    filesDB.forEach(db => {
                        try{
                            if(db.folder){
                                const size =  getTotalSize(`./uploads/user${result._id}` + db.path + '/' + db.name);
                                folders.push({ id: db.name, name: db.givenName, favorite: db.favorite, size: result.used_space, size: size, date: db.createdAt });
                            }else{
                                const split = (db.name).split('.');
                                const ext = split[split.length - 1];
                                let img_s = { w: 550, h: 550 };
                                if(db.file_type == 'image' && db.width && db.height){
                                    img_s.w = db.width;
                                    img_s.h = db.height;
                                }
                                files.push({ id: db.name, name: db.givenName, type: db.file_type, img_size: img_s, favorite: db.favorite, ext: db.ext, size: db.file_size, date: db.createdAt });
                            }
                        }catch(err) {
                            errors.push(err);
                        }
                    })
                }
                const dir_paths = body.split('/');
                const dir_id = dir_paths[dir_paths.length - 1];
                return res.json({ status: 'OK', folders: folders, files: files, dir_id: (dir_id == '/') ? '' : dir_id, path: paths, errors: errors });
            }else return res.json({ status: 'ERROR', msg: 'Path do not exists!' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/download_file/:files_array', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const file_array = JSON.parse(req.params.files_array);
            try{
                const files_arr_len = file_array.length;
                if(files_arr_len > 1){
                    const files = [];
                    for(let i = 0; i < files_arr_len; i++){
                        const file = file_array[i];
                        const file_info = await Files.findOne({ name: file }).lean();
                        if(await checkForPerms(file_info, result._id)){
                            if(!file_info.folder){
                                let db_path = file_info.path;
                                if(db_path.substr(db_path.length, -1) !== '/') db_path += '/';
                                const main_path = `./uploads/user${file_info.owner_id}` + db_path + file_info.name;
                                let name = file_info.givenName;
                                const name_split = name.split('.');
                                const actual_ext = name_split[name_split.length - 1];
                                if(actual_ext != file_info.ext){
                                    name = '';
                                    const name_splits = name_split.length;
                                    for(let i = 0; i < name_splits; i++){
                                        name += name_split[i] + '.';
                                    }
                                    name += file_info.ext;
                                }
                                files.push({ path: main_path, name: name });
                            }
                        }else return res.json({ status: 'error', error: 'No Permissions!'});
                    }
                    /*res.writeHead(200, {
                        "Content-Type": 'application/zip',
                        "Content-Disposition": "attachment"
                    });*/
                    return res.zip(files);
                }else{
                    const file_id = file_array[0];
                    const file_info = await Files.findOne({ name: file_id, deleted: false }).lean();
                    if(file_info && await checkForPerms(file_info, result._id)){
                        let db_path = file_info.path;
                        if(db_path.substr(db_path.length, -1) !== '/') db_path += '/';
                        const main_path = `./uploads/user${file_info.owner_id}` + db_path + file_id;
                        if(!file_info.folder){
                            let name = file_info.givenName;
                            const name_split = name.split('.');
                            const actual_ext = name_split[name_split.length - 1];
                            if(actual_ext != file_info.ext){
                                name = '';
                                const name_splits = name_split.length;
                                for(let i = 0; i < name_splits; i++){
                                    name += name_split[i] + '.';
                                }
                                name += file_info.ext;
                            }
                            const stat = fs.statSync(main_path);
                            res.writeHead(200, {
                                "Content-Type": 'application/octet-stream',
                                'Content-Length': stat.size
                            });
                            fs.createReadStream(main_path).pipe(res);
                        }else{
                            //folder download
                            const reg = new RegExp(`/${file_id}` + '$');
                            const files_in_folder = await Files.find({ path: { $regex: reg } }).lean();
                            const files = [];
                            files_in_folder.forEach(file_info => {
                                if(!file_info.folder){
                                    let db_path = file_info.path;
                                    if(db_path.substr(db_path.length, -1) !== '/') db_path += '/';
                                    const main_path = `./uploads/user${result._id}` + db_path + file_info.name;
                                    let name = file_info.givenName;
                                    const name_split = name.split('.');
                                    const actual_ext = name_split[name_split.length - 1];
                                    if(actual_ext != file_info.ext){
                                        name = '';
                                        const name_splits = name_split.length;
                                        for(let i = 0; i < name_splits; i++){
                                            name += name_split[i] + '.';
                                        }
                                        name += file_info.ext;
                                    }
                                    files.push({ path: main_path, name: name });
                                }
                            })
                            return res.zip(files);
                        }
                    }else return res.json({ status: 'error', error: 'No Permissions!'});
                }
            }catch(err){
                return res.json({ status: 'error', error: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/open_file/:file_id', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const file_id = req.params.file_id;
            try{
                const file_info = await Files.findOne({ name: file_id, folder: false }).lean();
                if(file_info){
                    if(await checkForPerms(file_info, result._id)){
                        if(!file_info.deleted){
                            let db_path = file_info.path;
                            if(db_path.substr(db_path.length, -1) !== '/') db_path += '/';
                            const main_path = `./uploads/user${file_info.owner_id}` + db_path + file_id;
                            const stat = fs.statSync(main_path);
                            res.writeHead(200, {
                                "Content-Type": file_info.contentType,
                                'Content-Length': stat.size
                            });
                            const entered_times = file_info.entered_times;
                            await Files.updateOne({ _id: file_info._id }, { entered: Date.now(), entered_times: (entered_times == undefined) ? 1 : entered_times + 1 });
                            fs.createReadStream(main_path).pipe(res);
                        }else return res.json({ status: 'ERROR', error: 'File do not exists!' });
                    }else return res.json({ status: 'ERROR', error: 'No Permissions to open file!' });
                }else return res.json({ status: 'ERROR', error: 'File do not exists!' });
            }catch(err){
                res.json({ status: 'ERROR', error: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/open_image/:file_id/:size', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            try{
                const file_id = req.params.file_id;
                const file_size = req.params.size;
                const file_info = await Files.findOne({ name: file_id, file_type: "image", folder: false }).lean();
                let owner_id = result._id;
                if(file_info){
                    if(await checkForPerms(file_info, result._id)){
                        let db_path = file_info.path;
                        if(db_path.substr(db_path.length, -1) !== '/') db_path += '/';
                        const main_path = `./uploads/user${file_info.owner_id}` + db_path + file_id;
                        if(!file_info.deleted){
                            const size = file_size.split('x');
                            const width = Number(size[0]);
                            const height = Number(size[1]);
                            const id_parts = file_id.split('.');
                            const format = id_parts[id_parts.length - 1];
                            if(width > 0 || height > 0){
                                res.type(`image/${format || 'png'}`)
                                return resize(main_path, format, width, height).pipe(res)
                            }else return res.send('URL signature mismatch');
                        }else return res.json({ status: 'ERROR', error: 'File do not exists!' });
                    }else return res.json({ status: 'ERROR', error: 'File do not exists!' });
                }else return res.json({ status: 'ERROR', error: 'File do not exists!' });
            }catch(err){
                res.json({ status: 'ERROR', error: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/get_trash', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            try{
                const folders = [];
                const files = [];
                const filesDB = await Files.find({ owner_id: result._id, deleted: true }).lean();
                filesDB.forEach(db => {
                    if(db.folder){
                        const size =  getTotalSize(`./uploads/user${result._id}` + db.path + '/' + db.name);
                        folders.push({ id: db.name, name: db.givenName, favorite: db.favorite, size: size, date: db.createdAt });
                    }else{
                        const split = (db.name).split('.');
                        const ext = split[split.length - 1];
                        files.push({ id: db.name, name: db.givenName, type: db.file_type, favorite: db.favorite, ext: db.ext, size: db.file_size, date: db.createdAt });
                    }
                })
                return res.json({ status: 'OK', folders: folders, files: files });
            }catch(err){
                return res.json({ status: 'ERROR', code: err.code, error: err });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/esapi', (req, res) => {
    console.log(req.body);
    res.json({ status: 'OK' });
})
app.post('/get_fav', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const body = "/";
            const sortby = (req.body.sort == -1) ? -1 : 1;
            try{
                const folders = [];
                const files = [];
                let new_dir = body;
                const paths = await getPath(new_dir);
                if(body.substr(body.length, -1) !== '/' && body.length != 1) new_dir += '/';
                const filesDB = await Files.find({ owner_id: result._id, deleted: false, favorite: true, path: body }).sort({ givenName: sortby }).lean();
                filesDB.forEach(db => {
                    if(db.folder){
                        const size =  getTotalSize(`./uploads/user${result._id}` + db.path + '/' + db.name);
                        folders.push({ id: db.name, name: db.givenName, favorite: true, size: result.used_space, size: size, date: db.createdAt });
                    }else{
                        const split = (db.name).split('.');
                        const ext = split[split.length - 1];
                        let img_s = { w: 550, h: 550 };
                        if(db.file_type == 'image' && db.width && db.height){
                            img_s.w = db.width;
                            img_s.h = db.height;
                        }
                        files.push({ id: db.name, name: db.givenName, type: db.file_type, img_size: img_s, favorite: true, ext: db.ext, size: db.file_size, date: db.createdAt });
                    }
                })
                return res.json({ status: 'OK', folders: folders, files: files, path: paths });
            }catch(err) {
                return res.json({ status: 'ERROR', code: err.code, msg: 'An error has occurred!' });
            }
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.post('/buy_plan', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const plan = req.body.plan_id;
            const yearly = req.body.year;
            if(plan == 1 || plan == 2 || plan == 3){
                if(plan != result.payment_plan){
                    const info = { name: '', price: 0, desc: '' };
                    if(plan == 1){
                        info.name = 'Basic Plan';
                        info.price = 1.99;
                    }
                    else if(plan == 2){ 
                        info.name = 'Standard Plan';
                        info.price = 2.99;
                    }
                    else{
                        info.name = 'Premium Plan';
                        info.price = 4.99;
                    }
                    let year_payment = false;
                    if(yearly) { 
                        info.price = Number((info.price * 10).toFixed(2));
                        year_payment = true;
                        info.desc = 'One year subscribtion to ' + info.name;
                    }else info.desc = 'One month subscribtion to ' + info.name;
                    var create_payment_json = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "paypal"
                        },
                        "redirect_urls": {
                            "return_url": "http://localhost/payment_success",
                            "cancel_url": "http://localhost/cancel"
                        },
                        "transactions": [{
                            "item_list": {
                                "items": [{
                                    "name": info.name,
                                    "price": info.price,
                                    "currency": "USD",
                                    "quantity": 1
                                }]
                            },
                            "amount": {
                                "currency": "USD",
                                "total": info.price
                            },
                            "description": info.desc
                        }]
                    };                    
                    paypal.payment.create(create_payment_json, async (error, payment) => {
                        if (!error) {
                            //Payment forward
                            const p_id = payment.id;
                            const u_id = result._id;
                            const insert = await Payment.create({
                                user_id: u_id,
                                payment_id: p_id,
                                payment_plan: plan,
                                full_year: year_payment
                            });
                            if(insert){
                                for(let i = 0; i < payment.links.length; i++){
                                    if(payment.links[i].rel === 'approval_url'){
                                        return res.json({ status: 'OK', url: payment.links[i].href });
                                    }
                                };
                            }
                        }else return res.json({ status: 'ERROR', error: error });
                    });
                }else return res.json({ status: 'ERROR', error: 'Already have this plan!' });
            }else return res.json({ status: 'ERROR', error: 'BAD PLAN ID'})
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.get('/payment_success', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            const payerId = req.query.PayerID;
            const paymentId = req.query.paymentId;
            const paymentDB = await Payment.findOne({ payment_id: paymentId, user_id: result._id }).lean();
            if(paymentDB){
                if(paymentDB.success == false){
                    const plan = paymentDB.payment_plan;
                    let price = 0;
                    if(plan == 1) price = 1.99;
                    else if(plan == 2) price = 2.99;
                    else price = 4.99;
                    if(paymentDB.full_year) price = Number((price * 10).toFixed(2));
                    const execute_payment_json = {
                        payer_id: payerId,
                        transactions: [{
                            amount: {
                                "currency": "USD",
                                "total": price
                            }
                        }]
                    };
                    paypal.payment.execute(paymentId, execute_payment_json, async (err, payment) => {
                        if (err) {
                            return res.json({ status: 'ERROR', error: err});
                        } else {
                            //console.log(JSON.stringify(payment));
                            const date_now = new Date(Date.now());
                            if(paymentDB.full_year) date_now.setMonth(date_now.getMonth() + 12); 
                            else date_now.setMonth(date_now.getMonth() + 1);
                            await Payment.updateOne({ payment_id: paymentId, user_id: result._id }, { $set: { success: true, started_at: Date.now() } }).lean();
                            await User.updateOne({ _id: result._id }, { $set: { payment_plan: plan, subscription_end: date_now } });
                            return res.redirect('http://localhost/success');
                        }
                    });
                }else return res.json({ status: 'ERROR', error: 'Already paid!' });
            }else return res.json({ status: 'ERROR', error: 'Payment do not exists!' });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.post('/change-lang', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            if(req.body.lang){
                let lang = req.body.lang;
                if(lang == 'serbian' || lang == 'english' || lang == 'russian'){
                    const update = await User.updateOne({ _id: result._id }, { $set: { language: lang }});
                    if(update) res.json({ status: 'OK' });
                    else res.json({ status: 'ERROR', error: 'An error has occured.'});
                }else return res.json({ status: 'ERROR', error: 'Language do not Exists.'});
            }else return res.json({ status: 'ERROR', error: 'User Must Select Language.'});
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.get('/my-files/:dir', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            const language = result.language;
            res.render('./my-files.ejs', { nav_scripts: scripts('nav', language), scripts: scripts('main', language), user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.get('/my-files', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            const language = result.language;
            res.render('./my-files.ejs', { nav_scripts: scripts('nav', language), scripts: scripts('main', language), user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
});
app.get('/shared', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            const language = result.language;
            res.render('./shared.ejs', { nav_scripts: scripts('nav', language), scripts: scripts('main', language), user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/trash', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            const language = result.language;
            res.render('./trashed-files.ejs', { nav_scripts: scripts('nav', language), scripts: scripts('main', language), user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/favorites', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            let theme = 3;
            if(req.cookies['theme']) theme = req.cookies['theme'];
            res.cookie('theme', theme, { maxAge: 1000 * 3600 * 24 * 365, path: '/', httpOnly: false, secure: false });
            const language = result.language;
            res.render('./my-favorites.ejs', { nav_scripts: scripts('nav', language), scripts: scripts('main', language), user: { f_name: result.f_name, theme: theme, l_name: result.l_name, email: result.email, language: result.language } });
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})
app.get('/login', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT == undefined) res.render('./login', { email: ''});
    else{
        if(await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress) != null) res.redirect('/');
        else {
            res.clearCookie("authT");
            res.render('./login', { email: ''});
        }
    }
});
app.get('/login/:email', async (req, res) => {
    const authT = req.cookies['authT'];
    if(!req.params.email){
        res.redirect('/login');
    }else{
        if(authT == undefined) res.render('./login', { email: req.params.email });
        else{
            if(await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress) != null) res.redirect('/');
            else {
                res.clearCookie("authT");
                res.render('./login', { email: ''});
            }
        }
    }
});
app.get('/register', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT == undefined) res.render('./register');
    else res.redirect('/');
});
// app.get('/resend_verification', async(req, res) => {
//     const authT = req.cookies['authT'];
//     if(authT !== undefined){
//         const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
//         if(result != null){
//             const token = result.email_verification_token;
//             if(token != null) {
//                 sendVerificationMail(result.email, token);
//                 return res.json({ status: "OK" })
//             }else return res.json({ status: 'token do not exist' });
//         }else return res.redirect('/login');
//     }else return res.redirect('/login');
// })
app.post('/logout', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT == undefined) res.json({ status: 'ERROR', code: 'LOGGEDOUT', error: 'Already logged out' });
    else{
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            console.log('logged out: ' + result._id);
            res.clearCookie('authT');
            return res.json({ status: 'OK' });
        }else return res.json({ status: 'ERROR', code: 'LOGGEDOUT', error: 'User do not exists' });
    }
})
app.get('/upgrade', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            return res.render('./upgrade', { logged: true, plan: result.payment_plan });
        }else return res.render('./upgrade', { logged: false, plan: null });
    }else return res.render('./upgrade', { logged: false, plan: null });
})
app.get('/', async (req, res) => {
    const authT = req.cookies['authT'];
    if(authT !== undefined){
        const result = await getData(authT, req.header('x-forwarded-for') || req.connection.remoteAddress);
        if(result != null){
            res.redirect(301, '/my-files');
        }else return res.redirect('/login');
    }else return res.redirect('/login');
})

app.listen(80, () => console.log("SERVER STARTED ON PORT: " + 80));