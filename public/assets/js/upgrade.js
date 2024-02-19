const buyPlan = async (id, additional = { year: false }) => {
    console.warn('This option will be available soon.\nPayment_ID: ' + id + '\nYearly: ' + additional.year);
    const resp = await fetch('/buy_plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: id, year: additional.year })
    }).then( res => res.json());
    if(resp.status === 'OK'){
        const opened_window = window.open(resp.url);
        var timer = setInterval(checkWindow, 500);
        function checkWindow() {
            if (opened_window.closed) {  
                clearInterval(timer);
                location.reload();
            }
        }
    }else{
        console.error(resp);
    }
}