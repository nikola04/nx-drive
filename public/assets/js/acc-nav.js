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
    document.querySelectorAll(`input[name='dark_theme']`).forEach(inp => {
        inp.addEventListener('change', () => {
            if(inp.value) setTheme(inp.value);
        })
    })
})
let displayed = false;
let sb_state = false;
let kb_state = false;
let mb_state = false;
document.addEventListener("click", function addBtnEvent(evt){
    const btn = document.querySelector('#addBtn');
    const cont = document.querySelector('#addNewContainer');
    const s_btn = document.querySelector('#settingsBtn');
    const s_box = document.querySelector('#settingsBox');
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
            if(targetEl == s_btn && sb_state) {
                settingsBtn(false);
                sb_state = false;
                return 0;
            }
            if(targetEl != s_box) settingsBtn(true);
            sb_state = true;
            return 0;
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
let loading = false;
const load = (url) => {
    if(window.location.href.includes(url) && url != "/") return;
    if(!loading){
        loading = true;
        changeActiveNav(url); //to be removed
        onXMLRend(); //to be removed
        //document.querySelector('#content-inner').style.opacity = '0';
        // loadPage({
        //     url: `/account${url}`,
        //     element: '#content-inner',
        //     where: '#content-inner',
        //     success: () => {
        //         changeActiveNav(url);
        //         onXMLRend(loadBar);
        //         onLoadScript(url);
        //     },
        //     error: () => {
        //         onXMLRend(loadBar);
        //     }
        // })
    }
}
const onXMLRend = () => {
    loading = false;
}
const changeActiveNav = (url) => {
    const menu_items = document.querySelectorAll('span.menu-item');
    if(url == '/'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'home'){
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }else if(url == '/data'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'data'){
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }else if(url == '/security'){
        menu_items.forEach(item => {
            if(item.getAttribute('data-id') !== 'security') {
                if(item.classList.contains('active')) item.classList.remove('active');
            }else item.classList.add('active');
        })
    }
}

window.addEventListener('load', () => {
    const loader = document.querySelector('div#loader')
    loader.addEventListener('transitionend', function handleTransition(e){
        loader.style.display ="none";
        loader.removeEventListener('transitionend', handleTransition)
    })
    loader.classList.add('loaded');
})