document.addEventListener('DOMContentLoaded', async function () {
    const topnavLinks = document.querySelectorAll('#topnav ul li a:not(#goBack)');
    const bottomnavLinks = document.querySelectorAll('#bottomnav ul li a:not(#goBack)');
    const sections = document.querySelectorAll('.content-section');
    const sidenavElement = document.getElementById('sidenav');
    const accountBtnTopbar = document.getElementById('accountBtnTopbar');
    const topnav = document.getElementById('topnav');
    const topnavContents = document.querySelectorAll('#topnav > *:not(img.LOGO)');
    const profileBtn = document.getElementById('profile');
    const settingBtn = document.getElementById('setting');
    const logoutBtn = document.getElementById('logout');
    const BackBtn = document.getElementById('Back');
    const profileContent = document.getElementById('ProfileContent');
    const editBtn = document.getElementById("EditBtn");
    const imgEdit = document.getElementById("ImgEdit");
    const saveBtn = document.getElementById("Save");
    const cancelBtn = document.getElementById("Cancel");
    const profileImg = document.getElementById("ProfileImg");
    const nameDisplay = document.getElementById("namedisplay");
    const emailDiv = document.getElementById("email");
    const HoldernameDiv = document.getElementById('Holdername');
    const datePicker = document.getElementById("date-picker");
    const dailySelect = document.getElementById("daily-select");
    const datePickerContainer = document.getElementById("date-picker-container"); // This is the date picker container
    const confirmText = document.getElementById("confirm-date-btn");
    const chooseOption = document.getElementById("datepicker");

    const IP = "192.168.100.60";

    // Function to check the orientation and adjust the layout for phones only
    function checkOrientation() {
        // Check if the device is a phone (screen width less than 600px)
        if (window.innerWidth <= 600) {
            // Check if the device is in landscape mode
            if (window.innerHeight < window.innerWidth) {
                // Landscape mode detected: Automatically rotate content to portrait
                document.body.style.transform = "rotate(90deg)";
                document.body.style.transformOrigin = "top left";
                document.body.style.width = "100vh";  // Make the width of the body the height of the viewport
                document.body.style.height = "100vw";  // Make the height of the body the width of the viewport
                document.body.style.overflow = "hidden"; // Prevent overflow
            } else {
                // Portrait mode detected: Reset content layout to portrait
                document.body.style.transform = "none";
                document.body.style.width = "100%";
                document.body.style.height = "100%";
                document.body.style.overflow = "auto"; // Allow content to overflow if necessary
            }
        } else {
            // If it's not a phone, don't apply the transformation (skip)
            document.body.style.transform = "none";
            document.body.style.width = "100%";
            document.body.style.height = "100%";
            document.body.style.overflow = "auto";
        }
    }

    // Run the function on load and on resize (when orientation changes)
    window.addEventListener('load', checkOrientation);
    window.addEventListener('resize', checkOrientation);


    if (localStorage.getItem('stationID')) {
        document.getElementById('Charge').style.display = 'none';
        document.getElementById('Discharge').style.display = 'flex';
    }
    if (localStorage.getItem('stationID') == 'undefined') {
        document.getElementById('Charge').style.display = 'flex';
        document.getElementById('Discharge').style.display = 'none';
    }
    // Function to show the date picker again
    function showDatePicker() {
        datePickerContainer.style.display = 'block'; // Show the date picker container
        dailySelect.style.display = 'none'; // Hide the select element
    }

    // Function to hide the date picker and show the select element
    function hideDatePicker() {
        datePickerContainer.style.display = 'none'; // Hide the date picker container
        dailySelect.style.display = 'inline'; // Show the select element
    }

    // Function to format today's date as YYYY-MM-DD
    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Set the date picker's default value to today's date
    datePicker.value = getTodayDate();

    const userID = localStorage.getItem('userID');
    let originalUsername = nameDisplay.innerText;
    let originalEmail = emailDiv.innerText;
    let originalHoldername = HoldernameDiv.innerText;
    let originalBankNum;

    // Redirect to index.html if userID is not found in localStorage
    if (!userID) {
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    let intervalID;

    function checkStationConnection() {
        const userID = localStorage.getItem('userID');
    
        fetch(`http://${IP}:8081/checking?stationID=${userID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} - ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Check if a stationID is found
                if (data.stationID) {
                    alert(data.stationID);
                    localStorage.setItem('stationID', data.stationID);
    
                    // Stop the interval since we have a result
                    // clearInterval(intervalID);
                    console.log('Interval stopped.');
                } else {
                    console.log('No station connected.');
                }
            })
            .catch(error => {
                console.error('Error during station check:', error);
            });
    }
    
    // Start the interval with a safer delay of 500ms
    intervalID = setInterval(checkStationConnection, 500);
    
    
    

    // Function to extract 'stationID' from URL
    function getStationIDFromClickURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('stationID'); // Get the stationID parameter
    }

    // Function to check if the page was opened by scanning a QR code
    function isQRScan() {
        const scannedStationID = getStationIDFromClickURL();
        return scannedStationID !== null && scannedStationID !== ''; // Check if stationID exists in the URL
    }

    // Variable to store the form that opened the confirm form
    let callingForm = null;

    // Function to open the confirm form
    function openConfirmForm(callerForm) {
        const confirmFormContainer = document.getElementById('confirmForm');
        const userID = localStorage.getItem('userID');

        // Store the calling form so we can refer to it later
        callingForm = callerForm;

        // Hide the calling form and show the confirm form
        callingForm.style.display = 'none';
        confirmFormContainer.style.display = 'block';  // Show the confirm form

        return new Promise((resolve, reject) => {
            // Add event listener for the "Back" button to return to the calling form
            const backButton = document.getElementById('Bank-form-Back-btn');
            backButton.addEventListener('click', function (e) {
                e.preventDefault();  // Prevent form submission
                confirmFormContainer.style.display = 'none';  // Hide the confirm form
                callingForm.style.display = 'block';    // Show the form that called the confirm form
                resolve(false); // Return false when user presses "Back"
            });

            // Add event listener for the "Confirm" button to trigger the request
            const confirmButton = document.getElementById('Bank-form-confirm-btn');
            confirmButton.addEventListener('click', async function (e) {
                e.preventDefault();  // Prevent form submission

                const password = document.getElementById('confirmpassword').value;

                try {
                    // Make the request to the server with userID and password
                    const response = await fetch(`http://${IP}:8081/confirmuser?userID=${userID}&password=${password}`);

                    if (!response.ok) {
                        throw new Error('Failed to confirm user');
                    }

                    const isConfirmed = await response.json();
                    if (isConfirmed === true) {
                        confirmFormContainer.style.display = 'none';  // Close the confirm form
                        callingForm.style.display = 'block';  // Show the calling form again
                        resolve(true); // Return true when the user is confirmed successfully
                    } else {
                        alert('Invalid password');
                        resolve(false); // Return false if the password is invalid
                    }

                } catch (error) {
                    console.error('Error confirming user:', error);
                    alert('Error confirming user');
                    resolve(false); // Return false if there's an error
                }
            });
        });
    }

    // Function to check stationID from URL against local storage
    function checkAndSaveStationID() {
        // Extract the stationID from the current page's URL
        const urlParams = new URLSearchParams(window.location.search);
        const scannedStationID = urlParams.get('stationID');

        if (scannedStationID) {
            const storedStationID = localStorage.getItem('stationID');

            if (storedStationID === scannedStationID) {
                // No action needed if they match
                console.log('StationID matches the stored value.');
            } else {
                // Update the stationID in localStorage if needed
                localStorage.setItem('stationID', scannedStationID);
                console.log('StationID updated successfully.');
                window.location.reload(); 
            }
        } else {
            // Log if no StationID is found in the URL
            console.log('No StationID found in the URL.');
        }
    }

    // Call the function only if the page was opened via QR scan
    window.onload = function () {
        if (isQRScan()) {
            checkAndSaveStationID();
        }
    };



    // Add event listener to logout link
    document.getElementById('logout').addEventListener('click', function () {
        // Remove the userID from localStorage
        localStorage.removeItem('userID');

        // Redirect to index.html
        window.location.href = 'index.html';
    });


    // Function to set active link in navigation
    function topsetActiveLink(link) {
        topnavLinks.forEach(topnavLink => topnavLink.classList.remove('active'));
        link.classList.add('active');
    }

    function bottomsetActiveLink(link) {
        bottomnavLinks.forEach(bottomnavLink => bottomnavLink.classList.remove('active'));
        link.classList.add('active');
    }

    // Event listener for navigation links
    topnavLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const activeSection = document.querySelector('.content-section.active');
            const targetSection = document.getElementById(link.getAttribute('data-section'));

            if (activeSection !== targetSection) {
                const isMovingLeft = Array.from(sections).indexOf(targetSection) < Array.from(sections).indexOf(activeSection);

                activeSection.classList.add(isMovingLeft ? 'right-out' : 'left-out');
                targetSection.classList.add(isMovingLeft ? 'left-in' : 'right-in');

                setTimeout(() => {
                    activeSection.classList.remove('active', 'right-out', 'left-out');
                    targetSection.classList.add('active');
                    targetSection.classList.remove('right-in', 'left-in');
                }, 500);

                topsetActiveLink(link);
            }
        });
    });

    bottomnavLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const activeSection = document.querySelector('.content-section.active');
            const targetSection = document.getElementById(link.getAttribute('data-section'));

            if (activeSection !== targetSection) {
                const isMovingLeft = Array.from(sections).indexOf(targetSection) < Array.from(sections).indexOf(activeSection);

                activeSection.classList.add(isMovingLeft ? 'right-out' : 'left-out');
                targetSection.classList.add(isMovingLeft ? 'left-in' : 'right-in');

                setTimeout(() => {
                    activeSection.classList.remove('active', 'right-out', 'left-out');
                    targetSection.classList.add('active');
                    targetSection.classList.remove('right-in', 'left-in');
                }, 500);

                bottomsetActiveLink(link);
            }
        });
    });

    // Initial positioning of the sidebar
    sidenavElement.style.right = "-500%";

    // Toggle sidebar visibility on account button click
    accountBtnTopbar.onclick = function () {
        if (sidenavElement.style.right === "-500%") {
            openSidebar();
        } else {
            closeSidebar();
        }
    };

    // Hide or show multiple elements
    function toggleElements(show, elements) {
        elements.forEach(element => {
            element.style.display = show ? "inline-block" : "none";
        });
    }

    // Initially hide all edit-related buttons
    toggleElements(false, [imgEdit, saveBtn, cancelBtn]);

    // Function to open sidebar
    function openSidebar() {
        sidenavElement.style.minWidth = "20%";
        sidenavElement.style.right = "0";
        topnav.style.right = "44%"; // Adjust based on sidebar width
        topnavContents.forEach(content => {
            content.style.transform = "translateX(-4%)"; // Move topbar content along with sidebar
        });
        accountBtnTopbar.classList.add('hide-account-icon'); // Hide the account icon
        profileContent.classList.add('hide-account-icon');
        profileBtn.classList.remove('hide-account-icon');
        settingBtn.classList.remove('hide-account-icon');
        logoutBtn.classList.remove('hide-account-icon');
    }

    // Function to close sidebar
    function closeSidebar() {
        sidenavElement.style.right = "-500%";
        topnav.style.right = "4%"; // Reset position of topnav
        topnavContents.forEach(content => {
            content.style.transform = "translateX(0)"; // Reset position of topbar content
        });
        accountBtnTopbar.classList.remove('hide-account-icon'); // Show the account icon
        profileBtn.classList.remove('hide-account-icon');
        settingBtn.classList.remove('hide-account-icon');
        logoutBtn.classList.remove('hide-account-icon');
    }

    // Close sidebar when clicking outside of it
    document.addEventListener('click', function (e) {
        if (!sidenavElement.contains(e.target) && !accountBtnTopbar.contains(e.target)) {
            closeSidebar();
            accountBtnTopbar.classList.remove('hide-account-icon'); // Show the account icon
            profileBtn.classList.remove('hide-account-icon');
            settingBtn.classList.remove('hide-account-icon');
            logoutBtn.classList.remove('hide-account-icon');
        }
    });

    document.getElementById("profile").addEventListener("click", function () {
        sidenavElement.style.minWidth = "30%";
        profileBtn.classList.add('hide-account-icon');
        settingBtn.classList.add('hide-account-icon');
        logoutBtn.classList.add('hide-account-icon');
        profileContent.classList.remove('hide-account-icon');
        BackBtn.onclick = function () {
            openSidebar();
        };
        // Event listener for Edit button
        editBtn.addEventListener("click", () => {
            toggleElements(true, [imgEdit, saveBtn, cancelBtn]);
            toggleElements(false, [editBtn, BackBtn]);
        });

        // Event listener for Save and Cancel buttons
        [saveBtn, cancelBtn].forEach(button => {
            button.addEventListener("click", () => {
                toggleElements(false, [imgEdit, saveBtn, cancelBtn]);
                toggleElements(true, [editBtn, BackBtn]);
            });
        });
    });

    // Ensure sidebar is hidden on page load or refresh
    document.addEventListener("DOMContentLoaded", function () {
        closeSidebar(); // Ensures the sidebar is hidden on page load
    });

    // Variables to store original values
    let isEditing = false; // Flag to track if editing is in progress
    let intervalId; // Variable to hold the interval ID

    // Function to handle the periodic update
    async function startPopulatingData() {
        try {
            await populateData(); // Initial data population
            setInterval(async () => {
                if (!isEditing) { // Check if editing is not in progress
                    await populateData();
                }
            }, 1000);
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    // Function to stop populating data
    function stopPopulatingData() {
        clearInterval(intervalId); // Clear the interval
        intervalId = null;
    }

    // Call the function to start populating data
    startPopulatingData();

    // Function to toggle editing mode
    function toggleEditingMode(isEditing) {
        const isVisible = isEditing ? "inline-block" : "none";
        const isHidden = isEditing ? "none" : "inline-block";

        // Show or hide edit elements
        imgEdit.style.display = isVisible;
        saveBtn.style.display = isVisible;
        cancelBtn.style.display = isVisible;

        // Hide or show default buttons
        editBtn.style.display = isHidden;

        if (isEditing) {
            // Convert username and email to editable input fields
            nameDisplay.innerHTML = `<input type="text" id="nameInput" value="${originalUsername}" />`;
            emailDiv.innerHTML = `<input type="email" id="emailInput" value="${originalEmail}" />`;

            // Add event listener to HoldernameDiv when in edit mode
            HoldernameDiv.addEventListener('click', function () {
                // Show the BankForm if BankHolder is 'N/A' and BankNumber is 0
                const bankFormContainer = document.getElementById('BankForm');
                bankFormContainer.style.display = 'block';  // Show the form
                document.getElementById('BankHoldername').value = originalHoldername;
                document.getElementById('BankNumber').value = originalBankNum;

                // Add event listener to close the form when the "Cancel" button is clicked
                const cancelButton = document.getElementById('Bank-form-cancel-btn');
                const nextButton = document.getElementById('Bank-form-Next-btn');


                cancelButton.addEventListener('click', function (e) {
                    e.preventDefault();  // Prevent form submission
                    bankFormContainer.style.display = 'none';  // Hide the form
                });

                nextButton.addEventListener('click', function (e) {
                    e.preventDefault();  // Prevent form submission
                    openConfirmForm(document.getElementById('BankForm')).then((confirmed) => {
                        if (confirmed) {

                            // Get the BankHolder and BankNumber values from the form fields
                            const BankHolder = document.getElementById('BankHoldername').value;
                            const BankNumber = document.getElementById('BankNumber').value;

                            // Make the request to save the bank info
                            const bankInfoURL = `http://${IP}:8081/bankinfo?userID=${userID}&BankHolder=${BankHolder}&BankNumber=${BankNumber}`;

                            fetch(bankInfoURL, {
                                method: 'GET',
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data === true) {
                                        // If the API returns true, close the BankForm
                                        bankFormContainer.style.display = 'none';  // Hide the form
                                        alert('Bank information updated successfully.');
                                    } else {
                                        alert('Failed to update bank information.');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error updating bank info:', error);
                                });
                        }
                    });
                });
            });
        } else {
            // Restore original view (if cancelled)
            nameDisplay.innerHTML = originalUsername;
            emailDiv.innerHTML = originalEmail;
        }
    }


    // Event listener for Edit button
    editBtn.addEventListener("click", () => {
        toggleEditingMode(true);
        isEditing = true; // Set flag to true when editing starts
        stopPopulatingData(); // Stop data updates
    });

    // Event listener for Cancel button
    cancelBtn.addEventListener("click", () => {
        toggleEditingMode(false);
        isEditing = false; // Reset flag when editing ends
        if (!intervalId) startPopulatingData(); // Resume data updates
    });

    // Event listener for Save button
    saveBtn.addEventListener("click", async () => {
        const nameInput = document.getElementById("nameInput");
        const emailInput = document.getElementById("emailInput");

        const updatedUsername = nameInput.value.trim();
        const updatedEmail = emailInput.value.trim();

        isEditing = false; // Reset flag when editing ends
        if (!intervalId) startPopulatingData(); // Resume data updates

        // Validate inputs
        if (!updatedUsername || !updatedEmail) {
            alert("Username and email cannot be empty!");
            return;
        }

        // Prepare the base64 image string (if any)
        const updatedProfileImg = profileImg.src.includes("data:image") ? profileImg.src.split(',')[1] : null; // Extract base64 part of the data URL

        // Handle API request for saving changes
        try {
            const response = await fetch(`http://${IP}:8081/updateUserData`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userID: localStorage.getItem("userID"),
                    username: updatedUsername,
                    email: updatedEmail,
                    profileImg: updatedProfileImg, // Send the base64 string
                }),
            });

            if (!response.ok) throw new Error("Failed to update user data");

            const result = await response.json();

            // Update original values and exit editing mode
            originalUsername = updatedUsername;
            originalEmail = updatedEmail;
            toggleEditingMode(false);

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save changes. Please try again.");
        }
    });



    // Event listener for image edit
    imgEdit.addEventListener("click", () => {
        // Create a file input element
        const fileInput = document.createElement("input");
        fileInput.type = "file";  // Set the type to file
        fileInput.accept = "image/*";  // Only allow image files

        // Set up the onchange event to handle the file selection
        fileInput.onchange = (event) => {
            const file = event.target.files[0];  // Get the selected file
            if (file) {
                // Create a FileReader to read the selected file
                const reader = new FileReader();

                // On file load, update the profile image with the new file's data URL
                reader.onload = (e) => {
                    // Update the profile image source to display the selected image
                    profileImg.src = e.target.result;  // Set the image preview source
                };

                // Read the file as a data URL (Base64-encoded string)
                reader.readAsDataURL(file);
            }
        };

        // Trigger the file input click event to open the file selection dialog
        fileInput.click();
    });

    // Populate data on the page
    async function populateData() {
        // Retrieve userID and stationID from localStorage
        const userID = localStorage.getItem('userID');
        const stationID = localStorage.getItem('stationID');

        // Check if both userID and stationID are missing
        if (!userID && !stationID) {
            console.error('Missing userID or stationID in localStorage');
            return;
        }

        // Initialize data object to hold the response data
        let data = {};

        // If stationID is provided, fetch station data
        if (stationID) {
            try {
                const response = await fetch(`http://${IP}:8081/requestData?stationID=${stationID}`);
                if (!response.ok) throw new Error('Failed to fetch station data from the API');

                // Parse JSON response
                const stationData = await response.json();
                data.station = stationData; // Store station data

                const longitude = stationData.location.longitude || 'N/A';
                const latitude = stationData.location.latitude || 'N/A';
                const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;

                // Extract and populate station-related information
                document.getElementById('PayCash').innerText = stationData.cost + ' $';
                document.getElementById('Duration').innerText = stationData.chargeTime;
                document.getElementById('Locate').innerHTML = `<b id="Locate"><a href="${googleMapsUrl}" target="_blank">View on Google Maps</a></b>`;
                document.getElementById('chargeStatus').innerText = stationData.chargeProcess;

                if (stationData.chargeProcess == "stop" || stationData.chargeProcess == "error" || stationData.chargeProcess == "complete") {
                    makePayment(stationID);
                }

                if (stationData.chargeProcess == "N/A" && stationData.connection == "Available"){
                    if (localStorage.getItem('stationID')) {
                        localStorage.removeItem('stationID');
                        document.getElementById('Charge').style.display = 'none';
                        document.getElementById('Discharge').style.display = 'flex';
                    }
                    if (!localStorage.getItem('stationID')) {
                        document.getElementById('Charge').style.display = 'flex';
                        document.getElementById('Discharge').style.display = 'none';
                    }
                }
                else  if (stationData.chargeProcess == "charge"){
                    if (localStorage.getItem('stationID')) {
                        document.getElementById('Charge').style.display = 'none';
                        document.getElementById('Discharge').style.display = 'flex';
                    }
                    if (!localStorage.getItem('stationID')) {
                        document.getElementById('Charge').style.display = 'flex';
                        document.getElementById('Discharge').style.display = 'none';
                    }
                }
                
            } catch (error) {
                document.getElementById('PayCash').innerText = `N/A`;
                document.getElementById('Duration').innerText = `N/A`;
                document.getElementById('Locate').innerHTML = `<b id="Locate"><a href="#" target="_blank">N/A</a></b>`;
                document.getElementById('chargeStatus').innerText = 'No connection';
                console.error('Error fetching or populating station data:', error);
            }
        }

        // If userID is provided, fetch user data
        if (userID) {
            try {
                const response = await fetch(`http://${IP}:8081/requestData?userID=${userID}`);
                if (!response.ok) throw new Error('Failed to fetch user data from the API');

                const userData = await response.json();
                data.user = userData;

                document.getElementById('namedisplay').innerText = data.user.username;
                document.getElementById('email').innerText = data.user.email;
                document.getElementById('Holdername').innerText = data.user.BankHolder;
                originalUsername = data.user.username;
                originalEmail = data.user.email;
                originalHoldername = data.user.BankHolder;
                originalBankNum = data.user.BankNumber;

                // Set profile image
                const profileImg = document.getElementById('ProfileImg');
                originalImage = data.user.profileImg;
                profileImg.src = data.user.profileImg || 'Image/Profileless.jpg'; // Use fallback if profileimg is null or undefined
                profileImg.onerror = () => {
                    profileImg.src = 'Image/Profileless.jpg'; // Fallback image on error
                };

                document.getElementById('Amount').innerText = data.user.wallet + ' $';
            } catch (error) {
                console.error('Error fetching or populating user data:', error);
            }
        }

        if (userID && stationID) {
            try {
                // Fetch both user and station data concurrently
                const [userResponse, stationResponse] = await Promise.all([
                    fetch(`http://${IP}:8081/requestData?userID=${userID}`),
                    fetch(`http://${IP}:8081/requestData?stationID=${stationID}`)
                ]);

                if (!userResponse.ok) throw new Error('Failed to fetch user data from the API');
                if (!stationResponse.ok) throw new Error('Failed to fetch station data from the API');

                // Parse JSON responses
                const userData = await userResponse.json();
                const stationData = await stationResponse.json();

                // Store data
                const data = {
                    user: userData,
                    station: stationData
                };

                // Check if the user has enough wallet balance to proceed with payment
                if ((stationData.cost - userData.wallet) == 0) {
                    makePayment(stationID);
                }

            } catch (error) {
                console.error('Error fetching or processing data:', error);
            }
        }


        // If neither userID nor stationID was found, populate default values
        if (!stationID) {
            document.getElementById('PayCash').innerText = `N/A`;
            document.getElementById('Duration').innerText = `N/A`;
            document.getElementById('Locate').innerHTML = `<b id="Locate"><a href="#" target="_blank">N/A</a></b>`;
            document.getElementById('chargeStatus').innerText = 'No connection';
        }

    }

    let lastSize = 0;
    let lastData = [];

    async function Historical_Data() {
        // Retrieve userID from localStorage
        const userID = localStorage.getItem('userID');

        if (!userID) {
            console.error('Missing userID in localStorage');
            return;
        }

        try {
            // Request data from the API to get the user's dates
            const response = await fetch(`http://${IP}:8081/recordeData?userID=${userID}`);
            if (!response.ok) {
                return;
            }

            // Parse the JSON response
            const User_Record_Data = await response.json();

            // Initialize data object to hold the response data
            let data = {};
            data.date = User_Record_Data;

            // Get the dates array from the data
            const dates = data.date.dates;

            if (dates && Array.isArray(dates)) {
                const CurrentSize = dates.length;

                // Check if the size of the dates array has changed or if the data is different
                if (CurrentSize !== lastSize || !arraysEqual(dates, lastData)) {
                    lastSize = CurrentSize;
                    lastData = [...dates];  // Save the current dates array

                    // Clear the previous records
                    const dailyRecordContainer = document.getElementById('daily-record');
                    dailyRecordContainer.innerHTML = '';

                    // Loop through each date and fetch the corresponding data
                    for (let i = 0; i < dates.length; i++) {
                        const currentDate = dates[i];
                        const Dateresponse = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&date=${currentDate}`);
                        if (!Dateresponse.ok) throw new Error(`Failed to fetch data for date ${currentDate}`);

                        const Record_value = await Dateresponse.json();
                        let value = {};
                        value.data = Record_value;

                        const Power = value.data.value;
                        const Cost = value.data.cost;
                        const longitude = value.data.location.longitude || 'N/A';
                        const latitude = value.data.location.latitude || 'N/A';
                        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;

                        const dateObj = new Date(currentDate);

                        // Define the month names array
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                        // Extract day, month, and year
                        const day = String(dateObj.getDate()).padStart(2, '0'); // Ensures the day is always 2 digits
                        const month = monthNames[dateObj.getMonth()]; // Get the month name
                        const year = dateObj.getFullYear(); // Get the year

                        // Format the date as 'DD MMM YYYY'
                        const formattedDate = `${day} ${month} ${year}`;

                        // Create a new daily record element
                        const dailyRecord = document.createElement('div');
                        dailyRecord.id = 'daily';

                        // Add the image (Google logo)
                        const img = document.createElement('img');
                        img.src = 'Image/map_Logo.png';
                        img.alt = 'map';
                        img.id = 'location-img';
                        dailyRecord.appendChild(img);

                        // Add the record details
                        const recordDetail = document.createElement('div');
                        recordDetail.id = 'record-detail';

                        // Date
                        const dateRecord = document.createElement('a');
                        dateRecord.id = 'date-record';
                        dateRecord.textContent = formattedDate;
                        recordDetail.appendChild(dateRecord);

                        // Google Maps link
                        const addressLink = document.createElement('a');
                        addressLink.id = 'address';
                        addressLink.href = googleMapsUrl;
                        addressLink.textContent = 'View on Google Maps';
                        recordDetail.appendChild(addressLink);

                        // Power
                        const powerRecord = document.createElement('a');
                        powerRecord.id = 'power-record';
                        powerRecord.textContent = `${Power} KWh`;
                        recordDetail.appendChild(powerRecord);

                        // Cost
                        const priceRecord = document.createElement('a');
                        priceRecord.id = 'price-record';
                        priceRecord.textContent = `$${Cost}`;
                        recordDetail.appendChild(priceRecord);

                        // Append the record details to the daily record
                        dailyRecord.appendChild(recordDetail);

                        // Append the daily record to the parent container
                        const dailyRecordContainer = document.getElementById('daily-record');
                        dailyRecordContainer.appendChild(dailyRecord);

                    }
                }
            } else {
                console.error('No valid dates found in the response');
            }

        } catch (error) {
            console.error('Error fetching or populating user data:', error);
        }
    }

    // Helper function to compare two arrays (used for detecting changes in the dates array)
    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    Historical_Data();
    // Call the function at an interval
    setInterval(Historical_Data, 100);

    // Fetch and render historical data based on the selected date
    async function fetchHistoricalData(selectedDate) {
        // Retrieve userID from localStorage
        const userID = localStorage.getItem('userID');

        if (!userID) {
            console.error('Missing userID in localStorage');
            return;
        }

        try {
            // Request data from the API to get the user's dates
            const response = await fetch(`http://${IP}:8081/recordeData?userID=${userID}`);
            if (!response.ok) {
                return;
            }
            // Parse the JSON response
            const User_Record_Data = await response.json();

            // Initialize data object to hold the response data
            let data = {};
            data.date = User_Record_Data;

            // Get the dates array from the data
            const dates = data.date.dates;

            if (dates && Array.isArray(dates)) {
                const CurrentSize = dates.length;

                // Clear the previous records
                const dailyRecordContainer = document.getElementById('daily-record');
                dailyRecordContainer.innerHTML = '';

                // Loop through each date and fetch the corresponding data
                for (let i = 0; i < dates.length; i++) {
                    const currentDate = dates[i];

                    // Format the current date to 'YY/MM/DD' (ignore time portion)
                    const currentDateObj = new Date(currentDate);
                    const currentFormattedDate = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

                    // Format the selected date to 'YY/MM/DD' (ignore time portion)
                    const selectedDateObj = new Date(selectedDate);
                    const selectedFormattedDate = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDateObj.getDate()).padStart(2, '0')}`;

                    console.log(`Comparing currentDate: ${currentFormattedDate} with selectedDate: ${selectedFormattedDate}`);

                    // Compare current date (YY/MM/DD) with selected date (YY/MM/DD)
                    if (currentFormattedDate === selectedFormattedDate) {
                        // Fetch and process data for the selected date
                        const Dateresponse = await fetch(`http://${IP}:8081/recordeData?userID=${userID}&date=${currentDate}`);
                        if (!Dateresponse.ok) throw new Error(`Failed to fetch data for date ${currentDate}`);

                        const Record_value = await Dateresponse.json();
                        let value = {};
                        value.data = Record_value;

                        const Power = value.data.value;
                        const Cost = value.data.cost;
                        const longitude = value.data.location.longitude || 'N/A';
                        const latitude = value.data.location.latitude || 'N/A';
                        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;

                        // Define the month names array
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                        // Extract day, month, and year
                        const day = String(currentDateObj.getDate()).padStart(2, '0'); // Ensures the day is always 2 digits
                        const month = monthNames[currentDateObj.getMonth()]; // Get the month name
                        const year = currentDateObj.getFullYear(); // Get the year

                        // Format the date as 'DD MMM YYYY'
                        const formattedDate = `${day} ${month} ${year}`;

                        // Create a new daily record element
                        const dailyRecord = document.createElement('div');
                        dailyRecord.id = 'daily';

                        // Add the image (Google logo)
                        const img = document.createElement('img');
                        img.src = 'Image/map_Logo.png';
                        img.alt = 'map';
                        img.id = 'location-img';
                        dailyRecord.appendChild(img);

                        // Add the record details
                        const recordDetail = document.createElement('div');
                        recordDetail.id = 'record-detail';

                        // Date
                        const dateRecord = document.createElement('a');
                        dateRecord.id = 'date-record';
                        dateRecord.textContent = formattedDate;
                        recordDetail.appendChild(dateRecord);

                        // Google Maps link
                        const addressLink = document.createElement('a');
                        addressLink.id = 'address';
                        addressLink.href = googleMapsUrl;
                        addressLink.textContent = 'View on Google Maps';
                        recordDetail.appendChild(addressLink);

                        // Power
                        const powerRecord = document.createElement('a');
                        powerRecord.id = 'power-record';
                        powerRecord.textContent = `${Power} KWh`;
                        recordDetail.appendChild(powerRecord);

                        // Cost
                        const priceRecord = document.createElement('a');
                        priceRecord.id = 'price-record';
                        priceRecord.textContent = `$${Cost}`;
                        recordDetail.appendChild(priceRecord);

                        // Append the record details to the daily record
                        dailyRecord.appendChild(recordDetail);

                        // Append the daily record to the parent container
                        dailyRecordContainer.appendChild(dailyRecord);
                    }
                }
            } else {
                console.error('No valid dates found in the response');
            }

        } catch (error) {
            console.error('Error fetching or populating user data:', error);
        }
    }

    // Function to handle the selection of "All" or "Choose"
    dailySelect.addEventListener('change', (event) => {
        const selectedOption = event.target.value;

        // Show date picker if the selected option is "Choose", regardless of previous selection
        if (selectedOption === 'date-picker') {
            showDatePicker();
        } else if (selectedOption === 'All-daily') {
            // Hide the date picker container when "All" is selected
            hideDatePicker();
            Historical_Data();
            lastSize = 0;
            lastData = [];
        }
    });

    // Event listener for the confirm button to hide the date picker container and show the select element
    confirmText.addEventListener('click', () => {
        // Hide the date picker container after confirmation

        // Get the selected date from the date picker input
        const selectedDate = datePicker.value;
        fetchHistoricalData(selectedDate);

        hideDatePicker();

        // Replace the "Choose" option with the selected date
        chooseOption.textContent = selectedDate;  // Replace the option text with the selected date

    });

    let lastNotificationSize = 0;
    let lastNotificationData = [];

    async function Notification_Data() {
        // Retrieve userID from localStorage
        const userID = localStorage.getItem('userID');

        if (!userID) {
            console.error('Missing userID in localStorage');
            return;
        }

        try {
            // Request data from the API to get the user's notifications
            const response = await fetch(`http://${IP}:8081/getnotifications?userID=${userID}`);
            if (!response.ok) throw new Error('Failed to fetch user data from the API');

            // Parse the JSON response (assumes the response is directly an array of notifications)
            const notifications = await response.json();

            // Check if notifications exist
            if (notifications.length === 0) {
                console.log('No notifications found');
                return;
            }

            // Check if the size of notifications array has changed or if the data is different
            const currentNotificationSize = notifications.length;
            if (currentNotificationSize !== lastNotificationSize || !arraysEqual(notifications, lastNotificationData)) {
                lastNotificationSize = currentNotificationSize;
                lastNotificationData = [...notifications];  // Save the current notifications array

                // Clear the previous notifications
                const NotificationContainer = document.getElementById('message-Content');
                NotificationContainer.innerHTML = '';  // Clear previous content

                // Loop through the notifications and handle/display them
                notifications.forEach(notification => {
                    const { ID, Date: notificationDate, Message } = notification; // Renaming Date to notificationDate
                    const formattedDate = new Date(notificationDate).toLocaleString(); // Format the date properly
                    console.log('ID', ID);
                    console.log('Formatted Date:', formattedDate);
                    console.log('Message:', Message);

                    const NotificastionDate = document.createElement('a');
                    NotificastionDate.id = 'message-date';
                    NotificastionDate.textContent = formattedDate;

                    // Create a new daily record element
                    const MessageBox = document.createElement('div');
                    MessageBox.id = 'message-Block';

                    // Message
                    const NotificationMessage = document.createElement('a');
                    NotificationMessage.id = 'message';
                    NotificationMessage.textContent = Message;
                    MessageBox.appendChild(NotificationMessage);

                    const DeleteNotification = document.createElement('a');
                    DeleteNotification.id = 'delet-message';

                    const DeleteIcon = document.createElement('i');
                    DeleteIcon.classList = 'fas fa-trash';
                    DeleteNotification.appendChild(DeleteIcon);

                    MessageBox.appendChild(DeleteNotification);

                    // Append the daily record to the parent container
                    NotificationContainer.appendChild(NotificastionDate);
                    NotificationContainer.appendChild(MessageBox);

                    // Add an event listener to the delete icon
                    DeleteNotification.addEventListener('click', async () => {
                        try {
                            // Send DELETE request to the server to remove the notification
                            const response = await fetch(`http://${IP}:8081/deletenotification?userID=${userID}&ID=${ID}`, {
                                method: 'DELETE',
                            });

                            // Parse and handle the response
                            const result = await response.json();
                            if (response.ok && result.message === 'Notification deleted successfully') {
                                console.log(`Notification Deleted - ID: ${ID}`);
                                // Remove the notification from the UI
                                NotificationContainer.removeChild(NotificastionDate);
                                NotificationContainer.removeChild(MessageBox);
                            } else {
                                console.error('Error: ', result.message || 'Failed to delete notification');
                            }
                        } catch (error) {
                            console.error('Error deleting notification: ', error);
                        }
                    });
                });
            }

        } catch (error) {
            console.error('Error fetching or populating user data:', error);
        }
    }

    // Helper function to compare two arrays (used for detecting changes in the notifications array)
    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].Date !== arr2[i].Date || arr1[i].Message !== arr2[i].Message) return false;
        }
        return true;
    }

    // Initial call to populate notifications
    Notification_Data();

    // Call the function at an interval to refresh notifications every 5 seconds (5000 milliseconds)
    setInterval(Notification_Data, 1000);

    document.getElementById('Discharge').addEventListener('click', function () {
        // Show the modal
        const modal = document.getElementById('confirmModal');
        modal.style.display = 'flex'; // Display the modal

        // Handle the 'Yes' button
        document.getElementById('confirmYes').addEventListener('click', function () {
            // Proceed with the action if user confirms
            const stationID = localStorage.getItem('stationID'); // Ensure stationID is available
            const url = `http://${IP}:8081/stationProcess?stationID=${stationID}&chargeStatuse=stop`;

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
                    }
                    return response.json(); // Parse the response as JSON if successful
                })
                .then(data => {
                    console.log('Charge stopped:', data);
                })
                .catch(error => {
                    console.error('Error stopping charge:', error);
                    response.text().then(text => {
                        console.log('Raw response text:', text);
                    });
                });

            // Hide the modal after action
            modal.style.display = 'none';
        });

        // Handle the 'No' button
        document.getElementById('confirmNo').addEventListener('click', function () {
            // Hide the modal if user cancels
            modal.style.display = 'none';
            console.log('Charge stopping cancelled by user.');
        });
    });


    function makePayment(stationID) {
        const url = `http://${IP}:8081/payment?stationID=${stationID}`;

        // Use fetch to send GET request to the server for payment
        fetch(url)
            .then(response => {
                // Check if the response is successful (status code 200)
                if (response.ok) {
                    return response.json();  // If it's OK, process the JSON
                } else {
                    // If response is not OK, throw an error but allow the response body to be handled
                    return response.json().then(data => {
                        throw new Error(data.error || `Payment failed with status code ${response.status}`);
                    });
                }
            })
            .then(data => {
                if (data && data.message) {
                    // Assuming success message is sent by server
                    if (data.message === 'Payment processed successfully') {
                        if(localStorage.getItem('stationID')){
                            localStorage.removeItem('stationID');  // Corrected to remove by key
                        }
                        if(!localStorage.getItem('stationID')){
                            location.reload();
                            alert('Payment processed successfully');
                        }
                    } else {
                        // If there is any error message in the server response
                        localStorage.removeItem('stationID');  // Corrected to remove by key
                    }
                } else {
                    // Handle case where there is no message or invalid response
                    alert(`Payment failed. Invalid server response for Station ID: ${stationID}`);
                }
            })
            .catch(error => {
                console.error('Error processing payment:', error);
                alert(`Error processing payment: ${error.message}`);
            });
    }

    // Function to check if the stationID is valid
    function checkStationID(stationID) {
        const url = `http://${IP}:8081/checking?stationID=${stationID}`;
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Explicitly check connection availability
                if (data.connectionAvailable === true) {
                    return true; // Station is available
                } else if (data.connectionAvailable === false && data.currentConnection) {
                    console.log('Station connection status:', data.currentConnection);
                    return data.currentConnection; // Station is unavailable
                } else {
                    return false; // Default to false for safety
                }
            })
            .catch(error => {
                console.error('Error checking stationID:', error);
                return false; // Return false in case of error
            });
    }


    // Function to connect stationID and userID
    function connectStationID(stationID, userID) {
        const url = `http://${IP}:8081/checking?stationID=${stationID}&userID=${userID}`;
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Return 'success' from server response, default to false if not present
                return data.success || false;
            })
            .catch(error => {
                console.error('Error checking stationID:', error);
                return false;  // Return false in case of error
            });
    }

    function handleStationID(stationID) {
        checkStationID(stationID)
            .then(isAvailable => {
                if (isAvailable) {
                    console.log('Station ID validated.');
                    const userID = localStorage.getItem('userID');
    
                    connectStationID(stationID, userID)
                        .then(success => {
                            if (success) {
                                const url = `http://${IP}:8081/stationProcess?stationID=${stationID}&chargeStatuse=charge`;
    
                                fetch(url)
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error(`Server error: ${response.status} - ${response.statusText}`);
                                        }
                                        return response.json(); // Parse the response as JSON
                                    })
                                    .then(data => {
                                        // Successfully connected to the station
                                        localStorage.setItem('stationID', stationID);
                                        location.reload();
                                    })
                                    .catch(error => {
                                        console.error('Error processing charge:', error);
                                    });
                            } 
                            // Handle already connected user
                            else if (data.connection === localStorage.getItem('userID')) {
                                console.log('Station is already connected to this user.');
                                localStorage.setItem('stationID', data.connection);
                            } 
                            // Handle connection failure
                            else {
                                alert('Failed to connect to the station. Please try again.');
                            }
                        })
                        .catch(error => {
                            console.error('Error connecting to station:', error);
                            alert('There was an issue connecting to the station. Please try again.');
                        });
                } 
                // Invalid station ID
                else {
                    alert('Invalid station ID. Connection cannot be processed.');
                }
            })
            .catch(error => {
                console.error('Error during station ID check:', error);
                alert('There was an issue checking the station ID. Please try again.');
            });
    }
    


    function getStationIDFromScanURL(url) {
        console.log("Decoded URL from QR:", url);  // Debugging line
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('stationID');
    }

    // Function to get the list of webcams
    function getWebcams() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const webcams = devices.filter(device => device.kind === 'videoinput');
                    resolve(webcams);
                })
                .catch(err => reject(err));
        });
    }

    let activeStream;

    // Show the QR options modal when 'Pay Now' or 'TopUp Now' button is clicked
    document.getElementById('Charge').addEventListener('click', function () {
        document.getElementById('qrOptionsModal').style.display = 'flex';
    });

    document.getElementById('topup').addEventListener('click', async function () {
        const userID = localStorage.getItem('userID');
        try {
            const response = await fetch(`http://${IP}:8081/requestData?userID=${userID}`);
            if (!response.ok) throw new Error('Failed to fetch user data from the API');

            let data = {};  // Initialize the data object
            const userData = await response.json();
            data.user = userData;

            const BankHolder = userData.BankHolder;
            const BankNumber = userData.BankNumber;

            // Check if BankHolder and BankNumber are valid
            if (BankHolder != 'N/A' && BankNumber != 0) {
                // Create the image element
                const image = document.createElement('img');
                image.src = 'Image/ABAQR.jpg';  // Set the image source
                image.alt = 'ABA QR Code';     // Set the alt text for the image

                // Create save button with an ID
                const saveButton = document.createElement('button');
                saveButton.id = 'saveQRBankButton';  // Add an ID for the save button
                saveButton.innerHTML = '<i class="fas fa-save"></i>';
                saveButton.addEventListener('click', function () {
                    // Create an anchor element to download the image
                    const link = document.createElement('a');
                    link.href = image.src;
                    link.download = 'ABAQR.jpg'; // Set the filename for the downloaded image
                    link.click(); // Trigger the download
                });

                // Create close button with an ID
                const closeButton = document.createElement('button');
                closeButton.id = 'closeQRBankButton';  // Add an ID for the close button
                closeButton.innerHTML = '<i class="fas fa-times"></i>';
                closeButton.addEventListener('click', function () {
                    const container = document.getElementById('imageContainer');
                    container.style.display = 'none';  // Hide the container when closing
                });

                // Append the image, save button, and close button to the container
                const container = document.getElementById('imageContainer');
                container.innerHTML = '';  // Clear any existing content in the container
                container.appendChild(image);
                container.appendChild(saveButton);
                container.appendChild(closeButton);

                // Show the container
                container.style.display = 'flex';
            } else {
                // Show the BankForm if BankHolder is 'N/A' and BankNumber is 0
                const bankFormContainer = document.getElementById('BankForm');
                bankFormContainer.style.display = 'block';  // Show the form

                // Add event listener to close the form when the "Cancel" button is clicked
                const cancelButton = document.getElementById('Bank-form-cancel-btn');
                const nextButton = document.getElementById('Bank-form-Next-btn');

                cancelButton.addEventListener('click', function (e) {
                    e.preventDefault();  // Prevent form submission
                    bankFormContainer.style.display = 'none';  // Hide the form
                });

                nextButton.addEventListener('click', function (e) {
                    e.preventDefault();  // Prevent form submission
                    openConfirmForm(document.getElementById('BankForm')).then((confirmed) => {
                        if (confirmed) {

                            // Get the BankHolder and BankNumber values from the form fields
                            const BankHolder = document.getElementById('BankHoldername').value;
                            const BankNumber = document.getElementById('BankNumber').value;

                            // Make the request to save the bank info
                            const bankInfoURL = `http://${IP}:8081/bankinfo?userID=${userID}&BankHolder=${BankHolder}&BankNumber=${BankNumber}`;

                            fetch(bankInfoURL, {
                                method: 'GET',
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data === true) {
                                        // If the API returns true, close the BankForm
                                        bankFormContainer.style.display = 'none';  // Hide the form
                                        alert('Bank information updated successfully.');
                                    } else {
                                        alert('Failed to update bank information.');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error updating bank info:', error);
                                });
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching or populating user data:', error);
        }
    });


    // Close the modal
    document.getElementById('closeModal').addEventListener('click', function () {
        document.getElementById('qrOptionsModal').style.display = 'none';
    });

    // Handle QR upload
    document.getElementById('uploadQR').addEventListener('click', function () {
        document.getElementById('fileInput').click();
        document.getElementById('qrOptionsModal').style.display = 'none'; // Close modal
    });

    // Handle file input change (for uploaded image)
    document.getElementById('fileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function () {
                    // Now we scan the uploaded image using jsQR
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);

                    // Use jsQR to decode the QR code from the canvas
                    const qrCode = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                    if (qrCode) {
                        console.log("QR Code data: ", qrCode.data);
                        const stationID = getStationIDFromScanURL(qrCode.data);
                        if (stationID) {
                            handleStationID(stationID);
                        } else {
                            alert("No stationID found in QR code URL.");
                        }
                    } else {
                        alert("No QR code found.");
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('scanQR').addEventListener('click', function () {
        document.getElementById('qrOptionsModal').style.display = 'none';

        // Create a container for QR scan (or show it if it already exists)
        let qrScanContainer = document.getElementById('qrScanContainer');
        if (!qrScanContainer) {
            qrScanContainer = document.createElement('div');
            qrScanContainer.id = 'qrScanContainer';
            document.body.appendChild(qrScanContainer);

            // Add video element for QR scan
            qrScanContainer.innerHTML = `
                <div id="webcamSelectContainer">
                    <label for="webcamSelect">Select Webcam:</label>
                    <select id="webcamSelect" style="padding: 5px;">
                        <option value="">Loading webcams...</option>
                    </select>
                </div>
                <h4>Scan QR Code</h4>
                <video id="scanVideo" autoplay></video>
                <canvas id="scanCanvas" style="display:none;"></canvas>
            `;

            // Add close button (X) to cancel the QR scan
            const closeButton = document.createElement('button');
            closeButton.id = 'closeQRScan';
            closeButton.textContent = 'X';
            qrScanContainer.appendChild(closeButton);

            // Get the list of webcams
            getWebcams().then(webcams => {
                const webcamSelect = document.getElementById('webcamSelect');
                webcamSelect.innerHTML = '';  // Clear loading text

                if (webcams.length > 0) {
                    webcams.forEach((webcam, index) => {
                        const option = document.createElement('option');
                        option.value = webcam.deviceId;
                        option.textContent = webcam.label || `Webcam ${index + 1}`;
                        webcamSelect.appendChild(option);
                    });

                    // Add event listener to handle webcam selection
                    webcamSelect.addEventListener('change', function () {
                        const selectedDeviceId = webcamSelect.value;
                        if (selectedDeviceId) {
                            startCameraForInPageScan(qrScanContainer, selectedDeviceId);
                        }
                    });

                    // Start with the first available webcam
                    if (webcams.length > 0) {
                        startCameraForInPageScan(qrScanContainer, webcams[0].deviceId);
                    }
                } else {
                    webcamSelect.innerHTML = '<option value="">No webcams found</option>';
                }
            }).catch(err => {
                console.error('Error accessing devices:', err);
                alert('Unable to access webcam devices.');
            });

            // Attach the close button event listener
            closeButton.addEventListener('click', function () {
                console.log("Closing QR scan...");
                stopCamera(qrScanContainer);  // Stop the camera and hide QR scan
                if (qrScanContainer) {
                    qrScanContainer.remove();     // Remove the container from DOM
                    console.log("QR scan container removed");
                }
            });
        }
    });


    // Function to get available webcams
    function getWebcams() {
        return navigator.mediaDevices.enumerateDevices()
            .then(devices => devices.filter(device => device.kind === 'videoinput'))
            .catch(err => {
                console.error('Error getting webcams:', err);
                return [];
            });
    }

    // Function to start the camera for QR scanning with the selected webcam
    function startCameraForInPageScan(container, deviceId) {
        const video = container.querySelector('#scanVideo');
        const canvas = container.querySelector('#scanCanvas');
        const context = canvas.getContext('2d');

        // Stop any currently active video stream
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
        }

        // Request video stream from the selected webcam
        navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
        })
            .then(stream => {
                activeStream = stream;
                video.srcObject = stream;

                video.onloadedmetadata = function () {
                    console.log('Video metadata loaded:', video.videoWidth, video.videoHeight);
                };

                // Capture frames and scan QR codes
                const interval = setInterval(() => {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas before drawing
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);

                        const qrCode = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
                        if (qrCode) {
                            console.log('QR Code data:', qrCode.data);
                            clearInterval(interval); // Stop scanning after successful scan

                            const stationID = getStationIDFromScanURL(qrCode.data);
                            if (stationID) {
                                handleStationID(stationID);
                            } else {
                                alert('No stationID found in QR code URL.');
                            }

                            // Stop the camera after scanning
                            stopCamera(container);
                        }
                    }
                }, 500);
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                alert('Unable to access the selected camera.');
            });
    }

    // Function to stop the camera stream
    function stopCamera(container) {
        const videoElement = container.querySelector('#scanVideo');
        if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());  // Stop each track
            videoElement.srcObject = null;  // Disconnect the video stream
            console.log("Camera stopped");
        }
        if (qrScanContainer) {
            qrScanContainer.remove();     // Remove the container from DOM
            console.log("QR scan container removed");
        } else {
            console.log("No camera stream found");
        }
    }


});
