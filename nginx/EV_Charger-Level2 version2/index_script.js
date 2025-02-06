document.addEventListener('DOMContentLoaded', function() {
    // Check if userID exists in localStorage
    if (localStorage.getItem('userID')) {
        window.location.href = 'Login.html'; // Redirect to login.html if userID exists
    }

    const sidenavElement = document.getElementById('sidenav');
    const accountBtnTopbar = document.getElementById('menuBtn');
    const topnav = document.getElementById('topnav');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('sidenavRegisterBtn');
    const registerSubmitBtn = document.querySelector('#registerForm button[type="submit"]');
    const loginSubmitBtn = document.querySelector('#loginForm button[type="submit"]');
    const googleLoginbtn = document.getElementById('google-login-btn');

    const IP = "192.168.100.60";

    // Set initial styles for elements
    sidenavElement.style.right = "-40%";

    // Event listener for sidebar toggle button
    if (accountBtnTopbar) {
        accountBtnTopbar.onclick = toggleSidebar;
    }

    // Close the sidebar when clicking outside of it
    document.addEventListener('click', function(e) {
        if (!sidenavElement.contains(e.target) && !accountBtnTopbar.contains(e.target)) {
            closeSidebar();
        }
    });

    // Function to toggle the sidebar
    function toggleSidebar() {
        const isOpen = sidenavElement.style.right === '0px';
        sidenavElement.style.right = isOpen ? '-40%' : '0px';
        topnav.style.right = isOpen ? '4%' : '44%';
        accountBtnTopbar.style.display = isOpen ? 'block' : 'none';
    }

    // Function to toggle the display of the login form
    if (loginBtn) {
        loginBtn.onclick = function() {
            openLoginForm();
        }
    }

    // Function to toggle the display of the register form
    if (registerBtn) {
        registerBtn.onclick = function() {
            openRegisterForm();
        }
    }

    // Close the forms when clicking outside of them
    document.addEventListener('click', function(event) {
        var Login_forms = document.getElementsByClassName('form-containerLog');
        var Register_forms = document.getElementsByClassName('form-containerReg');
        var clickedElement = event.target;
        var isLoginForm = (clickedElement.id === 'loginBtn' || clickedElement === loginBtn);
        var isRegisterForm = (clickedElement.id === 'sidenavRegisterBtn' || clickedElement === registerBtn);

        for (var i = 0; i < Login_forms.length; i++) {
            var Login_form = Login_forms[i];
            if (event.target != Login_form && !Login_form.contains(event.target) && !isLoginForm && !isRegisterForm) {
                Login_form.style.display = 'none';
                resetForm(Login_form.querySelector('form'));
            }
        }
        for (var i = 0; i < Register_forms.length; i++) {
            var Register_form = Register_forms[i];
            if (event.target != Register_form && !Register_form.contains(event.target) && !isLoginForm && !isRegisterForm) {
                Register_form.style.display = 'none';
                resetForm(Register_form.querySelector('form'));
            }
        }
    });

    function closeSidebar() {
        sidenavElement.style.right = "-40%";
        topnav.style.right = "4%";
        accountBtnTopbar.style.display = "block";
    }

    function openLoginForm() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        resetForm(loginForm.querySelector('form'));
        closeSidebar();
    }

    function openRegisterForm() {
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
        resetForm(registerForm.querySelector('form'));
        closeSidebar();
    }

    function resetForm(form) {
        form.reset();
    }

    // Handle form submission for registration
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const username = document.getElementById('newUsername').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('newPassword').value;
    
            // Send registration request to server
            fetch(`http://${IP}:8081/register`, { // Use backticks for string interpolation
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.message === 'User registered successfully') {
                    alert('Registration successful');
                    openLoginForm(); // Ensure this function is defined
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error registering user:', error);
            });
        });
    }
    
    // Handle form submission for login
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
    
            fetch(`http://${IP}:8081/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.message === 'Login successful') {
                    localStorage.setItem('userID', data.userID);
                    window.location.href = 'Login.html';
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error logging in user:', error);
            });
        });
    }
    // if (googleLoginbtn) {
    //     // Attach the click handler to the Google Login button
    //     googleLoginbtn.onclick = function() {
    //         console.log("Google Login Button Clicked");
    
    //         // Initialize the Google API client
    //         gapi.load('auth2', function() {
    //             console.log("Google API Loaded");
    
    //             gapi.auth2.init({
    //                 client_id: '974778737036-3t64ftnr4f30u0lobdaoquejutq0nom8.apps.googleusercontent.com' // Replace with your Google Client ID
    //             }).then(function(auth2) {
    //                 console.log("Google Auth Initialized");
    
    //                 // Attempt to sign in
    //                 console.log("Attempting to sign in...");
    //                 auth2.signIn().then(function(googleUser) {
    //                     console.log("Google User Signed In");
    
    //                     // Get the Google user's profile information
    //                     const profile = googleUser.getBasicProfile();
    //                     const userName = profile.getName();
    //                     const userEmail = profile.getEmail();
    //                     const userId = profile.getId();
    
    //                     // Display the user's name, email, and userId (Google does not expose the password)
    //                     console.log('User Name:', userName);
    //                     console.log('User Email:', userEmail);
    //                     console.log('User ID:', userId); // This is the Google ID
    //                 }).catch(function(error) {
    //                     console.error('Error during Google Sign-In:', error);
    //                 });
    //             }).catch(function(error) {
    //                 console.error("Google Auth Initialization Failed:", error);
    //             });
    //         });
    //     };
    // }
    
    //  else {
    // console.error('Google Login Button Not Found');  // If googleLoginbtn is not defined
// }


});
