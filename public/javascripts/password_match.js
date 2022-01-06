function passwordMatch(e,form){
    var password = document.getElementById('password');
    var password2 = document.getElementById('password2');
    
    if(password2.value == password.value){
        postform(e, form);
    }else{
        var alert_mess = document.getElementById("alert_message");
        var alert_cont = document.getElementById("alert_container");
        removeChildNodes(alert_mess);
        alert_cont.style.display="block";
        alert_cont.style.backgroundColor = "red"; 
        alert_mess.append("password not matching");      
    }
    e.preventDefault();
}