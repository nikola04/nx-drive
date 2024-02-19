const Files = require('../models/files');
const fse = require('fs-extra');
const fs = require('fs');
const { v1: uuidv1,v4: uuidv4 } = require('uuid');

const moveAll = async (from, to, main_path, start = true, errors = []) => {
    try{
        let path = to.path;
        if(path != '/') path += '/';
        path += to.name;
        if(from.path.includes(to.name)){
            //ukoliko ga prebacujemo unazad
            //skloni iz stare putanje deo izmedju za koji se vraca
        }else if(from.path !='/'){
            from.path.split('/').forEach(dir => {
                if(dir.length > 0 && !path.includes(dir)) path += '/' + dir;
            })
        }
        await Files.updateOne({ _id: from._id }, { $set: { path: path } });
        if(from.folder){
            fs.mkdirSync(main_path + path + '/' + from.name);
            const docs = await Files.find({ path: { $regex: from.name + '$' }}).lean();
            for(let i = 0; i < docs.length; i++){
                const arr = await moveAll(docs[i], to, main_path, start = false, errors);
                if(arr.length > 0)
                    arr.forEach(err => {
                        errors.push(err);
                    });
            }
        }else fse.moveSync(main_path + from.path + '/' + from.name, main_path + path + '/' + from.name, { overwrite: true });
        if(start) fs.rmdirSync(main_path + from.path + '/' + from.name);
    }catch(err) {
        errors.push(err);
    }
    return errors;
}
const copyAll = async (parent_path, name, owner, first = true) => {
    const dir = await Files.findOne({ name: name }).lean();
    const files = await Files.find({ path: { "$regex": name + '$', "$options": "i" }}).lean();
    if(dir){
        await Files.updateOne({ name: dir.name, owner_id: owner }, { $set: { have_copies: true, copied: dir.copied + 1 } }).lean();
        //Copy Directory
        let file_path = parent_path;
        if(file_path == '/') file_path = '';
        const new_id = uuidv4();
        let file_name = dir.givenName;
        if(first){
            if(dir.have_copies){
                const num = dir.copied;
                file_name += ` - Copy (${num}).`;
            }else file_name += ' - Copy';
        }
        const n_dir = await Files.create({
            owner_id: owner,
            givenName: file_name,
            name: new_id,
            path: parent_path,
            ext: dir.ext,
            copy_of: dir.name,
            file_size: dir.file_size,
            folder: true
        });
        const main_path = `./uploads/user${owner}`;
        const new_dir_path = main_path + file_path + '/' + new_id;
        fs.mkdirSync(new_dir_path)
        //create parent directory
        files.forEach(async file => {
            //copy each file
            if(file.folder) copyAll(file_path + '/' + new_id, file.name, owner, false); //if file is dir go recursivly again
            else{
                //copy file
                const new_name = uuidv4();
                const n_file = await Files.create({
                    owner_id: owner,
                    givenName: file.givenName,
                    name: new_name + '.' + file.ext,
                    path: file_path + '/' + new_id,
                    ext: file.ext,
                    file_type: file.file_type,
                    file_size: file.file_size,
                    contentType: file.contentType,
                    folder: false
                });
                if(n_file) fs.copyFileSync(main_path + file.path + '/' + file.name, new_dir_path + '/' + new_name + '.' + file.ext);
            }
        });
        if(first) return { id: n_dir.name, name: n_dir.givenName, favorite: false, size: null, date: n_dir.createdAt, folder: true };
    }
    return;
}
module.exports = { moveAll, copyAll };