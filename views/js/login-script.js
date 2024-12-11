document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container");
    const switchBtns = document.querySelectorAll(".switch-btn");

    switchBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const switchTo = btn.dataset.switch;
            if (switchTo === "signup") {
                container.classList.add("signing-up");
            } else {
                container.classList.remove("signing-up");
            }
        });
    });
});