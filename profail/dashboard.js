// ==========================================
// DEMO MESSAGES
// ==========================================

const demoMessages = [

    {
        id: 1,

        name: "Ahmed Ali",

        email: "ahmed@example.com",

        message:
            "Hello, I would like to know more about your services.",

        date: "2026-10-06",

        status: "New"
    },


    {
        id: 2,

        name: "Sara Mohamed",

        email: "sara@example.com",

        message:
            "Thank you for your website. I have a question.",

        date: "2026-10-05",

        status: "Read"
    },


    {
        id: 3,

        name: "John Peter",

        email: "john@example.com",

        message:
            "I would like to contact you about a project.",

        date: "2026-10-04",

        status: "New"
    }

];


// ==========================================
// DEMO USERS
// ==========================================

const demoUsers = [

    {
        id: 1,

        name: "Yousef Hassan",

        email: "yousef@example.com",

        date: "2026-10-06"
    },


    {
        id: 2,

        name: "Mariam Ali",

        email: "mariam@example.com",

        date: "2026-10-04"
    },


    {
        id: 3,

        name: "Omar Ahmed",

        email: "omar@example.com",

        date: "2026-10-02"
    },


    {
        id: 4,

        name: "Fatima Ibrahim",

        email: "fatima@example.com",

        date: "2026-09-30"
    }

];


// ==========================================
// LOAD MESSAGES
// ==========================================

function getMessages() {

    const savedMessages =
        localStorage.getItem("messages");


    if (savedMessages) {

        return JSON.parse(savedMessages);

    }


    localStorage.setItem(
        "messages",
        JSON.stringify(demoMessages)
    );


    return demoMessages;
}


// ==========================================
// LOAD USERS
// ==========================================

function getUsers() {

    const savedUsers =
        localStorage.getItem("users");


    if (savedUsers) {

        return JSON.parse(savedUsers);

    }


    localStorage.setItem(
        "users",
        JSON.stringify(demoUsers)
    );


    return demoUsers;
}


// ==========================================
// PAGE TITLE
// ==========================================

function changeTitle(title, subtitle) {

    document.getElementById(
        "pageTitle"
    ).textContent = title;


    document.getElementById(
        "pageSubtitle"
    ).textContent = subtitle;
}


// ==========================================
// REMOVE ACTIVE BUTTON
// ==========================================

function removeActiveButtons() {

    const buttons =
        document.querySelectorAll(".menu-btn");


    buttons.forEach(function(button) {

        button.classList.remove("active");

    });
}


// ==========================================
// SET ACTIVE BUTTON
// ==========================================

function setActiveButton(button) {

    removeActiveButtons();

    button.classList.add("active");
}


// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

    const messages = getMessages();

    const users = getUsers();


    // Count unread messages

    const unreadMessages =
        messages.filter(function(message) {

            return message.status === "New";

        }).length;


    changeTitle(
        "Dashboard",
        "Welcome back, Admin"
    );


    document.getElementById(
        "pageContent"
    ).innerHTML = `


        <!-- STATISTICS -->

        <section class="stats">


            <div class="stat-card">

                <p>Total Messages</p>

                <h2>
                    ${messages.length}
                </h2>

            </div>


            <div class="stat-card">

                <p>Registered Users</p>

                <h2>
                    ${users.length}
                </h2>

            </div>


            <div class="stat-card">

                <p>Unread Messages</p>

                <h2>
                    ${unreadMessages}
                </h2>

            </div>


        </section>



        <!-- CONTENT -->

        <section class="content-grid">


            <!-- RECENT MESSAGES -->

            <div class="panel">

                <div class="panel-header">

                    <h2>
                        Recent Messages
                    </h2>

                    <span class="badge">
                        ${messages.length}
                    </span>

                </div>


                ${createMessagesTable(messages)}

            </div>



            <!-- USERS -->

            <div class="panel">

                <div class="panel-header">

                    <h2>
                        Recent Users
                    </h2>

                    <span class="badge">
                        ${users.length}
                    </span>

                </div>


                ${createUsersTable(users)}

            </div>


        </section>

    `;
}


// ==========================================
// SHOW MESSAGES
// ==========================================

function showMessages() {

    const messages = getMessages();


    changeTitle(
        "Messages",
        "Messages received from your Contact Me form"
    );


    document.getElementById(
        "pageContent"
    ).innerHTML = `


        <div class="page-heading">

            <h2>
                Contact Messages
            </h2>

            <p>
                All messages sent from your website.
            </p>

        </div>


        <div class="panel">


            <div class="panel-header">

                <h2>
                    All Messages
                </h2>

                <span class="badge">
                    ${messages.length}
                </span>

            </div>


            ${createMessagesTable(messages)}


        </div>

    `;
}


// ==========================================
// SHOW USERS
// ==========================================

function showUsers() {

    const users = getUsers();


    changeTitle(
        "Users",
        "Users who signed up on your website"
    );


    document.getElementById(
        "pageContent"
    ).innerHTML = `


        <div class="page-heading">

            <h2>
                Registered Users
            </h2>

            <p>
                All users who created an account.
            </p>

        </div>


        <div class="panel">


            <div class="panel-header">

                <h2>
                    All Users
                </h2>

                <span class="badge">
                    ${users.length}
                </span>

            </div>


            ${createUsersTable(users)}


        </div>

    `;
}


// ==========================================
// CREATE MESSAGE TABLE
// ==========================================

function createMessagesTable(messages) {


    if (messages.length === 0) {

        return `

            <div class="empty">

                No messages available.

            </div>

        `;

    }


    return `

        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Message</th>

                        <th>Date</th>

                        <th>Status</th>

                    </tr>

                </thead>


                <tbody>


                    ${messages.map(function(message) {

                        return `

                            <tr>

                                <td>
                                    ${message.name}
                                </td>


                                <td>
                                    ${message.email}
                                </td>


                                <td class="message-text">
                                    ${message.message}
                                </td>


                                <td>
                                    ${message.date}
                                </td>


                                <td>

                                    <span class="status">

                                        ${message.status}

                                    </span>

                                </td>

                            </tr>

                        `;

                    }).join("")}


                </tbody>

            </table>

        </div>

    `;
}


// ==========================================
// CREATE USERS TABLE
// ==========================================

function createUsersTable(users) {


    if (users.length === 0) {

        return `

            <div class="empty">

                No users available.

            </div>

        `;

    }


    return `

        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Joined</th>

                    </tr>

                </thead>


                <tbody>


                    ${users.map(function(user) {

                        return `

                            <tr>

                                <td>
                                    ${user.name}
                                </td>


                                <td>
                                    ${user.email}
                                </td>


                                <td>
                                    ${user.date}
                                </td>

                            </tr>

                        `;

                    }).join("")}


                </tbody>

            </table>

        </div>

    `;
}


// ==========================================
// DASHBOARD BUTTON
// ==========================================

document
    .getElementById("dashboardBtn")
    .addEventListener("click", function() {

        showDashboard();

        setActiveButton(this);

    });


// ==========================================
// MESSAGES BUTTON
// ==========================================

document
    .getElementById("messagesBtn")
    .addEventListener("click", function() {

        showMessages();

        setActiveButton(this);

    });


// ==========================================
// USERS BUTTON
// ==========================================

document
    .getElementById("usersBtn")
    .addEventListener("click", function() {

        showUsers();

        setActiveButton(this);

    });


// ==========================================
// CLEAR DATA BUTTON
// ==========================================

document
    .getElementById("clearData")
    .addEventListener("click", function() {


        const answer = confirm(
            "Are you sure you want to reset the dashboard?"
        );


        if (!answer) {

            return;

        }


        // Remove old data

        localStorage.removeItem(
            "messages"
        );

        localStorage.removeItem(
            "users"
        );


        // Restore demo data

        localStorage.setItem(
            "messages",
            JSON.stringify(demoMessages)
        );


        localStorage.setItem(
            "users",
            JSON.stringify(demoUsers)
        );


        // Show dashboard

        showDashboard();


        // Set Dashboard active

        setActiveButton(
            document.getElementById(
                "dashboardBtn"
            )
        );


        alert(
            "Dashboard has been reset successfully!"
        );

    });


// ==========================================
// START
// ==========================================

showDashboard();