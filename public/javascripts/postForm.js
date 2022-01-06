function removeChildNodes(parent){
    while(parent.firstChild){
        parent.removeChild(parent.firstChild);
    }
}
function postform(e,form){
    var load = document.getElementById("loadr");
    load.style.display="block";
    var url = $(form).attr("action");
    var form_data = new URLSearchParams(new FormData(form));
    console.log(form_data);
    console.log(url);
    fetch(url, {
    method: 'POST', 
    body: form_data,
    })
    .then(
        response => response.json())
    .then(data => {
        load.style.display="none";
    console.log('Success:', data);
            if(data.success == 0){

                if(!Array.isArray(data.message)){
                    var alert_mess = document.getElementById("alert_message");
                    var alert_cont = document.getElementById("alert_container");
                    removeChildNodes(alert_mess);
                    alert_cont.style.display="block";
                    alert_cont.style.backgroundColor = "red"; 
                    alert_mess.append(data.message); 
                }
                else{
                    var alert_mess = document.getElementById("alert_message");
                    var alert_cont = document.getElementById("alert_container");
                    removeChildNodes(alert_mess);
                    alert_cont.style.display="block"; 
                    alert_cont.style.backgroundColor = "red"; 
                    console.log(data);     		
                data.message.forEach(function(item){
                var list =  document.createElement("LI");
                list.append(item);
                alert_mess.append(list);
            })
                }
                
        }else if (data.success == 1){
            var alert_mess = document.getElementById("alert_message");
            var alert_cont = document.getElementById("alert_container");
            removeChildNodes(alert_mess);
            alert_cont.style.display="block";
            alert_cont.style.backgroundColor = "green"; 
            alert_mess.append(data.message); 
            console.log(data.message);
            if(data.redirect){
                setTimeout(redirect, 2000);
                function redirect(){
                    window.location.replace(data.redirect);
                }
                
            }
        }
    })
    .catch((error) => {
    load.style.display="none";
    var alert_mess = document.getElementById("alert_message");
    var alert_cont = document.getElementById("alert_container");
    removeChildNodes(alert_mess);
    alert_cont.style.display="block";
    alert_cont.style.backgroundColor = "red"; 
    alert_mess.append("page error"); 
    console.error('Error:', error);
    });
    e.preventDefault();
}