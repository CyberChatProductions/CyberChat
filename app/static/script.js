console.log("JS LOADED");

let ws;
let username;
let currentUser = null;

const usersBox = document.getElementById("users");
const messagesBox = document.getElementById("messages");

function login() {
    username = document.getElementById("nameInput").value.trim();
    if (!username) return;

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${protocol}://${location.host}/ws`);

    ws.onopen = () => {
        ws.send(username);
        loadDialogs();
    };

    ws.onmessage = (e) => {
        const [sender, msg] = e.data.split("|");
        addMessage(sender, msg);
    };

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "flex";
}

// 📌 загрузка диалогов
async function loadDialogs() {
    const res = await fetch(`/dialogs/${username}`);
    const data = await res.json();

    usersBox.innerHTML = "";

    data.forEach(u => createUser(u));
}

// 📌 создание пользователя (ВАЖНО: dataset)
function createUser(name) {
    const div = document.createElement("div");
    div.className = "user";
    div.innerText = name;

    // 🔥 КЛЮЧЕВОЙ ФИКС — сохраняем имя в DOM
    div.dataset.user = name;

    usersBox.appendChild(div);
}

// 📌 добавление нового пользователя
function addUser() {
    const name = prompt("Enter username:");
    if (!name) return;

    createUser(name);
}

// 📌 ОДИН ОБЩИЙ КЛИК (event delegation)
usersBox.addEventListener("click", (e) => {
    const el = e.target.closest(".user");
    if (!el) return;

    const name = el.dataset.user;
    if (!name) return;

    currentUser = name;
    messagesBox.innerHTML = "";

    ws.send("history|" + name);
});

// 📌 отправка сообщения
function send() {
    const msg = document.getElementById("msgInput").value;
    if (!currentUser || !msg) return;

    ws.send(currentUser + "|" + msg);
    document.getElementById("msgInput").value = "";
}

// 📌 вывод сообщений
function addMessage(sender, msg) {
    const div = document.createElement("div");
    div.className = "msg " + (sender === username ? "me" : "other");

    div.innerText = sender === username ? msg : sender + ": " + msg;

    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}
