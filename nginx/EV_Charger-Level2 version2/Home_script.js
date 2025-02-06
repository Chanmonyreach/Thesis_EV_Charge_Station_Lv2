document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('#topnav ul li a:not(#goBack)');
    const sections = document.querySelectorAll('.content-section');
    const sidenavElement = document.getElementById('sidenav');
    const accountBtnTopbar = document.getElementById('accountBtnTopbar');
    const topnavContents = document.querySelectorAll('#topnav nav, #topnav ul');
    const logo = document.querySelector('#topnav img.logo');

    
    let sidebarOpened = false;

    function setActiveLink(link) {
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        link.classList.add('active');
    }

    sidenavElement.style.right = "-40%";

    function openSidebar() {
        sidenavElement.style.right = "0";
        topnavContents.forEach(content => {
            content.style.transform = "translateX(-35%)"; // Move topnav contents to the left more
        });
        logo.classList.add('bigger-logo'); // Make the logo bigger (if needed)
        accountBtnTopbar.classList.add('hide-account-icon');
        sidebarOpened = true;
    }

    function closeSidebar() {
        sidenavElement.style.right = "-40%";
        topnavContents.forEach(content => {
            content.style.transform = "translateX(0)"; // Reset topnav contents position
        });
        logo.classList.remove('bigger-logo'); // Reset logo size (if applicable)
        accountBtnTopbar.classList.remove('hide-account-icon');
        sidebarOpened = false;
    }

    function toggleSidebar() {
        if (!sidebarOpened) {
            openSidebar();
        } else {
            closeSidebar();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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
                }, 300);

                setActiveLink(link);
                closeSidebar(); // Close sidebar after clicking a navigation link
            }
        });
    });

    accountBtnTopbar.onclick = function() {
        toggleSidebar();
    };

    document.addEventListener('click', function(e) {
        if (!sidenavElement.contains(e.target) && !accountBtnTopbar.contains(e.target)) {
            if (sidebarOpened) {
                closeSidebar();
            }
        }
    });
});
  