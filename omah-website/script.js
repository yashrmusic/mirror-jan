const guideResult = document.querySelector("#guideResult");
const choices = document.querySelectorAll(".choice-list button");
const slider = document.querySelector("#productSlider");
const sliderButtons = document.querySelectorAll("[data-slide]");

choices.forEach((choice) => {
  choice.addEventListener("click", () => {
    choices.forEach((item) => item.classList.remove("is-active"));
    choice.classList.add("is-active");
    guideResult.textContent = choice.dataset.result;
  });
});

sliderButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.slide === "next" ? 1 : -1;
    slider.scrollBy({
      left: direction * Math.min(360, slider.clientWidth * 0.82),
      behavior: "smooth",
    });
  });
});
