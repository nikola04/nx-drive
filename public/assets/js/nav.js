/*if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    const domain = 'ncloud.net';
    const path = window.location.pathname;
    window.location.href= `http://mobile.${domain}${path}`;
}*/
const setTheme = (theme) => {
    if(theme == 1) switchTheme(1);
    else if(theme == 2) switchTheme(0);
    else{
        if(window.matchMedia("(prefers-color-scheme: dark)").matches) switchTheme(0);
        else switchTheme(1);
    }
    let exp = new Date();
    exp.setTime(exp.getTime() + 1000 * 3600 * 24 * 365);
    document.cookie = `theme=${theme}; expires=${exp}; path=/`;
}
const switchTheme = (theme) => {
    const colors = [
        { var: '--txt-color-xxlight', dark: '#9b8fdf' },
        { var: '--txt-color-xlight', dark: '#897cd9' },
        { var: '--txt-color-light', dark: '#7868d4' },
        { var: '--txt-color', dark: '#6654ce' },
        { var: '--txt-color-dark', dark: '#5440c8' },
        { var: '--txt-color-xdark', dark: '#4935ba' },
        { var: '--txt-color-xxdark', dark: '#4130a6' },
        { var: '--txt-color-basic', dark: '#fff', light: '#111' },
        { var: '--txt-color-basic-rgb', dark: '255, 255, 255', light: '0, 0, 0' },
        { var: '--txt-color-basic-rgb2', dark: '0, 0, 0', light: '255, 255, 255' },
        { var: '--txt-color-basic2', dark: '#e1e1e1', light: '#424242' },
        { var: '--txt-color-basic3', dark: '#d0d0d0', light: '#323232' },
        { var: '--bg-color-light', dark: '#202020', light: '#f7f7f7' },
        { var: '--bg-color-nav', dark: '#181818', light: 'f9f9f9' },
        { var: '--bg-color-navalt', dark: '#212121', light: '#f3f3f3' },
        { var: '--bg-color-nav2', dark: '#191919', light: '#f8f8f8'},
        { var: '--bg-color-body', dark: '#151515', light: '#fafafa' },
        { var: '--bg-color-light', dark: '#333', light: '#eee' },
        { var: '--bg-color-input', dark: '#222', light: '#ddd' },
        { var: '--row-hover-txt', dark: '#998be5' },
        { var: '--row-hover-rgb', dark: '160, 147, 235' },
        { var: '--menu-hover-rgb', dark: '150, 150, 150', light: '60, 60, 60' },
        { var: '--scroll-thumb', dark: '#444', light: '#e0e0e0' },
        { var: '--scroll-thumbh', dark: '#666', light: '#cacaca' },
        { var: '--scroll-thumba', dark: '#555', light: '#d6d6d6' },
        { var: '--search-rgb', dark: '255, 255, 255', light: '117, 117, 117' },
        { var: '--search-result', dark: '#3a3a3a', light: '#e6e6e6' },
        { var: '--search-txt-color', dark: '#efefef', light: '#454545' },
        { var: '--loader-gradient', dark: '#242424, #181818', light: '#fafafa, #f0f0f0' },
        { var: '--loader-cloud', dark: '#fff', light: '#323232' },
        { var: '--border-color-light', dark: '#444', light: '#dadce0' },
        { var: '--bg-color-added-user', dark: '#444', light: '#beb9c8' }
    ];
    if(document.querySelector('style#colors') == null){
        const st = document.createElement('style');
        st.setAttribute('id', 'colors');
        document.head.appendChild(st);
    } 
    const style = document.querySelector('style#colors');
    if(theme){
        style.innerText = ':root{ \n';
        colors.forEach(color => {
            let val = color.light;
            if(val == null) val = color.dark;
            style.innerText += color.var + ': ' + val + ' !important;\n';
        })
        style.innerText += '}';
    }else{
        style.innerText = ':root{ \n';
        colors.forEach(color => {
            style.innerText += color.var + ': ' + color.dark + ' !important;\n';
        })
        style.innerText += '}';
    }
}
window.addEventListener('load', () => {
    const input_el = document.querySelector('#search-bar');
    const box = document.querySelector('#search-result');
    const cont = document.querySelector('#search-div');
    const filters = document.querySelector('#filter-btn');
    let filter_click = false
    filters.addEventListener('mousedown', e => {
        filter_click = true;
    })
    document.querySelector('html').addEventListener('mouseup', e => {
        filter_click = false;
        box_click = false;
    })
    let len = 0;
    let suggested = false;
    input_el.addEventListener('focus', () => {
        focused = true;
        if(len > 0) suggested = true;
        updateSearch(input_el.value, true);
        if(!cont.classList.contains('focus')) cont.classList.add('focus');
        if(!box.classList.contains('active')) box.classList.add('active');
    })
    let box_click = false;
    box.addEventListener('mousedown', e => {
        box_click = true;
    });
    box.addEventListener('mouseup', () => {
        setTimeout(() => {
            box.classList.remove('active');
            cont.classList.remove('focus');
            input_el.value = '';
        }, 100)
    })
    input_el.addEventListener('blur', () => {
        if(!box_click && !filter_click) {
            box.classList.remove('active');
            cont.classList.remove('focus');
        }
    });
    input_el.addEventListener('keyup', () => {
        len = input_el.value.length;
        if(len > 0){ 
            updateSearch(input_el.value);
        }else if(!suggested) box.classList.remove('active');
    });
    document.querySelectorAll(`input[name='dark_theme']`).forEach(inp => {
        inp.addEventListener('change', () => {
            if(inp.value) setTheme(inp.value);
        })
    })
})
//Function to Show Filters
const showFilters = () => {
    console.log('opening filters tab..')
}
//Loaded Search
const loadedSearch = [];
const loadedSearchItems = [];
//Function to update Search whenever input content changes
const updateSearch = async (search, first = false) => {
    const response = await fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: search })
    }).then(res => res.json());
    if(response.status == 'OK') {
        let parse = false;

        if(loadedSearch.length > 0)
            if(response.data.length == loadedSearch.length){
                for(let i = 0; i < response.data.length; i++){
                    if(loadedSearch[i] != response.data[i].id) {
                        parse = true;
                        break;
                    }
                }
            }else parse = true;
        else parse = true;
        if(parse) parseSearch(response.data, first);
        else {
            const box = document.querySelector('#search-result');
            if(!box.classList.contains('active')) box.classList.add('active');
        }
    }else console.log(response)
}
//Function to get
const getIcon = (file, options = { big: false, img: true }) => {
    let icon = null;
    if(file.type == 'folder'){
        icon = "<p class='icon bx bxs-folder'></p>";
    }else if(file.type == 'image'){
        //to do
        //treba da stavim pravu sliku
        if(file.name_id != null && options.big && options.img) icon = `<p class='icon icon-img'><img src='/open_image/${file.name_id}/40x40'></p>`;
        else if(file.name_id != null && options.img) icon = `<p class='icon icon-img'><img src='/open_image/${file.name_id}/30x30'></p>`;
        else icon = "<p class='icon bx bx-image'></p>";
    }else if(file.type == 'video'){
        icon = "<p class='icon bx bxs-videos'></p>";
    }else if(file.type == 'audio'){
        icon = "<p class='icon bx bxs-music'></p>";
    }else if(file.ext == "docx" || file.ext == "doc"){
        icon = "<p class='icon bx bxs-file-doc'></p>";
    }else if(file.ext == "pdf"){
        icon = "<p class='icon bx bxs-file-pdf'></p>";
    }else if(file.ext == "txt"){
        icon = "<p class='icon bx bxs-file-txt'></p>";
    }else if(file.ext == ""){
        icon = "<p class='icon bx bxs-file-blank'></p>";
    }else if(file.ext == "zip" || file.ext == "rar" || file.ext == "7z" || file.ext == "rar" || file.ext == "7zip"){
        icon = "<p class='icon bx bxs-file-archive'></p>";
    }else{
        icon = "<p class='icon bx bx-file'></p>";
    }
    return icon;
}
//Function to parse Search Result to container
const parseSearch = (results, first = false) => {
    loadedSearch.length = 0;
    const container = document.querySelector('#search-result');
    container.innerHTML = '';
    if(results.length > 0){
        results.forEach(result => {
            loadedSearchItems.push(result)
            loadedSearch.push(result.id);
            const icon = getIcon({ type: result.type, name_id: result.name_id });
            const name = document.createElement('p');
            name.classList.add('name');
            name.innerText = result.name;
            name.setAttribute('title', result.name);
            const box = document.createElement('div');
            box.classList.add('src-result-item');
            box.innerHTML = icon;
            box.appendChild(name);
            if(result.type == "folder") box.setAttribute('onclick', `goTo('${result.id}')`);
            else{
                if(result.type == "image" || result.type == "video" || result.type == 'audio') box.addEventListener('click', () => {
                    showPreview(result.id, { file: { id: result.name_id, name: result.name, ext: result.ext, favorite: result.favorite, type: result.type } });
                });
                else box.setAttribute('onclick', `window.open('/open_file/${result.name_id}', '_blank')`);
            }
            container.appendChild(box);
        })
    }else if(!first){
        const box = document.createElement('div');
        box.classList.add('no-results');
        const i = document.createElement('i');
        i.classList.add('bx');
        i.classList.add('bx-x')
        const p = document.createElement('p');
        p.innerHTML = 'There are no results for current query';
        box.appendChild(i);
        box.appendChild(p);
        container.appendChild(box);
    }
}
//Function to go in clicked folder
const goTo = async name => {
    const resp = await fetch('/find_dir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name })
    }).then(res => res.json());
    if(resp.status == 'OK') parseDirs(await getDir(resp.name));
    else console.log(resp);
}
//Function to expand side menu or shrink it
let state = 1;
let movingM = false;
const sideMenu = () => {
    if(!movingM || true){
        movingM = true;
        const sideNav = document.querySelector('nav#side');
        const smMenu = document.querySelector('nav#smSide');
        if(!state){
            smMenu.classList.remove('active');
            smMenu.addEventListener('transitionend', function handleTransitionEnd(){
                smMenu.removeEventListener('transitionend', handleTransitionEnd);
                sideNav.classList.add('active');
            })
        }else{
            sideNav.classList.remove('active');
            sideNav.addEventListener('transitionend', function handleTransitionEnd(){
                sideNav.removeEventListener('transitionend', handleTransitionEnd);
                smMenu.classList.add('active');
            })
        }
        state = (state + 1) % 2;
        localStorage.setItem('menu-state', state);
    }
}
let displayed = false;
let sb_state = false;
let kb_state = false;
let mb_state = false;
document.addEventListener("click", function addBtnEvent(evt){
    const btn = document.querySelector('#addBtn');
    const cont = document.querySelector('#addNewContainer');
    const s_btn = document.querySelector('#settingsBtn');
    const s_box = document.querySelector('#settingsBox');
    const k_btn = document.querySelector('#keyboardBtn');
    const k_bg = document.querySelector('#keyboardBg');
    const m_btn = document.querySelector('#menuBtn');
    const m_box = document.querySelector('#menuBox');
    let targetEl = evt.target;
    do {
        if(targetEl == btn || targetEl == cont){
            if(sb_state){
                sb_state = false;
                settingsBtn(false);
            }
            if(mb_state){
                mb_state = false;
                menuBtn(false);
            }
            if(kb_state){
                kb_state = false;
                keyboardBtn(false);
            }
            if(targetEl == btn && displayed) {
                addButton(false);
                displayed = false;
                return 0;
            }
            addButton(true);
            displayed = true;
            return 0;
        }else if(targetEl == s_btn || targetEl == s_box){
            if(displayed){
                displayed = false;
                addButton(false);
            }
            if(mb_state){
                mb_state = false;
                menuBtn(false);
            }
            if(kb_state){
                kb_state = false;
                keyboardBtn(false);
            }
            if(targetEl == s_btn && sb_state) {
                settingsBtn(false);
                sb_state = false;
                return 0;
            }
            if(targetEl != s_box) settingsBtn(true);
            sb_state = true;
            return 0;
        }else if(targetEl == k_btn || targetEl == k_bg){
            if(displayed){
                displayed = false;
                addButton(false);
            }
            if(mb_state){
                mb_state = false;
                menuBtn(false);
            }
            if(sb_state){
                sb_state = false;
                settingsBtn(false);
            }
            if(kb_state){
                keyboardBtn(false);
                kb_state = false;
                return;
            }
            keyboardBtn(true);
            kb_state = true;
            return;
        }else if(targetEl == m_btn || targetEl == m_box){
            if(displayed){
                displayed = false;
                addButton(false);
            }
            if(sb_state){
                sb_state = false;
                settingsBtn(false);
            }
            if(mb_state && targetEl == m_btn){
                mb_state = false;
                menuBtn(false);
                return;
            }
            menuBtn(true);
            mb_state = true;
            return;
        }
        // Go up the DOM
        targetEl = targetEl.parentNode;
    } while (targetEl);
    if(displayed){
        displayed = false;
        addButton(false);
    }
    if(sb_state){
        sb_state = false;
        settingsBtn(false);
    }
    if(mb_state){
        mb_state = false;
        menuBtn(false);
    }
});
document.addEventListener('contextmenu', () => {
    if(displayed){
        displayed = false;
        addButton(false);
    }
    if(sb_state){
        sb_state = false;
        settingsBtn(false);
    }
})
//Keyboard Button
const keyboardBtn = (state) => {
    const k_btn = document.querySelector('#keyboardBtn');
    const k_bg = document.querySelector('#keyboardBg');
    const k_box = document.querySelector('#keyboardBox');
    if(state){
        k_btn.classList.add('active');
        k_bg.classList.add('active');
        k_box.classList.add('active');
        setTimeout(() => {
            k_bg.style.opacity = 1;
            k_box.style.opacity = 1;
        }, 30);
        kb_state = true;
    }else{
        k_bg.addEventListener('transitionend', function handleTEnd(){
            k_bg.classList.remove('active');
            k_bg.removeEventListener('transitionend', handleTEnd);
        })
        k_box.addEventListener('transitionend', function handleTEnd(){
            k_box.classList.remove('active');
            k_box.removeEventListener('transitionend', handleTEnd);
        })
        k_box.style.opacity = 0;
        k_bg.style.opacity = 0;
        k_btn.classList.remove('active');
        kb_state = false;
    }
}
//Menu Button
const menuBtn = (state) => {
    const m_btn = document.querySelector('#menuBtn');
    const m_box = document.querySelector('#menuBox');
    if(state){
        m_btn.classList.add('active');
        m_box.classList.add('active');
        setTimeout(() => {
            m_box.style.opacity = 1
        }, 30)
    }else{
        m_btn.classList.remove('active');
        m_box.addEventListener('transitionend', function handleTEnd(){
            m_box.classList.remove('active');
            m_box.removeEventListener('transitionend', handleTEnd);
        });
        m_box.style.opacity = 0;
    }
}
//Settings Button
const settingsBtn = (state) => {
    const s_btn = document.querySelector('#settingsBtn');
    const s_box = document.querySelector('#settingsBox');
    if(state){
        resetMenu();
        s_btn.classList.add('active');
        s_box.classList.add('active');
    }else{
        s_btn.classList.remove('active');
        s_box.classList.remove('active');
    }
}
const resetMenu = () => {
    const box = document.querySelector('#settingsBox');
    const main = box.querySelector('div.main');
    const divs = box.querySelectorAll('div.child')
    divs.forEach(div => { div.classList.remove('active'); div.style = ''; });
    box.style.height = '';
    main.classList.add('active');
}
const switchMenu = ({ theme = 0, main = 0, switch_acc = 0, settings, help = 0, langs = 0, back = 0 }) => {
    const box = document.querySelector('#settingsBox');
    const divs = box.querySelectorAll('div.child');
    let new_div = undefined;
    if(theme) new_div = box.querySelector('div.theme');
    else if(switch_acc) new_div = box.querySelector('div.sacc');
    else if(settings) new_div = box.querySelector('div.settnpriv');
    else if(help) new_div = box.querySelector('div.helpnsupp');
    else if(langs) new_div = box.querySelector('div.language');
    else if(main) new_div = box.querySelector('div.main');
    divs.forEach(div => {
        if(div.classList.contains('active')){
            if(!main && !back) new_div.style.transform = 'translateX(100%)';
            div.style.transform = '';
            div.addEventListener('transitionend', function handleTEnd(){
                div.style.display = '';
                div.removeEventListener('transitionend', handleTEnd);
            });
            div.style.display = 'flex';
            if(main || back) div.style.transform = 'translateX(100%)';
            div.classList.remove('active');
            new_div.style.display = 'flex';
            box.style = 'height: ' + (new_div.getBoundingClientRect().height + 16) + 'px !important';
            setTimeout(() => {
                new_div.classList.add('active');
            }, 50)
        }
    });
}
let changing = false;
const changeLanguage = async lang => {
    if(!changing){
        changing = true;
        const resp = await fetch('/change-lang', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lang: lang })
        }).then(res => res.json());
        if(resp){
            if(resp.status == 'OK') window.location.reload();
            else{
                console.error(resp.error);
                changing = false;
            }
        }
    }
}
let autoclose;
const showMessage = ({ message, revoke = false, success }) => {
    const box = document.querySelector('#notif-message');
    const text = box.querySelector('p');
    text.innerText = message;
    if(!revoke) box.classList.remove('revoke');
    else{
        box.classList.add('revoke');
        const btn = box.querySelector('.revoke-btn');
        btn.addEventListener('click', success);
    }
    box.style.display = 'flex';
    box.classList.add('active');
    if(autoclose) clearTimeout(autoclose);
    autoclose = setTimeout(() => {
        closeNotifMessage();
    }, 7500);
}
const closeNotifMessage = () => {
    const box = document.querySelector('#notif-message');
    box.addEventListener('transitionend', function handleTEnd(){
        box.classList.remove('active');
        box.classList.remove('revoke');
        box.style = '';
        box.removeEventListener('transitionend', handleTEnd);
    });
    box.style.opacity = '0';
}
//Add Button
const addButton = (display) => {
    const btn = document.querySelector('#addBtn');
    const cont = document.querySelector('#addNewContainer');
    if(display) {
        cont.classList.add('active');
        btn.classList.add('active');
    }else{
        cont.classList.remove('active');
        btn.classList.remove('active');
    }
}
//Additional Load Page Functions
//Expand length of load bar every time interval call it
const addLength = (bar) => {
    let width = bar.style.width;
    if(width == null || width == undefined) width == 0;
    else width = Number(width.substr(0, width.length - 1));
    if(width + 8 <= 100){
        bar.style.width = width + 8 + '%'; 
    }else{
        bar.style.width = '100%';
        clearInterval(interval);
    }
}
//On XML HTTP Request end function to stop loading bar
const onXMLRend = (loadBar = document.querySelector('div#loaded')) => {
    clearInterval(interval);
    loadBar.style.width = "100%";
    loadBar.style.opacity = '0';
    loadBar.addEventListener('transitionend', function handleTransitionEnd() {
        loadBar.style = "";
        loading = false;
        loadBar.removeEventListener('transitionend', handleTransitionEnd);
    } );
}
let loading = false;
let interval;
//load page function
const load = (url) => {
    if(window.location.href.includes(url)) return;
    const loadBar = document.querySelector('div#loaded');
    if(!loading){
        loading = true;
        loadBar.style.opacity = '1';
        interval = setInterval(() => {
            addLength(loadBar)
        }, 120)
        document.querySelector('#content-inner').style.opacity = '0';
        loadPage({
            url: `${url}`,
            element: '#content-inner',
            where: '#content-inner',
            success: () => {
                changeActiveNav(url);
                onXMLRend(loadBar);
                onLoadScript(url);
            },
            error: () => {
                onXMLRend(loadBar);
            }
        })
    }
}
const changeActiveNav = (url) => {
    const menu_items = document.querySelectorAll('span.menu-item');
    if(url == '/my-files'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'files'){
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }else if(url == '/trash'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'trash'){
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }else if(url == '/favorites'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'fav') {
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }else if(url == '/shared'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'shared') {
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }
}
const onLoadScript = (url) => {
    if(url == '/my-files' || url == '/trash' || url == '/favorites' || url == '/shared'){
        if(window.loadedScripts == undefined) window.loadedScripts = [];
        if(!window.loadedScripts.includes('getfiles')){
            const oldScript = document.querySelector('#pageScript');
            if(oldScript != null) oldScript.remove();
            const oldStyle = document.querySelector('#pageStyle');
            if(oldStyle != null) oldStyle.remove();
            if(url == '/my-files'){
                loadScript({
                    url: '/assets/js/getfiles.js',
                    dataType: 'script',
                    attr: [
                        { attr: 'id', value: 'pageScript' },
                        { attr: 'onload', value: 'onLoad()' }
                    ]
                })
            }else if(url == '/trash'){
                loadScript({
                    url: '/assets/js/getfiles.js',
                    dataType: 'script',
                    attr: [
                        { attr: 'id', value: 'pageScript' },
                        { attr: 'onload', value: 'onLoadT()' }
                    ]
                })
            }else if(url == '/favorites'){
                loadScript({
                    url: '/assets/js/getfiles.js',
                    dataType: 'script',
                    attr: [
                        { attr: 'id', value: 'pageScript' },
                        { attr: 'onload', value: 'onLoadF()' }
                    ]
                })
            }else if(url == '/shared'){
                loadScript({
                    url: '/assets/js/getfiles.js',
                    dataType: 'script',
                    attr: [
                        { attr: 'id', value: 'pageScript' },
                        { attr: 'onload', value: 'onLoadS()' }
                    ]
                })
            }
            loadScript({
                url: '/assets/css/file-manager.css',
                dataType: 'css',
                attr: [
                    { attr: 'id', value: 'pageStyle' },
                    { attr: 'onload', value: `onLoadStyle()`}
                ]
            })
            window.loadedScripts.push('getfiles')
        }else{
            document.querySelector('#content-inner').style.opacity = '1';
            if(url == '/my-files') onLoad();
            else if(url == '/trash') onLoadT();
            else if(url == '/favorites') onLoadF();
            else if(url == '/shared') onLoadS();
        }
    }else{
        if(typeof listen_mouse !== undefined) listen_mouse = false;
        if(typeof listen_shift !== undefined) listen_shift = false;
        if(typeof listen_ctrl !== undefined) listen_ctrl = false;
        if(typeof listen_enter !== undefined) listen_enter = false;
        if(typeof listen_enter !== undefined) listen_arrow = false;
        if(typeof listen_del !== undefined) listen_del = false;
        document.querySelector('#content-inner').style.opacity = '1';
    }
}
const onLoadStyle = () => {
    document.querySelector('#content-inner').style.opacity = '1';
}
//Replace data for used space
const replaceData = (db_data) => {
    const using = document.querySelector('p#using-space');
    const out_of = document.querySelector('p#out-of');
    const used_space = document.querySelector('span#used-space');

    using.innerText = formatData(db_data.used);
    out_of.innerText = formatData(db_data.max);
    
    const perc = ((db_data.used / db_data.max) * 100).toFixed(1);
    used_space.style.width = `${perc}%`;
    used_space.parentNode.parentNode.title = `Used: ${perc}%`;
}
//Format data to MB, GB or TB
const formatData = (value) => {
    if(value >= 1099511627776){
        let num = value / 1099511627776;
        const split = (String(num)).split('.');
        if(split[1] != undefined && split[1].length == 1) value = num.toFixed(1);
        else if(split[1] != undefined && split[1].length > 1){
            value = num.toFixed(2)
            if(Number(String(value).substr(String(value).length - 1, 1)) == 0) value = num.toFixed(1);
        }
        else value = Math.ceil(num);
        return value + " TB";
    }else if(value >= 1073741824){
        let num = value / 1073741824;
        const split = (String(num)).split('.');
        if(split[1] != undefined && split[1].length == 1) value = num.toFixed(1);
        else if(split[1] != undefined && split[1].length > 1){
            value = num.toFixed(2)
            if(Number(String(value).substr(String(value).length - 1, 1)) == 0) value = num.toFixed(1);
        }
        else value = Math.ceil(num);
        return value + " GB";
    }else if(value >= 1048576){
        let num = value / 1048576;
        const split = (String(num)).split('.');
        if(split[1] != undefined && split[1].length == 1) value = num.toFixed(1);
        else if(split[1] != undefined && split[1].length > 1){
            value = num.toFixed(2)
            if(Number(String(value).substr(String(value).length - 1, 1)) == 0) value = num.toFixed(1);
        }
        else value = Math.ceil(num);
        return value + " MB";
    }else if(value >= 1024){
        let num = value / 1024;
        const split = (String(num)).split('.');
        if(split[1] != undefined && split[1].length == 1) value = num.toFixed(1);
        else if(split[1] != undefined && split[1].length > 1){
            value = num.toFixed(2)
            if(Number(String(value).substr(String(value).length - 1, 1)) == 0) value = num.toFixed(1);
        }
        else value = Math.ceil(num);
        return value + " KB";
    }else if(value < 1024 && value != null) return value + " B";
    else if(value === null) return '-';
    else return value;
}
const getGlobalData = async () => {
    const data = await fetch('/getMemoryStat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
    return data;
}
//Logout User
const logout = async () => {
    const resp = await fetch('/logout' ,{
        method: 'POST'
    }).then(res => res.json());
    if(resp.status === 'OK' || resp.code === 'LOGGEDOUT') {
        sessionStorage.setItem('last-in', '/');
        location.href = '/';
    }else console.log(resp);
}
//Check for new popstate event and replace page data
window.addEventListener('popstate', async (e) => {
    if(e.state){
        e.preventDefault();
        if(e.state.page == '/my-files'){
            if(e.state.dir) parseDirs(await getDir(e.state.dir));
            else parseDirs(await getDir('/'))
        }else if(e.state.page == '/trash'){
            const now = await getJunk();
            parseDirs(now);
        }else if(e.state.page == '/favorites'){
            const now = await getJunk();
            parseDirs(now);
        }
        
    }
})
window.addEventListener('load', async () => {
    const data = await getGlobalData();
    if(!data.error) replaceData({ used: data.used, max: data.max });
    else replaceData({ used: 0, max: 0 })
    const loader = document.querySelector('div#loader')
    loader.addEventListener('transitionend', function handleTransition(e){
        loader.style.display ="none";
        loader.removeEventListener('transitionend', handleTransition)
    })
    loader.classList.add('loaded');
})