//2024/8/24，stanley分享手機可hover文字效果
const jumpLetter = document.querySelectorAll(".jump-letter");

const handleTouchMove = (event) => {
  const touch = event.touches[0];
  jumpLetter.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      item.classList.add("active");
    }
  });
};

jumpLetter.forEach((letter) => {
  letter.addEventListener("mouseenter", function () {
    this.classList.add("active");
  });

  letter.addEventListener("touchstart", handleTouchMove);
  letter.addEventListener("touchmove", handleTouchMove);

  letter.addEventListener("animationend", function () {
    this.classList.remove("active");
  });
});
