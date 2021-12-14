function postform(e,form){

    var url = $(form).attr("action");
    var form_data = new URLSearchParams(new FormData(form));
    console.log(form_data);
    console.log(url);
    fetch(url, {
    method: 'POST', 
    body: form_data,
    })
    .then(response => response.json())
    .then(data => {
    console.log('Success:', data);
    })
    .catch((error) => {
    console.error('Error:', error);
    });
    e.preventDefault();
}