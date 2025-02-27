document.addEventListener("DOMContentLoaded", function () {
    const chatArea = document.getElementById("chat-box");
    const userText = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-button");
    const buttonContainer = document.getElementById("chat-buttons");

    let orderStage = 0;
    let orderInfo = { product: "", phone: "", address: "", payment: "" };

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
        }
    }

    function startOrderProcess() {
        orderStage = 1;
        displayMessage("Какой товар вас интересует?", "bot");
        createButtons([
            { text: "Смартфон", action: () => processOrderFlow("Смартфон") },
            { text: "Ноутбук", action: () => processOrderFlow("Ноутбук") },
            { text: "Наушники", action: () => processOrderFlow("Наушники") },
            { text: "Другое", action: () => {
                displayMessage("Пожалуйста, введите название товара.", "bot");
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
                displayMessage("Укажите ваш адрес доставки.", "bot");
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
                createButtons([
                    { text: "Показать заказы", action: showOrders },
                    { text: "Новый заказ", action: startOrderProcess }
                ]);
                return;
        }
    }

    function saveOrder(orderData) {
        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push(orderData);
        localStorage.setItem("orders", JSON.stringify(orders));
    }

    function showOrders() {
        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        if (orders.length === 0) {
            displayMessage("Нет сохраненных заказов.", "bot");
            return;
        }
        displayMessage("Ваши заказы:", "bot");
        orders.forEach((order, index) => {
            displayMessage(`${index + 1}. Товар: ${order.product}, Телефон: ${order.phone}, Адрес: ${order.address}, Оплата: ${order.payment}`, "bot");
        });
    }

    function greetUser() {
        displayMessage("Привет! Я бот-заказов. Чем могу помочь?", "bot");
        createButtons([
            { text: "Как оформить заказ?", action: startOrderProcess },
            { text: "Показать заказы", action: showOrders }
        ]);
    }

    sendBtn.addEventListener("click", processUserInput);
    userText.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            processUserInput();
        }
    });

    greetUser();
});
