const errorBox = document.querySelector('#error');
const loader = document.querySelector('#fetch_loader');
document.querySelector('#form').addEventListener('submit', async function login(e) {
    errorBox.innerHTML = '';
    loader.classList.add('active');
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const pass = document.querySelector('#pass').value;
    const data = {
        f_email: email,
        f_pass: pass,
        f_name: name
    }
    const resp = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then( res => res.json() );
    if(resp){
        loader.classList.remove('active');
        if(resp.status != "OK") {
            errorBox.innerText = resp.error;
            errorBox.classList.add('active');
        }else location.href = '/login';//location.href = '/verify_email/';
    }
    /*}else{
        document.querySelector('#password').focus();
        errorBox.innerHTML = 'Password must have at least one uppercase and one special character including numbers';
        errorBox.classList.add('active');
    }*/
});
document.querySelector('#form').addEventListener('invalid', e => {
    e.preventDefault();
    e.target.focus();
    if(e.target == document.querySelector('#pass')){
        errorBox.parentNode.style.overflow = 'visible';
        errorBox.innerHTML = '<span style="opacity:55; font-size:13px">Password must have at least:<br/>*One special character<br/>*Minimum 8 character<br/>*At least one uppercase character</span>';
        errorBox.classList.add('active');
    }else {
        errorBox.innerHTML = '';
        errorBox.classList.remove('active');
    }
}, true);