const currentUser = parseInt($('#current-user').val());
const chatSection = $('#chat');
let messageList = $('#messages');


function renderMessage(message) {
    const position = message.sender.id === currentUser ? 'right' : 'left';
    const msg = `
        <li class="message ${position}">
            <span class="badge rounded-pill bg-success">${message.sender.username}</span>
            <div class="text">${message.text}<br>
                <span class="small">${message.timestamp}</span>
            </div>
            </div>
        </li>
        `;
    $(msg).appendTo(messageList);
    messageList.animate({scrollTop: messageList.prop('scrollHeight')});
}


function showChatSection(recipient_id) {
    let messageList = $('#messages');
    $.getJSON(`/api/chat/?recipient=${recipient_id}`, (data) => {
        messageList.children('.message').remove();
        data['results'].forEach( msg => renderMessage(msg));
        messageList.animate({scrollTop: messageList.prop('scrollHeight')});
    });
}


function selectRecipient(recipient_id) {
    showChatSection(recipient_id);
}


function getUsers() {
    $.getJSON('/api/users/', (data) => {
        $('#users').children('.user').remove();
        const users = data['results'];
        for (let i=0; i<users.length; i++) {

            const userTab = `
                <li class="nav-item user" role="presentation">
                    <button class="nav-link ${i === 0 ? 'active': ''}" id="${users[i]['id']}" data-bs-toggle="tab"
                        data-bs-target="messages" type="button" role="tab" aria-controls="messages"
                        aria-selected="true">${users[i]['username']}</button>
                </li>
            `;
            $(userTab).appendTo('#users');
        }

        if (data['count']) {
            showChatSection(users[0]['id']);
        }

        $('.user').click((e) => {
            selectRecipient(e.target.getAttribute('id'));
        });
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function sendMessage(recipient, text) {
    const csrftoken = getCookie('csrftoken');

    $.ajax({
        url: '/api/chat/',
        type: 'POST',
        data: {
            'text': text,
            'receiver_id': recipient,
        },
        beforeSend: function(xhr, settings) {
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
        },
        success: function(response) {
            console.log('Success:', response);
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            $('.toast').toast('show');
        }
    });
}


function getMessageById(message) {
    $.getJSON(`/api/chat/${message.id}/`, function (data) {
        renderMessage(data);
        $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')});
    });
}


const checkElement = async selector => {
    while ( document.querySelector(selector) === null) {
      await new Promise( resolve =>  requestAnimationFrame(resolve) )
    }
    return document.querySelector(selector);
};


$(document).ready(function () {
    getUsers();

    checkElement('.user > .nav-link.active').then((selector) => {
        const selectedRecipient = $('.user > .nav-link.active')[0].getAttribute('id');
        var socket = new WebSocket(`ws://${window.location.host}/ws/sample_room/`);

        socket.onopen = function (e) {
            console.log("The connection was setup successfully !");
        };


        $('#chat-text').keypress((e) => {
            if (e.keyCode == 13)
            $('#chat-send').click();
        });

        $('#chat-send').click(() => {
            const text = $('#chat-text').val();
            if (text.length > 0) {
                socket.send(JSON.stringify({
                    'text': text,
                    'receiver': selectedRecipient
                }));
                $('#chat-text').val('');
            }
        });

        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            renderMessage(data.message);
        };
    });
});
