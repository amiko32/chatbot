document.addEventListener("DOMContentLoaded", function () {
    const chatArea = document.getElementById("chat-box");
    const userText = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-button");
    const buttonContainer = document.getElementById("chat-buttons");

    let orderStage = 0;
    let orderInfo = { product: "", phone: "", address: "", payment: "" };
    const SUPABASE_URL = "https://ydqfolzixkzontirgydn.supabase.co";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkcWZvbHppeGt6b250aXJneWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDk3MzAsImV4cCI6MjA1NjIyNTczMH0.MKMEnpEriVfPSNLR0OmCweYd3-8Jp5co1zyUPd8tHpg";

    function displayMessage(text, sender) {
        const msg = document.createElement("div");
        msg.classList.add("message", sender);
        msg.innerText = text;
        chatArea.appendChild(msg);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function createButtons(options) {
        buttonContainer.innerHTML = "";
        options.forEach(option => {
            let btn = document.createElement("button");
            btn.innerText = option.text;
            btn.onclick = () => {
                displayMessage(option.text, "user");
                option.action();
            };
            buttonContainer.appendChild(btn);
        });
    }

    function processUserInput() {
        const userMessage = userText.value.trim();
        if (!userMessage) return;

        displayMessage(userMessage, "user");
        userText.value = "";

        setTimeout(() => generateBotResponse(userMessage), 1000);
    }

    function generateBotResponse(message) {
        if (orderStage > 0) {
            processOrderFlow(message);
            return;
        }

        if (message.includes("Как оформить заказ?")) {
            startOrderProcess();
        } else if (message.includes("Показать заказы")) {
            showOrders();
        } else {
            displayMessage("Я не понял ваш запрос. Попробуйте выбрать один из вариантов.", "bot");
            createMainButtons();
        }
    }

    function startOrderProcess() {
        orderStage = 1;
        displayMessage("Какой товар вас интересует?", "bot");
        createButtons([
            { text: "Розы", action: () => processOrderFlow("Розы") },
            { text: "Тюльпаны", action: () => processOrderFlow("Тюльпаны") },
            { text: "Пионы", action: () => processOrderFlow("Пионы") },
            { text: "Другое", action: () => {
                displayMessage("Пожалуйста,введите:название,количество и цвет.", "bot");
                orderStage = 100;
            }}
        ]);
    }

    function processOrderFlow(message) {
        if (orderStage === 100) {
            orderInfo.product = message;
            orderStage = 2;
            displayMessage("Пожалуйста, укажите ваш номер телефона.", "bot");
            return;
        }

        switch (orderStage) {
            case 1:
                orderInfo.product = message;
                orderStage++;
                displayMessage("Пожалуйста, укажите ваш номер телефона.", "bot");
                break;
            case 2:
                orderInfo.phone = message;
                orderStage++;
                displayMessage("Укажите ваш адрес доставки или напишите самовывоз.", "bot");
                break;
            case 3:
                orderInfo.address = message;
                orderStage++;
                displayMessage("Выберите способ оплаты.", "bot");
                createButtons([
                    { text: "Карта", action: () => processOrderFlow("Карта") },
                    { text: "Наличные", action: () => processOrderFlow("Наличные") }
                ]);
                return;
            case 4:
                orderInfo.payment = message;
                orderStage = 0;
                saveOrder(orderInfo);
                displayMessage("Ваш заказ сохранен! Введите 'Показать заказы' для просмотра.", "bot");
                createMainButtons();
                return;
        }
    }

    async function saveOrder(orderData) {
        let response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`,
                "Prefer": "return=representation"
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            displayMessage("Ваш заказ оформлен,ожидайте звонка оператора!", "bot");
        } else {
            displayMessage("Ошибка", "bot");
        }
    }

    async function showOrders() {
        let response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: "GET",
            headers: {
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`
            }
        });

        if (!response.ok) {
            displayMessage("Ошибка при загрузке заказов.", "bot");
            createMainButtons();
            return;
        }

        let orders = await response.json();
        if (orders.length === 0) {
            displayMessage("Нет сохраненных заказов.", "bot");
        } else {
            displayMessage("Ваши заказы:", "bot");
            orders.forEach((order, index) => {
                displayMessage(`${index + 1}. Товар: ${order.product}, Телефон: ${order.phone}, Адрес: ${order.address}, Оплата: ${order.payment}`, "bot");
            });
        }
        createMainButtons();
    }

    function createMainButtons() {
        createButtons([
            { text: "Как оформить заказ?", action: startOrderProcess },
            { text: "Показать заказы", action: showOrders }
        ]);
    }

    function greetUser() {
        displayMessage("Привет! Я бот-заказов. Чем могу помочь?", "bot");
        createMainButtons();
    }

    sendBtn.addEventListener("click", processUserInput);
    userText.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            processUserInput();
        }
    });

    greetUser();
});
