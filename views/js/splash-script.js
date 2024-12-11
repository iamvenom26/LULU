window.onload = () => {
    const logo = document.getElementById('logo-container');
    const background = document.getElementById('background');
    
    setTimeout(() => {
        [logo, background].forEach(el => {
            el.style.transition = "opacity 1.5s ease";
            el.style.opacity = "0";
        });
    }, 7000);

    setTimeout(() => {
        window.location.href = 'main.html';
    }, 8500);
}; 