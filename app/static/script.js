const ws = new WebSocket(`wss://${location.host}/ws`);

ws.onmessage = (event) => {
    const chat = document.getElementById("chat");

    const li = document.createElement("li");
    li.textContent = event.data;

    chat.appendChild(li);
};

function sendMessage() {
    const username = document.getElementById("username").value;
    const message = document.getElementById("message").value;

    if (!username || !message) return;

    ws.send(username + ": " + message);

    document.getElementById("message").value = "";
}
