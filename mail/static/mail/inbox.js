document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Add event listener for when compose submit button is pressed 
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
      event.preventDefault(); 
      send_email();
  } );
});

function send_email() {
    let subject = document.querySelector("#compose-subject").value;
    let body =   document.querySelector("#compose-body").value;
    let recipients = document.querySelector("#compose-recipients").value;
    let jsonEmail = JSON.stringify({subject: subject, body : body, recipients:recipients  });
    fetch('/emails', {method: 'POST', body: jsonEmail })
    .then( result => {
        if (! result.ok) throw result; 
        return result.json(); 
       } )
    .then(
        // parameter result of anonymous arrow function is a JS object, not JSON text 
        result=> {
        console.log(result);    
        load_mailbox('sent');
        }
    )
    .catch( function(error) {
        console.log("Error: ", error);
        alert('Invalid email. The recipients must be valid email addresses separated by commas. Please try composing again');
        compose_email_no_clear();
    } ); 
}

function compose_email_no_clear() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
}

function clear_compose_fields() {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function compose_email() {
    compose_email_no_clear();
    clear_compose_fields();
}

function reply_email(email) {
    let recipient = email.sender;
    let subject = email.subject;
    if (subject.length < 4 || !(subject[0] ==='R' && subject[1]==='e' && subject[2]===':'
    && subject[3] ===' '  )) subject = "Re: " + subject; 

    let body = email.body;
    body = "On " + email.timestamp + " " + email.sender + " wrote:\n" + body;
    
    document.querySelector('#compose-recipients').value = recipient;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
    compose_email_no_clear();
}

function load_email_body(email,mailbox) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    let body = document.querySelector('#email-view'); 
    body.innerHTML = '';
    body.style.display = 'block';
    if (mailbox !== 'sent') {
        let archive = document.createElement('button');
        archive.addEventListener('click', function (event) {
            console.log(event);
            
            fetch(`/emails/${email.id}`, {method: "PUT", body:JSON.stringify({
                archived: !email.archived
            })  })
            .then(result => {
                if (!result.ok) throw result;
                load_mailbox('inbox');
                return result.json();
            }).then(result => {
                console.log(result);  
            }).catch( error => {
                console.log(error);
            });
            
        });
    
        archive.innerHTML = email.archived ?'Unarchive this Email' :'Archive this Email'; 
        body.append(archive);
        body.append(document.createElement('hr'));
    }
    let sender = email.sender; 
    let recipients = email.recipients; 
    let subject = email.subject; 
    let timeStamp = email.timestamp;
    let emailBody = email.body; 

    let senderNode = document.createElement('p');
    let recipientsNode = document.createElement('p');
    let subjectNode = document.createElement('p');
    let timeStampNode = document.createElement('p');
    let emailBodyNode = document.createElement('p');

    senderNode.innerHTML = "<b>From: </b>" + sender ;
    recipientsNode.innerHTML = "<b> To: </b>" + recipients; 
    subjectNode.innerHTML = "<b> Subject: </b>" + subject;
    timeStampNode.innerHTML = "<b> Date/Time Received: </b>" + timeStamp;
    emailBodyNode.innerHTML = emailBody;

    emailBodyNode.style.whiteSpace = 'pre-wrap';
    console.log(emailBody);

    body.append(senderNode);
    body.append(recipientsNode); 
    body.append(subjectNode);
    body.append(timeStampNode);

    let reply = document.createElement('button');
    reply.innerHTML = "Reply";
    reply.addEventListener('click', function (event) {
        event.preventDefault();
        reply_email(email);
    });

    body.append(reply);
    body.append(document.createElement('hr'));
    body.append(emailBodyNode);

    fetch(`/emails/${email.id}`, {method: 'PUT', body: JSON.stringify({
        read: true
    })}).then(response => {
        if (!response.ok) throw response;
        return response.json();
    }).then(result => {
        console.log(result);
    }).catch( error => {
        console.log(error);
    })   ; 
}

function load_email(emailNode,mailbox) {
    console.log(emailNode);
    let emailId = emailNode.dataset.email_id;

    console.log(emailId);

    fetch(`/emails/${emailId}`)
    .then(result => {
        if (! result.ok) throw result; 
        return result.json(); 
    })
    .then( result => {
        console.log(result);
        load_email_body(result,mailbox);
    } )
    .catch( error => {
        alert("This is an invalid email");
        console.log(error); 
    }
    );
}

function insert_emails_flex(emails,mailbox) {
    let emailsNode = document.querySelector("#emails-view");
    for (email of emails) { 
        let flexItem = document.createElement('div');
        flexItem.style.margin = '5px';
        flexItem.style.border = '3px solid grey';
        flexItem.style.borderRadius = "10px";
        if (email.read) { flexItem.style.backgroundColor = "lightgray"; }
        else { flexItem.style.backgroundColor = 'white';}

        flexItem.addEventListener('mouseover', function () {
            this.style.cursor = 'pointer';
        });

        flexItem.dataset.email_id = email.id; 

        flexItem.addEventListener('click', function (event) {
            event.preventDefault();
            load_email(this, mailbox);
        });
        
        let sender = email.sender; 
        let subject = email.subject; 
        let timestamp = email.timestamp;
        
        let senderItem = document.createElement('div');
        let subjectItem = document.createElement('div');
        let timeItem = document.createElement('div');
        
        senderItem.style.display = 'inline-block';
        subjectItem.style.display = 'inline-block'; 
        timeItem.style.display = 'inline-block';  
        
        subjectItem.style.marginLeft = '20px';
        senderItem.style.marginLeft = '5px';
        timeItem.style.marginRight = '5px';
        timeItem.style.float = 'right';

        senderItem.innerHTML = sender;
        subjectItem.innerHTML = subject;
        timeItem.innerHTML = timestamp;

        flexItem.append(senderItem); flexItem.append(subjectItem); flexItem.append(timeItem);
        
        emailsNode.append(flexItem);
    }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails from the specific mailbox 
  fetch(`/emails/${mailbox}`).then(response => {
    if (!response.ok) throw response; 
    return response.json();})
    .then( emails => 
    {
        console.log(emails);
        insert_emails_flex(emails,mailbox);   
    }
    ).catch( error => {
        console.log(error);
        alert("Invalid mailbox selected");
    });
}