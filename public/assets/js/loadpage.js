function loadPage({url = undefined, where = 'body', element = "body", success = function(){}, error = function(){}}){
    const xhr = new XMLHttpRequest();
    xhr.open('GET',url);
    xhr.onload = () => {
        if(xhr.readyState == 4){
            if(xhr.status == 200){
                const response = xhr.response;
                const div = document.querySelector(where);
                const html = (xhr.response).querySelector(element).innerHTML;
                div.innerHTML = html;
                document.title = response.title;
                window.history.pushState({"content": html, "pageTitle":response.title, "page": url}, response.title, url);
                success();
            }else error();
        }
    }
    xhr.responseType = 'document';
    xhr.send();
}
function loadScript({url = undefined, dataType = "script", attr = null, success = function(){}}){
    if(dataType == "script"){
        const el = document.createElement('script');
        el.src = url;
        if(attr !== null){
            if(attr.length >= 1){
                attr.forEach(item => {
                    if(typeof item.value != 'undefined'){
                        el.setAttribute(item.attr, item.value);
                    }else{
                        el.setAttribute(item.attr, '');
                    }
                });
            }else{
                if(typeof attr.value != 'undefined'){
                    el.setAttribute(attr.attr, attr.value);
                }else{
                    el.setAttribute(attr.attr, '');
                }
            }
        }
        document.querySelector('body').appendChild(el);
        success();
    }else if(dataType == "css"){
        const el = document.createElement('link');
        el.rel = "stylesheet";
        el.href = url;
        if(attr !== null){
            attr.forEach(item => {
                el.setAttribute(item.attr, item.value);
            });
        }
        document.querySelector('head').appendChild(el);
        success();
    }
}