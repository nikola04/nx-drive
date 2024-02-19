const errorBox = document.querySelector('#error');
const loader = document.querySelector('#fetch_loader');
document.querySelector('#form').addEventListener('submit', async function login(e) {
    errorBox.innerHTML = '';
    loader.classList.add('active');
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const pass = document.querySelector('#pass').value;
    const data = {
        f_email: email,
        f_pass: pass
    }
    const resp = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then( res => res.json() );
    if(resp){
        loader.classList.remove('active');
        if(resp.status != "OK") {
            if(resp.code == 'UNVF'){
                swapEmVerification();
            }else{
                errorBox.innerText = resp.error;
                errorBox.classList.add('active');
            }
        }else location.href = '/';
    }
});
document.querySelector('#form').addEventListener('invalid', (function () {
    return function (e) {
      e.preventDefault();
      e.target.focus();
    };
})(), true);
const swapEmVerification = () => {
    location.href = '/verify_email';
}