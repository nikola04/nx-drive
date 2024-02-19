// --- Shortcuts --- //
//  CTRL + mouse - selecting, SHIFT + mouse - selecting, ENTER - open(enter into folder), arrow - select (up, down), //
//  DEL - delete all selected, 
//i - info tab, n - new folder, shift+r - refresh, backspace - go one folder back, ctrl+z - undo, ctrl+c - copy //
// --- Shortcuts --- //
const parsedFolders = [];
let loadedFolders = [];
let viewing;
let viewingFiles = [];
let add_user_to_shared = [];
const suggestedFiles = [];
const allSelected = [];
const xhr_uploadings = [];
let location_paths = [];
let parsed = 0;
let sortby = -1;
let favorite = false;
let shared = false;
let loadBar = document.querySelector('div#loaded');
{
    const storage = localStorage.getItem('sort-results')
    if(storage != '-1')
        if(storage == '1') {
            sortby = 1;
            const el = document.querySelector('.active-sort');
            if(el.classList.contains('bx-down-arrow-alt')) el.classList.remove('bx-down-arrow-alt');
            el.classList.add('bx-up-arrow-alt')
        }else localStorage.setItem('sort-results', sortby);
}
let ctrl_pressed = false;
let shift_pressed = false;
let listen_arrows_2 = false;
let listen_ctrl = false;
let listen_shift = false;
let listen_enter = false;
let listen_mouse = false;
let listen_search = false;
let listen_exp_scroll = false;
let listen_i = false;
let listen_n = false;
let listen_r = false;
let listen_b = false;
let listen_z = false;
let listen_cp = false;
let listen_shortcuts = false;
let listen_arrows = false;
let listen_del = false;
let listen_rcmndd_scroll = false;
let listen_fumove = false;
let selected = false;
let last_moved_to = false;
let cursor_moving = false;
let listen_unload = false;
let moving_to_id = null;
let open_info_tab = false;
let shown_info_tab = false;
let uploading = null;
let shown_fu = false;
let parsing_dirs = false;

//load while scrolling
/*const listenExpScrol = () => {
    const exp = document.querySelector('#explorer');
    exp.addEventListener('scroll', e => {
        if(!parsing_dirs){
            const cont = exp.getBoundingClientRect();
            const height = exp.scrollHeight - exp.clientHeight - cont.top - 1, scrollPos = exp.scrollTop - cont.top;
            if(scrollPos > height){
                parsing_dirs = true;
                parseDirsOnScroll();
            }
        }
    });
}
const parseDirsOnScroll = () => {
    const folders_to_parse = { folders: [], files: [] };
    let i = parsed;
    while(i < loadedFolders.folders.length){
        if(i - parsed >= 27) break;
        folders_to_parse.folders.push(loadedFolders.folders[i]);
        i++;
    }
    while(i < loadedFolders.files.length){
        if(i - parsed >= 27) break;
        folders_to_parse.files.push(loadedFolders.files[i]);
        i++;
    }
    if(i > parsed) parseDirs(folders_to_parse, false);
}*/

const getThisDir = () => {
    const paths = window.location.href.split('/');
    let pathNow = '/';
    for(let i = 0; i < paths.length; i++)
        if(paths[i] == 'my-files'){
            if(paths[i + 1]) pathNow = paths[i + 1];
            break;
        }
    return pathNow;
}

const listenForSearch = () => {
    const input_el = document.querySelector('#search-bar');
    input_el.addEventListener('focus', () => {
        listen_i = false;
        listen_shortcuts = false;
        listen_n = false;
        listen_r = false;
        listen_b = false;
        listen_z = false;
        listen_cp = false;
        listen_arrows = false;
        listen_enter = false;
    })
    input_el.addEventListener('blur', () => {
        listen_i = true;
        listen_shortcuts = true;
        listen_n = true;
        listen_r = true;
        listen_b = true;
        listen_z = true;
        listen_cp = true;
        listen_arrows = true;
        listen_enter = true;
    })
}
const listenTabSwitch = () => {
    document.addEventListener("visibilitychange", () => {
        shift_pressed = false;
        ctrl_pressed = false;
    });
}
const listenI = () => {
    window.addEventListener('keypress', function handleDown(e){
        if(e.code == 'KeyI' && listen_i)
            if(!open_info_tab) showInfo();
            else closeMoreInfo();
    });
}
const listenN = () => {
    window.addEventListener('keypress', function handleDown(e){
        if(e.code == 'KeyN' && listen_n) createDir();
    });
}
const listenCTRLpZ = () => {
    window.addEventListener('keypress', function handleDown(e){
        if(e.code == 'KeyZ' && ctrl_pressed && listen_z) undoMove();
    });
}
const listenCTRLpC = () => {
    window.addEventListener('keyup', function handleDown(e){
        if(e.code == 'KeyC' && ctrl_pressed && listen_cp) copySelected();
    });
}
const listenR = () => {
    window.addEventListener('keypress', function handleDown(e){
        if(e.code == 'KeyR' && shift_pressed && listen_r) refresh();
    });
}
const listenB = () => {
    window.addEventListener('keyup', function handleDown(e){
        if(e.key == 'Backspace' && listen_b) getBack();
    });
}
const listenCTRL = () => {
    window.addEventListener('keydown', function handleDown(e){
        if(e.ctrlKey && listen_ctrl){
            if(!ctrl_pressed) ctrl_pressed = true;
            window.addEventListener('keyup', function handleUp(e){
                ctrl_pressed = false;
                window.removeEventListener('keyup', handleUp);
            })
        }
    })
}
const listenShortcuts = () => {
    window.addEventListener('keypress', e => {
        if(listen_shortcuts && e.key == '?' && keyboardBtn) keyboardBtn(true); 
    })
    window.addEventListener('keydown', e => {
        if(e.key == 'Escape') if(kb_state) keyboardBtn(false);
    });
}
const listenForUnload = () => {
    window.onbeforeunload = function() {
        if(uploading) return true;
    };
}
const listenSHIFT = () => {
    window.addEventListener('keydown', function handleDown(e){
        if(e.shiftKey && listen_shift){
            if(!shift_pressed) shift_pressed = true;
            window.addEventListener('keyup', function handleUp(e){
                shift_pressed = false;
                window.removeEventListener('keyup', handleUp);
            })
        }
    })
}
const listenENTER = () => {
    window.addEventListener('keydown', async function handleDown(e){
        if(e.key === 'Enter' && listen_enter){
            if(allSelected.length == 1){
                const table = document.querySelector('div#file-table');
                const sel = allSelected[0];
                const row = table.querySelector(`div[data-id~='${sel}']`);
                row.dispatchEvent(new MouseEvent('dblclick', {'bubbles': true})) 
            }
        }
    })
}
const listenARROW = () => {
    window.addEventListener('keydown', function handleArrowDown(e) {
        if(listen_arrows){
            if(e.key == 'ArrowUp' || e.key == 'ArrowDown'){
                e.preventDefault();
                const scrollable = document.querySelector('div#explorer');
                const table = document.querySelector('div#file-table');
                const rows = table.querySelectorAll('div.row');
                const len = allSelected.length;
                const height = rows[0].getBoundingClientRect().height;
                if(len > 0){
                    let onlast = false;
                    let last = 0;
                    if(e.key == 'ArrowDown') onlast = true;
                    const rows_len = rows.length;
                    for(let i = 0; i < rows_len; i++){
                        if(rows[i].classList.contains('active')){
                            last = i;
                            if(!onlast)
                                break;
                        }
                    }
                    if(e.key == 'ArrowDown' && last < rows_len - 1) last++;
                    else if(e.key == 'ArrowUp' && last > 0) last--;
                    const row = rows[last];
                    const boundingRect = row.getBoundingClientRect();
                    const sBoundingRect = scrollable.getBoundingClientRect();
                    const bodyH = document.querySelector('body').getBoundingClientRect().height;
                    if(boundingRect.y + height > bodyH) scrollable.scrollBy({ behavior: 'smooth', top: boundingRect.y - bodyH + height * 3 });
                    else if(boundingRect.y < sBoundingRect.y) scrollable.scrollBy({ behavior: 'smooth', top: sBoundingRect.y - boundingRect.y - height * 3 });
                    row.click();
                }else{
                    if(e.key == 'ArrowUp'){
                        const last = rows[rows.length - 1];
                        last.classList.add('active');
                        const id = last.getAttribute('data-id');
                        allSelected.push(id)
                        selected = true;
                    }else if(e.key == 'ArrowDown'){
                        const last = table.querySelectorAll('div.row')[0];
                        last.classList.add('active');
                        const id = last.getAttribute('data-id');
                        allSelected.push(id)
                        selected = true;
                    }
                }
            }
        }
    })
}
const listenARROWS2 = () => {
    window.addEventListener('keydown', function handleArrowDown(e) {
        if(listen_arrows_2){
            if(e.key == 'ArrowLeft'){
                swapPreview(false);
            }else if(e.key == 'ArrowRight'){
                swapPreview(true);
            }
        }
    })
}
const listenDEL = () => {
    window.addEventListener('keydown', function handleArrowDown(e){
        if(listen_del && e.key == 'Delete'){
            if(allSelected.length > 0) deleteSelected();
        }
    })
}
function detectLeftButton(evt) {
    evt = evt || window.event;
    if ("buttons" in evt) {
        return evt.buttons == 1;
    }
    var button = evt.which || evt.button;
    return button == 1;
}
const childOf = (element, parent) => {
    if(element == parent) return true;
    if(element == document.body) return false;
    return childOf(element.parentNode, parent);
}
const startPos = { x: 0, y: 0 };
const listenMouseSelect = () => {
    const table = document.querySelector('div#file-table');
    const menu = document.querySelector('div#context-menu');
    const exp = document.querySelector('div#explorer');
    window.addEventListener('contextmenu', e => {
        if(!childOf(e.target, table)) menu.classList.remove('active');
        if(childOf(e.target, exp)) e.preventDefault();
    })
    const exp_pos = { left: Math.ceil(exp.getBoundingClientRect().left), top: Math.ceil(exp.getBoundingClientRect().top)}
    table.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        menu.addEventListener('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();
        })
        menu.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
        })
        const hovered = document.elementFromPoint(e.clientX, e.clientY);
        if(hovered.classList.contains('row')){
            select({ id: hovered.getAttribute('data-id'), ignore: true })
        }
        const pos = { x: e.clientX, y: e.clientY };
        let selected = { file: false, folder: false, count: 0, preview: false };
        if(menu.classList.contains('file')) menu.classList.remove('file');
        if(menu.classList.contains('folder')) menu.classList.remove('folder');
        if(menu.classList.contains('preview')) menu.classList.remove('preview');
        if(menu.classList.contains('none')) menu.classList.remove('none');
        parsedFolders.forEach(loaded => {
            allSelected.forEach(sel => {
                if(loaded.id == sel){
                    if(allSelected.length == 1){
                        if(loaded.favorite) menu.classList.add('favorite');
                        else menu.classList.remove('favorite');
                    }else menu.classList.remove('favorite');
                    if(loaded.type == 'folder') selected.folder = true;
                    else {
                        selected.file = true;
                        if(loaded.type == 'image' || loaded.type == 'video' || loaded.type == 'audio') selected.preview = true;
                    }
                    const count = selected.count;
                    selected.count = count + 1;
                    return false;
                }
            })
        })
        const size = { w: 255, h: 0 };
        if(selected.count == 1){
            if(selected.folder == true && selected.file == false){
                menu.classList.add('folder');
                size.h = 367;
            }
            else if(selected.file == true && selected.folder == false){
                menu.classList.add('file');
                size.h = 403;
                if(selected.preview) menu.classList.add('preview')
            }
        }else if(selected.count == 0){
            menu.classList.add('none');
            size.h = 129;
        }else size.h = 248;
        if(menu.classList.contains('active')){
            let i = 0;
            menu.addEventListener('transitionend', function handleT(e){
                if(i == 1){
                    menu.style.left = pos.x + 'px';
                    menu.style.top = pos.y + 'px';
                    menu.classList.add('active');
                    menu.removeEventListener('transitionend', handleT);
                }
                i++;
            })
            menu.classList.remove('active');
        }else{
            menu.style.left = pos.x + 'px';
            menu.style.top = pos.y + 'px';
            if(window.innerHeight <= e.clientY + size.h && window.innerWidth <= e.clientX + size.h){
                menu.style.transform = 'translate(-100%, -100%)';
            }else if(window.innerHeight <= e.clientY + size.h){
                menu.style.transform = 'translateY(-100%)';
            }else if(window.innerWidth <= e.clientX + size.w){
                menu.style.transform = 'translateX(-100%)';
            }else{
                menu.style.transform = '';
            }
            menu.classList.add('active')
        }
        table.addEventListener('mousedown', function handleClick(e){
            menu.classList.remove('active');
            menu.style.overflow = '';
            table.removeEventListener('mousedown', handleClick)
            const optionDivs = document.querySelectorAll('.option-box');
            optionDivs.forEach(div => {
                if(div.classList.contains('active')){
                    div.classList.remove('active')
                    const icon = div.parentNode.querySelector('i.cm-icon');
                    icon.classList.remove('bx-x');
                    icon.classList.add('bx-chevron-right');
                    opb_state = (opb_state + 1) % 2;
                }
            })
        })
    })
    table.addEventListener('mousedown', function handleDown(e){
        if(listen_mouse && detectLeftButton(e)){
            window.addEventListener('mouseup', function handleUp(e){
                end = true;
                document.querySelector('body').style.cursor = '';
                window.removeEventListener('mouseup', handleUp);
            })
            const explorer = document.querySelector('div#explorer');
            const box = explorer.getBoundingClientRect();
            const pos = { x: Math.ceil(box.left), y: Math.ceil(box.top) };
            let end = false;
            startPos.x = e.clientX - pos.x;
            startPos.y = (e.clientY - pos.y) + explorer.scrollTop;
            if(startPos.x >= 0 && startPos.y >= 0){
                const size = {w: 0, h: 0};
                const reverse = { w: false, h: false };
                const table = document.querySelector('div#file-table');
                const rows = table.querySelectorAll('div.row');
                let selectable = true;
                //stavlja selected na false iako je selectan samo div koji je ispod za 1 ili vise row-ova
                // rows.forEach(row => {
                //     const row_pos = Math.abs(Math.ceil(row.getBoundingClientRect().top - pos.y));
                //     const row_height = Math.abs(Math.ceil(row.getBoundingClientRect().height));
                //     const id = row.getAttribute('data-id')
                //     if(startPos.y >= row_pos && startPos.y <= (row_pos + row_height)){
                //         allSelected.forEach(selected => {
                //             if(selected == id) {
                //                 console.log(row_pos)
                //                 selectable = false;
                //                 return false;
                //             }
                //         })
                //     }
                // })
                const row = document.elementFromPoint(e.clientX, e.clientY);
                if(row){
                    const id = row.dataset.id;
                    allSelected.forEach(selected => {
                        if(selected == id) {
                            selectable = false;
                            return false;
                        }
                    })
                }
                window.addEventListener('mousemove', function updateCoords(ev) {
                    if(ev !== null){
                        size.w = ev.clientX - pos.x - startPos.x;
                        size.h = (ev.clientY - pos.y - startPos.y) + explorer.scrollTop;
                        if(size.w < 0){
                            reverse.w = true;
                            size.w = Math.abs(size.w);
                        }else reverse.w = false;
                        if(size.h < 0){
                            reverse.h = true;
                            size.h = Math.abs(size.h);
                        }else reverse.h = false;
                        if(end){
                            if(selectable) updateSelectRect(null, null, null, true)
                            else {
                                document.querySelectorAll('div.row').forEach(row => {
                                    if(row.classList.contains('moving_to')) row.classList.remove('moving_to');
                                    if(row.classList.contains('moving')) {
                                        row.style = '';
                                        row.classList.remove('moving');
                                    }
                                })
                                document.querySelector('body').style.cursor = '';
                                cursor_moving = false;
                                if(moving_to_id != null){
                                    const id = moving_to_id;
                                    moving_to_id = null;
                                    moveFromTo(allSelected, id);
                                }
                                last_moved_to = false;
                            }
                            window.removeEventListener('mousemove', updateCoords);
                        }else{
                            if(selectable && !ctrl_pressed) updateSelectRect(size, reverse, pos);
                            else{
                                if(!cursor_moving) {
                                    cursor_moving = true;
                                    document.querySelector('body').style.cursor = 'move';
                                }else if(!(ctrl_pressed || shift_pressed)) moveFiles({ x: ev.pageX, y: ev.pageY });
                            }
                        }
                    }
                });
            }
        }
    })
}
const chSortBy = (el) => {
    const sortBy = document.querySelectorAll('.sort-by');
    sortBy.forEach(sb => {
        if(sb.classList.contains('active')) sb.classList.remove('active');
    });
    el = el.querySelector('i');
    el.classList.add('active');
    if(sortby == 1) {
        sortby = -1;
        localStorage.setItem('sort-results', sortby);
        if(el.classList.contains('bx-up-arrow-alt')) {
            el.classList.remove('bx-up-arrow-alt');
            el.classList.add('bx-down-arrow-alt');
        }else if(!el.classList.contains('bx-down-arrow-alt')) el.classList.add('bx-down-arrow-alt');
    }else {
        sortby = 1;
        localStorage.setItem('sort-results', sortby);
        if(el.classList.contains('bx-down-arrow-alt')) {
            el.classList.remove('bx-down-arrow-alt');
            el.classList.add('bx-up-arrow-alt');
        }else if(!el.classList.contains('bx-up-arrow-alt')) el.classList.add('bx-up-arrow-alt');
    };
    swapSort();
}
const swapSort = () => {
    loadedFolders.files.reverse();
    loadedFolders.folders.reverse();
    parseDirs(loadedFolders)
}
let opb_state = 0;
const openWith = (el) => {
    const menu = document.querySelector('#context-menu');
    const optionBox = el.querySelector('div.option-box');
    const icon = el.querySelector('i.cm-icon');
    if(opb_state){
        menu.style.overflow = 'hidden';
        optionBox.classList.remove('active');
        icon.classList.add('bx-chevron-right');
        icon.classList.remove('bx-x');
    }else{
        menu.style.overflow = 'visible';
        optionBox.classList.add('active');
        icon.classList.add('bx-x');
        icon.classList.remove('bx-chevron-right');
    }
    opb_state = (opb_state + 1) % 2;
}
let listening_prompt_submit = false;
let listening_prompt_close = false;
const promptBox = (suggestion = '', options = {}) => {
    listen_i = false;
    listen_shortcuts = false;
    listen_n = false;
    listen_r = false;
    listen_b = false;
    listen_z = false;
    listen_cp = false;
    listen_arrows = false;
    listen_enter = false;
    listen_arrows_2 = false;
    listen_ctrl = false;
    listen_shift = false;
    const box = document.querySelector('#promptBox');
    const prompt = document.querySelector('#prompt');
    const bg = document.querySelector('#promptBG');
    prompt.setAttribute('value', `${suggestion}`);
    prompt.value = suggestion;
    prompt.setAttribute('data-suggested', `${suggestion}`);
    if(!listening_prompt_close){
        listening_prompt_close = true;
        document.body.addEventListener('keydown', function handleClose(e){
            if(e.key == 'Escape'){
                document.body.removeEventListener('keydown', handleClose);
                closePrompt();
                listening_prompt_close = false;
            }
        });
    }
    if(!listening_prompt_submit){
        prompt.addEventListener('keydown', function handleKD(e){
            if(e.key == 'Enter'){
                const btn = document.querySelector('#renamePromptBtn');
                btn.classList.add('mousedown');
                prompt.blur();
                setTimeout(() => {
                    btn.click();
                    btn.classList.remove('mousedown');
                    prompt.removeEventListener('keydown', handleKD);
                    listening_prompt_submit = false;
                }, 210)
            }
        });
        listening_prompt_submit = true;
    }
    const title = document.querySelector('#promptTitle');
    const btn = document.querySelector('#renamePromptBtn');
    if(options.type == 'folder'){
        title.innerText = 'Create Folder';
        btn.innerText = 'Create';
        btn.setAttribute('onclick', `submitPrompt(${JSON.stringify(options)})`);
        prompt.setAttribute('placeholder', 'Enter folder name..');
    }else if(options.type == 'rename'){
        title.innerText = 'Rename';
        btn.innerText = 'Rename';
        btn.setAttribute('onclick', `submitPrompt(${JSON.stringify(options)})`);
        prompt.setAttribute('placeholder', 'Enter new name..');
    }
    bg.classList.add('active');
    box.classList.add('active');
    setTimeout(() => {
        prompt.select();
        bg.style.opacity = 1;
        box.style.opacity = 1;
    }, 20);
}
let listening_confirm_close = false;
let listening_confirm = false;
const confirmBox = (options = {}) => {
    listen_i = false;
    listen_shortcuts = false;
    listen_n = false;
    listen_r = false;
    listen_b = false;
    listen_z = false;
    listen_cp = false;
    listen_arrows = false;
    listen_enter = false;
    listen_arrows_2 = false;
    listen_ctrl = false;
    listen_shift = false;
    const box = document.querySelector('#confirmBox');
    const bg = document.querySelector('#promptBG');
    if(!listening_confirm_close){
        listening_confirm_close = true;
        document.body.addEventListener('keydown', function handleClose(e){
            if(e.key == 'Escape'){
                document.body.removeEventListener('keydown', handleClose);
                closeConfirm();
                listening_confirm_close = false;
            }
        });
    }
    const title = document.querySelector('#confirmTitle');
    const btn = document.querySelector('#confirmBtn');
    if(options.type == 'remove' && options.files != null){
        title.innerText = (options.files.length > 1) ? 'Remove Files:' : 'Remove File:';
        btn.innerText = 'Delete';
        btn.addEventListener('click', function handleConfirm(){
            deleteSelected(false, true);
            closeConfirm();
            btn.removeEventListener('click', handleConfirm);
        });
        const files = box.querySelector('.files');
        files.innerHTML = '';
        options.files.forEach(file => {
            parsedFolders.forEach(f => {
                if(file == f.id) {
                    const p = document.createElement('p');
                    const options = {
                        img: false
                    }
                    const icon = (options.type == 'folder') ? "<p class='icon bx bx-folder'></p>" : getIcon({ type: f.type, ext: f.ext, name_id: f.id }, options);
                    p.innerHTML = icon;
                    p.innerText += f.name;
                    files.appendChild(p);
                }
            })
        })
    }
    bg.classList.add('active');
    box.classList.add('active');
    setTimeout(() => {
        bg.style.opacity = 1;
        box.style.opacity = 1;
    }, 20);
}
let listening_share_close = false;
const shareBox = async (options = {}) => {
    listen_i = false;
    listen_shortcuts = false;
    listen_n = false;
    listen_r = false;
    listen_b = false;
    listen_z = false;
    listen_cp = false;
    listen_arrows = false;
    listen_enter = false;
    listen_arrows_2 = false;
    listen_ctrl = false;
    listen_shift = false;
    const box = document.querySelector('#shareBox');
    const bg = document.querySelector('#promptBG');
    const permissions = await fetch('/get_privileged', {
        method:'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file: allSelected[0] })
    }).then(res => res.json());
    if(!listening_share_close){
        listening_share_close = true;
        document.body.addEventListener('keydown', function handleClose(e){
            if(e.key == 'Escape'){
                document.body.removeEventListener('keydown', handleClose);
                closeShare();
                listening_share_close = false;
            }
        });
        bg.addEventListener('mousedown', function handleClose(e){
            bg.removeEventListener('mousedown', handleClose);
            closeShare();
            listening_share_close = false;
        });
    }
    bg.classList.add('active');
    box.classList.add('active');
    setTimeout(() => {
        bg.style.opacity = 1;
        box.style.opacity = 1;
        focusInputShareBox();
        const selected_id = allSelected[0];
        let file = {};
        parsedFolders.forEach(parsed => {
            if(parsed.id == selected_id){
                file = parsed;
            }
        });
        const icon = getIcon({ type: file.type, ext: file.ext, name_id: file.id }, {
            img: false
        });
        const selected = document.querySelector('#selected-file');
        selected.innerHTML = icon;
        const span = document.createElement('span');
        span.innerText = file.name;
        selected.appendChild(span);
        selected.setAttribute('title', file.name);
    }, 20);
    if(permissions){
        if(permissions.status == 'OK' && permissions.allowed.length > 0){
            document.querySelector('#have-access').innerHTML = '';
            updateUsersWithPermission(permissions.allowed);
        }
    }
}
const removeUserWithPermission = user => {
    const box = document.querySelector('#have-access');
    box.querySelectorAll('div.usrwperm').forEach(div => {
        if(div.getAttribute('data-id') == user) div.remove();
    });
}
const updateUsersWithPermission = users => {
    const box = document.querySelector('#have-access');
    users.forEach(user => {
        const div = document.createElement('div');
        div.classList.add('usrwperm');
        div.setAttribute('data-id', user.email);
        const info = document.createElement('div');
        info.classList.add('info');
        const p = document.createElement('p');
        p.classList.add('email');
        p.innerText = user.email;
        const p1 = document.createElement('p');
        p1.classList.add('name');
        p1.innerText = user.name;
        if(user.me){
            p1.innerHTML += " <span>(me)</span>";
        }
        info.appendChild(p1);
        info.appendChild(p);
        div.appendChild(info);
        const remove = document.createElement('p');
        if(user.me){
            remove.classList.add('owner');
            remove.innerText = 'Owner';
        }
        else{
            remove.classList.add('remove-user-perms');
            remove.innerText = 'Remove';
            remove.addEventListener('mouseup', async () => {
                const remove_user = await fetch('/remove_shared', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ file: allSelected[0], shared_to: user.email })
                }).then(res => res.json());
                if(remove_user.status == 'OK'){
                    removeUserWithPermission(user.email);
                }
            })
        }
        div.appendChild(remove);
        box.appendChild(div);
    })
}
const clearSharedList = () => {
    document.querySelector('#addedShare').querySelectorAll('div.added-user').forEach(child => {child.remove()});
    add_user_to_shared = [];
}
const removeFromSharedList = id => {
    const box = document.querySelector('#addedShare');
    const childs = box.querySelectorAll('div.added-user');
    add_user_to_shared.forEach(user => {
        if(user == id){
            add_user_to_shared.splice(add_user_to_shared.indexOf(user), 1);
            return;
        }
    });
    childs.forEach(child => {
        if(child.getAttribute('data-id') == id){
            child.remove();
        }
    })
}
const updateAddedEmails = () => {
    const box = document.querySelector('#addedShare');
    const childs = box.querySelectorAll('div.added-user');
    const exists = [];
    childs.forEach(child => exists.push(child.getAttribute('data-id')));
    const last_child = box.querySelector('div.input-holder'); 
    add_user_to_shared.forEach(user => {
        let add = true;
        exists.forEach(exist => { if(exist == user) add = false });
        if(add){
            const div = document.createElement('div');
            div.classList.add('added-user');
            div.setAttribute('data-id', user);
            const span = document.createElement('span');
            span.innerText = user;
            div.appendChild(span);
            const remove = document.createElement('p');
            remove.classList.add('bx');
            remove.classList.add('bx-x');
            remove.addEventListener('mouseup', () => removeFromSharedList(user))
            div.appendChild(remove);
            box.insertBefore(div, last_child);
        }
    });
}
const checkEmailForShare = (email) => {
    const regex = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/);
    if(regex.test(email)){
        add_user_to_shared.push(email);
        updateAddedEmails();
        return true;
    }
    return false;
}
const addEmailForShare = (ev, input) => {
    if((ev.key == "Enter" || ev.code == "Space") && input.value.length > 0){
        if(checkEmailForShare(input.value)) input.value = '';
    }
}
setInterval(() => {
    updateUserSearch();
}, 33);
const updateUserSearch = () => {
    const input = document.querySelector('#user-share-input');
    if(input.value.length > 0) document.querySelector('#empty-text-for-share').style.opacity = 0;
    else document.querySelector('#empty-text-for-share').style.opacity = '';
}
const focusInputShareBox = () => {
    document.querySelector('#user-share-input').focus();
}
const saveShares = async () => {
    if(add_user_to_shared.length > 0){
        const resp = await fetch('/share_file_to',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: allSelected[0], users: add_user_to_shared })
        }).then( res => res.json() );
        if(resp.status == 'OK'){
            if(resp.success.length > 0) updateUsersWithPermission(resp.success);
            clearSharedList();
            if(resp.do_not_exist.length > 0){
                console.log('Do not exists:')
                console.log(resp.do_not_exist)
            }
        }
    }
}
const closeShare = () => {
    const box = document.querySelector('#shareBox');
    const bg = document.querySelector('#promptBG');
    bg.style.opacity = 0;
    box.style.opacity = 0;
    bg.addEventListener('transitionend', function handleTEnd(){
        bg.removeEventListener('transitionend', handleTEnd);
        bg.classList.remove('active');
        box.classList.remove('active');
    })
    box.addEventListener('transitionend', function handleTEnd(){
        box.classList.remove('active');
        box.removeEventListener('transitionend', handleTEnd);
        listen_i = true;
        listen_shortcuts = true;
        listen_n = true;
        listen_r = true;
        listen_b = true;
        listen_z = true;
        listen_cp = true;
        listen_arrows = true;
        listen_enter = true;
        listen_arrows_2 = true;
        listen_ctrl = true;
        listen_shift = true;
    })
}
const closeConfirm = () => {
    const box = document.querySelector('#confirmBox');
    const bg = document.querySelector('#promptBG');
    bg.style.opacity = 0;
    box.style.opacity = 0;
    bg.addEventListener('transitionend', function handleTEnd(){
        bg.removeEventListener('transitionend', handleTEnd);
        bg.classList.remove('active');
        box.classList.remove('active');
    })
    box.addEventListener('transitionend', function handleTEnd(){
        box.classList.remove('active');
        box.removeEventListener('transitionend', handleTEnd);
        listen_i = true;
        listen_shortcuts = true;
        listen_n = true;
        listen_r = true;
        listen_b = true;
        listen_z = true;
        listen_cp = true;
        listen_arrows = true;
        listen_enter = true;
        listen_arrows_2 = true;
        listen_ctrl = true;
        listen_shift = true;
    })
}
const submitPrompt = (options) => {
    const prompt = document.querySelector('#prompt');
    const value = prompt.value;
    if(value.length > 0 && prompt.getAttribute('data-suggested') != value){
        if(options.type == 'rename') rename(value);
        else if(options.type == 'folder') createDir(false, value);
        closePrompt();
    }else{
        prompt.select();
        prompt.addEventListener('keydown', function handleKD(e){
            if(e.key == 'Enter'){
                const btn = document.querySelector('#renamePromptBtn');
                btn.classList.add('mousedown');
                prompt.blur();
                setTimeout(() => {
                    btn.click();
                    btn.classList.remove('mousedown');
                    prompt.removeEventListener('keydown', handleKD);
                    listening_prompt_submit = false;
                }, 210)
            }
        })
    }
}
const closePrompt = () => {
    const box = document.querySelector('#promptBox');
    const bg = document.querySelector('#promptBG');
    bg.style.opacity = 0;
    box.style.opacity = 0;
    bg.addEventListener('transitionend', function handleTEnd(){
        bg.removeEventListener('transitionend', handleTEnd);
        bg.classList.remove('active');
        box.classList.remove('active');
    })
    box.addEventListener('transitionend', function handleTEnd(){
        box.classList.remove('active');
        box.removeEventListener('transitionend', handleTEnd);
        listen_i = true;
        listen_shortcuts = true;
        listen_n = true;
        listen_r = true;
        listen_b = true;
        listen_z = true;
        listen_cp = true;
        listen_arrows = true;
        listen_enter = true;
        listen_arrows_2 = true;
        listen_ctrl = true;
        listen_shift = true;
    })
}
const openAll = () => {
    const menu = document.querySelector('div#context-menu');
    menu.classList.remove('active')
    window.open(`/open_file/${allSelected[0]}`, '_blank');
}
const undoMove = () => {
    console.warn('undoMove Function');
}
const rename = async (new_name = null) => {
    const menu = document.querySelector('div#context-menu');
    menu.classList.remove('active');
    const row_id = (viewing != undefined && viewing != null) ? viewing.id : allSelected[0];
    if(row_id != undefined){
        if(new_name == null){
            let found = false;
            let c_name;
            loadedFolders.files.forEach(loaded => {
                if(loaded.id == row_id){
                    found = true;
                    c_name = loaded.name;
                }
            });
            if(!found){
                loadedFolders.folders.forEach(loaded => {
                    if(loaded.id == row_id){
                        c_name = loaded.name;
                        found = true;
                    }
                });
                if(!found){
                    c_name = viewing.name;
                }
            }
            promptBox(c_name, {
                type: 'rename'
            });
        }else{
            if(new_name.length > 0){
                const resp = await fetch('/rnm_f',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ new_n: new_name, file: row_id })
                }).then( res => res.json() );
                if(resp.status == 'OK'){
                    const row = document.querySelector(`div[data-id~='${row_id}']`);
                    const name = (row == null) ? null : row.querySelector('p.name').querySelector('span');
                    let found = false;
                    loadedFolders.files.forEach(loaded => {
                        if(loaded.id == row_id){
                            found = true;
                            loaded.name = new_name;
                        }
                    })
                    if(!found){
                        loadedFolders.folders.forEach(loaded => {
                            if(loaded.id == row_id){
                                found = true;
                                loaded.name = new_name;
                            }
                        });
                        if(!found){
                            viewingFiles.forEach(file => {
                                if(file.id == row_id){
                                    file.name = new_name;
                                }
                            })
                        }
                    }
                    swapPreviewName(new_name);
                    swapSuggestedName(new_name);
                    if(name != null) name.innerText = new_name;
                }else if(resp.status == 'WARN'){
                    console.warn(resp.error);
                }else{
                    console.error(resp.error);
                }
            }
        }
    }
}
const addToFav = async () => {
    const menu = document.querySelector('div#context-menu');
    const data = { data: allSelected };
    const resp = await fetch('/add_fav', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json());
    if(resp.status == 'OK'){
        updateFavorites(allSelected, true);
        menu.classList.remove('active');
    }else if(resp.status == 'WARN'){
        console.warn(resp.error);
    }else{
        console.error(resp.error);
    }
}
const remFromFav = async () => {
    const menu = document.querySelector('div#context-menu');
    const data = { data: allSelected };
    const resp = await fetch('/rm_fav', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json());
    if(resp.status == 'OK'){
        updateFavorites(allSelected, false);
        menu.classList.remove('active');
    }else if(resp.status == 'WARN'){
        console.warn(resp.error);
    }else{
        console.error(resp.error);
    }
}
const updateFavorites = (data, fav) => {
    parsedFolders.forEach(loaded => {
        data.forEach(favorite => {
            if(loaded.id == favorite){
                if(fav) loaded.favorite = true;
                else loaded.favorite = false;
                updateFavIcon(favorite, fav)
            }
        })
    })
}
const updateFavIcon = ( id, add ) => {
    const row = document.querySelector(`div[data-id~='${id}']`);
    if(add){
        const star = row.querySelector('i.bx.bx-star');
        star.classList.remove('bx-star');
        star.classList.add('bxs-star');
        star.classList.remove('fav-hover');
        star.classList.add('fav');
    }else{
        const star = row.querySelector('i.bx.bxs-star');
        star.classList.remove('bxs-star');
        star.classList.add('bx-star');
        star.classList.remove('fav');
        star.classList.add('fav-hover');
    }
}
const moveFiles = (pos = null) => {
    if(pos !== null){
        //Moving Files
        allSelected.forEach(sel => {
            const el = document.querySelector(`div[data-id~='${sel}']`);
            el.classList.add('moving');
        })
        //Selecting Folder To be Moved
        const el = document.elementFromPoint(pos.x, pos.y);
        if(el.classList.contains('row') && el.getAttribute('data-id') != undefined){
            const id = el.getAttribute('data-id');
            if(last_moved_to == false){
                last_moved_to = id;
            }else if(last_moved_to != id){
                let type = '';
                parsedFolders.forEach(item => {
                    if(id == item.id){
                        type = item.type;
                        return false;
                    }
                })
                moving_to_id = null;
                last_moved_to = false;
                if(type == 'folder'){
                    if(!el.classList.contains('moving_to')){
                        document.querySelectorAll('div.row').forEach(row => {
                            if(row.classList.contains('moving_to')) row.classList.remove('moving_to');
                        })
                        moving_to_id = id;
                        el.classList.add('moving_to');
                    }
                }else{
                    document.querySelectorAll('div.row').forEach(row => {
                        if(row.classList.contains('moving_to')) row.classList.remove('moving_to');
                    })
                }
            }
        }else if(last_moved_to != false){
            document.querySelectorAll('div.row').forEach(row => {
                if(row.classList.contains('moving_to')) row.classList.remove('moving_to');
            })
            last_moved_to = false;
        }
    }else return false;
}
const updateSelectRect = (size = null, reverse = { w: false, h: false }, explorerPos, remove = false) => {
    const selRect = document.querySelector('div#selRect');
    if(remove){
        selRect.style = '';
    }else if(startPos != null && size != null){
        selRect.style.left = startPos.x + 'px';
        selRect.style.top = startPos.y + 'px';
        selRect.style.width = size.w + 'px';
        selRect.style.height = size.h + 'px';
        const pos = { top: 0, height: size.h };
        if(reverse.w && reverse.h){
            selRect.style.transform = "translate(-100%, -100%)";
            pos.top = startPos.y - size.h;
        }else if(reverse.w){
            selRect.style.transform = "translateX(-100%)";
            pos.top = startPos.y;
        }else if(reverse.h){
            selRect.style.transform = "translateY(-100%)";
            pos.top = startPos.y - size.h;
        }else{
            selRect.style.transform = "";
            pos.top = startPos.y;
        }
        pos.top -= document.querySelector('div#explorer').scrollTop;
        checkIfSelected(pos, explorerPos);
    }else return false;
}
const checkIfSelected = (pos, blockPos) => {
    const table = document.querySelector('div#file-table');
    const rows = table.querySelectorAll('div.row');
    rows.forEach(row => {
        const row_pos_height = Math.ceil(row.getBoundingClientRect().top - blockPos.y) + Math.ceil(row.getBoundingClientRect().height);
        const row_pos = Math.ceil(row.getBoundingClientRect().top - blockPos.y);
        const id = row.dataset.id;
        if((row_pos >= pos.top && row_pos <= (pos.top + pos.height)) || (pos.top <= row_pos_height && pos.top >= row_pos)){
            if(id != null && !row.classList.contains('active')){
                row.classList.add('active');
                allSelected.push(id)
                selected = true;
            }
        }else{
            row.classList.remove('active');
            const sel_len = allSelected.length;
            for(let i = 0; i < sel_len; i++){
                if(allSelected[i] == id) allSelected.splice(i, 1);
            }
        }
    })
    updateIcon();
}
const createFile = async (closeM = false) => {
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const name = promptBox('Enter name for File');
    if(name != null){
        let pathNow = '/';
        for(let i = 0; i < paths.length; i++)
            if(paths[i] == 'my-files'){
                if(paths[i + 1]) pathNow = paths[i + 1];
                break;
            }
        const res = await fetch('/mk_file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: pathNow, fileName: name })
        }).then(res => res.json())
        if(res.status === 'OK'){
            if(pathNow != undefined && pathNow != null){
                const now = await getDir(pathNow);
                parseDirs(now);
            }else{
                const main = await getDir('/');
                parseDirs(main);
            }
        }else {
            if(res.code == 'ENOENT'){
                const main = await getDir('/');
                console.error('ERROR CREATING FILE IN INCORRECT DIRECTORY\nCode: ' + res.code + '\nShould be fixed now automatically!');
                parseDirs(main);
            }else{
                console.error('ERROR CREATING FILE\nCode: ' + res.code);
            }
        }
    }
}
const createDir = async (closeM = false, name = null) => {
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    if(name != null){
        let pathNow = getThisDir();
        const res = await fetch('/mk_dir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: pathNow, fileName: name })
        }).then(res => res.json())
        if(res.status === 'OK'){
            addDir(res.folder, {
                type: 'folder'
            })
        }else {
            if(res.code == 'ENOENT'){
                const main = await getDir('/');
                console.error('ERROR CREATING FOLDER IN INCORRECT DIRECTORY\nCode: ' + res.code + '\nShould be fixed now automatically!');
                parseDirs(main);
            }else{
                console.error('ERROR CREATING FOLDER\nCode: ' + res.code);
            }
        }
    }else promptBox('', {
        type: 'folder'
    });
}
const addDir = (file, options = {}) => {
    const box = document.querySelector('#file-table');
    const infoLast = localStorage.getItem('infoTab');
    const data_size = formatData(file.size);
    parsedFolders.push({ id: file.id, name: file.name, type: options.type, ext: null, size: data_size, favorite: file.favorite, createdAt: file.date });
    loadedFolders.folders.push({ id: file.id, name: file.name, type: options.type, ext: null, size: data_size, favorite: file.favorite, createdAt: file.date });
    const date = new Date(file.date);
    const formated_time = formatTime(date);
    const extra_row = `<i class="bx bx-star fav-hover"></i>`;
    let active = '';
    if(file.id == infoLast){
        active = 'active';
        allSelected.push(file.id)
    }
    const row = document.createElement('div');
    row.classList.add('row');
    if(active != '') row.classList.add(`${active}`);
    row.setAttribute('onclick', `select({ id:'${file.id}'})`);
    row.setAttribute('data-id', file.id);
    if(options.type == 'folder'){
        const p1 = document.createElement('p');
        p1.classList.add('icon')
        row.setAttribute('ondblclick', `goIn('${file.id}')`);
        p1.classList.add('bx')
        p1.classList.add('bx-folder');
        row.appendChild(p1);
    }else if(options.type == 'file'){
        let show_img = localStorage.getItem('display-image-explorer');
        if(!show_img) show_img = true;
        const icon = getIcon({ type: file.type, ext: file.ext, name_id: file.id }, { img: show_img, big: false });
        row.innerHTML = icon;
        if(file.type == 'image' || file.type == 'video' || file.type == 'audio') row.setAttribute('ondblclick', `showPreview('${file.id}')`);
        else row.setAttribute('ondblclick', `window.open('/open_file/${file.id}', '_blank')`);
    }
    const p2 = document.createElement('p');
    p2.classList.add('name');
    p2.setAttribute('title', file.name);
    const span1 = document.createElement('span');
    span1.innerText = file.name;
    p2.appendChild(span1);
    p2.innerHTML += extra_row;
    row.appendChild(p2);
    const p3 = document.createElement('p');
    p3.classList.add('size');
    const span2 = document.createElement('span');
    span2.innerText = data_size;
    p3.appendChild(span2);
    row.appendChild(p3);
    const p4 = document.createElement('p');
    p4.classList.add('created');
    p4.setAttribute('title', formated_time);
    const span3 = document.createElement('span');
    span3.innerText = formated_time;
    p4.appendChild(span3);
    row.appendChild(p4);
    if(options.type == 'folder' || options.type == 'file'){
        box.insertBefore(row, box.firstChild);
    }
    row.click();
};
const getInfoById = id => {
    let file = undefined;
    loadedFolders.folders.forEach(folder => {
        if(folder.id == id){
            file = folder;
            file.folder = true;
        }
    });
    if(file) return file;
    else loadedFolders.files.forEach(doc => {
        if(doc.id == id){
            file = doc;
            file.folder = false;
        }
    })
    if(file) return file;
    else parsedFolders.forEach(doc => {
        if(doc.id == id){
            file = doc;
        }
    });
    return file;
}
const moveFromTo = async (from, to) => {
    let folders = 0;
    let files = 0;
    from.forEach(el => { if(getInfoById(el).folder) folders++; else files++; });
    console.log(folders);
    console.log(files);
    const resp = await fetch('/mv_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: from, to: to })
    }).then( res => res.json() );
    if(!favorite){
        let pathNow = getThisDir();
        if(resp.status == 'OK'){
            if(pathNow != undefined && pathNow != null){
                const now = await getDir(pathNow);
                parseDirs(now);
            }else{
                const main = await getDir('/');
                parseDirs(main);
            }
            allSelected.length = 0;
            let message = 'Files moved successfully';
            if(from.length == 1 ){
                if(folders == 1) message = '1 Folder moved successfully.';
                else message = '1 File moved successfully';
            }else{
                if(files == 0) message == folders + ' Folders moved successfully.';
                else if(folders == 0) message = files + ' Files moved successfully.';
                else {
                    const fold = (folders > 1) ? folders + ' Folders': '1 Folder';
                    const fil = (files > 1) ? files + ' Files': '1 File';
                    message = `${fold} and ${fil} moved successfully.`;
                }
            }
            showMessage({ message: message });
        }else{
            console.log(resp.error);
        }
    }else{
        /*const pathNow = sessionStorage.getItem('last-in-fav');
        if(resp.success){
            if(pathNow != undefined && pathNow != null){
                const now = await getDir(pathNow);
                parseDirs(now);
            }else{
                const main = await getFav();
                parseDirs(main);
            }
        }else{
            console.log(resp.error);
        }*/
    }
}
const rcmndScrollObserver = new ResizeObserver(entries => {
    if(!shared && !favorite){
        const item = entries[0];
        const scroll_pos = Math.floor(item.target.scrollLeft / (item.target.scrollWidth - item.contentRect.width) * 100);
        document.querySelector('#scroll-pos-inner').style.width = formatScroll(scroll_pos) + '%';
    }
})
const getSuggested = async () => {
    const data = await fetch('/get_suggested', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).then(res => res.json());
    if(data.status == "OK"){
        return data.data;
    }else {
        console.error('An error has occured: \n' + data.error);
        return;
    }
}
const getDir = async (path) => {
    loadBar.style = '';
    loadBar.style.opacity = '1';
    interval = setInterval(() => {
        addLength(loadBar)
    }, 120)
    return await fetch('/get_dir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: path, sort: sortby })
    })
    .then(data => data.json())
    .then(data => {
        if(!favorite){
        }else{
            if(data.code === 'DIRMISSING') sessionStorage.setItem('last-in-fav', '/');
            else sessionStorage.setItem('last-in-fav', path);
        }
        if(data.status === 'OK'){
            window.history.pushState({ page: '/my-files', dir: data.dir_id }, '', '/my-files/' + data.dir_id);
            location_paths = data.path;
            return data;
        }
        else console.error(data.msg + '\n' + data.code);
        return null;
    })
}
const getFav = async () => {
    loadBar.style = '';
    loadBar.style.opacity = '1';
    interval = setInterval(() => {
        addLength(loadBar)
    }, 120)
    const data = await fetch('/get_fav', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sort: 1 })
    }).then(res => res.json());
    sessionStorage.setItem('last-in-fav', '/');
    if(data.status === 'OK') return data;
    else return null;
}
const getShared = async (path) => {
    loadBar.style = '';
    loadBar.style.opacity = '1';
    interval = setInterval(() => {
        addLength(loadBar)
    }, 120)
    const data = await fetch('/get_shared', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sort: 1, path: path })
    }).then(res => res.json());
    sessionStorage.setItem('last-in-s', path);
    if(data.status === 'OK') return data;
    else return null;
}
const getJunk = async () => {
    loadBar.style.opacity = '1';
    interval = setInterval(() => {
        addLength(loadBar)
    }, 120)
    const data = await fetch('/get_trash', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json());
    if(data.status === 'OK') return data;
    else {
        console.log(data)
        console.error('An error has occured while loading Trashed Files\n' + data.error);
        return null;
    }
}
const removeLastDirFromPath = (url) => {
    const arr = url.split('/');
    arr.pop();
    return arr.join('/');
}
const getFromPath = async (path) => {
    if(shared){
        if(path == '') parseDirs(await getShared('/'), true, false, true);
        else parseDirs(await getShared(path), true, false, true);
    }else if(favorite){
        if(path == '') parseDirs(await getFav('/'));
        else parseDirs(await getFav(path));
    }else{
        if(path == '') parseDirs(await getDir('/'));
        else parseDirs(await getDir(path));
    }
}
const goIn = async id => {
    if(favorite){
        const pathNow = sessionStorage.getItem('last-in-fav');
        if(pathNow != undefined && pathNow != null){
            const lastChar = pathNow.substr(pathNow.length, -1);
            if(lastChar == '/' || pathNow == '/') parseDirs(await getDir(id));
            else parseDirs(await getDir(id));
        }else parseDirs(await getDir('/' + id));
    }else if(shared){
        const pathNow = sessionStorage.getItem('last-in-s');
        if(pathNow != undefined && pathNow != null){
            const lastChar = pathNow.substr(pathNow.length, -1);
            if(lastChar == '/' || pathNow == '/') parseDirs(await getShared(id));
            else parseDirs(await getShared(id));
        }else parseDirs(await getShared(id));
    }else{
        const pathNow = getThisDir();
        if(pathNow != undefined && pathNow != null){
            const lastChar = pathNow.substr(pathNow.length, -1);
            if(lastChar == '/' || pathNow == '/') parseDirs(await getDir(id));
            else parseDirs(await getDir(id));
        }else parseDirs(await getDir(id));
    }
}
const goInSelected = async (closeM = false) => {
    if(closeM) {
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active');
    }
    const id = allSelected[0];
    if(!favorite){
        const pathNow = getThisDir();
        if(pathNow != undefined && pathNow != null){
            const lastChar = pathNow.substr(pathNow.length, -1);
            if(lastChar == '/' || pathNow == '/') parseDirs(await getDir(pathNow + id));
            else parseDirs(await getDir(pathNow + '/' + id));
        }
    }else{
        const pathNow = sessionStorage.getItem('last-in-fav');
        if(pathNow != undefined && pathNow != null){
            const lastChar = pathNow.substr(pathNow.length, -1);
            if(lastChar == '/' || pathNow == '/') parseDirs(await getDir(pathNow + id));
            else parseDirs(await getDir(pathNow + '/' + id));
        }
    }
}
const updateIcon = () => {
    //const iconT = document.querySelector('span#trashicon');
    const iconD = document.querySelector('span#downloadicon');
    if(allSelected.length > 0){
        //if(iconT.classList.contains('disabled')) iconT.classList.remove('disabled');
        if(iconD != undefined && iconD.classList.contains('disabled')) iconD.classList.remove('disabled');
    }else{
        //if(!iconT.classList.contains('disabled')) iconT.classList.add('disabled');
        if(iconD != undefined && !iconD.classList.contains('disabled')) iconD.classList.add('disabled');
    }
}
const deleteSelected = async (closeM = false, confirm = false) => {
    if(closeM) {
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    if(confirm){
        const resp = await fetch('/rm_dir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: allSelected })
        }).then(res => res.json())
        if(resp.status === 'OK'){
            removeDeletedRows(allSelected);
        }else{
            console.log(resp.error);
        }
    }else{
        confirmBox({
            type: 'remove',
            files: allSelected
        })
    }
}
const shareSelected = (closeM = false, confirm = false) => {
    if(closeM) {
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    if(confirm){
    }else{
        shareBox({
            files: allSelected
        })
    }
}
const recoverSelected = async (closeM = false) => {
    if(closeM) {
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const resp = await fetch('/recover_dir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: allSelected })
    }).then(res => res.json())
    if(resp.status === 'OK'){
        removeDeletedRows(allSelected);
    }else{
        console.log(resp.error);
    }
}
const removeDeletedRows = (rows) => {
    rows.forEach(rowID => {
        const row = document.querySelector(`div[data-id~='${rowID}']`);
        row.remove();
    });
    allSelected.length = 0;
}
const select = ({ id, ignore = false, l_ctrl = true, l_shift = true}) => {
    const table = document.querySelector('div#file-table');
    let f_id = null;
    let y = 0;
    let a = 0;
    parsedFolders.forEach(el => {
        if(el.id == id) {
            f_id = el.id;
            a = y;
            return true;
        }
        y++;
    })
    if(f_id !== null){
        if(!(ctrl_pressed || shift_pressed) || !(l_ctrl || l_shift)){
            if(open_info_tab) localStorage.setItem('infoTab', f_id);
            const row = table.querySelector(`div[data-id~='${f_id}']`);
            const have = row.classList.contains('active');
            if(!(ignore && have)){
                allSelected.length = 0;
                table.querySelectorAll('div.row').forEach(row => {
                    if(row.classList.contains('active') && row.getAttribute('data-id') != f_id) row.classList.remove('active');
                    else if(row.getAttribute('data-id') == f_id){
                        row.classList.add('active');
                        allSelected.push(f_id);
                    }
                })
            }
        }else if(ctrl_pressed && l_ctrl){
            const folder = table.querySelector(`div[data-id~='${f_id}']`);
            if(!folder.classList.contains('active')) {
                folder.classList.add('active');
                allSelected.push(f_id);
            }else{
                folder.classList.remove('active');
                const sel_len = allSelected.length;
                for(let i = 0; i < sel_len; i++){
                    if(allSelected[i] == f_id){
                        allSelected.splice(i, i);
                        break;
                    }
                }
            }
        }else if(shift_pressed && l_shift){
            const rows = table.querySelectorAll('div.row');
            let min = rows.length;
            let max = 0;
            let z = 0;
            rows.forEach(row => {
                if(row.classList.contains('active')){
                   if(z < min) min = z;
                   if(z > max) max = z;
                }
               z++;
            })
            if(a < min){
                for(let i = a; i <= max; i++){
                    const row = table.querySelectorAll('div.row')[i];
                    if(!row.classList.contains('active')){
                        row.classList.add('active');
                        allSelected.push(row.getAttribute('data-id'));
                    }
                }
            }else if(a > max){
                for(let i = max; i <= a; i++){
                    const row = table.querySelectorAll('div.row')[i];
                    if(!row.classList.contains('active')){
                        row.classList.add('active');
                        allSelected.push(row.getAttribute('data-id'));
                    }
                }
            }else{
                for(let i = min; i <= a; i++){
                    const row = table.querySelectorAll('div.row')[i];
                    if(!row.classList.contains('active')){
                        row.classList.add('active');
                        allSelected.push(row.getAttribute('data-id'));
                    }
                }
            }
        }
    }
    selected = true;
    updateIcon();
    if(open_info_tab) updateInfoBox();
}
const unSelect = () => {
    const table = document.querySelector('div#explorer');
    document.querySelector('div#clickable-area').addEventListener('mousedown', (e) => {
        e.preventDefault()
        if(selected){
            allSelected.length = 0;
            parsedFolders.forEach(el => {
                const row = table.querySelector(`div[data-id~='${el.id}']`);
                if(row != undefined)
                    if(row.classList.contains('active')){
                        row.classList.remove('active')
                    }
            })
            updateIcon();
        }
    });
}
const formatTime = (time) => {
    const now = new Date();
    if(time.toLocaleDateString() == now.toLocaleDateString()){
        return time.toLocaleTimeString();
    }else return time.toLocaleDateString();
}
const download = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.setAttribute("download", fileName);
    a.click();
}
const downloadSelected = (closeM = false) => {
    if(closeM) {
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    if(allSelected.length == 1){
        let name = '';
        parsedFolders.forEach(file => {
            if(file.id == allSelected[0]){
                name = file.name;
            }
        });
        download('/download_file/' + JSON.stringify(allSelected), name);
    }else if(allSelected.length > 1) download('/download_file/' + JSON.stringify(allSelected), 'NexCloud');
}
class ClassWatcher {

    constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
        this.targetNode = targetNode
        this.classToWatch = classToWatch
        this.classAddedCallback = classAddedCallback
        this.classRemovedCallback = classRemovedCallback
        this.observer = null
        this.lastClassState = targetNode.classList.contains(this.classToWatch)

        this.init()
    }

    init() {
        this.observer = new MutationObserver(this.mutationCallback)
        this.observe()
    }

    observe() {
        this.observer.observe(this.targetNode, { attributes: true })
    }

    disconnect() {
        this.observer.disconnect()
    }

    mutationCallback = mutationsList => {
        for(let mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                let currentClassState = mutation.target.classList.contains(this.classToWatch)
                if(this.lastClassState !== currentClassState) {
                    this.lastClassState = currentClassState
                    if(currentClassState) {
                        this.classAddedCallback()
                    }
                    else {
                        this.classRemovedCallback()
                    }
                }
            }
        }
    }
}
const closeSImg = () => {
    if(listen_arrows_2) listen_arrows_2 = false;
    if(!listen_arrows) listen_arrows = true;
    const fileCont = document.querySelector('#showFile');
    const preview = document.querySelector('#previewEl');
    const fileBg = document.querySelector('#showFileBG');
    const controller = document.querySelector('#previewControlls');
    fileBg.addEventListener('transitionend', function handleT() {
        fileCont.classList.remove('active');
        fileBg.classList.remove('active');
        fileBg.removeEventListener('transitionend', handleT);
        preview.remove();
    });
    controller.classList.remove('active');
    fileCont.style.opacity = '0';
    fileBg.style.opacity = '0';
    viewing = null;
}
const swapPreviewName = name => {
    const nav = document.querySelector('#sfNav').querySelector('.file-name');
    nav.innerText = name;
    nav.setAttribute('title', name);
}
const swapSuggestedName = new_name => {
    const recommended = document.querySelector('#recommended');
    const names = recommended.querySelectorAll('.suggested-name');
    if(suggestedFiles.length > 0){
        names.forEach(name => {
            const value = name.querySelector('span');
            let found = false;
            suggestedFiles.forEach(file => {
                if(file.name == value.innerText){
                    found = true;
                    return;
                }
            })
            if(!found){
                value.innerText = new_name;
                name.setAttribute('title', new_name);
                return;
            }
        })
    }
}
let zoomrng = 0;
let angle = 0;
const resetPreviewControlls = () => {
    const controlls = document.querySelector('#previewControlls');
    controlls.querySelectorAll('span.button').forEach(btn => {
        if(!btn.classList.contains('zmo')){
             if(btn.classList.contains('disabled')) btn.classList.remove('disabled');
        }else if(!btn.classList.contains('disabled')) btn.classList.add('disabled');
    });
    if(!listen_arrows_2) listen_arrows_2 = true;
    if(listen_arrows) listen_arrows = false;
    zoomrng = 0;
    angle = 0;
}
const previewZoomI = el => {
    if(zoomrng < 6){
        const img = document.querySelector('#previewEl');
        const w = img.clientWidth;
        if(w != undefined && zoomrng != 5){
            const sbtn = el.parentNode.querySelector('.zmo');
            if(sbtn.classList.contains('disabled')) sbtn.classList.remove('disabled');
            img.style.width = (w + 120) + 'px';
            zoomrng++;
        }else if(w != undefined){
            img.style.width = (w + 120) + 'px';
            zoomrng++;
            if(!el.classList.contains('disabled')) el.classList.add('disabled');
        }
    }else if(!el.classList.contains('disabled')) el.classList.add('disabled');
}
const previewZoomO = (el, e) => {
    const img = document.querySelector('#previewEl');
    const w = img.clientWidth;
    if(e.detail < 3){
        if(zoomrng > 1){
            if(w != undefined && w > 70){
                if(el.classList.contains('disabled')) el.classList.remove('disabled');
                const sbtn = el.parentNode.querySelector('.zmi');
                if(sbtn.classList.contains('disabled')) sbtn.classList.remove('disabled');
                img.style.width = (w - 120) + 'px';
                zoomrng--;
            }else if(!el.classList.contains('disabled')) el.classList.add('disabled');
        }else{
            if(zoomrng > 0){
                img.style.width = img.naturalWidth + 'px';
                zoomrng--;
            }if(!el.classList.contains('disabled')) el.classList.add('disabled');
        }
    }else{
        img.style.width = img.naturalWidth + 'px';
        resetPreviewControlls();
    }
}
const previewRotL = el => {
    const img = document.querySelector('#previewEl');
    angle -= 90;
    if(angle < 0) angle = 270;
    img.style.transform = `rotateZ(${angle}deg)`;
}
const previewRotR = el => {
    const img = document.querySelector('#previewEl');
    angle += 90;
    if(angle > 360) angle = 90;
    img.style.transform = `rotateZ(${angle}deg)`;
}
const swapPreview = (next) => {
    let previewEl = document.querySelector('#previewEl');
    const current_id = previewEl.getAttribute('data-id');
    if(current_id){
        let el = {}, new_id = current_id;
        const len = viewingFiles.length;
        while(el.type != 'image' && el.type != 'video' && el.type != 'audio' && new_id >= 0 && new_id < len){
            if(next) new_id++;
            else new_id--;
            el = viewingFiles[new_id];
            if(el != undefined && (el.type == 'image' || el.type == 'video' || el.type == 'audio')) break;
            else el = {};
        }
        if(el != undefined && ( el.type == 'image' || el.type == 'video' || el.type == 'audio')){
            select({ 
                id: el.id,
                l_ctrl: false,
                l_shift: false
            });
            /*previewLoader.style.width = el.img_size.w + "px";
            previewLoader.style.height = el.img_size.h + "px";
            previewLoader.setAttribute('src', `/open_image/${el.id}/50x50`);*/
            if(previewEl != undefined) previewEl.remove();
            showPreview(el.id, { files: viewingFiles });
        }
    }
}
const downloadPreviewed = () => {
    if(viewing != undefined){
    let name = viewing.name;
        const splitted = name.split('.');
        if(splitted[splitted.length - 1] != viewing.ext) name += '.' + viewing.ext;
        download('/download_file/' + JSON.stringify([ viewing.id ]), name);
    }
}
const printPreview = () => {
    const id = document.querySelector('#previewEl').getAttribute('data-name');
    loadedFolders.files.forEach(fl => {
        if(fl.id == id){
            const img_link = `/open_file/${fl.id}/`;
            printJS({ printable: img_link, type: 'image'})
        }
    })
}
let preview_loader = false;
const showPreview = (img_id, options = {}) => {
    resetPreviewControlls();
    if(img_id == undefined){
        allSelected.forEach(sl => {
            let f = {};
            loadedFolders.files.forEach(ld => {
                if(ld.id == sl) {
                    if(ld.type == 'image' || ld.type == 'video' || ld.type == 'audio') f = ld;
                    return 0;
                }
            })
            if(f.type == 'image' || f.type == 'video' || f.type == 'audio') {
                img_id = f.id;
                return 0;
            }
        });
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const fileCont = document.querySelector('#showFile');
    const fileBg = document.querySelector('#showFileBG');
    const previewEl = document.querySelector('#previewEl');
    const previewCont = document.querySelector('#preview-container');
    const previewLoader = document.querySelector('#preview-loader');
    const controller = document.querySelector('#previewControlls');
    const right = document.querySelector('#prwGoRight');
    const left = document.querySelector('#prwGoLeft');
    left.classList.remove('disabled');
    right.classList.remove('disabled');
    left.style.display = '';
    right.style.display = '';
    if(!preview_loader){
        preview_loader = true;
        previewLoader.addEventListener('load', () => {
            previewLoader.style.display = 'block';
        })
    }else{
        previewLoader.style.display = 'block';
    }
    let classWatcher = new ClassWatcher(fileBg, 'active', () => {
        setTimeout(() => {
            fileBg.style.opacity = '1';
            fileCont.style.opacity = '1';
        }, 10)
    }, () => {
    })
    let i = -1;
    let file;
    if(options.file == undefined && options.files == undefined){
        const len = loadedFolders.files.length;
        viewingFiles = loadedFolders.files;
        for(i = 0; i < len; i++){
            if(loadedFolders.files[i].id == img_id) {
                file = loadedFolders.files[i];
                if(loadedFolders.files[i-1] == undefined) left.classList.add('disabled');
                if(loadedFolders.files[i+1] == undefined) right.classList.add('disabled');
                break;
            }
        }
    }else if(options.files != undefined){
        viewingFiles = options.files;
        const len = options.files.length;
        for(i = 0; i < len; i++){
            if(options.files[i].id == img_id) {
                file = options.files[i];
                if(options.files[i-1] == undefined) left.classList.add('disabled');
                if(options.files[i+1] == undefined) right.classList.add('disabled');
                break;
            }
        }
    }else if(options.file){
        file = options.file;
        left.style.display = 'none';
        right.style.display = 'none';
    }
    viewing = file;
    if(file != undefined){
        if(file.type == 'image') controller.classList.add('active');
        else controller.classList.remove('active');
        fileBg.classList.add('active');
        swapPreviewName(file.name)
        if(previewEl != null) previewEl.remove();
        if(file.type == 'image'){
            const img = document.createElement('img');
            img.style.display = 'none';
            img.setAttribute('id', 'previewEl');
            if(i >= 0) img.setAttribute('data-id', `${i}`);
            img.setAttribute('data-name', `${file.id}`);
            img.addEventListener('load', () => {
                img.style.width = img.naturalWidth + 'px';
                previewLoader.style.display = 'none';
                img.style.display = '';
                previewCont.addEventListener('click', function handleC(e){
                    if(e.target == previewCont) {
                        closeSImg();
                        previewCont.removeEventListener('click', handleC);
                    }
                })
            })
            img.setAttribute('src', `/open_file/${file.id}`);
            img.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
            previewCont.appendChild(img);
        }else if(file.type == 'video'){
            const video = document.createElement('video');
            video.style.display = 'none';
            video.setAttribute('id', 'previewEl');
            if(i >= 0) video.setAttribute('data-id', `${i}`);
            video.setAttribute('data-name', `${file.id}`);
            //video.setAttribute('autoplay', 'true');
            video.setAttribute('controls', 'true');
            video.addEventListener('loadedmetadata', () => {
                previewLoader.style.display = 'none';
                video.style.display = '';
                previewCont.addEventListener('click', function handleC(e){
                    if(e.target == previewCont) {
                        closeSImg();
                        previewCont.removeEventListener('click', handleC);
                    }
                })
            })
            video.setAttribute('src', `/open_file/${file.id}`);
            video.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
            previewCont.appendChild(video);
        }else if(file.type == 'audio'){
            const audio = document.createElement('audio');
            audio.style.display = 'none';
            audio.setAttribute('id', 'previewEl');
            if(i >= 0) audio.setAttribute('data-id', `${i}`);
            audio.setAttribute('data-name', `${file.id}`);
            //audio.setAttribute('autoplay', 'true');
            audio.setAttribute('controls', 'true');
            audio.addEventListener('loadedmetadata', () => {
                previewLoader.style.display = 'none';
                audio.style.display = '';
                previewCont.addEventListener('click', function handleC(e){
                    if(e.target == previewCont) {
                        closeSImg();
                        previewCont.removeEventListener('click', handleC);
                    }
                })
            })
            audio.setAttribute('src', `/open_file/${file.id}`);
            audio.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
            previewCont.appendChild(audio);
        }
    }
    return;
}
const parseDirs = async (data, delete_parsed = true, upd_path = false, shared = false) => {
    if(data !== null){
        const area = document.querySelector('#clickable-area');
        area.style = '';
        parsedFolders.length = 0;
        const folders = data.folders;
        const files = data.files;
        const path = data.path;
        const path_holder = document.querySelector('#path_value');
        if(!upd_path && path_holder != undefined){
            path_holder.innerHTML = '';
            const a = document.createElement('a');
            a.classList.add('bx');
            a.classList.add('home');
            a.classList.add('bxs-home');
            a.setAttribute('onclick', `getFromPath('/')`);
            path_holder.appendChild(a);
            let n = 0;
            const len = path.length;
            path.forEach(el => {
                const i = document.createElement('i');
                i.classList.add('bx');
                i.classList.add('bx-chevron-right');
                path_holder.appendChild(i);
                const a = document.createElement('a');
                if(n < len - 1) a.setAttribute('onclick', `getFromPath('${el.path}')`);
                a.innerText = el.name;
                path_holder.appendChild(a);
                n++;
            })
        }
        const box = document.querySelector('div#file-table');
        if(delete_parsed) {
            parsedFolders.length = 0;
            loadedFolders = { folders: folders, files: files, path: path };
            parsed = 0;
            box.innerHTML = "";
        }
        const infoLast = localStorage.getItem('infoTab');
        let show_img = localStorage.getItem('display-image-explorer');
        if(show_img == 'false') show_img = false;
        else{
            show_img = true;
            localStorage.setItem('display-image-explorer', true)
        }
        if(folders.length > 0 || files.length > 0){
            let i = 0;
            folders.forEach(folder => {
                //load while scrolling
                //if(i >= 30) return;
                parsed++;
                is_empty_dir = false;
                const data_size = formatData(folder.size);
                parsedFolders.push({ id: folder.id, name: folder.name, type: 'folder', ext: null, size: data_size, favorite: folder.favorite, createdAt: folder.date });
                const date = new Date(folder.date);
                const formated_time = formatTime(date);
                let extra_row = `<i class="bx bxs-star fav"></i>`;                
                if(!folder.favorite) extra_row = `<i class="bx bx-star fav-hover"></i>`;
                let active = '';
                if(folder.id == infoLast){
                    active = 'active';
                    allSelected.push(folder.id)
                }
                const row = document.createElement('div');
                row.classList.add('row');
                if(active != '') row.classList.add(`${active}`);
                row.setAttribute('onclick', `select({ id:'${folder.id}'})`);
                row.setAttribute('data-id', folder.id);
                row.setAttribute('ondblclick', `goIn('${folder.id}')`);
                const p1 = document.createElement('p');
                p1.classList.add('icon')
                p1.classList.add('bx')
                p1.classList.add('bx-folder');
                row.appendChild(p1);
                const p2 = document.createElement('p');
                p2.classList.add('name');
                p2.setAttribute('title', folder.name);
                const span1 = document.createElement('span');
                span1.innerText = folder.name;
                p2.appendChild(span1);
                p2.innerHTML += extra_row;
                row.appendChild(p2);
                const p3 = document.createElement('p');
                p3.classList.add('size');
                const span2 = document.createElement('span');
                span2.innerText = data_size;
                p3.appendChild(span2);
                row.appendChild(p3);
                const p4 = document.createElement('p');
                p4.classList.add('created');
                p4.setAttribute('title', formated_time);
                const span3 = document.createElement('span');
                span3.innerText = formated_time;
                p4.appendChild(span3);
                row.appendChild(p4);
                box.appendChild(row);
                i++;
            });
            files.forEach(file => {
                //load while scrolling
                //if(i >= 30) return;
                parsed++;
                const data_size = formatData(file.size);
                parsedFolders.push({ id: file.id, name: file.name, favorite: file.favorite, type: file.type, size: data_size, ext: file.ext, createdAt: file.date });
                const date = new Date(file.date);
                const formated_time = formatTime(date);
                const options = {
                    big: true,
                    img: show_img
                }
                const icon = getIcon({ type: file.type, ext: file.ext, name_id: file.id }, options);
                let extra_row = `<i class="bx bxs-star fav"></i>`;
                if(!file.favorite) extra_row = `<i class="bx bx-star fav-hover"></i>`;
                let active = '';
                if(file.id == infoLast){
                    active = 'active';
                    allSelected.push(file.id)
                }
                const row = document.createElement('div');
                row.classList.add('row');
                if(active != '') row.classList.add(`${active}`);
                row.setAttribute('onclick', `select({id:'${file.id}'})`); 
                if(file.type == 'image' || file.type == 'video' || file.type == 'audio') row.setAttribute('ondblclick', `showPreview('${file.id}')`);
                else row.setAttribute('ondblclick', `window.open('/open_file/${file.id}', '_blank')`);
                row.setAttribute('data-id', `${file.id}`);
                row.innerHTML = icon;
                const p1 = document.createElement('p');
                p1.classList.add('name');
                p1.setAttribute('title', `${file.name}`);
                const span1 = document.createElement('span');
                span1.innerText = file.name;
                p1.appendChild(span1);
                p1.innerHTML += extra_row;
                row.appendChild(p1);
                const p2 = document.createElement('p');
                p2.classList.add('size');
                p2.setAttribute('title', `${data_size}`);
                const span2 = document.createElement('span');
                span2.innerText = data_size;
                p2.appendChild(span2);
                row.appendChild(p2);
                const p3 = document.createElement('p');
                p3.classList.add('created');
                p3.setAttribute('title', `${formated_time}`);
                const span3 = document.createElement('span');
                span3.innerText = formated_time;
                p3.appendChild(span3);
                row.appendChild(p3);
                box.appendChild(row);
                i++;
            });
        }else if(delete_parsed){
            const div = document.createElement('div');
            div.classList.add('empty-dir');
            const div_inner = document.createElement('div');
            const i = document.createElement('i');
            i.classList.add('bx');
            i.classList.add('bxs-folder-open');
            const p1 = document.createElement('p');
            p1.innerText = 'This directory is empty!';
            const p2 = document.createElement('p');
            p2.innerText = 'Drag and drop items here to start uploading.';
            div_inner.appendChild(i);
            div_inner.appendChild(p1);
            div_inner.appendChild(p2);
            div.appendChild(div_inner);
            box.appendChild(div)
        }
        const box_height = Math.ceil(box.getBoundingClientRect().height);
        let rcmnd_height;
        if(document.querySelector('#recommended')){
            rcmnd_height = Math.ceil(document.querySelector('#recommended').getBoundingClientRect().height);
        }
        const clc_h = box_height + (rcmnd_height != undefined) ? rcmnd_height : 0;
        area.style.height = `calc(100% - ${clc_h})`;
    }else {
        //parseDirs(await getDir('/'));
    }
    if(!shown_info_tab){
        shown_info_tab = true;
        const tabState = localStorage.getItem('infoTab');
        if(tabState){
            open_info_tab = true;
            document.querySelector('div#file-info').classList.add('active');
            updateInfoBox(tabState);
        }
    }
    onXMLRend();
    parsing_dirs = false;
}
const parseSuggested = data => {
    if(data != undefined){
        suggestedFiles.length = 0;
        const recommended = document.querySelector('#recommended');
        const recommendedcont = document.querySelector('#recommended-cont');
        recommended.innerHTML = '';
        let show_images = true;
        const ls = localStorage.getItem('display-image-recommended');
        if(ls == undefined){
            if(localStorage.getItem('slow-loading') != 'true') localStorage.setItem('display-image-recommended', 'true');
            else{
                localStorage.setItem('display-image-recommended', 'false');
                show_images = false;
            }
        }else if(ls == 'false') show_images = false;
        if(data.length > 0){
            recommendedcont.style.display = '';
            data.forEach(file => {
                suggestedFiles.push(file)
                const div = document.createElement('div');
                div.classList.add('suggested-file');
                const options = {
                    big: true,
                    img: false
                }
                const name_icon = getIcon({ type: file.type, ext: file.ext, name_id: file.id }, options);
                const icon = document.createElement('div');
                icon.classList.add('suggested-icon');
                icon.innerHTML = name_icon;
                if(/*file.type == 'video' || */file.type == 'image' && show_images){
                    const img = document.createElement('img');
                    img.setAttribute('src', `/open_image/${file.id}/170x`);
                    img.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
                    img.addEventListener('load', () => {
                        icon.innerHTML = '';
                        icon.appendChild(img);
                    })
                }
                div.appendChild(icon)
                const name = document.createElement('p');
                name.classList.add('suggested-name');
                const name_holder = document.createElement('span');
                name_holder.innerText = file.name;
                name.innerHTML = name_icon;
                name.appendChild(name_holder)
                name.setAttribute('title', file.name);
                const last_opened = document.createElement('span');
                last_opened.classList.add('suggested-last-opened');
                const entered_date = getFormatedTime(file.entered_date);
                last_opened.innerText = entered_date;
                div.appendChild(name);
                div.appendChild(last_opened)
                div.addEventListener('click', () => {
                    showPreview(file.id, { files: data })
                })
                recommended.appendChild(div);
            });
        }else recommendedcont.style.display = 'none';
    }
}
const formatScroll = pos => {
    if(pos < 10) pos += 4;
    else if(pos < 20) pos += 3.5;
    else if(pos < 30) pos += 3;
    else if(pos < 40) pos += 2.5;
    else if(pos < 50) pos += 2;
    else if(pos < 60) pos += 1.5;
    else if(pos < 70) pos += 1;
    else if(pos < 80) pos += 0.5;
    return pos;
}
const listenRcmnddScroll = () => {
    const recommended = document.querySelector('#recommended');
    const scroll_pos = document.querySelector('#scroll-pos-inner');
    const scroll_pos_out = document.querySelector('#scroll-pos');
    const cancelMove = () => {
        down = false;
        document.body.style.cursor = '';
        recommended.style.cursor = '';
    }
    let down = false;
    let previous = 0;
    let left = 0;
    let limit;
    let last_scrolled;
    let mouse_down = false;
    recommended.style.cursor = '';
    document.body.style.cursor = '';
    recommended.addEventListener('mousedown', e => { limit = recommended.scrollWidth - recommended.getBoundingClientRect().width; previous = e.pageX - recommended.offsetLeft; left = recommended.scrollLeft; down = true; document.body.style.cursor = 'grabbing'; recommended.style.cursor = 'grabbing';});
    window.addEventListener('mouseup', cancelMove);
    recommended.addEventListener('mouseleave', cancelMove);
    window.addEventListener('mousemove', e => {
        if(!down) return;
        else{
            e.preventDefault();
            const dx = e.pageX - recommended.offsetLeft;
            const walk = dx - previous;
            recommended.scrollLeft = left - walk;
            let scrolled = Math.floor(recommended.scrollLeft / limit * 100);
            if(last_scrolled != scrolled){
                last_scrolled = scrolled;
                if(scrolled <= 100){
                    scroll_pos.style.width = formatScroll(scrolled) + '%';
                }
            }
        }
    })
    scroll_pos_out.addEventListener('mousedown', e => { mouse_down = true });
    document.body.addEventListener('mouseup', e => { mouse_down = false });
    document.body.addEventListener('mousemove', e => {
        if(mouse_down){
            const pos = e.pageX - scroll_pos_out.getBoundingClientRect().left;
            const perc = formatScroll(Math.floor(pos / scroll_pos_out.getBoundingClientRect().width * 100));
            scroll_pos.style.width = perc + '%';
            if(limit == undefined) limit = recommended.scrollWidth - recommended.getBoundingClientRect().width;
            const scroll = limit * perc / 100;
            recommended.scrollTo({
                top: 0,
                left: scroll
            });
        }
    });
    scroll_pos_out.addEventListener('click', e => {
        const pos = e.pageX - scroll_pos_out.getBoundingClientRect().left;
        const perc = formatScroll(Math.floor(pos / scroll_pos_out.getBoundingClientRect().width * 100));
        scroll_pos.style.width = perc + '%';
        if(limit == undefined) limit = recommended.scrollWidth - recommended.getBoundingClientRect().width;
        const scroll = limit * perc / 100;
        recommended.scrollTo({
            top: 0,
            left: scroll,
            'behavior': 'smooth'
        });
    })
}
const getFormatedTime = time => {
    let msec = new Date() - new Date(time);
    let ss = Math.floor(msec / 1000);
    let mm = Math.floor(msec / 1000 / 60);
    let hh = Math.floor(msec / 1000 / 60 / 60);
    let dd = Math.floor(msec / 1000 / 60 / 60 / 24);
    let m = Math.floor(msec / 1000 / 60 / 60 / 24 / 30);
    let y = Math.floor(msec / 1000 / 60 / 60 / 24 / 30 / 12);
    if(ss < 60){
        const when = (ss == 1) ? " second." : " seconds.";
        return "Opened before " + ss + when;
    }else if(mm < 60) {
        const when = (mm == 1) ? " minute." : " minutes.";
        return "Opened before " + mm + when;
    }else if(hh < 24){
        const when = (hh == 1) ? " hour." : " hours.";
        return "Opened before " + hh + when;
    }else if(dd < 30){
        const when = (dd == 1) ? " day." : " days.";
        return "Opened before " + dd + when;
    }else if(m < 24){
        const when = (m == 1) ? " month." : " months.";
        return "Opened before " + m + when;
    }else{
        const when = (y == 1) ? " year." : " years.";
        return "Opened before " + y + when;
    }
}
let get_back = false;
const getBack = async () => {
    if(!get_back && location_paths.length){
        get_back = true;
        let before = '/';
        if(location_paths.length > 1) before = location_paths[location_paths.length - 2].path;
        await getDir(before)
        .then(data => {
            parseDirs(data);
            get_back = false;
        })
    }
}
const refresh = async (trash = null) => {
    if(trash === null){
        listen_mouse = true;
        listen_ctrl = true;
        listen_shift = true;
        const data = await getGlobalData();
        if(!data.error) replaceData({ used: data.used, max: data.max });
        else replaceData({ used: 0, max: 0 });
        if(favorite){
            const pathNow = sessionStorage.getItem('last-in-fav');
            if(pathNow != undefined && pathNow != null) parseDirs(await getFav(pathNow));
            else parseDirs(await getFav('/'));
        }else if(shared){
            const pathNow = sessionStorage.getItem('last-in-s');
            if(pathNow != undefined && pathNow != null) parseDirs(await getShared(pathNow));
            else parseDirs(await getShared('/'));
        }else{
            const pathNow = getThisDir();
            if(pathNow != undefined && pathNow != null) parseDirs(await getDir(pathNow));
            else parseDirs(await getDir('/'));
        }
    }else{
        const trash = await getJunk();
        parseDirs(trash);
    }
}
const updateInfoBox = (lastid) => {
    const info = document.querySelector('div#file-info');
    const firstSelected = allSelected[0];
    let selected = null;
    let found = false;
    if(lastid){
        parsedFolders.forEach(loaded => {
            if(loaded.id == lastid){
                selected = loaded;
                found = true;
                return 0;
            }
        });
    }
    if(!found){
        parsedFolders.forEach(loaded => {
            if(loaded.id == firstSelected){
                selected = loaded;
                return 0;
            }
        });
    }
    if(selected != null){
        const id = selected.id;
        const name = selected.name;
        const type = selected.type;
        const fav = selected.favorite;
        let favorite = 'No';
        if(fav) favorite = 'Yes';
        const ext = selected.ext;
        const size = selected.size;
        const date = new Date(selected.createdAt);
        const formated_date = date.toLocaleDateString();
        const formated_time = date.toLocaleTimeString();
        const icon = getIcon({ type: type, ext: ext });
        let img = "";
        if(type == 'image'){
            img = `style ="background-image: url('/open_image/${id}/260x180')"`;
        }else img = "style = 'display: none'";
        let plain = `
        <div>
            <div>${icon}<span title="${name}">${name}</span></div>
            <i onclick="closeMoreInfo()" class="bx bx-x"></i>
        </div>
        <div class="img" ${img}></div>
        <div id="file-info-cont">
            <p>System Information</p>
            <div class="table">
                <div>
                    <span>Type: </span>
                    <span>${type}</span>
                </div>`;
                if(ext != null){
                plain += `<div>
                    <span>Extension: </span>
                    <span>.${ext}</span>
                </div>`; }
                plain += `<div>
                    <span>Favorite: </span>
                    <span>${favorite}</span>
                </div>
                <div>
                    <span>Size: </span>
                    <span>${size}</span>
                </div>
                <div>
                    <span>Created Date: </span>
                    <span>${formated_date}</span>
                </div>
                <div>
                    <span>Created Time: </span>
                    <span>${formated_time}</span>
                </div>
            </div>
        </div>
        `;
        info.innerHTML = plain;
    }
}
const showInfo = (closeM = false) => {
    open_info_tab = true;
    localStorage.setItem('infoTab', allSelected[0]);
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const info = document.querySelector('div#file-info');
    updateInfoBox();
    if(!info.classList.contains('showInfo')) info.classList.add('active');
    shown_info_tab = true;
}
const closeMoreInfo = () => {
    open_info_tab = false;
    localStorage.removeItem('infoTab');
    const info = document.querySelector('div#file-info');
    if(info.classList.contains('active')) info.classList.remove('active');
    shown_info_tab = false;
}
const copySelected = async (closeM = false) => {
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const resp = await fetch('/copy_dir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: allSelected })
    }).then(res => res.json())
    if(resp.status == 'OK'){
        if(resp.user_storage != null) replaceData({ used: resp.user_storage.used, max: resp.user_storage.max });
        if(resp.docs)
            resp.docs.forEach(doc => {
                if(doc.folder) addDir(doc, { type: 'folder' });
                else addDir(doc, { type: 'file' });
            });
            if(resp.failed.length > 0) showMessage({message: 'Some Documents failed to copy.', revoke: true, success: () => { console.log('revoke') }});
            else showMessage({message: 'Documents have been copied successfully.', revoke: true, success: () => { console.log('revoke') }});
        if(resp.failed){
            resp.failed.forEach(item => {console.log(item)});
        }
    }else{
        showMessage({message: 'An Error has occured. Try again later.'});
    }
}
const dragAndDropUpload = () => {
    const isAdvancedUpload = function() {
        const div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    }();
    if(isAdvancedUpload){
        const droparea = document.querySelector('body');
        const active = () => droparea.classList.add("dropping");
        const inactive = () => droparea.classList.remove('dropping');
        const prevents = (e) => e.preventDefault();

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
            droparea.addEventListener(evtName, prevents);
        });
    
        ['dragenter', 'dragover'].forEach(evtName => {
            droparea.addEventListener(evtName, active);
        });
    
        ['dragleave', 'drop'].forEach(evtName => {
            droparea.addEventListener(evtName, inactive);
        });
    
        droparea.addEventListener("drop", e => {
            const files = e.dataTransfer.files;
            let data = new FormData();
            const files_len = files.length;
            if(files_len > 0){
                let long = false;
                uploading = [];
                if(files_len > 1){
                    uploading[0] = 'Files';
                    uploading[1] = '';
                    long = true;
                }else{ 
                    uploading[0] = files[0].name;
                    uploading[1] = files[0].name;
                }
                for(let i = 0; i < files_len; i++){
                    data.append('files_arr', files[i]);
                    if(long){
                        uploading[1] += files[i].name;
                        if(i < files_len - 1) uploading[1] += '; \n';
                    }
                }
                let pathNow = getThisDir();
                if(pathNow == '') pathNow = '/';
                const json = JSON.stringify({ path: pathNow });
                const blob = new Blob([json], {
                type: 'application/json'
                });
                data.append('document', blob)
                showProgress(files);
                const xhr = new XMLHttpRequest();
                xhr.upload.addEventListener('progress', onProgress, false);
                xhr.addEventListener('load', async () => {
                    if(xhr.readyState == 4 && xhr.status == 200){
                        const res = JSON.parse(xhr.response);
                        if(res.status === 'success'){
                            uploading = null;
                            parseDirs(await getDir(pathNow))
                            const data = await getGlobalData();
                            if(!data.error) {
                                replaceData({ used: data.used, max: data.max });
                                parseSuggested(await getSuggested())
                            }else replaceData({ used: 0, max: 0 })
                        }else onProgress(null, true);
                    }
                })
                xhr.addEventListener('error', err => {
                    onProgress(null, true);
                    console.log(err)
                })
                xhr.open('POST', '/upload_file');
                xhr.send(data);
                xhr_uploadings.push(xhr)
            }else console.log('error')
        });
    }
}
const dirUpload = (closeM = false, open = true) => {
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    const input = document.querySelector('input#dir-input');
    input.addEventListener('change', function handleChange() {
        input.removeEventListener('change', handleChange);
        console.log(input.files);
    })
    if(open) input.click();
}
const fileUpload = (closeM = false, open = true) => {
    if(closeM){
        const menu = document.querySelector('div#context-menu');
        menu.classList.remove('active')
    }
    let pathNow = getThisDir();
    if(pathNow == '') pathNow = '/';
    const input = document.querySelector('input#file-input');
    if(open) input.click();
    input.addEventListener('change', function handleChange() {
        input.removeEventListener('change', handleChange);
        let data = new FormData();
        const files = input.files;
        const files_len = input.files.length;
        if(files_len > 0){
            let long = false;
            uploading = [];
            if(files_len > 1){
                uploading[0] = 'Files';
                uploading[1] = '';
                long = true;
            }else{ 
                uploading[0] = files[0].name;
                uploading[1] = files[0].name;
            }
            for(let i = 0; i < files_len; i++){
                data.append('files_arr', files[i]);
                if(long){
                    uploading[1] += files[i].name;
                    if(i < files_len - 1) uploading[1] += '; \n';
                }
            }
            const json = JSON.stringify({ path: pathNow });
            const blob = new Blob([json], {
            type: 'application/json'
            });
            data.append('document', blob)
            showProgress(files);
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', onProgress, false);
            xhr.addEventListener('load', async () => {
                if(xhr.readyState == 4 && xhr.status == 200){
                    const res = JSON.parse(xhr.response);
                    if(res.status === 'success'){
                        uploading = null;
                        parseDirs(await getDir(pathNow))
                        const data = await getGlobalData();
                        if(!data.error) {
                            replaceData({ used: data.used, max: data.max });
                            parseSuggested(await getSuggested());
                        }else replaceData({ used: 0, max: 0 })
                    }else onProgress(null, true);
                }
            })
            xhr.addEventListener('error', err => {
                onProgress(null, true);
                console.log(err)
            })
            xhr.open('POST', '/upload_file');
            xhr.send(data);
            xhr_uploadings.push(xhr)
        }else console.log('error')
    })
}
const changeStateUPopup = () => {
    const popup = document.querySelector('#popup');
    if(popup.classList.contains('expanded')) popup.classList.remove('expanded');
    else popup.classList.add('expanded');
}
const showProgress = (uploading_files) => {
    const popup = document.querySelector('#popup');
    const popup_bg = document.querySelector('#popup-bg');
    popup_bg.style = '';
    popup.style = '';
    popup.innerHTML = '';
    const div = document.createElement('div');
    const content = document.createElement('div');
    const span = document.createElement('span');
    const span2 = document.createElement('span');
    content.classList.add('content');
    const right = document.createElement('div');
    const icon = document.createElement('a');
    icon.classList.add('bx');
    icon.classList.add('bx-chevron-down');
    icon.classList.add('popupBtn');
    icon.addEventListener('click', () => changeStateUPopup())
    right.appendChild(icon);
    const icon2 = document.createElement('a');
    icon2.classList.add('bx');
    icon2.classList.add('bx-x');
    icon2.classList.add('popupBtn');
    icon2.addEventListener('click', () => closePopup());
    right.appendChild(icon2)
    span2.classList.add('upload-name');
    span2.innerText = 'Uploading File';
    if(uploading !== null) {
        span2.innerText = 'Uploading: ' + uploading[0];
        span2.title = uploading[1];
    }
    span.id = 'loaded_perc';
    div.classList.add('upload-progress');
    div.appendChild(span)
    content.appendChild(span2);
    content.appendChild(right)
    popup.appendChild(content);
    popup.appendChild(div);
    //expanded content
    const expanded_box = document.createElement('div');
    expanded_box.classList.add('expanded-content');
    for(let i = 0; i < uploading_files.length; i++){
        const item = document.createElement('div');
        item.classList.add('uploading-item');
        const item_name = document.createElement('span');
        item_name.classList.add('name');
        const options = {
            img: false,
            big: false
        }
        const icon = getIcon({ type: 'image', ext: 'jpg' }, options);
        item_name.innerHTML = icon;
        const name_text = document.createElement('p');
        name_text.innerText = uploading_files[i].name;
        name_text.classList.add('text');
        item_name.appendChild(name_text);
        item.appendChild(item_name);
        const status = document.createElement('div');
        status.classList.add('uploading_status');
        const circle = document.createElement('div');
        circle.classList.add('inner-circle');
        status.appendChild(circle);
        item.appendChild(status);
        expanded_box.appendChild(item);
    }
    popup.appendChild(expanded_box);
    if(!shown_fu) {
        shown_fu = true;
        listenFUMove();
    }
    popup.classList.add('expanded');
    popup.classList.add('active');
}
const onProgress = (ev, err = false) => {
    const popup = document.querySelector('#popup');
    const holder = popup.querySelector('#loaded_perc');
    if(!err){
        const loaded = Math.ceil((ev.loaded / ev.total) * 100);
        holder.style.width = loaded + '%';
    }else{
        holder.style.width = '100%';
        holder.style.backgroundColor = 'rgb(164, 0, 34)';
    }
}
const closePopup = () => {
    const popup = document.querySelector('#popup');
    if(popup.classList.contains('active')) popup.classList.remove('active');
    xhr_uploadings.forEach(xhr => {
        xhr.abort();
    })
    uploading = false;
    document.querySelector('body').style.cursor = '';
}
const listenFUMove = () => {
    if(listen_fumove){
        const element = document.querySelector('#popup');
        let listening = false;
        element.addEventListener('mousedown', function moveElement(elE) {
            document.querySelectorAll('.popupBtn').forEach(el => {
                el.addEventListener('mousedown', (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                })
            })
            const body = document.querySelector('body');
            body.style.userSelect = 'none';
            body.style.cursor = 'none';
            const boundingRect = element.getBoundingClientRect();
            const bodyBoundingRect = body.getBoundingClientRect();
            const contRect = document.querySelector('#content').getBoundingClientRect();
            const posEl = { x: elE.clientX - boundingRect.left, y: elE.clientY - boundingRect.top };
            const sizeEl = { w: boundingRect.width, h: boundingRect.height };
            const sizeBdy = { w: bodyBoundingRect.width, h: document.querySelector('#top').getBoundingClientRect().height + contRect.height };
            const sizeCont = { w: contRect.width, h: contRect.height };
            body.addEventListener('mousemove', function movingEl(e) {
                const x = e.clientX - posEl.x;
                const y = e.clientY - posEl.y;
                if(x + sizeEl.w < sizeBdy.w - 8 && x > sizeBdy.w - sizeCont.w + 8) element.style.left = x + 'px';
                if(y + sizeEl.h < sizeBdy.h - 8 && y > sizeBdy.h - sizeCont.h + 8) element.style.top = y + 'px';
                body.addEventListener('mouseup', function moveElStop() {
                    body.style.cursor = '';
                    body.style.userSelect = '';
                    body.removeEventListener('mousemove', movingEl);
                });
            });
        })
    }
}
const onLoad = async () => {
    document.body.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
    //load while scrolling
    /*if(!listen_exp_scroll){
        listenExpScrol();
        listen_exp_scroll = true;
    }*/
    favorite = false;
    shared = false;
    rcmndScrollObserver.observe(document.querySelector('#recommended'));
    if(!listen_ctrl){
        listenCTRL();
        listen_ctrl = true;
    }
    if(!listen_rcmndd_scroll){
        listenRcmnddScroll();
    }
    if(!listen_search){
        listenForSearch();
        listen_search = true;
    }
    listenMouseSelect();
    if(!listen_shortcuts){
        listenShortcuts();
        listen_shortcuts = true;
    }
    listen_mouse = true;
    if(!listen_enter){
        listenENTER();
        listen_enter = true;
    }
    if(!listen_i){
        listenI();
        listen_i = true;
    }
    if(!listen_r){
        listenR();
        listen_r = true;
    }
    if(!listen_b){
        listenB();
        listen_b = true;
    }
    if(!listen_n){
        listenN();
        listen_n = true;
    }
    if(!listen_z){
        listenCTRLpZ();
        listen_z = true;
    }
    if(!listen_cp){
        listenCTRLpC();
        listen_cp = true;
    }
    if(!listen_fumove){
        if(shown_fu) listenFUMove();
        listen_fumove = false;
    }
    if(!listen_unload){
        listenForUnload();
        listen_unload = true;
    }
    if(!listen_shift){
        listenSHIFT();
        listen_shift = true;
    }
    if(!listen_del){
        listenDEL();
        listen_del = true;
    }
    if(!listen_arrows){
        listenARROW();
        listen_arrows = true;
    }
    if(!listen_arrows_2){
        listenARROWS2();
    }
    listenTabSwitch();
    dragAndDropUpload();
    unSelect();
    const pathNow = getThisDir();
    if(pathNow != undefined && pathNow != null){
        const now = await getDir(pathNow);
        parseDirs(now);
    }else{
        const main = await getDir('/');
        parseDirs(main);
    }
    parseSuggested(await getSuggested())
};
const onLoadF = async () => {
    favorite = true;
    shared = false;
    if(!listen_search){
        listenForSearch();
        listen_search = true;
    }
    if(!listen_ctrl){
        listenCTRL();
        listen_ctrl = true;
    }
    listenMouseSelect();
    listen_mouse = true;
    if(!listen_enter){
        listenENTER();
        listen_enter = true;
    }
    if(!listen_unload){
        listenForUnload();
        listen_unload = true;
    }
    if(!listen_shift){
        listenSHIFT();
        listen_shift = true;
    }
    if(!listen_del){
        listenDEL();
        listen_del = true;
    }
    if(!listen_arrows){
        listenARROW();
        listen_arrows = true;
    }
    if(!listen_arrows_2){
        listenARROWS2();
    }
    if(!listen_z){
        listenCTRLpZ();
        listen_z = true;
    }
    listen_n = false, listen_b = false, listen_cp = false;
    listenTabSwitch();
    unSelect();
    const now = await getFav();
    parseDirs(now, true, false);
    if(!listen_search){
        listenForSearch();
        listen_search = true;
    }
};
const onLoadT = async () => {
    favorite = false;
    shared = false;
    if(!listen_search){
        listenForSearch();
        listen_search = true;
    }
    if(!listen_ctrl){
        listenCTRL();
        listen_ctrl = true;
    }
    listenMouseSelect();
    listen_mouse = true;
    if(!listen_shift){
        listenSHIFT();
        listen_shift = true;
    }
    if(!listen_del){
        listenDEL();
        listen_del = true;
    }
    if(!listen_arrows){
        listenARROW();
        listen_arrows = true;
    }
    if(!listen_z){
        listenCTRLpZ();
        listen_z = true;
    }
    listen_n = false, listen_i = false, listen_b = false, listen_cp = false;
    listenTabSwitch();
    unSelect();
    const trash = await getJunk();
    parseDirs(trash, true, true);
};
const onLoadS = async () => {
    document.body.ondragstart = function(e) { e.preventDefault(); e.stopImmediatePropagation(); return false; };
    //load while scrolling
    /*if(!listen_exp_scroll){
        listenExpScrol();
        listen_exp_scroll = true;
    }*/
    favorite = false;
    shared = true;
    if(!listen_ctrl){
        listenCTRL();
        listen_ctrl = true;
    }
    if(!listen_search){
        listenForSearch();
        listen_search = true;
    }
    listenMouseSelect();
    listen_mouse = true;
    if(!listen_enter){
        listenENTER();
        listen_enter = true;
    }
    if(!listen_i){
        listenI();
        listen_i = true;
    }
    if(!listen_r){
        listenR();
        listen_r = true;
    }
    if(!listen_b){
        listenB();
        listen_b = true;
    }
    if(!listen_n){
        listenN();
        listen_n = true;
    }
    if(!listen_z){
        listenCTRLpZ();
        listen_z = true;
    }
    if(!listen_cp){
        listenCTRLpC();
        listen_cp = true;
    }
    if(!listen_fumove){
        if(shown_fu) listenFUMove();
        listen_fumove = true;
    }
    if(!listen_shift){
        listenSHIFT();
        listen_shift = true;
    }
    if(!listen_arrows){
        listenARROW();
        listen_arrows = true;
    }
    if(!listen_arrows_2){
        listenARROWS2();
    }
    listen_n = false, listen_b = false, listen_cp = false;
    listenTabSwitch();
    unSelect();
    const pathNow = sessionStorage.getItem('last-in-s');
    if(pathNow != undefined && pathNow != null){
        const now = await getShared(pathNow);
        parseDirs(now, true, false, true);
    }else{
        const main = await getShared('/');
        parseDirs(main, true, false, true);
    }
};